"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { GuideWordmark } from "@/components/guide-logo";
import { signUpWithEmail } from "./actions";

export default function SignUpPage() {
  const params = useSearchParams();
  const defaultRole = params.get("role") === "rebbe" ? "rebbe" : "customer";
  const [state, formAction, pending] = useActionState(signUpWithEmail, null);

  return (
    <div className="bg-paper">
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-12 sm:px-8">
        <div className="panel !p-6 sm:!p-8">
          <GuideWordmark href={null} size="sm" className="mb-4" />
          <p className="hebrew text-forest-700">ברוכים הבאים</p>
          <h1 className="display mt-2 text-2xl text-forest-950 sm:text-3xl">
            Join Guide
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            Save progress, notes, and quizzes for Mishnayos and Gemara.
          </p>

          <form action={formAction} className="mt-8 space-y-4">
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
            <fieldset className="space-y-2.5 rounded-md border border-line bg-paper p-4">
              <legend className="px-1 text-sm font-semibold text-forest-800">
                I am a…
              </legend>
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
            <Link href="/auth/sign-in" className="font-semibold text-forest-700">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
