"use client";

import Link from "next/link";
import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { GuideWordmark } from "@/components/guide-logo";
import { LoginMenu } from "@/components/login-menu";
import { SchoolPickerField } from "@/components/school-picker-field";
import { parseLoginAs, signupAsCopy } from "@/lib/login-roles";
import { signUpWithEmail } from "./actions";

function SignUpForm() {
  const params = useSearchParams();
  const as = parseLoginAs(params.get("as") ?? params.get("role"));
  const copy = signupAsCopy(as);
  const [state, formAction, pending] = useActionState(signUpWithEmail, null);

  if (as === "official") {
    return (
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-between gap-3">
          <GuideWordmark href="/" size="md" />
          <LoginMenu variant="nav" />
        </div>
        <div className="rounded-2xl border border-line bg-surface px-6 py-8 sm:px-8">
          <h1 className="display text-[1.75rem] text-forest-950">
            Guide Official
          </h1>
          <p className="mt-3 text-[0.95rem] text-ink-muted">
            Please log in with your Guide Official account.
          </p>
          <Link
            href="/auth/sign-in?as=official"
            className="btn-primary mt-6 inline-flex"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 flex items-center justify-between gap-3">
        <GuideWordmark href="/" size="md" />
        <LoginMenu variant="nav" />
      </div>
      <div className="rounded-2xl border border-line bg-surface px-6 py-8 sm:px-8 sm:py-9">
        <p className="hebrew text-forest-700">ברוכים הבאים</p>
        <h1 className="display mt-2 text-[1.75rem] text-forest-950 sm:text-[2rem]">
          {copy.title}
        </h1>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-muted">
          {copy.subtitle}
        </p>

        <form action={formAction} className="mt-8 space-y-4">
          <input type="hidden" name="as" value={as} />
          <input type="hidden" name="role" value={copy.roleValue} />
          {as === "student" && <SchoolPickerField required />}
          <label className="block text-sm font-semibold text-forest-900">
            Name
            <input
              name="name"
              required
              className="field mt-1.5"
              placeholder="Your name"
            />
          </label>
          <label className="block text-sm font-semibold text-forest-900">
            Email
            <input
              name="email"
              type="email"
              required
              className="field mt-1.5"
              placeholder="you@example.com"
            />
          </label>
          <label className="block text-sm font-semibold text-forest-900">
            Password
            <input
              name="password"
              type="password"
              required
              minLength={8}
              className="field mt-1.5"
              placeholder="At least 8 characters"
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
            {pending ? "Creating…" : "Get started"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Already have an account?{" "}
          <Link
            href={`/auth/sign-in?as=${as}`}
            className="font-semibold text-forest-800"
          >
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <div className="auth-shell">
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-5 py-14 sm:px-8">
        <Suspense
          fallback={
            <div className="w-full max-w-md rounded-2xl border border-line bg-surface px-6 py-8">
              <GuideWordmark href="/" size="md" className="mb-4" />
              <p className="text-ink-muted">Loading…</p>
            </div>
          }
        >
          <SignUpForm />
        </Suspense>
      </div>
    </div>
  );
}
