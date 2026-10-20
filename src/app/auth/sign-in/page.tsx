"use client";

import Link from "next/link";
import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
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
    <AuthCard
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
          <>Need a different role? Use Log in as a above.</>
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
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {state.error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="btn-primary w-full !py-3"
        >
          {pending ? "Signing in…" : "Log In"}
        </button>
      </form>
    </AuthCard>
  );
}

export default function SignInPage() {
  return (
    <div className="auth-shell">
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-5 py-12 sm:px-8 sm:py-16">
        <Suspense
          fallback={
            <div className="w-full max-w-md rounded-2xl border border-line bg-surface px-6 py-8">
              <p className="text-ink-muted">Loading…</p>
            </div>
          }
        >
          <SignInForm />
        </Suspense>
      </div>
    </div>
  );
}
