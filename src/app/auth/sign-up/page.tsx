"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { signUpWithEmail } from "./actions";

export default function SignUpPage() {
  const params = useSearchParams();
  const defaultRole = params.get("role") === "rebbe" ? "rebbe" : "customer";
  const [state, formAction, pending] = useActionState(signUpWithEmail, null);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-12 sm:px-8">
      <p className="hebrew text-forest-600">ברוכים הבאים</p>
      <h1 className="display mt-2 text-4xl font-semibold text-forest-950">
        Join Guide
      </h1>
      <p className="mt-2 text-ink-muted">
        Create an account to save progress, notes, and quizzes.
      </p>

      <form action={formAction} className="mt-8 space-y-4">
        <label className="block text-sm font-semibold text-forest-800">
          Name
          <input name="name" required className="field mt-1" placeholder="Your name" />
        </label>
        <label className="block text-sm font-semibold text-forest-800">
          Email
          <input
            name="email"
            type="email"
            required
            className="field mt-1"
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
            className="field mt-1"
            placeholder="At least 8 characters"
          />
        </label>
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-forest-800">I am a…</legend>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="radio"
              name="role"
              value="customer"
              defaultChecked={defaultRole === "customer"}
            />
            Student
          </label>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="radio"
              name="role"
              value="rebbe"
              defaultChecked={defaultRole === "rebbe"}
            />
            Rebbe (Guide for Education)
          </label>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="radio" name="role" value="moderator" />
            Moderator
          </label>
        </fieldset>

        {state?.error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {state.error}
          </p>
        )}

        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? "Creating…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-sm text-ink-muted">
        Already have an account?{" "}
        <Link href="/auth/sign-in" className="font-semibold text-forest-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}
