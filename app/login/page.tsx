"use client";

import { useState, useTransition } from "react";
import { useActionState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ShieldCheck } from "lucide-react";
import { getRecaptchaToken } from "@/lib/recaptcha";
import { loginAction, type LoginState } from "@/app/api/login/actions";
import {
  loginSchema,
  twoFactorSchema,
  type LoginInput,
  type TwoFactorInput,
} from "@/lib/validations/auth";
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

const initialState: LoginState = { stage: "credentials" };
const recaptchaDisabled = process.env.NEXT_PUBLIC_DISABLE_RECAPTCHA === "true";

const recaptchaToken = recaptchaDisabled
  ? "disabled"
  : await getRecaptchaToken("login");

export default function LoginPage() {
  const [state, formAction, isActionPending] = useActionState(
    loginAction,
    initialState,
  );
  const [isTransitionPending, startTransition] = useTransition();
  const isPending = isActionPending || isTransitionPending;

  // Override cục bộ chỉ dùng cho nút "Back" — không liên quan tới state
  // server trả về, tự reset mỗi khi có dispatch mới tới server
  const [stageOverride, setStageOverride] = useState<"credentials" | null>(
    null,
  );
  const stage = stageOverride ?? state.stage;

  const credentialsForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const twoFactorForm = useForm<TwoFactorInput>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: { code: "" },
  });

  async function onCredentialsSubmit(values: LoginInput) {
    setStageOverride(null);

    const recaptchaDisabled =
      process.env.NEXT_PUBLIC_DISABLE_RECAPTCHA === "true";

    const recaptchaToken = recaptchaDisabled
      ? "disabled"
      : await getRecaptchaToken("login");

    const fd = new FormData();
    fd.set("step", "credentials");
    fd.set("email", values.email);
    fd.set("password", values.password);
    fd.set("recaptchaToken", recaptchaToken);

    startTransition(() => {
      formAction(fd);
    });
  }

  async function onCodeSubmit(values: TwoFactorInput) {
    setStageOverride(null);
    const fd = new FormData();
    fd.set("step", "2fa");
    fd.set("code", values.code);

    startTransition(() => {
      formAction(fd);
    });
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
              : `Enter the 6-digit code from your authenticator app for ${state.email}`}
          </CardDescription>
        </CardHeader>

        {stage === "credentials" ? (
          <form onSubmit={credentialsForm.handleSubmit(onCredentialsSubmit)}>
            <CardContent className="flex flex-col gap-3">
              <div>
                <Input
                  {...credentialsForm.register("email")}
                  type="email"
                  placeholder="Email"
                  autoComplete="email"
                />
                {credentialsForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-destructive">
                    {credentialsForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <Input
                  {...credentialsForm.register("password")}
                  type="password"
                  placeholder="Password"
                  autoComplete="current-password"
                />
                {credentialsForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-destructive">
                    {credentialsForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              {state.error && (
                <p className="text-sm text-destructive">{state.error}</p>
              )}
            </CardContent>
            <CardFooter className="flex-col items-stretch gap-3">
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending && <Loader2 className="animate-spin" />}
                Sign in
              </Button>
              <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5" />
                Protected by reCAPTCHA
              </p>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={twoFactorForm.handleSubmit(onCodeSubmit)}>
            <CardContent className="flex flex-col gap-3">
              <div>
                <Input
                  {...twoFactorForm.register("code")}
                  type="text"
                  inputMode="numeric"
                  placeholder="123456"
                  maxLength={6}
                  autoComplete="one-time-code"
                  autoFocus
                />
                {twoFactorForm.formState.errors.code && (
                  <p className="mt-1 text-sm text-destructive">
                    {twoFactorForm.formState.errors.code.message}
                  </p>
                )}
              </div>
              {state.error && (
                <p className="text-sm text-destructive">{state.error}</p>
              )}
            </CardContent>
            <CardFooter className="flex-col items-stretch gap-2">
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending && <Loader2 className="animate-spin" />}
                Verify
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={isPending}
                onClick={() => {
                  setStageOverride("credentials");
                  twoFactorForm.reset({ code: "" });
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
