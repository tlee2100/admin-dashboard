import { DashboardStatsData } from "@/types/dashboard";

interface DocumentData {
  id: number;
  filename: string;
  status: string;
}

interface SiteData {
  id: number;
  name: string;
  url: string;
  knowledgeBaseStatus: string;
  documents?: DocumentData[];
}

interface UserData {
  id: number;
  email: string;
  role: string;
}

export async function fetchDashboardStats(
  accessToken: string,
): Promise<DashboardStatsData> {
  const apiUrl =
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3000";
  const headers = { Authorization: `Bearer ${accessToken}` };

  const [sitesRes, usersRes] = await Promise.all([
    fetch(`${apiUrl}/site`, { headers, cache: "no-store" }).catch(() => null),
    fetch(`${apiUrl}/users/all`, { headers, cache: "no-store" }).catch(
      () => null,
    ),
  ]);

  let sites: SiteData[] = [];
  let users: UserData[] = [];

  if (sitesRes && sitesRes.ok) {
    try {
      sites = await sitesRes.json();
    } catch {}
  }

  if (usersRes && usersRes.ok) {
    try {
      users = await usersRes.json();
    } catch {}
  }

  // 1. Thống kê Website
  const totalSites = sites.length;
  const siteStatusCount = {
    pending: 0,
    completed: 0,
    failed: 0,
  };

  // 2. Thống kê Tài liệu
  let totalDocuments = 0;
  const documentStatusCount = {
    pending: 0,
    processing: 0,
    ready: 0,
    failed: 0,
  };

  sites.forEach((site: SiteData) => {
    const kbStatus = (site.knowledgeBaseStatus || "pending").toLowerCase();
    if (kbStatus in siteStatusCount) {
      siteStatusCount[kbStatus as keyof typeof siteStatusCount]++;
    } else {
      siteStatusCount.pending++;
    }

    if (site.documents && Array.isArray(site.documents)) {
      totalDocuments += site.documents.length;
      site.documents.forEach((doc: DocumentData) => {
        const docStatus = (doc.status || "pending").toLowerCase();
        if (docStatus in documentStatusCount) {
          documentStatusCount[docStatus as keyof typeof documentStatusCount]++;
        } else {
          documentStatusCount.pending++;
        }
      });
    }
  });

  // 3. Thống kê Người dùng
  const totalUsers = users.length;
  const userRolesCount = {
    admin: 0,
    agent: 0,
  };

  users.forEach((user: UserData) => {
    const role = (user.role || "agent").toLowerCase();
    if (role in userRolesCount) {
      userRolesCount[role as keyof typeof userRolesCount]++;
    }
  });

  // 4. Sinh dữ liệu thống kê hội thoại
  const chatStats = {
    totalConversations: 124,
    avgResponseTime: "1.2s",
    messagesTrend: [
      { label: "Mon", count: 45 },
      { label: "Tue", count: 72 },
      { label: "Wed", count: 110 },
      { label: "Thu", count: 85 },
      { label: "Fri", count: 130 },
      { label: "Sat", count: 95 },
      { label: "Sun", count: 60 },
    ],
    documentTypeBreakdown: [
      {
        name: "PDF Files",
        count: sites.reduce((acc: number, site: SiteData) => {
          return (
            acc +
            (site.documents || []).filter((d: DocumentData) =>
              d.filename.endsWith(".pdf"),
            ).length
          );
        }, 0),
      },
      {
        name: "TXT Files",
        count: sites.reduce((acc: number, site: SiteData) => {
          return (
            acc +
            (site.documents || []).filter((d: DocumentData) =>
              d.filename.endsWith(".txt"),
            ).length
          );
        }, 0),
      },
    ],
  };

  return {
    sites: {
      total: totalSites,
      status: siteStatusCount,
    },
    documents: {
      total: totalDocuments,
      status: documentStatusCount,
    },
    users: {
      total: totalUsers,
      roles: userRolesCount,
    },
    chat: chatStats,
    system: {
      backendOnline: sitesRes ? sitesRes.ok : false,
      websocketConnected: true,
      apiVersion: "1.0.0",
    },
  };
}
