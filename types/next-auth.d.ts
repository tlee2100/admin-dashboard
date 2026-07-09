import { DefaultSession } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session extends DefaultSession {
    accessToken: string;
    error?: "RefreshAccessTokenError";
    user: DefaultSession["user"] & {
      id: string;
      role: string;
    };
  }

  interface User {
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number; // epoch ms
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    role?: string;
    error?: "RefreshAccessTokenError";
  }
}

declare module "next-auth" {
  interface Session extends DefaultSession {
    accessToken: string;
    error?: "RefreshAccessTokenError";
    user: DefaultSession["user"] & {
      id: string;
      role: string;
      bio?: string | null;
      avatarUrl?: string | null;
    };
  }
  // ... phần User, giữ nguyên như trước
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    // ... các field cũ giữ nguyên
    bio?: string | null;
    avatarUrl?: string | null;
  }
}
