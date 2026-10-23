"use client";

export const runtime = "edge";

import Link from "next/link";
import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { AdminKeyIcon } from "@/components/admin-entry";
import { AppWordmark } from "@/components/app-wordmark";
import { AuthCard } from "@/components/auth-card";
import { GuideWordmark } from "@/components/guide-logo";
import { StudentSignIn } from "@/components/student-sign-in";
import { FIRST_APP_NAME } from "@/lib/apps";
import { loginAsCopy, parseLoginAs } from "@/lib/login-roles";
import { publicAmudHomePath } from "@/lib/site";
import { signInWithEmail } from "./actions";

function SignInForm() {
  const params = useSearchParams();
  const as = parseLoginAs(params.get("as"));
  const copy = loginAsCopy(as);
  const [state, formAction, pending] = useActionState(signInWithEmail, null);

  if (as === "student") {
    return <StudentSignIn />;
  }

  const isEducator = as === "educator";
  const isOfficial = as === "official";
  const isLearner = as === "learner";

  return (
    <div className="auth-shell flex min-h-screen flex-col">
      <div className="flex items-center justify-between px-6 py-5 sm:px-8">
        {isLearner ? (
          <AppWordmark
            name={FIRST_APP_NAME}
            href={publicAmudHomePath()}
            size="lg"
          />
        ) : (
          <GuideWordmark href="/" size="lg" />
        )}
        {isEducator ? (
          <Link
            href="/schools/demo"
            className="text-sm font-semibold text-forest-800 no-underline hover:underline"
          >
            View demo
          </Link>
        ) : null}
        {isLearner ? (
          <Link
            href={publicAmudHomePath()}
            className="text-sm font-semibold text-forest-800 no-underline hover:underline"
          >
            ← {FIRST_APP_NAME}
          </Link>
        ) : null}
      </div>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-5 pb-16 sm:px-8">
        <AuthCard
          eyebrow={isEducator ? null : isLearner || isOfficial ? null : "Log in"}
          title={
            isEducator ? (
              <span className="inline-flex items-center gap-2.5">
                <AdminKeyIcon className="h-[1.05em] w-[1.05em] text-forest-700" />
                {copy.title}
              </span>
            ) : (
              copy.title
            )
          }
          subtitle={copy.subtitle}
          footer={
            copy.joinHref && copy.joinLabel ? (
              <>
                {isEducator ? (
                  <>
                    School or district administrator?{" "}
                    <Link
                      href={copy.joinHref}
                      className="font-semibold text-forest-800"
                    >
                      {copy.joinLabel}
                    </Link>
                  </>
                ) : (
                  <>
                    New here?{" "}
                    <Link
                      href={copy.joinHref}
                      className="font-semibold text-forest-800"
                    >
                      {copy.joinLabel}
                    </Link>
                  </>
                )}
              </>
            ) : isOfficial ? (
              <>
                Students use{" "}
                <Link
                  href="/auth/sign-in?as=student"
                  className="font-semibold text-forest-800"
                >
                  student log in
                </Link>
                .
              </>
            ) : null
          }
        >
          {isEducator ? (
            <p className="mb-5 rounded-[10px] border border-line bg-sky-soft px-3.5 py-3 text-sm leading-snug text-forest-900">
              Teachers log in only — use the setup link from your school invite.
              There is no public teacher signup.
            </p>
          ) : null}
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="as" value={as} />
            <label className="block text-sm font-semibold text-forest-900">
              Email
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="field mt-1.5"
                placeholder={
                  isEducator
                    ? "you@school.org"
                    : isOfficial
                      ? "official@guidelearning.org"
                      : undefined
                }
              />
            </label>
            <label className="block text-sm font-semibold text-forest-900">
              Password
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="field mt-1.5"
              />
            </label>
            {state?.error && (
              <p className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {state.error}
              </p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="btn-primary w-full"
            >
              {pending ? "Signing in…" : "Log in"}
            </button>
          </form>
          {isEducator ? (
            <p className="mt-4 text-center text-sm text-ink-muted">
              <Link href="/schools/meeting" className="font-semibold text-forest-800">
                Book a meeting
              </Link>
              {" · "}
              <Link href="/account" className="font-semibold text-forest-800">
                Get help
              </Link>
            </p>
          ) : null}
        </AuthCard>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-shell flex min-h-screen items-center justify-center">
          <p className="text-ink-muted">Loading…</p>
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
