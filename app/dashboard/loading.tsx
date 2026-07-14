import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex h-full min-h-[60vh] w-full flex-col items-center justify-center gap-4 text-muted-foreground">
      <Loader2 className="size-10 animate-spin text-primary" />
      <p className="text-sm font-medium animate-pulse">Loading data...</p>
    </div>
  );
}
