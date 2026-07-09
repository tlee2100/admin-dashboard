import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Forward multipart/form-data nguyên vẹn tới NestJS — không cần parse
  // lại thủ công, fetch tự set đúng Content-Type + boundary từ formData gốc
  const formData = await request.formData();

  const res = await fetch(`${process.env.API_URL}/users/me/avatar`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${session.accessToken}` },
    body: formData,
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
