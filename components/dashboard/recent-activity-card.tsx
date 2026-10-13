import { CheckCircle2, Globe, Clock } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export function RecentActivityCard() {
  return (
    <Card className="border-primary/5">
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Recent Activity
        </CardTitle>
        <CardDescription>System operational status report</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col">
          <div className="flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors border-b">
            <div className="rounded-full bg-emerald-500/10 p-1.5 text-emerald-500 mt-0.5">
              <CheckCircle2 className="size-3.5" />
            </div>
            <div className="flex-1 space-y-0.5">
              <p className="text-sm font-medium">Training data completed</p>
              <p className="text-xs text-muted-foreground">
                Document &quot;huong_dan_su_dung.pdf&quot; for website &quot;VTI
                Academy&quot; is now ready.
              </p>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium mt-1">
              2 minutes ago
            </span>
          </div>

          <div className="flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors border-b">
            <div className="rounded-full bg-blue-500/10 p-1.5 text-blue-500 mt-0.5">
              <Globe className="size-3.5" />
            </div>
            <div className="flex-1 space-y-0.5">
              <p className="text-sm font-medium">
                New website successfully integrated
              </p>
              <p className="text-xs text-muted-foreground">
                Admin has successfully initialized and configured the chatbot
                for &quot;vti-group.vn&quot;.
              </p>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium mt-1">
              1 hour ago
            </span>
          </div>

          <div className="flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors">
            <div className="rounded-full bg-amber-500/10 p-1.5 text-amber-500 mt-0.5">
              <Clock className="size-3.5" />
            </div>
            <div className="flex-1 space-y-0.5">
              <p className="text-sm font-medium">
                New document is being processed
              </p>
              <p className="text-xs text-muted-foreground">
                Agent uploaded file &quot;quy_che_tuyen_dung.txt&quot; for
                chatbot site ID #3.
              </p>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium mt-1">
              3 hours ago
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
