import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        // Present only on the 2FA step (6-digit TOTP code)
        code: { label: "2FA code", type: "text" },
        recaptchaToken: { label: "reCAPTCHA token", type: "text" },
      },
      // authorize() là nơi DUY NHẤT bạn tự viết logic xác thực
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const code = credentials?.code as string | undefined;

        // Bước 2 của luồng 2FA: xác thực bằng mã TOTP thay vì mật khẩu
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

        // Bước 1 (bình thường): email + password + recaptcha
        const res = await fetch(`${process.env.API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password: credentials?.password,
            recaptchaToken: credentials?.recaptchaToken,
          }),
        });

        // Nếu NestJS trả 401/400 → coi như đăng nhập sai
        if (!res.ok) return null;

        const data = await res.json();
        // Tài khoản bật 2FA nhưng client lại gọi thẳng bước 1 (không qua pre-check)
        // → không có access_token, coi như chưa đủ điều kiện đăng nhập
        if (!data?.access_token) return null;

        return {
          id: String(data.user.id),
          email: data.user.email,
          role: data.user.role,
          accessToken: data.access_token as string,
        };
      },
    }),
  ],
  session: { strategy: "jwt" }, // bắt buộc phải là "jwt" vì Credentials provider không hỗ trợ database session
  callbacks: {
    // jwt() chạy MỖI KHI có request liên quan đến session (kể cả không login lại)
    // nhưng `user` chỉ có giá trị ở LẦN ĐẦU (ngay sau khi authorize() thành công)
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.role = user.role;

        // Login response không kèm `name` → gọi thêm 1 lần để làm giàu token
        // (khớp với luồng "session & callbacks enrich data" của thiết kế)
        try {
          const res = await fetch(`${process.env.API_URL}/users/${user.id}`);
          if (res.ok) {
            const profile = await res.json();
            token.name = profile.name;
          }
        } catch {
          // Không chặn đăng nhập nếu bước enrich thất bại
        }
      }
      return token; // token này được mã hoá và lưu vào cookie
    },
    // session() chạy mỗi khi client gọi useSession() hoặc server gọi auth()
    // Nhiệm vụ: lấy data từ token (đã mã hoá, phía server) và "phơi" ra session object
    // mà client component có thể đọc được
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.user.id = token.sub as string;
      session.user.role = token.role as string;
      session.user.name = (token.name as string) ?? session.user.email;
      return session;
    },
  },
  pages: {
    signIn: "/login", // Auth.js sẽ redirect về đây khi cần login, thay vì trang mặc định
  },
});
