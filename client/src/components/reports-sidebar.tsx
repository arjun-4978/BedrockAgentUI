import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import type { Report } from "@shared/schema";

interface ReportsSidebarProps {
  reports: Report[];
  isLoading: boolean;
  onOpenReport: (report: Report) => void;
}

export default function ReportsSidebar({ reports, isLoading, onOpenReport }: ReportsSidebarProps) {
  const queryClient = useQueryClient();

  const handleRefreshReports = () => {
    queryClient.invalidateQueries({
      queryKey: ["/api/reports"]
    });
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Unknown";
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`;
    return `${Math.floor(diffInHours / 168)} weeks ago`;
  };

  return (
    <div className="w-80 bg-card border-l border-border flex flex-col" data-testid="reports-sidebar">
      {/* Reports Header */}
      <div className="p-4 border-b border-border bg-gradient-to-r from-emerald-500 to-teal-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <i className="fas fa-file-chart-column text-white text-sm"></i>
            </div>
            <h2 className="text-lg font-semibold text-white">BRD Reports</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefreshReports}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            data-testid="refresh-reports-button"
          >
            <i className="fas fa-refresh text-white text-sm"></i>
          </Button>
        </div>
        <p className="text-sm text-white/90 mt-1">Latest reports from S3 bucket</p>
      </div>

      {/* Reports List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3" data-testid="reports-list">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-background rounded-lg p-3 border border-border animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full mb-2"></div>
                <div className="flex space-x-4">
                  <div className="h-3 bg-muted rounded w-16"></div>
                  <div className="h-3 bg-muted rounded w-12"></div>
                </div>
              </div>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-8">
            <i className="fas fa-file-alt text-muted-foreground text-2xl mb-2"></i>
            <p className="text-sm text-muted-foreground">No reports available</p>
            <p className="text-xs text-muted-foreground mt-1">
              Start a conversation to generate reports
            </p>
          </div>
        ) : (
          reports.map((report) => (
            <div
              key={report.id}
              onClick={() => onOpenReport(report)}
              className="bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-lg p-3 border-2 border-transparent bg-clip-padding hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer fade-in relative overflow-hidden"
              data-testid={`report-item-${report.id}`}
              style={{
                background: 'linear-gradient(white, white) padding-box, linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899) border-box'
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-foreground text-sm">{report.title}</h3>
                  {report.description && (
                    <p className="text-xs text-muted-foreground mt-1">{report.description}</p>
                  )}
                  <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                    <span>{formatDate(report.lastModified || report.createdAt)}</span>
                    {report.size && <span>{report.size}</span>}
                  </div>
                </div>
                <div className="flex items-center space-x-1 ml-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reports Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground mb-3 text-center">
          {reports.length > 0 && (
            <span>Total: {reports.length} reports • Last updated: {reports[0]?.lastModified ? formatDate(reports[0].lastModified) : 'Unknown'}</span>
          )}
        </div>
        <Button
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
          onClick={handleRefreshReports}
          data-testid="view-all-reports-button"
        >
          <i className="fas fa-folder-open mr-2"></i>
          View All Reports
        </Button>
      </div>
    </div>
  );
}
