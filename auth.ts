import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";

// Phân biệt "cần 2FA" với "sai email/mật khẩu" — cả 2 đều xảy ra trong
// cùng 1 lần gọi authorize(), nhưng Server Action cần xử lý khác nhau
// (chuyển sang bước nhập mã, thay vì hiển thị lỗi đăng nhập)
export class TwoFactorRequiredError extends CredentialsSignin {
  code = "two_factor_required";
}

const REFRESH_BUFFER_MS = 60 * 1000;

async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const res = await fetch(`${process.env.API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: token.refreshToken }),
    });

    if (!res.ok) throw new Error("Refresh failed");

    const data = await res.json();

    return {
      ...token,
      accessToken: data.access_token,
      refreshToken: data.refresh_token, // rotation: luôn nhận refresh token mới
      accessTokenExpires: Date.now() + data.expires_in * 1000,
      error: undefined,
    };
  } catch {
    // refreshToken thật sự đã chết (hết hạn 7 ngày, hoặc bị revoke) —
    // không thể tự phục hồi nữa, đánh dấu lỗi để middleware xử lý logout
    return {
      ...token,
      accessToken: undefined,
      error: "RefreshAccessTokenError",
    };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        code: { label: "2FA code", type: "text" },
        recaptchaToken: { label: "reCAPTCHA token", type: "text" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const code = credentials?.code as string | undefined;

        if (code) {
          const res = await fetch(
            `${process.env.API_URL}/auth/verify-2fa-login`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, code }),
            },
          );
          if (!res.ok) return null;

          const data = await res.json();
          if (!data?.access_token) return null;

          return {
            id: String(data.user.id),
            email: data.user.email,
            role: data.user.role,
            accessToken: data.access_token as string,
            refreshToken: data.refresh_token as string,
            accessTokenExpires: Date.now() + data.expires_in * 1000,
          };
        }

        const res = await fetch(`${process.env.API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password: credentials?.password,
            recaptchaToken: credentials?.recaptchaToken,
          }),
        });

        const data = await res.json();

        if (data?.twoFactorRequired) {
          throw new TwoFactorRequiredError();
        }

        if (!res.ok || !data?.access_token) return null;

        return {
          id: String(data.user.id),
          email: data.user.email,
          role: data.user.role,
          accessToken: data.access_token as string,
          refreshToken: data.refresh_token as string,
          accessTokenExpires: Date.now() + data.expires_in * 1000,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      // Lần đầu tiên ngay sau khi authorize() thành công (login/verify-2fa)
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.accessTokenExpires = user.accessTokenExpires;
        token.role = user.role;

        try {
          const res = await fetch(`${process.env.API_URL}/users/${user.id}`);
          if (res.ok) {
            const profile = await res.json();
            token.name = profile.name;
          }
        } catch {}

        return token;
      }

      // Các lần sau (mọi request cần session): còn hạn → trả về ngay,
      // KHÔNG gọi network — đây là fast path giữ cho app nhanh như đã sửa
      // ở phần Users page trước đó
      if (
        typeof token.accessTokenExpires === "number" &&
        Date.now() < token.accessTokenExpires - REFRESH_BUFFER_MS
      ) {
        return token;
      }

      // Sắp hết hạn hoặc đã hết hạn → refresh trong im lặng, user không
      // hề hay biết, không bị đá ra khỏi trang
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.user.id = token.sub as string;
      session.user.role = token.role as string;
      session.user.name = (token.name as string) ?? session.user.email;
      session.error = token.error;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
