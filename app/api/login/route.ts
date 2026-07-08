import { NextResponse } from "next/server";

// Same-origin proxy to the NestJS /auth/login endpoint.
// Lets the login page detect a 2FA-required response *before* it commits to
// creating a NextAuth session, without needing CORS for this pre-check.
export async function POST(request: Request) {
  const body = await request.json();

  const res = await fetch(`${process.env.API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
