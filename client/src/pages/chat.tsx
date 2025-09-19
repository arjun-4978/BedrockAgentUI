import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import ChatInterface from "@/components/chat-interface";
import ReportsSidebar from "@/components/reports-sidebar";
import ReportModal from "@/components/report-modal";
import type { ChatSession, ChatMessage, Report } from "@shared/schema";

export default function ChatPage() {
  const [sessionId, setSessionId] = useState<string>("");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const queryClient = useQueryClient();

  // Create session on mount
  useEffect(() => {
    const createSession = async () => {
      try {
        const response = await apiRequest("POST", "/api/chat/session");
        const session: ChatSession = await response.json();
        setSessionId(session.sessionId);
      } catch (error) {
        console.error("Failed to create session:", error);
      }
    };
    
    createSession();
  }, []);

  // Fetch messages for current session
  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat", sessionId, "messages"],
    enabled: !!sessionId,
  });

  // Fetch reports
  const { data: reports = [], isLoading: reportsLoading } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", `/api/chat/${sessionId}/message`, {
        content,
        isFromAgent: false
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/chat", sessionId, "messages"]
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/reports"]
      });
    }
  });

  const handleSendMessage = async (content: string) => {
    if (!sessionId || !content.trim()) return;
    await sendMessageMutation.mutateAsync(content);
  };

  const handleOpenReport = (report: Report) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };

  const handleCloseModal = () => {
    setShowReportModal(false);
    setSelectedReport(null);
  };

  return (
    <div className="flex h-screen" data-testid="chat-page">
      <ChatInterface
        messages={messages}
        isLoading={messagesLoading || sendMessageMutation.isPending}
        onSendMessage={handleSendMessage}
        sessionId={sessionId}
      />
      <ReportsSidebar
        reports={reports}
        isLoading={reportsLoading}
        onOpenReport={handleOpenReport}
      />
      {showReportModal && selectedReport && (
        <ReportModal
          report={selectedReport}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
