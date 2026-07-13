import { DefaultSession } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session extends DefaultSession {
    accessToken: string;
    error?: "RefreshAccessTokenError";
    user: DefaultSession["user"] & {
      id: string;
      role: string;
      bio?: string | null;
      avatarUrl?: string | null;
      organizationId?: number | null;
    };
  }

  interface User {
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
    role: string;
    bio?: string | null;
    avatarUrl?: string | null;
    organizationId?: number | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    role?: string;
    bio?: string | null;
    avatarUrl?: string | null;
    organizationId?: number | null;
    error?: "RefreshAccessTokenError";
  }
}
