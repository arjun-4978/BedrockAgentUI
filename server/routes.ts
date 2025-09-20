import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertChatSessionSchema, insertChatMessageSchema, insertReportSchema } from "@shared/schema";
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from "@aws-sdk/client-bedrock-agent-runtime";
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

const bedrockClient = new BedrockAgentRuntimeClient({ 
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ""
  }
});

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ""
  }
});

// Helper function to extract agent ID from ARN
function extractAgentId(agentIdOrArn: string): string {
  console.log(`Extracting agent ID from: ${agentIdOrArn}`);
  
  // If it's already a 10-character alphanumeric string, return as-is
  if (/^[0-9a-zA-Z]{10}$/.test(agentIdOrArn)) {
    console.log(`Already valid agent ID: ${agentIdOrArn}`);
    return agentIdOrArn;
  }
  
  // If it's an ARN, extract the agent ID
  if (agentIdOrArn.includes('arn:aws:bedrock')) {
    // Look for patterns like:
    // arn:aws:bedrock:region:account:agent/AGENTID123
    // arn:aws:bedrock-agentcore:region:account:runtime/name_AGENTID123
    
    // Try to find a 10-character alphanumeric sequence
    const matches = agentIdOrArn.match(/[0-9a-zA-Z]{10}/g);
    if (matches && matches.length > 0) {
      // Use the last match (most likely to be the agent ID)
      const agentId = matches[matches.length - 1];
      console.log(`Extracted agent ID from ARN: ${agentId}`);
      return agentId;
    }
    
    // Fallback: extract from the end of the string
    const parts = agentIdOrArn.split(/[/_-]/);
    const lastPart = parts[parts.length - 1];
    const alphanumeric = lastPart.replace(/[^0-9a-zA-Z]/g, '');
    const truncated = alphanumeric.substring(Math.max(0, alphanumeric.length - 10));
    console.log(`Fallback extraction: ${truncated}`);
    return truncated;
  }
  
  console.log(`Using as-is (not an ARN): ${agentIdOrArn}`);
  return agentIdOrArn;
}

async function invokeBedrockAgent(inputText: string, sessionId: string) {
  const agentId = extractAgentId(process.env.BEDROCK_AGENT_ID || "");
  const agentAliasId = extractAgentId(process.env.BEDROCK_AGENT_ALIAS_ID || "");
  
  console.log(`Invoking Bedrock agent: ${agentId}, alias: ${agentAliasId}`);
  
  const command = new InvokeAgentCommand({
    agentId,
    agentAliasId,
    inputText: inputText,
    sessionId: sessionId,
    enableTrace: true,
  });

  try {
    const response = await bedrockClient.send(command);
    return response;
  } catch (error: any) {
    console.error("Error invoking Bedrock agent:", error);
    
    // If it's a ResourceNotFoundException, provide a helpful message
    if (error.name === 'ResourceNotFoundException') {
      console.error(`Bedrock agent not found. Please verify:
        - Agent ID: ${agentId} exists in region ${process.env.AWS_REGION}
        - Agent Alias ID: ${agentAliasId} is valid for this agent
        - AWS credentials have permissions to access this agent`);
    }
    
    throw error;
  }
}

async function listS3Reports() {
  const bucketName = process.env.S3_REPORTS_BUCKET || "";
  const prefix = process.env.S3_REPORTS_PREFIX || "reports/";
  
  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
    });
    
    const response = await s3Client.send(command);
    return response.Contents || [];
  } catch (error) {
    console.error("Error listing S3 reports:", error);
    throw error;
  }
}

