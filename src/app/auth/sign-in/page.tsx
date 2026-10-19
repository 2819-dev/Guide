"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signInWithEmail } from "./actions";

export default function SignInPage() {
  const [state, formAction, pending] = useActionState(signInWithEmail, null);

  return (
    <div className="bg-sky-soft">
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-14 sm:px-8">
        <div className="panel !rounded-[1.5rem] !p-7 shadow-[var(--shadow-soft)] sm:!p-9">
          <p className="hebrew text-forest-600">שלום</p>
          <h1 className="display mt-2 text-3xl text-forest-950 sm:text-4xl">
            Welcome back
          </h1>
          <p className="mt-2 text-ink-muted">
            Log in to continue your Mishnah and Gemara study.
          </p>

          <form action={formAction} className="mt-8 space-y-4">
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
            New here?{" "}
            <Link href="/auth/sign-up" className="font-semibold text-forest-700">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
