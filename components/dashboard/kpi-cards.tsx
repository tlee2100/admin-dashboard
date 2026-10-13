import { Globe, FileText, Users, Server, UserCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardStatsData } from "@/types/dashboard";

interface KpiCardsProps {
  stats: DashboardStatsData;
}

export function KpiCards({ stats }: KpiCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Website card */}
      <Card className="relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-md border-primary/10">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Websites
          </CardTitle>
          <div className="rounded-lg bg-blue-500/10 p-2 text-blue-500 dark:bg-blue-500/20">
            <Globe className="size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.sites.total}</div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
            <Badge
              variant="outline"
              className="border-emerald-500/30 bg-emerald-500/5 text-emerald-500 px-1 py-0.5"
            >
              {stats.sites.status.completed} Completed
            </Badge>
            <span>pending: {stats.sites.status.pending}</span>
          </div>
        </CardContent>
      </Card>

      {/* Document card */}
      <Card className="relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-md border-primary/10">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Training Documents
          </CardTitle>
          <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-500 dark:bg-indigo-500/20">
            <FileText className="size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.documents.total}</div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
            <Badge
              variant="outline"
              className="border-indigo-500/30 bg-indigo-500/5 text-indigo-500 px-1 py-0.5"
            >
              {stats.documents.status.ready} Ready
            </Badge>
            <span>processing: {stats.documents.status.processing}</span>
          </div>
        </CardContent>
      </Card>

      {/* Users card */}
      <Card className="relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-md border-primary/10">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            System Users
          </CardTitle>
          <div className="rounded-lg bg-amber-500/10 p-2 text-amber-500 dark:bg-amber-500/20">
            <Users className="size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.users.total}</div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 text-emerald-500">
              <UserCheck className="size-3" />
              {stats.users.roles.admin} Admin
            </span>
            <span>/ {stats.users.roles.agent} Agent</span>
          </div>
        </CardContent>
      </Card>

      {/* System Status card */}
      <Card className="relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-md border-primary/10">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Connection Status
          </CardTitle>
          <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-500 dark:bg-emerald-500/20">
            <Server className="size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="relative flex size-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500"></span>
            </div>
            <span className="text-base font-semibold text-emerald-600 dark:text-emerald-400">
              All systems operational
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              API:{" "}
              <span
                className={
                  stats.system.backendOnline
                    ? "text-emerald-500 font-medium"
                    : "text-rose-500 font-medium"
                }
              >
                {stats.system.backendOnline ? "Online" : "Offline"}
              </span>
            </span>
            <span>|</span>
            <span className="flex items-center gap-1">
              WebSocket:{" "}
              <span className="text-emerald-500 font-medium">Connected</span>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
