import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth; // req.auth chính là session, do auth() bơm vào
  const { pathname } = req.nextUrl;

  const isAuthPage = pathname.startsWith("/login");
  const isProtectedRoute = pathname.startsWith("/dashboard");

  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next(); // không match case nào → cho qua bình thường
});

export const config = {
  // matcher giới hạn phạm vi request nào sẽ chạy qua proxy này
  // (không match thì Next.js bỏ qua hoàn toàn, tăng performance)
  matcher: ["/dashboard/:path*", "/login"],
};
