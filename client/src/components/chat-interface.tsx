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
    try {
      await onSendMessage(promptText);
      setPromptText("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSubmitting(false);
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
      <div className="bg-card border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <i className="fas fa-robot text-primary-foreground text-sm"></i>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">AI Agent Chat</h1>
            <p className="text-sm text-muted-foreground">Powered by AWS Bedrock</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 px-3 py-1 bg-accent/10 rounded-full">
            <div className="w-2 h-2 bg-accent rounded-full"></div>
            <span className="text-sm text-accent-foreground font-medium">
              {sessionId ? "Connected" : "Connecting..."}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4" data-testid="chat-messages">
        {/* Welcome Message */}
        <div className="flex items-start space-x-3 fade-in">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <i className="fas fa-robot text-primary-foreground text-sm"></i>
          </div>
          <div className="bg-card rounded-lg p-4 max-w-3xl border border-border">
            <p className="text-foreground">
              Welcome! I'm your AI agent assistant. You can send me long prompts and I'll process them using AWS Bedrock. 
              I can also generate detailed reports that will be stored in S3 for your review.
            </p>
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
              className={`rounded-lg p-4 max-w-3xl ${
                message.isFromAgent
                  ? "bg-card border border-border"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
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

        {/* Typing Indicator */}
        {isLoading && (
          <div className="flex items-start space-x-3 fade-in" data-testid="typing-indicator">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="fas fa-robot text-primary-foreground text-sm"></i>
            </div>
            <div className="bg-card rounded-lg p-4 border border-border">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full typing-indicator"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full typing-indicator" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full typing-indicator" style={{ animationDelay: "0.4s" }}></div>
                </div>
                <span className="text-sm text-muted-foreground">Agent is thinking...</span>
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
              className="absolute bottom-4 right-4 w-8 h-8 bg-primary rounded-lg flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed p-0"
              data-testid="send-button"
            >
              <i className="fas fa-paper-plane text-primary-foreground text-sm"></i>
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>Supports long prompts up to 100,000 characters</span>
            <span data-testid="character-count">{promptText.length} characters</span>
          </div>
        </div>
      </div>
    </div>
  );
}
