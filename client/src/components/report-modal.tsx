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
              variant="outline"
              size="sm"
              onClick={handleClose}
              className="px-3 py-1 hover:bg-muted transition-colors"
              data-testid="close-modal-button"
            >
              <i className="fas fa-times mr-1"></i>
              Close
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
            <div className="markdown-content max-w-none">
              <ReactMarkdown 
                components={{
                  h1: ({children}) => (
                    <h1 className="text-3xl font-bold mb-6 mt-8 text-gray-900 dark:text-gray-100 border-b-2 border-gray-300 dark:border-gray-600 pb-3">
                      {children}
                    </h1>
                  ),
                  h2: ({children}) => (
                    <h2 className="text-2xl font-semibold mb-4 mt-8 text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
                      {children}
                    </h2>
                  ),
                  h3: ({children}) => (
                    <h3 className="text-xl font-semibold mb-3 mt-6 text-gray-800 dark:text-gray-200">
                      {children}
                    </h3>
                  ),
                  h4: ({children}) => (
                    <h4 className="text-lg font-semibold mb-2 mt-4 text-gray-700 dark:text-gray-300">
                      {children}
                    </h4>
                  ),
                  h5: ({children}) => (
                    <h5 className="text-base font-semibold mb-2 mt-3 text-gray-700 dark:text-gray-300">
                      {children}
                    </h5>
                  ),
                  p: ({children}) => (
                    <p className="mb-4 leading-relaxed text-gray-700 dark:text-gray-300">
                      {children}
                    </p>
                  ),
                  ul: ({children}) => (
                    <ul className="mb-4 pl-6 space-y-1">
                      {children}
                    </ul>
                  ),
                  ol: ({children}) => (
                    <ol className="mb-4 pl-6 space-y-1">
                      {children}
                    </ol>
                  ),
                  li: ({children}) => (
                    <li className="leading-relaxed text-gray-700 dark:text-gray-300 list-disc">
                      {children}
                    </li>
                  ),
                  strong: ({children}) => (
                    <strong className="font-semibold text-gray-900 dark:text-gray-100">
                      {children}
                    </strong>
                  ),
                  em: ({children}) => (
                    <em className="italic text-gray-600 dark:text-gray-400">
                      {children}
                    </em>
                  ),
                  code: ({children}) => (
                    <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
                      {children}
                    </code>
                  ),
                  pre: ({children}) => (
                    <pre className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto mb-6 border border-gray-200 dark:border-gray-700">
                      <code className="text-gray-800 dark:text-gray-200 text-sm">
                        {children}
                      </code>
                    </pre>
                  ),
                  blockquote: ({children}) => (
                    <blockquote className="border-l-4 border-gray-400 dark:border-gray-600 pl-4 italic text-gray-600 dark:text-gray-400 mb-4">
                      {children}
                    </blockquote>
                  ),
                  table: ({children}) => (
                    <div className="overflow-x-auto mb-6">
                      <table className="min-w-full border border-gray-300 dark:border-gray-600">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({children}) => (
                    <thead className="bg-gray-100 dark:bg-gray-800">
                      {children}
                    </thead>
                  ),
                  tbody: ({children}) => (
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {children}
                    </tbody>
                  ),
                  tr: ({children}) => (
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      {children}
                    </tr>
                  ),
                  th: ({children}) => (
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-300 dark:border-gray-600">
                      {children}
                    </th>
                  ),
                  td: ({children}) => (
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                      {children}
                    </td>
                  ),
                  hr: () => (
                    <hr className="my-6 border-gray-300 dark:border-gray-600" />
                  )
                }}
              >
                {reportData.content}
              </ReactMarkdown>
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
