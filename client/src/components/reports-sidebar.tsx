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
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Reports</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefreshReports}
            className="p-1 hover:bg-muted rounded"
            data-testid="refresh-reports-button"
          >
            <i className="fas fa-refresh text-muted-foreground text-sm"></i>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Latest reports from S3</p>
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
              className="bg-background rounded-lg p-3 border border-border hover:border-primary/50 transition-colors cursor-pointer fade-in"
              data-testid={`report-item-${report.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-foreground text-sm">{report.title}</h3>
                  {report.description && (
                    <p className="text-xs text-muted-foreground mt-1">{report.description}</p>
                  )}
                  <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                    <span>{formatDate(report.createdAt)}</span>
                    {report.size && <span>{report.size}</span>}
                  </div>
                </div>
                <div className="flex items-center space-x-1 ml-2">
                  <div className="w-2 h-2 bg-accent rounded-full"></div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reports Footer */}
      <div className="p-4 border-t border-border">
        <Button
          variant="secondary"
          className="w-full"
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
