"use client";

export const runtime = 'edge';

import Link from "next/link";
import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { GuideWordmark } from "@/components/guide-logo";
import { StudentSignIn } from "@/components/student-sign-in";
import { loginAsCopy, parseLoginAs } from "@/lib/login-roles";
import { signInWithEmail } from "./actions";

function SignInForm() {
  const params = useSearchParams();
  const as = parseLoginAs(params.get("as"));
  const copy = loginAsCopy(as);
  const [state, formAction, pending] = useActionState(signInWithEmail, null);

  if (as === "student") {
    return <StudentSignIn />;
  }

  return (
    <div className="auth-shell flex min-h-screen flex-col">
      <div className="flex items-center px-6 py-5 sm:px-8">
        <GuideWordmark href="/" size="lg" />
      </div>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-5 pb-16 sm:px-8">
        <AuthCard
          eyebrow={as === "official" ? null : "Log in as a"}
          title={copy.title}
          subtitle={copy.subtitle}
          footer={
            copy.joinHref && copy.joinLabel ? (
              <>
                New here?{" "}
                <Link
                  href={copy.joinHref}
                  className="font-semibold text-forest-800"
                >
                  {copy.joinLabel}
                </Link>
              </>
            ) : (
              <>Need a different role? Use Log In above.</>
            )
          }
        >
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
                placeholder={as === "educator" ? "you@school.org" : undefined}
              />
            </label>
            <label className="block text-sm font-semibold text-forest-900">
              Password
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="field mt-1.5"
              />
            </label>
            {state?.error && (
              <p className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {state.error}
              </p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="btn-primary w-full"
            >
              {pending ? "Signing in…" : "Log in"}
            </button>
          </form>
        </AuthCard>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-shell flex min-h-screen items-center justify-center">
          <p className="text-ink-muted">Loading…</p>
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
