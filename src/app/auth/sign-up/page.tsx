"use client";

import Link from "next/link";
import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
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

  return (
    <AuthCard
      eyebrow={null}
      title={copy.title}
      subtitle={copy.subtitle}
      footer={
        <>
          Already have an account?{" "}
          <Link
            href={`/auth/sign-in?as=${as}`}
            className="font-semibold text-forest-800"
          >
            Log In
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
    </AuthCard>
  );
}

export default function SignUpPage() {
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
          <SignUpForm />
        </Suspense>
      </div>
    </div>
  );
}
