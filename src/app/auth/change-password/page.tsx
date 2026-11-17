"use client";

export const runtime = "edge";

import { Suspense, useActionState } from "react";
import { AuthCard } from "@/components/auth-card";
import { GuideWordmark } from "@/components/guide-logo";
import { changePasswordAction } from "./actions";

function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, null);

  return (
    <div className="auth-shell flex min-h-screen flex-col">
      <div className="flex items-center px-4 py-5 sm:px-8">
        <GuideWordmark href="/" size="lg" />
      </div>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 pb-16 sm:px-8">
        <AuthCard
          eyebrow={null}
          title="Choose a new password"
          subtitle="Replace your temporary password to continue. Use at least 8 characters."
        >
          <form action={formAction} className="space-y-4">
            <label className="block text-sm font-semibold text-forest-900">
              Current password
              <input
                name="currentPassword"
                type="password"
                required
                autoComplete="current-password"
                className="field mt-1.5"
              />
            </label>
            <label className="block text-sm font-semibold text-forest-900">
              New password
              <input
                name="newPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="field mt-1.5"
              />
            </label>
            <label className="block text-sm font-semibold text-forest-900">
              Confirm new password
              <input
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="field mt-1.5"
              />
            </label>
            {state?.error ? (
              <p className="form-alert form-alert--error" role="alert">
                {state.error}
              </p>
            ) : null}
            <button type="submit" disabled={pending} className="btn-primary w-full">
              {pending ? "Saving…" : "Save password"}
            </button>
          </form>
        </AuthCard>
      </div>
    </div>
  );
}

export default function ChangePasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-shell flex min-h-screen items-center justify-center">
          <p className="text-ink-muted">Loading…</p>
        </div>
      }
    >
      <ChangePasswordForm />
    </Suspense>
  );
}
