import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const hasAuthError = req.auth?.error === "RefreshAccessTokenError";
  const { pathname } = req.nextUrl;

  const isAuthPage = pathname.startsWith("/login");
  const isProtectedRoute = pathname.startsWith("/dashboard");

  // hasAuthError nghĩa là refresh token đã chết thật sự (không phải access
  // token hết hạn bình thường — cái đó đã tự phục hồi trong jwt() callback)
  if (isProtectedRoute && (!isLoggedIn || hasAuthError)) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isAuthPage && isLoggedIn && !hasAuthError) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