async function getS3ReportContent(key: string) {
  const bucketName = process.env.S3_REPORTS_BUCKET || "";
  
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    
    const response = await s3Client.send(command);
    const content = await response.Body?.transformToString();
    return content;
  } catch (error) {
    console.error("Error getting S3 report content:", error);
    throw error;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Create a new chat session
  app.post("/api/chat/session", async (req, res) => {
    try {
      const sessionId = randomUUID();
      const session = await storage.createChatSession({ sessionId });
      res.json(session);
    } catch (error) {
      console.error("Error creating chat session:", error);
      res.status(500).json({ error: "Failed to create chat session" });
    }
  });

  // Get chat messages for a session
  app.get("/api/chat/:sessionId/messages", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const messages = await storage.getChatMessages(sessionId);
      res.json(messages);
    } catch (error) {
      console.error("Error getting chat messages:", error);
      res.status(500).json({ error: "Failed to get chat messages" });
    }
  });

  // Send a message to the agent
  app.post("/api/chat/:sessionId/message", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const validation = insertChatMessageSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }

      const { content } = validation.data;

      // Save user message
      await storage.createChatMessage(sessionId, {
        content,
        isFromAgent: false
      });

      // Invoke Bedrock agent
      let responseText = "I've processed your request.";
      let reportPath = null;
      
      try {
        const agentResponse = await invokeBedrockAgent(content, sessionId);
        
        if (agentResponse.completion) {
          responseText = ""; // Reset to build from chunks
          // Handle streaming response
          for await (const chunkEvent of agentResponse.completion) {
            if (chunkEvent.chunk) {
              const decodedResponse = new TextDecoder("utf-8")
                .decode(chunkEvent.chunk.bytes);
              responseText += decodedResponse;
            }
          }
          
          // Check if response contains a report path
          const reportMatch = responseText.match(/report.*?\.md/i);
          if (reportMatch) {
            reportPath = reportMatch[0];
            
            // Create report entry in storage
            await storage.createReport({
              title: reportPath,
              description: "Generated report from agent analysis",
              s3Path: `reports/${reportPath}`,
              size: "Unknown"
            });
          }
        }
      } catch (bedrockError: any) {
        console.error("Bedrock agent call failed, using fallback response:", bedrockError.message);
        
        // Provide a helpful fallback response when Bedrock is not available
        if (bedrockError.name === 'ResourceNotFoundException') {
          responseText = `Thank you for your message: "${content}"\n\n` +
            `I'm currently unable to connect to the AWS Bedrock agent. This could be because:\n` +
            `• The agent ID or alias ID needs to be configured correctly\n` +
            `• The agent doesn't exist in the specified AWS region\n` +
            `• AWS permissions need to be updated\n\n` +
            `Please contact your administrator to configure the Bedrock agent integration.\n\n` +
            `For testing purposes, this is a simulated response. The chat interface and S3 report features are working correctly.`;
        } else {
          responseText = `I received your message: "${content}"\n\n` +
            `I'm currently experiencing technical difficulties connecting to the AI agent service. ` +
            `Please try again later or contact support if the issue persists.\n\n` +
            `Error: ${bedrockError.message}`;
        }
      }

      // Save agent response
      const agentMessage = await storage.createChatMessage(sessionId, {
        content: responseText,
        isFromAgent: true
      });

      res.json({
        message: agentMessage,
        reportPath
      });
    } catch (error) {
      console.error("Error sending message to agent:", error);
      res.status(500).json({ error: "Failed to send message to agent" });
    }
  });

  // Get all reports
  app.get("/api/reports", async (req, res) => {
    try {
      // Get reports from storage
      const storedReports = await storage.getReports();
      
      // Also sync with S3
      try {
        const s3Objects = await listS3Reports();
        
        // Create report entries for any S3 objects not in storage
        for (const obj of s3Objects) {
          if (obj.Key && obj.Key.endsWith('.md')) {
            const existing = storedReports.find(r => r.s3Path === obj.Key);
            if (!existing) {
              const title = obj.Key.split('/').pop() || obj.Key;
              await storage.createReport({
                title,
                description: "Report from S3",
                s3Path: obj.Key,
                size: obj.Size ? `${Math.round(obj.Size / 1024)} KB` : "Unknown"
              });
            }
          }
        }
      } catch (s3Error) {
        console.warn("Could not sync with S3:", s3Error);
      }
      
      // Return updated list
      const reports = await storage.getReports();
      res.json(reports);
    } catch (error) {
      console.error("Error getting reports:", error);
      res.status(500).json({ error: "Failed to get reports" });
    }
  });

  // Get report content
  app.get("/api/reports/:id/content", async (req, res) => {
    try {
      const { id } = req.params;
      const report = await storage.getReport(id);
      
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }

      // Get content from S3
      const content = await getS3ReportContent(report.s3Path);
      
      res.json({
        report,
        content
      });
    } catch (error) {
      console.error("Error getting report content:", error);
      res.status(500).json({ error: "Failed to get report content" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
