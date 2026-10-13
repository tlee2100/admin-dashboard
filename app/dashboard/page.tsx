import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { fetchDashboardStats } from "@/services/dashboard.service";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { MessageTrendChart } from "@/components/dashboard/message-trend-chart";
import { DocumentBreakdownCard } from "@/components/dashboard/document-breakdown-card";
import { RecentActivityCard } from "@/components/dashboard/recent-activity-card";
import { QuickActionsCard } from "@/components/dashboard/quick-actions-card";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardHome() {
  const session = await auth();
  if (!session?.accessToken) {
    redirect("/login");
  }

  const stats = await fetchDashboardStats(session.accessToken);
  const greeting = getGreeting();
  const userName = session.user?.name || session.user?.email || "Admin";

  return (
    <div className="flex flex-col gap-6">
      {/* Header greeting */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {greeting}, {userName}! 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Here is an overview of the system&apos;s operational status and AI
            training documents.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <KpiCards stats={stats} />

      {/* Charts & Breakdown */}
      <div className="grid gap-6 md:grid-cols-3">
        <MessageTrendChart chatStats={stats.chat} />
        <DocumentBreakdownCard
          documentStats={stats.documents}
          chatStats={stats.chat}
        />
      </div>

      {/* Activity & Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <RecentActivityCard />
        <QuickActionsCard />
      </div>
    </div>
  );
}
