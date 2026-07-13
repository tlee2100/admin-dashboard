"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Globe,
  FileText,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Plus,
  Server,
  UserCheck,
  TrendingUp,
  RotateCw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type StatsData = {
  sites: {
    total: number;
    status: { pending: number; completed: number; failed: number };
  };
  documents: {
    total: number;
    status: {
      pending: number;
      processing: number;
      ready: number;
      failed: number;
    };
  };
  users: {
    total: number;
    roles: { admin: number; agent: number };
  };
  chat: {
    totalConversations: number;
    avgResponseTime: string;
    messagesTrend: { label: string; count: number }[];
    documentTypeBreakdown: { name: string; count: number }[];
  };
  system: {
    backendOnline: boolean;
    websocketConnected: boolean;
    apiVersion: string;
  };
};

export default function DashboardHome() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // Calculate greeting based on current system time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };
  const greeting = getGreeting();

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/dashboard/stats");
      if (!res.ok) throw new Error("Failed to load statistics.");
      const result = await res.json();
      if (result.success) {
        setStats(result.data);
      } else {
        throw new Error(result.error || "Data error from backend.");
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "A connection error occurred.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStats();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Vẽ biểu đồ SVG động
  const maxMessageCount =
    stats?.chat?.messagesTrend?.reduce(
      (max, item) => Math.max(max, item.count),
      0,
    ) || 1;
  const chartHeight = 160;
  const chartWidth = 500;
  const barPadding = 12;
  const barWidth =
    Math.floor(chartWidth / (stats?.chat?.messagesTrend?.length || 7)) -
    barPadding;

  return (
    <div className="flex flex-col gap-6">
      {/* Header greeting and status block */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {greeting}, {session?.user?.name || session?.user?.email || "Admin"}
            ! 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Here is an overview of the system&apos;s operational status and AI
            training documents.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            disabled={loading}
            className="gap-2"
          >
            <RotateCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            Refresh data
          </Button>
        </div>
      </div>

      {loading ? (
        // Hiển thị Skeletons khi tải trang
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="size-8 rounded-full" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        // Hiển thị thông báo lỗi
        <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center text-destructive">
          <AlertTriangle className="mb-2 size-8" />
          <h3 className="font-semibold">Failed to load data</h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchStats}>
            Retry
          </Button>
        </div>
      ) : (
        // Giao diện chính sau khi có dữ liệu
        <>
          {/* Dashboard KPI cards */}
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
                <div className="text-2xl font-bold">
                  {stats?.sites?.total || 0}
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                  <Badge
                    variant="outline"
                    className="border-emerald-500/30 bg-emerald-500/5 text-emerald-500 px-1 py-0.5"
                  >
                    {stats?.sites?.status?.completed || 0} Completed
                  </Badge>
                  <span>pending: {stats?.sites?.status?.pending || 0}</span>
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
                <div className="text-2xl font-bold">
                  {stats?.documents?.total || 0}
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                  <Badge
                    variant="outline"
                    className="border-indigo-500/30 bg-indigo-500/5 text-indigo-500 px-1 py-0.5"
                  >
                    {stats?.documents?.status?.ready || 0} Ready
                  </Badge>
                  <span>
                    processing: {stats?.documents?.status?.processing || 0}
                  </span>
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
                <div className="text-2xl font-bold">
                  {stats?.users?.total || 0}
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 text-emerald-500">
                    <UserCheck className="size-3" />
                    {stats?.users?.roles?.admin || 0} Admin
                  </span>
                  <span>/ {stats?.users?.roles?.agent || 0} Agent</span>
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
                        stats?.system?.backendOnline
                          ? "text-emerald-500 font-medium"
                          : "text-rose-500 font-medium"
                      }
                    >
                      {stats?.system?.backendOnline ? "Online" : "Offline"}
                    </span>
                  </span>
                  <span>|</span>
                  <span className="flex items-center gap-1">
                    WebSocket:{" "}
                    <span className="text-emerald-500 font-medium">
                      Connected
                    </span>
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Section Biểu đồ & Phân tích */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Biểu đồ hoạt động tin nhắn SVG tự vẽ */}
            <Card className="md:col-span-2 border-primary/5">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">
                    Weekly Message Frequency
                  </CardTitle>
                  <CardDescription>
                    Number of conversations handled automatically by the chatbot
                  </CardDescription>
                </div>
                <TrendingUp className="text-muted-foreground size-4" />
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center p-6 pb-2">
                <div className="relative w-full h-[200px] flex items-end justify-center">
                  <svg
                    width="100%"
                    height={chartHeight}
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="overflow-visible"
                  >
                    {/* Vẽ các đường kẻ ngang nền */}
                    {Array.from({ length: 4 }).map((_, i) => {
                      const y = (chartHeight / 4) * (i + 1);
                      return (
                        <line
                          key={i}
                          x1="0"
                          y1={y}
                          x2={chartWidth}
                          y2={y}
                          stroke="hsl(var(--border))"
                          strokeWidth="1"
                          strokeDasharray="4,4"
                        />
                      );
                    })}

                    {/* Vẽ các thanh bar cột */}
                    {stats?.chat?.messagesTrend?.map((item, index) => {
                      const barHeight = Math.max(
                        (item.count / maxMessageCount) * (chartHeight - 40),
                        10,
                      );
                      const x = index * (barWidth + barPadding) + barPadding;
                      const y = chartHeight - barHeight - 20;

                      return (
                        <g key={index} className="group">
                          {/* Thanh bar thực tế */}
                          <rect
                            x={x}
                            y={y}
                            width={barWidth}
                            height={barHeight}
                            rx="4"
                            className="fill-primary/80 transition-all duration-300 group-hover:fill-primary"
                            onMouseEnter={() => setHoveredBar(index)}
                            onMouseLeave={() => setHoveredBar(null)}
                          />

                          {/* Nhãn văn bản trục X (Ngày) */}
                          <text
                            x={x + barWidth / 2}
                            y={chartHeight - 4}
                            textAnchor="middle"
                            className="fill-muted-foreground text-[10px] font-medium select-none"
                          >
                            {item.label}
                          </text>

                          {/* Nhãn số liệu trên đầu cột khi hover */}
                          <text
                            x={x + barWidth / 2}
                            y={y - 6}
                            textAnchor="middle"
                            className={`fill-foreground text-xs font-semibold select-none transition-opacity duration-200 ${
                              hoveredBar === index ? "opacity-100" : "opacity-0"
                            }`}
                          >
                            {item.count}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
                <div className="flex w-full items-center justify-between text-xs text-muted-foreground border-t pt-4 mt-2">
                  <span>
                    Avg. response time:{" "}
                    <strong className="text-foreground">
                      {stats?.chat?.avgResponseTime}
                    </strong>
                  </span>
                  <span>
                    Total conversations:{" "}
                    <strong className="text-foreground">
                      {stats?.chat?.totalConversations}
                    </strong>
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Phân bổ Định dạng tài liệu */}
            <Card className="border-primary/5">
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Document Formats
                </CardTitle>
                <CardDescription>
                  AI training file breakdown by type
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {stats?.chat?.documentTypeBreakdown?.map((type, idx) => {
                  const percentage =
                    stats.documents.total > 0
                      ? Math.round((type.count / stats.documents.total) * 100)
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
                      {/* Thanh Progress custom */}
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            idx === 0 ? "bg-indigo-500" : "bg-teal-500"
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}

                <div className="mt-4 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                  <p className="leading-relaxed">
                    💡 <strong>Training tip:</strong> The system prioritizes
                    <strong>PDF</strong> format for large document sets with
                    table-heavy content, and <strong>TXT</strong> for short Q&A
                    answers.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Section Bảng thao tác nhanh & Lịch sử hoạt động */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Lịch sử hoạt động gần đây */}
            <Card className="border-primary/5">
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  System operational status report
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex flex-col">
                  {/* Hoạt động 1 */}
                  <div className="flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors border-b">
                    <div className="rounded-full bg-emerald-500/10 p-1.5 text-emerald-500 mt-0.5">
                      <CheckCircle2 className="size-3.5" />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <p className="text-sm font-medium">
                        Training data completed
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Document &quot;huong_dan_su_dung.pdf&quot; for website
                        &quot;VTI Academy&quot; is now ready.
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium mt-1">
                      2 minutes ago
                    </span>
                  </div>

                  {/* Hoạt động 2 */}
                  <div className="flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors border-b">
                    <div className="rounded-full bg-blue-500/10 p-1.5 text-blue-500 mt-0.5">
                      <Globe className="size-3.5" />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <p className="text-sm font-medium">
                        New website successfully integrated
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Admin has successfully initialized and configured the
                        chatbot for &quot;vti-group.vn&quot;.
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium mt-1">
                      1 hour ago
                    </span>
                  </div>

                  {/* Hoạt động 3 */}
                  <div className="flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors">
                    <div className="rounded-full bg-amber-500/10 p-1.5 text-amber-500 mt-0.5">
                      <Clock className="size-3.5" />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <p className="text-sm font-medium">
                        New document is being processed
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Agent uploaded file &quot;quy_che_tuyen_dung.txt&quot;
                        for chatbot site ID #3.
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium mt-1">
                      3 hours ago
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bảng thao tác nhanh (Quick Actions) */}
            <Card className="border-primary/5 flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Shortcuts to key administration areas
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 pt-2">
                <Link href="/dashboard/users" className="group">
                  <div className="flex items-center justify-between rounded-lg border border-primary/5 bg-card p-3 shadow-xs transition-all duration-200 hover:border-primary/20 hover:bg-muted/40">
                    <div className="flex items-center gap-3">
                      <div className="rounded-md bg-blue-500/10 p-2 text-blue-500 group-hover:bg-blue-500/20">
                        <Users className="size-4" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold">User Management</p>
                        <p className="text-xs text-muted-foreground">
                          Add, edit, or remove Agent/Admin permissions.
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1" />
                  </div>
                </Link>

                <Link href="/dashboard/profile" className="group">
                  <div className="flex items-center justify-between rounded-lg border border-primary/5 bg-card p-3 shadow-xs transition-all duration-200 hover:border-primary/20 hover:bg-muted/40">
                    <div className="flex items-center gap-3">
                      <div className="rounded-md bg-indigo-500/10 p-2 text-indigo-500 group-hover:bg-indigo-500/20">
                        <UserCheck className="size-4" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold">
                          Personal Profile
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Change password, avatar, and account information.
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1" />
                  </div>
                </Link>

                <div className="rounded-xl bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-primary/5 p-4 flex items-center justify-between mt-2">
                  <div className="space-y-1">
                    <p className="text-sm font-bold">
                      Need to integrate a new chatbot?
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Create a site and link a training document set now.
                    </p>
                  </div>
                  <Button size="sm" className="gap-1.5 shadow-sm">
                    <Plus className="size-3.5" />
                    Add Website
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
