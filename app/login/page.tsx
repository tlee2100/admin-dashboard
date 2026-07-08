"use client";
import { signIn } from "next-auth/react"; // KHÁC với signIn export từ auth.ts (đó là bản server-side)
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { getRecaptchaToken } from "@/lib/recaptcha";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

type Stage = "credentials" | "2fa";

export default function LoginPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCredentialsSubmit(
    e: React.SubmitEvent<HTMLFormElement>,
  ) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const recaptchaToken = await getRecaptchaToken("login");

      // Pre-check via a same-origin proxy so we can detect a 2FA-required
      // response before committing to a NextAuth session.
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, recaptchaToken }),
      });
      const data = await res.json();

      if (data?.twoFactorRequired) {
        setStage("2fa");
        return;
      }

      if (!res.ok || !data?.access_token) {
        setError(data?.message ?? "Email hoặc mật khẩu không đúng");
        return;
      }

      const signInRes = await signIn("credentials", {
        email,
        password,
        recaptchaToken,
        redirect: false,
      });
      if (signInRes?.error) {
        setError("Email hoặc mật khẩu không đúng");
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Không thể kết nối tới máy chủ");
    } finally {
      setLoading(false);
    }
  }

  async function handleCodeSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const signInRes = await signIn("credentials", {
        email,
        code,
        redirect: false,
      });
      if (signInRes?.error) {
        setError("Mã 2FA không đúng");
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Không thể kết nối tới máy chủ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">
            {stage === "credentials" ? "Sign in" : "Two-factor verification"}
          </CardTitle>
          <CardDescription>
            {stage === "credentials"
              ? "Enter your credentials to access the admin dashboard"
              : `Enter the 6-digit code from your authenticator app for ${email}`}
          </CardDescription>
        </CardHeader>

        {stage === "credentials" ? (
          <form onSubmit={handleCredentialsSubmit}>
            <CardContent className="flex flex-col gap-3">
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="Email"
                autoComplete="email"
                required
              />
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="Password"
                autoComplete="current-password"
                required
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </CardContent>
            <CardFooter className="flex-col items-stretch gap-3">
              <Button type="submit" disabled={loading} className="w-full">
                {loading && <Loader2 className="animate-spin" />}
                Sign in
              </Button>
              <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5" />
                Protected by reCAPTCHA
              </p>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handleCodeSubmit}>
            <CardContent className="flex flex-col gap-3">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                type="text"
                inputMode="numeric"
                placeholder="123456"
                maxLength={6}
                autoComplete="one-time-code"
                autoFocus
                required
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </CardContent>
            <CardFooter className="flex-col items-stretch gap-2">
              <Button type="submit" disabled={loading} className="w-full">
                {loading && <Loader2 className="animate-spin" />}
                Verify
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={loading}
                onClick={() => {
                  setStage("credentials");
                  setCode("");
                  setError("");
                }}
              >
                Back
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
