"use client";

export const runtime = "edge";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState } from "react";
import { AuthCard } from "@/components/auth-card";
import { GuideWordmark } from "@/components/guide-logo";
import { parseLoginAs } from "@/lib/login-roles";
import { requestPasswordResetAction } from "./actions";

function ForgotPasswordForm() {
  const params = useSearchParams();
  const as = parseLoginAs(params.get("as") ?? "educator");
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, null);
  const backHref = `/auth/sign-in?as=${as}`;

  return (
    <div className="auth-shell flex min-h-screen flex-col">
      <div className="flex items-center px-6 py-5 sm:px-8">
        <GuideWordmark href="/" size="lg" />
      </div>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-5 pb-16 sm:px-8">
        <AuthCard
          eyebrow={null}
          title={state?.sent ? "Check your email" : "Reset your password"}
          subtitle={
            state?.sent
              ? "If that email has a Guide account, we sent a link to reset the password. It can take a minute — check spam too."
              : "Enter the email you use for Guide and we’ll send you a link to choose a new password."
          }
          footer={
            <Link href={backHref} className="font-semibold text-forest-800">
              ← Back to log in
            </Link>
          }
        >
          {state?.sent ? null : (
            <form action={formAction} className="space-y-4">
              <input type="hidden" name="as" value={as} />
              <label className="block text-sm font-semibold text-forest-900">
                Email
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="field mt-1.5"
                  placeholder="you@school.org"
                  autoFocus
                />
              </label>
              {state?.error ? (
                <p className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {state.error}
                </p>
              ) : null}
              <button type="submit" disabled={pending} className="btn-primary w-full">
                {pending ? "Sending…" : "Send reset link"}
              </button>
              <p className="text-center text-sm text-ink-muted">
                Students: ask your teacher for a new password.
              </p>
            </form>
          )}
        </AuthCard>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-shell flex min-h-screen items-center justify-center">
          <p className="text-ink-muted">Loading…</p>
        </div>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  );
}
