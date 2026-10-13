"use server";

import { CredentialsSignin, AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, TwoFactorRequiredError } from "@/auth";
import { loginSchema, twoFactorSchema } from "@/lib/validations/auth";

export type LoginState = {
  stage: "credentials" | "2fa";
  email?: string;
  error?: string;
};

export async function loginAction(
  prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const step = formData.get("step");

  // ---- Bước 2: xác minh mã 2FA ----
  if (step === "2fa") {
    const parsed = twoFactorSchema.safeParse({ code: formData.get("code") });
    if (!parsed.success) {
      return {
        stage: "2fa",
        email: prevState.email,
        error: parsed.error.issues[0]?.message ?? "Mã 2FA không hợp lệ",
      };
    }

    try {
      await signIn("credentials", {
        email: prevState.email,
        code: parsed.data.code,
        redirect: false,
      });
    } catch (error) {
      const errStr = String(
        error instanceof Error ? error.cause || error.message : error,
      ).toLowerCase();
      if (
        errStr.includes("fetch failed") ||
        errStr.includes("econnrefused") ||
        (error instanceof AuthError &&
          error.type === "CallbackRouteError" &&
          errStr.includes("typeerror"))
      ) {
        return {
          stage: "2fa",
          email: prevState.email,
          error:
            "Không thể kết nối tới máy chủ backend (NestJS API). Vui lòng thử lại sau.",
        };
      }
      if (
        error instanceof CredentialsSignin ||
        (error instanceof AuthError &&
          (error.type === "CredentialsSignin" ||
            error.type === "CallbackRouteError"))
      ) {
        return {
          stage: "2fa",
          email: prevState.email,
          error: "Mã 2FA không đúng",
        };
      }
      throw error; // để lọt lỗi khác (vd NEXT_REDIRECT) đi tiếp
    }

    redirect("/dashboard");
  }

  // ---- Bước 1: email + password + recaptcha ----
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      stage: "credentials",
      error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
    };
  }

  const recaptchaToken = formData.get("recaptchaToken");
  if (typeof recaptchaToken !== "string" || !recaptchaToken) {
    return {
      stage: "credentials",
      error: "Không xác minh được reCAPTCHA, vui lòng thử lại",
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      recaptchaToken,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof TwoFactorRequiredError) {
      return { stage: "2fa", email: parsed.data.email };
    }
    const errStr = String(
      error instanceof Error ? error.cause || error.message : error,
    ).toLowerCase();

    if (
      errStr.includes("fetch failed") ||
      errStr.includes("econnrefused") ||
      (error instanceof AuthError &&
        error.type === "CallbackRouteError" &&
        errStr.includes("typeerror"))
    ) {
      return {
        stage: "credentials",
        error:
          "Không thể kết nối tới máy chủ backend. Vui lòng đảm bảo server NestJS đã được khởi chạy (http://localhost:3000).",
      };
    }
    if (
      error instanceof CredentialsSignin ||
      (error instanceof AuthError &&
        (error.type === "CredentialsSignin" ||
          error.type === "CallbackRouteError"))
    ) {
      return { stage: "credentials", error: "Email hoặc mật khẩu không đúng" };
    }
    throw error;
  }

  redirect("/dashboard");
}
