import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { fetchDashboardStats } from "@/services/dashboard.service";

export async function GET() {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const stats = await fetchDashboardStats(session.accessToken);
    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("Error generating dashboard statistics:", error);
    return NextResponse.json(
      {
        success: false,
        error: errMsg,
      },
      { status: 500 },
    );
  }
}
