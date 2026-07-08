import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";

// Phân biệt "cần 2FA" với "sai email/mật khẩu" — cả 2 đều xảy ra trong
// cùng 1 lần gọi authorize(), nhưng Server Action cần xử lý khác nhau
// (chuyển sang bước nhập mã, thay vì hiển thị lỗi đăng nhập)
export class TwoFactorRequiredError extends CredentialsSignin {
  code = "two_factor_required";
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

        // Backend trả 200 kèm twoFactorRequired: true (không throw lỗi)
        // → phải check trước khi check res.ok / access_token
        if (data?.twoFactorRequired) {
          throw new TwoFactorRequiredError();
        }

        if (!res.ok || !data?.access_token) return null;

        return {
          id: String(data.user.id),
          email: data.user.email,
          role: data.user.role,
          accessToken: data.access_token as string,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.role = user.role;
        try {
          const res = await fetch(`${process.env.API_URL}/users/${user.id}`);
          if (res.ok) {
            const profile = await res.json();
            token.name = profile.name;
          }
        } catch {}
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.user.id = token.sub as string;
      session.user.role = token.role as string;
      session.user.name = (token.name as string) ?? session.user.email;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
