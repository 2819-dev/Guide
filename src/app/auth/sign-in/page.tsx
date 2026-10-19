"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signInWithEmail } from "./actions";

export default function SignInPage() {
  const [state, formAction, pending] = useActionState(signInWithEmail, null);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-12 sm:px-8">
      <p className="hebrew text-forest-600">שלום</p>
      <h1 className="display mt-2 text-4xl font-semibold text-forest-950">
        Sign in
      </h1>
      <p className="mt-2 text-ink-muted">Continue your Bava Metzia study.</p>

      <form action={formAction} className="mt-8 space-y-4">
        <label className="block text-sm font-semibold text-forest-800">
          Email
          <input name="email" type="email" required className="field mt-1" />
        </label>
        <label className="block text-sm font-semibold text-forest-800">
          Password
          <input
            name="password"
            type="password"
            required
            className="field mt-1"
          />
        </label>
        {state?.error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {state.error}
          </p>
        )}
        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-sm text-ink-muted">
        New here?{" "}
        <Link href="/auth/sign-up" className="font-semibold text-forest-700">
          Create an account
        </Link>
      </p>
    </div>
  );
}
