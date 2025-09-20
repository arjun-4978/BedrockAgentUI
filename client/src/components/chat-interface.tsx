import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ChatMessage } from "@shared/schema";

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (content: string) => Promise<void>;
  sessionId: string;
}

export default function ChatInterface({ messages, isLoading, onSendMessage, sessionId }: ChatInterfaceProps) {
  const [promptText, setPromptText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async () => {
    if (!promptText.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    setIsStreaming(true);
    setStreamingMessage("");
    
    try {
      // Use streaming endpoint
      const response = await fetch(`/api/chat/${sessionId}/message/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: promptText })
      });
      
      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          setStreamingMessage(prev => prev + chunk);
        }
      }
      
      // Refresh messages after streaming completes
      await onSendMessage(promptText);
      setPromptText("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSubmitting(false);
      setIsStreaming(false);
      setStreamingMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 300) + "px";
    }
  };

  return (
    <div className="flex-1 flex flex-col" data-testid="chat-interface">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 border-b border-border p-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <i className="fas fa-brain text-white text-lg"></i>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Capillary Migration - BRD Generation</h1>
            <div className="flex items-center space-x-2 mt-1">
              <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                <span className="text-sm text-white font-medium">AI Solutions Squad</span>
              </div>
              <div className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full">
                <span className="text-xs text-white/90">Powered by AWS Bedrock</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
            <div className={`w-3 h-3 rounded-full ${
              sessionId ? "bg-green-400 animate-pulse" : "bg-yellow-400"
            }`}></div>
            <span className="text-sm text-white font-medium">
              {sessionId ? "Connected" : "Connecting..."}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4" data-testid="chat-messages">
        {/* Welcome Message */}
        <div className="flex items-start space-x-3 fade-in">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <i className="fas fa-brain text-white text-sm"></i>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 max-w-3xl border-2 border-transparent" style={{
            background: 'linear-gradient(white, white) padding-box, linear-gradient(45deg, #3b82f6, #8b5cf6) border-box'
          }}>
            <div className="flex items-center space-x-2 mb-3">
              <i className="fas fa-sparkles text-blue-600"></i>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">Welcome to Capillary Migration BRD Generator!</h3>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              I'm your AI Solutions Squad assistant, powered by AWS Bedrock. I specialize in generating comprehensive Business Requirements Documents (BRDs) for Capillary migration projects. 
              Simply describe your requirements, and I'll create detailed BRD reports stored in S3 for your team's review.
            </p>
            <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <i className="fas fa-check-circle text-green-500"></i>
                <span>BRD Generation</span>
              </div>
              <div className="flex items-center space-x-1">
                <i className="fas fa-cloud text-blue-500"></i>
                <span>S3 Storage</span>
              </div>
              <div className="flex items-center space-x-1">
                <i className="fas fa-users text-purple-500"></i>
                <span>Team Collaboration</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 fade-in ${
              message.isFromAgent ? "" : "justify-end"
            }`}
            data-testid={`message-${message.id}`}
          >
            {message.isFromAgent && (
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="fas fa-robot text-primary-foreground text-sm"></i>
              </div>
            )}
            <div
              className={`rounded-xl p-4 max-w-3xl ${
                message.isFromAgent
                  ? "bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-2 border-transparent"
                  : "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
              }`}
              style={message.isFromAgent ? {
                background: 'linear-gradient(white, white) padding-box, linear-gradient(45deg, #3b82f6, #8b5cf6) border-box'
              } : {}}
            >
              <div className="message-content text-gray-800 dark:text-gray-200">
                {message.content.split('\n').map((line, index) => {
                  // Handle headers
                  if (line.startsWith('# ')) {
                    return (
                      <h1 key={index} className="text-xl font-bold mb-3 mt-4 first:mt-0 text-gray-900 dark:text-gray-100 border-b border-gray-300 dark:border-gray-600 pb-2">
                        {line.substring(2)}
                      </h1>
                    );
                  }
                  if (line.startsWith('## ')) {
                    return (
                      <h2 key={index} className="text-lg font-semibold mb-2 mt-3 first:mt-0 text-gray-800 dark:text-gray-200">
                        {line.substring(3)}
                      </h2>
                    );
                  }
                  if (line.startsWith('### ')) {
                    return (
                      <h3 key={index} className="text-base font-semibold mb-1 mt-2 first:mt-0 text-gray-700 dark:text-gray-300">
                        {line.substring(4)}
                      </h3>
                    );
                  }
                  // Handle bullet points
                  if (line.startsWith('- ') || line.startsWith('* ')) {
                    return (
                      <div key={index} className="flex items-start mb-1 ml-4">
                        <span className="text-gray-600 dark:text-gray-400 mr-2">•</span>
                        <span>{line.substring(2)}</span>
                      </div>
                    );
                  }
                  // Handle numbered lists
                  if (/^\d+\. /.test(line)) {
                    const match = line.match(/^(\d+)\. (.*)/);
                    return (
                      <div key={index} className="flex items-start mb-1 ml-4">
                        <span className="text-gray-600 dark:text-gray-400 mr-2 font-medium">
                          {match?.[1]}.
                        </span>
                        <span>{match?.[2]}</span>
                      </div>
                    );
                  }
                  // Handle bold text
                  if (line.includes('**')) {
                    const parts = line.split('**');
                    return (
                      <p key={index} className="mb-2">
                        {parts.map((part, i) => 
                          i % 2 === 1 ? (
                            <strong key={i} className="font-semibold text-gray-900 dark:text-gray-100">
                              {part}
                            </strong>
                          ) : part
                        )}
                      </p>
                    );
                  }
                  // Regular paragraphs
                  return line.trim() ? <p key={index} className="mb-2 leading-relaxed">{line}</p> : <br key={index} />;
                })}
              </div>
              {message.isFromAgent && message.content.includes("report") && (
                <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 flex items-center justify-between mt-3">
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-file-chart-column text-accent"></i>
                    <span className="text-sm font-medium text-accent-foreground">Report generated</span>
                  </div>
                </div>
              )}
            </div>
            {!message.isFromAgent && (
              <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="fas fa-user text-muted-foreground text-sm"></i>
              </div>
            )}
          </div>
        ))}

        {/* Streaming Message */}
        {isStreaming && streamingMessage && (
          <div className="flex items-start space-x-3 fade-in" data-testid="streaming-message">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <i className="fas fa-brain text-white text-sm animate-pulse"></i>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 max-w-3xl border-2 border-transparent" style={{
              background: 'linear-gradient(white, white) padding-box, linear-gradient(45deg, #3b82f6, #8b5cf6) border-box'
            }}>
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-blue-600 font-medium">AI is generating response...</span>
              </div>
              <div className="message-content text-gray-700 dark:text-gray-300">
                {streamingMessage.split('\n').map((line, index) => {
                  // Handle headers
                  if (line.startsWith('# ')) {
                    return (
                      <h1 key={index} className="text-xl font-bold mb-3 mt-4 first:mt-0 text-gray-900 dark:text-gray-100 border-b border-gray-300 dark:border-gray-600 pb-2">
                        {line.substring(2)}
                      </h1>
                    );
                  }
                  if (line.startsWith('## ')) {
                    return (
                      <h2 key={index} className="text-lg font-semibold mb-2 mt-3 first:mt-0 text-gray-800 dark:text-gray-200">
                        {line.substring(3)}
                      </h2>
                    );
                  }
                  if (line.startsWith('### ')) {
                    return (
                      <h3 key={index} className="text-base font-semibold mb-1 mt-2 first:mt-0 text-gray-700 dark:text-gray-300">
                        {line.substring(4)}
                      </h3>
                    );
                  }
                  // Handle bullet points
                  if (line.startsWith('- ') || line.startsWith('* ')) {
                    return (
                      <div key={index} className="flex items-start mb-1 ml-4">
                        <span className="text-gray-600 dark:text-gray-400 mr-2">•</span>
                        <span>{line.substring(2)}</span>
                      </div>
                    );
                  }
                  // Handle numbered lists
                  if (/^\d+\. /.test(line)) {
                    const match = line.match(/^(\d+)\. (.*)/);
                    return (
                      <div key={index} className="flex items-start mb-1 ml-4">
                        <span className="text-gray-600 dark:text-gray-400 mr-2 font-medium">
                          {match?.[1]}.
                        </span>
                        <span>{match?.[2]}</span>
                      </div>
                    );
                  }
                  // Regular paragraphs
                  return line.trim() ? <p key={index} className="mb-2 leading-relaxed">{line}</p> : <br key={index} />;
                })}
              </div>
              <div className="w-2 h-4 bg-blue-500 streaming-cursor inline-block ml-1"></div>
            </div>
          </div>
        )}

        {/* Typing Indicator */}
        {(isLoading || (isStreaming && !streamingMessage)) && (
          <div className="flex items-start space-x-3 fade-in" data-testid="typing-indicator">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <i className="fas fa-brain text-white text-sm"></i>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border-2 border-transparent" style={{
              background: 'linear-gradient(white, white) padding-box, linear-gradient(45deg, #3b82f6, #8b5cf6) border-box'
            }}>
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full typing-indicator"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full typing-indicator" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full typing-indicator" style={{ animationDelay: "0.4s" }}></div>
                </div>
                <span className="text-sm text-blue-600 font-medium">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-card border-t border-border p-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={promptText}
              onChange={(e) => {
                setPromptText(e.target.value);
                adjustTextareaHeight();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Enter your prompt here... You can write detailed, multi-paragraph requests."
              className="w-full bg-background border border-border rounded-lg p-4 pr-12 resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent min-h-[100px] max-h-[300px]"
              data-testid="prompt-input"
            />
            <Button
              onClick={handleSubmit}
              disabled={!promptText.trim() || isSubmitting}
              className="absolute bottom-4 right-4 w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed p-0 shadow-lg hover:shadow-xl hover:scale-105"
              data-testid="send-button"
            >
              <i className="fas fa-paper-plane text-white text-sm"></i>
            </Button>
          </div>
          <div className="flex items-center justify-between mt-3 text-xs">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 text-blue-600">
                <i className="fas fa-magic"></i>
                <span>AI-powered BRD generation</span>
              </div>
              <span className="text-gray-400">•</span>
              <span className="text-muted-foreground">Up to 100K characters</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`font-medium ${
                promptText.length > 90000 ? 'text-red-500' : 
                promptText.length > 50000 ? 'text-yellow-500' : 'text-green-500'
              }`} data-testid="character-count">
                {promptText.length.toLocaleString()}
              </span>
              <span className="text-muted-foreground">characters</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
