"use client";

export const runtime = "edge";

import Link from "next/link";
import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { GuideWordmark } from "@/components/guide-logo";
import { parseLoginAs, signupAsCopy } from "@/lib/login-roles";
import { signUpWithEmail } from "./actions";

const linkClass = "font-semibold text-forest-800 hover:underline";

function SignUpForm() {
  const params = useSearchParams();
  const as = parseLoginAs(params.get("as") ?? params.get("role"));
  const copy = signupAsCopy(as);
  const [state, formAction, pending] = useActionState(signUpWithEmail, null);

  if (as === "official") {
    return (
      <AuthCard
        eyebrow="Guide Official"
        title="Log in with your Guide Official account"
        subtitle="Guide Official accounts are created by the Guide team."
        footer={null}
      >
        <Link href="/auth/sign-in?as=official" className="btn-primary w-full">
          Log in
        </Link>
      </AuthCard>
    );
  }

  // Students never sign up: their teacher creates the account.
  if (as === "student") {
    return (
      <AuthCard
        eyebrow="Student"
        title="Your teacher sets up your account"
        subtitle="Ask your teacher for your username and password, then log in."
        footer={null}
      >
        <Link href="/auth/sign-in?as=student" className="btn-primary w-full">
          Go to student log in
        </Link>
      </AuthCard>
    );
  }

  // Teachers = login only (school email invite). School admins apply on /education.
  if (as === "educator") {
    return (
      <AuthCard
        eyebrow="Teachers and school administrators"
        title="Accounts come from your school"
        subtitle="Teachers receive an invite from their school administrator. School and district administrators apply to bring Guide to their school."
        footer={
          <>
            Already have an account?{" "}
            <Link href="/auth/sign-in?as=educator" className={linkClass}>
              Log in
            </Link>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <Link href="/education#apply" className="btn-primary w-full">
            Apply for your school
          </Link>
          <Link href="/auth/sign-in?as=educator" className="btn-secondary w-full">
            Log in
          </Link>
        </div>
      </AuthCard>
    );
  }

  const isDeveloper = as === "developer";

  return (
    <AuthCard
      eyebrow={isDeveloper ? "Developer" : null}
      title={isDeveloper ? "Create a developer account" : copy.title}
      subtitle={
        isDeveloper
          ? "Create your account, then submit your developer application."
          : "Save your Test Yourself scores and notes. A school account is not required."
      }
      footer={
        <>
          Already have an account?{" "}
          <Link href={`/auth/sign-in?as=${as}`} className={linkClass}>
            Log in
          </Link>
        </>
      }
    >
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="as" value={as} />
        <input type="hidden" name="role" value={copy.roleValue} />
        <label className="block text-sm font-semibold text-forest-900">
          Name
          <input
            name="name"
            required
            className="field mt-1.5"
            placeholder="Full name"
            autoComplete="name"
          />
        </label>
        <label className="block text-sm font-semibold text-forest-900">
          Email
          <input
            name="email"
            type="email"
            required
            className="field mt-1.5"
            placeholder={isDeveloper ? "you@company.com" : "you@example.com"}
            autoComplete="email"
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
            autoComplete="new-password"
          />
        </label>

        {isDeveloper ? (
          <p className="text-[0.8125rem] leading-snug text-ink-muted">
            A Guide Official reviews every developer application. Your
            developer portal opens once you are approved.
          </p>
        ) : null}

        {state?.error && (
          <p className="form-alert form-alert--error" role="alert">
            {state.error}
          </p>
        )}

        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthCard>
  );
}

function SignUpShell() {
  return (
    <div className="auth-shell flex min-h-screen flex-col">
      <div className="flex items-center justify-between gap-4 px-4 py-5 sm:px-8">
        <GuideWordmark href="/" size="lg" />
      </div>
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 pb-16 sm:px-8">
        <SignUpForm />
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-shell flex min-h-screen items-center justify-center">
          <p className="text-ink-muted">Loading…</p>
        </div>
      }
    >
      <SignUpShell />
    </Suspense>
  );
}
