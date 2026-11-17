"use client";

export const runtime = "edge";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState, useState } from "react";
import { AuthCard } from "@/components/auth-card";
import { GuideWordmark } from "@/components/guide-logo";
import { resetPasswordAction } from "./actions";

function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";
  const as = params.get("as") ?? "educator";
  const linkError = params.get("error");
  const [state, formAction, pending] = useActionState(resetPasswordAction, null);
  const [show, setShow] = useState(false);
  const forgotHref = `/auth/forgot-password?as=${encodeURIComponent(as)}`;

  const broken = !token || Boolean(linkError);

  return (
    <div className="auth-shell flex min-h-screen flex-col">
      <div className="flex items-center px-4 py-5 sm:px-8">
        <GuideWordmark href="/" size="lg" />
      </div>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 pb-16 sm:px-8">
        <AuthCard
          eyebrow={null}
          title={broken ? "This link has expired" : "Choose a new password"}
          subtitle={
            broken
              ? "Reset links expire after a short time and can be used once. Request a new link to continue."
              : email
                ? `For ${email}. You’ll be logged in right after.`
                : "You’ll be logged in right after."
          }
          footer={
            <Link href={forgotHref} className="font-semibold text-forest-800 hover:underline">
              {broken ? "Send a new link" : "Need a new link?"}
            </Link>
          }
        >
          {broken ? null : (
            <form action={formAction} className="space-y-4">
              <input type="hidden" name="token" value={token} />
              <input type="hidden" name="email" value={email} />
              <input type="hidden" name="as" value={as} />
              <label className="block text-sm font-semibold text-forest-900">
                New password
                <span className="relative mt-1.5 block">
                  <input
                    name="newPassword"
                    type={show ? "text" : "password"}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="field pr-20"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    className="absolute inset-y-0 right-0 px-4 text-sm font-semibold text-forest-800"
                    aria-label={show ? "Hide passwords" : "Show passwords"}
                  >
                    {show ? "Hide" : "Show"}
                  </button>
                </span>
              </label>
              <label className="block text-sm font-semibold text-forest-900">
                Confirm new password
                <input
                  name="confirmPassword"
                  type={show ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="field mt-1.5"
                />
              </label>
              <p className="text-sm text-ink-muted">At least 8 characters.</p>
              {state?.error ? (
                <p className="form-alert form-alert--error" role="alert">
                  {state.error}
                </p>
              ) : null}
              <button type="submit" disabled={pending} className="btn-primary w-full">
                {pending ? "Saving…" : "Save and log in"}
              </button>
            </form>
          )}
        </AuthCard>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-shell flex min-h-screen items-center justify-center">
          <p className="text-ink-muted">Loading…</p>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
