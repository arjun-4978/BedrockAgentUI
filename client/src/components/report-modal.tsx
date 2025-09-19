import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import type { Report } from "@shared/schema";

interface ReportModalProps {
  report: Report;
  onClose: () => void;
}

export default function ReportModal({ report, onClose }: ReportModalProps) {
  const [showModal, setShowModal] = useState(true);

  const { data: reportData, isLoading } = useQuery<{report: Report; content: string}>({
    queryKey: ["/api/reports", report.id, "content"],
  });

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const handleClose = () => {
    setShowModal(false);
    setTimeout(onClose, 150);
  };

  const handleDownload = () => {
    if (reportData?.content) {
      const blob = new Blob([reportData.content], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = report.title;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleOpenInNewTab = () => {
    if (reportData?.content) {
      const blob = new Blob([reportData.content], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    }
  };

  return (
    <div 
      className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 transition-opacity duration-150 ${
        showModal ? "opacity-100" : "opacity-0"
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
      data-testid="report-modal"
    >
      <div className={`bg-card rounded-lg w-full max-w-4xl h-[80vh] flex flex-col transition-transform duration-150 ${
        showModal ? "scale-100" : "scale-95"
      }`}>
        {/* Modal Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <i className="fas fa-file-alt text-primary"></i>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{report.title}</h2>
              <p className="text-sm text-muted-foreground">{report.s3Path}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              disabled={!reportData?.content}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              data-testid="download-report-button"
            >
              <i className="fas fa-download text-muted-foreground"></i>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenInNewTab}
              disabled={!reportData?.content}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              data-testid="open-new-tab-button"
            >
              <i className="fas fa-external-link-alt text-muted-foreground"></i>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              data-testid="close-modal-button"
            >
              <i className="fas fa-times text-muted-foreground"></i>
            </Button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6" data-testid="report-content">
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-1/2 animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-5/6 animate-pulse"></div>
              <div className="space-y-2 mt-8">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-4 bg-muted rounded w-full animate-pulse"></div>
                ))}
              </div>
            </div>
          ) : reportData?.content ? (
            <div className="markdown-content prose prose-neutral dark:prose-invert max-w-none">
              <ReactMarkdown>{reportData.content}</ReactMarkdown>
            </div>
          ) : (
            <div className="text-center py-8">
              <i className="fas fa-exclamation-triangle text-destructive text-2xl mb-2"></i>
              <p className="text-sm text-muted-foreground">Failed to load report content</p>
              <p className="text-xs text-muted-foreground mt-1">
                The report may not be available in S3 or there was an error loading it.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
