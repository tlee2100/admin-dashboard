import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { DocumentStats, ChatStats } from "@/types/dashboard";

interface DocumentBreakdownCardProps {
  documentStats: DocumentStats;
  chatStats: ChatStats;
}

export function DocumentBreakdownCard({
  documentStats,
  chatStats,
}: DocumentBreakdownCardProps) {
  return (
    <Card className="border-primary/5">
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Document Formats
        </CardTitle>
        <CardDescription>AI training file breakdown by type</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {chatStats.documentTypeBreakdown.map((type, idx) => {
          const percentage =
            documentStats.total > 0
              ? Math.round((type.count / documentStats.total) * 100)
              : 0;

          return (
            <div key={idx} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-muted-foreground">
                  {type.name}
                </span>
                <span className="font-semibold text-foreground">
                  {type.count} files ({percentage}%)
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    idx === 0 ? "bg-indigo-500" : "bg-teal-500"
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}

        <div className="mt-4 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
          <p className="leading-relaxed">
            💡 <strong>Training tip:</strong> The system prioritizes{" "}
            <strong>PDF</strong> format for large document sets with table-heavy
            content, and <strong>TXT</strong> for short Q&A answers.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
