"use client";

import Link from "next/link";
import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { GuideWordmark } from "@/components/guide-logo";
import { LoginMenu } from "@/components/login-menu";
import { parseLoginAs, signupAsCopy } from "@/lib/login-roles";
import { signUpWithEmail } from "./actions";

function SignUpForm() {
  const params = useSearchParams();
  const as = parseLoginAs(params.get("as") ?? params.get("role"));
  const copy = signupAsCopy(as);
  const [state, formAction, pending] = useActionState(signUpWithEmail, null);

  if (as === "official") {
    return (
      <div className="panel !p-6 sm:!p-8">
        <div className="flex items-start justify-between gap-3">
          <GuideWordmark href={null} size="sm" />
          <LoginMenu variant="nav" />
        </div>
        <h1 className="display mt-5 text-2xl text-forest-950 sm:text-3xl">
          Guide Official
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Staff accounts are provisioned internally. Use Log in as → Guide
          Official if you already have access.
        </p>
        <Link
          href="/auth/sign-in?as=official"
          className="btn-primary mt-6 inline-flex"
        >
          Log in as Guide Official
        </Link>
      </div>
    );
  }

  return (
    <div className="panel !p-6 sm:!p-8">
      <div className="flex items-start justify-between gap-3">
        <GuideWordmark href={null} size="sm" />
        <LoginMenu variant="nav" />
      </div>
      <p className="hebrew mt-5 text-forest-700">ברוכים הבאים</p>
      <h1 className="display mt-2 text-2xl text-forest-950 sm:text-3xl">
        {copy.title}
      </h1>
      <p className="mt-2 text-sm text-ink-muted">{copy.subtitle}</p>

      <form action={formAction} className="mt-8 space-y-4">
        <input type="hidden" name="as" value={as} />
        <input type="hidden" name="role" value={copy.roleValue} />
        <label className="block text-sm font-semibold text-forest-800">
          Name
          <input
            name="name"
            required
            className="field mt-1.5"
            placeholder="Your name"
          />
        </label>
        <label className="block text-sm font-semibold text-forest-800">
          Email
          <input
            name="email"
            type="email"
            required
            className="field mt-1.5"
            placeholder="you@example.com"
          />
        </label>
        <label className="block text-sm font-semibold text-forest-800">
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

        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? "Creating…" : "Get started"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        Already have an account?{" "}
        <Link
          href={`/auth/sign-in?as=${as}`}
          className="font-semibold text-forest-700"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <div className="bg-paper">
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-12 sm:px-8">
        <Suspense
          fallback={
            <div className="panel !p-6 sm:!p-8">
              <GuideWordmark href={null} size="sm" className="mb-4" />
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
