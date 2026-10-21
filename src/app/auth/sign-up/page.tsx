"use client";

export const runtime = "edge";

import Link from "next/link";
import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { GuideWordmark } from "@/components/guide-logo";
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
      <AuthCard
        eyebrow={null}
        title="Guide Official"
        subtitle="Please log in with your Guide Official account."
        footer={null}
      >
        <Link href="/auth/sign-in?as=official" className="btn-primary inline-flex">
          Log In
        </Link>
      </AuthCard>
    );
  }

  // Teachers = login only (school email invite). School admins apply on /education.
  if (as === "educator") {
    return (
      <AuthCard
        eyebrow="For schools"
        title="Teachers log in only"
        subtitle="Teachers receive a setup invite from their school. School and district administrators apply for Guide — there is no separate teacher signup."
        footer={
          <>
            Already invited?{" "}
            <Link
              href="/auth/sign-in?as=educator"
              className="font-semibold text-forest-800"
            >
              Log in
            </Link>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <Link href="/auth/sign-in?as=educator" className="btn-primary inline-flex justify-center">
            Teacher log in
          </Link>
          <Link href="/education#apply" className="btn-secondary inline-flex justify-center">
            Apply for your school
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      eyebrow={
        as === "student" ? "Join as a" : as === "developer" ? "Partners" : null
      }
      title={copy.title}
      subtitle={copy.subtitle}
      footer={
        <>
          Already have an account?{" "}
          <Link
            href={`/auth/sign-in?as=${as}`}
            className="font-semibold text-forest-800"
          >
            Log in
          </Link>
        </>
      }
    >
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="as" value={as} />
        <input type="hidden" name="role" value={copy.roleValue} />
        {as === "student" && <SchoolPickerField required />}
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
            placeholder="you@school.org"
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

        {as === "developer" ? (
          <p className="text-[0.8125rem] leading-snug text-ink-muted">
            Next, submit a developer application. The portal unlocks after Guide
            Official verifies you.
          </p>
        ) : null}

        {state?.error && (
          <p className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {state.error}
          </p>
        )}

        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending
            ? "Creating…"
            : as === "developer"
              ? "Create account"
              : "Get started"}
        </button>
      </form>
    </AuthCard>
  );
}

export default function SignUpPage() {
  return (
    <div className="auth-shell flex min-h-screen flex-col">
      <div className="flex items-center px-6 py-5 sm:px-8">
        <GuideWordmark href="/" size="lg" />
      </div>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-5 pb-16 sm:px-8">
        <Suspense
          fallback={
            <div className="w-full max-w-md rounded-[10px] border border-line bg-surface px-6 py-8">
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
