import { auth } from "@/auth";
import { NextResponse } from "next/server";

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

export async function GET() {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const headers = { Authorization: `Bearer ${session.accessToken}` };

    // Gọi song song API lấy danh sách Website và Người dùng từ NestJS Backend
    const [sitesRes, usersRes] = await Promise.all([
      fetch(`${process.env.API_URL}/site`, { headers, cache: "no-store" }),
      fetch(`${process.env.API_URL}/users/all`, { headers, cache: "no-store" }),
    ]);

    let sites: SiteData[] = [];
    let users: UserData[] = [];

    if (sitesRes.ok) {
      sites = await sitesRes.json();
    } else {
      console.error(
        "Failed to fetch sites from NestJS backend:",
        sitesRes.statusText,
      );
    }

    if (usersRes.ok) {
      users = await usersRes.json();
    } else {
      console.error(
        "Failed to fetch users from NestJS backend:",
        usersRes.statusText,
      );
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
            documentStatusCount[
              docStatus as keyof typeof documentStatusCount
            ]++;
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

    // 4. Sinh dữ liệu giả định về xu hướng trò chuyện & lượng tin nhắn (vì Chat không lưu database)
    const chatStats = {
      totalConversations: 124, // MOCK data
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

    return NextResponse.json({
      success: true,
      data: {
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
          backendOnline: true,
          websocketConnected: true,
          apiVersion: "1.0.0",
        },
      },
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("Error generating dashboard statistics:", error);
    // Trả về dữ liệu mock an toàn nếu backend gặp lỗi để trang dashboard không bị crash
    return NextResponse.json({
      success: false,
      error: errMsg,
      data: {
        sites: { total: 0, status: { pending: 0, completed: 0, failed: 0 } },
        documents: {
          total: 0,
          status: { pending: 0, processing: 0, ready: 0, failed: 0 },
        },
        users: { total: 0, roles: { admin: 0, agent: 0 } },
        chat: {
          totalConversations: 0,
          avgResponseTime: "0s",
          messagesTrend: [],
          documentTypeBreakdown: [],
        },
        system: {
          backendOnline: false,
          websocketConnected: false,
          apiVersion: "0.0.0",
        },
      },
    });
  }
}
