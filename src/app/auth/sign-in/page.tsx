"use client";

import Link from "next/link";
import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { GuideWordmark } from "@/components/guide-logo";
import { LoginMenu } from "@/components/login-menu";
import { loginAsCopy, parseLoginAs } from "@/lib/login-roles";
import { signInWithEmail } from "./actions";

function SignInForm() {
  const params = useSearchParams();
  const as = parseLoginAs(params.get("as"));
  const copy = loginAsCopy(as);
  const [state, formAction, pending] = useActionState(signInWithEmail, null);

  return (
    <div className="panel !p-6 sm:!p-8">
      <div className="flex items-start justify-between gap-3">
        <GuideWordmark href={null} size="sm" />
        <LoginMenu variant="nav" />
      </div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-forest-600">
        Log in as a
      </p>
      <h1 className="display mt-1.5 text-2xl text-forest-950 sm:text-3xl">
        {copy.title.replace(/^Log in as /, "")}
      </h1>
      <p className="mt-2 text-sm text-ink-muted sm:text-base">{copy.subtitle}</p>

      <form action={formAction} className="mt-8 space-y-4">
        <input type="hidden" name="as" value={as} />
        <label className="block text-sm font-semibold text-forest-800">
          Email
          <input name="email" type="email" required className="field mt-1.5" />
        </label>
        <label className="block text-sm font-semibold text-forest-800">
          Password
          <input
            name="password"
            type="password"
            required
            className="field mt-1.5"
          />
        </label>
        {state?.error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {state.error}
          </p>
        )}
        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? "Signing in…" : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        {copy.joinHref && copy.joinLabel ? (
          <>
            New here?{" "}
            <Link
              href={copy.joinHref}
              className="font-semibold text-forest-700"
            >
              {copy.joinLabel}
            </Link>
          </>
        ) : (
          <>Guide Official accounts are provisioned by the team.</>
        )}
      </p>
    </div>
  );
}

export default function SignInPage() {
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
          <SignInForm />
        </Suspense>
      </div>
    </div>
  );
}
