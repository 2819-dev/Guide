"use client";

export const runtime = "edge";

import Link from "next/link";
import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { AppWordmark } from "@/components/app-wordmark";
import { AuthCard } from "@/components/auth-card";
import { GuideWordmark } from "@/components/guide-logo";
import { StudentSignIn } from "@/components/student-sign-in";
import { FIRST_APP_NAME } from "@/lib/apps";
import { loginAsCopy, parseLoginAs } from "@/lib/login-roles";
import { publicAmudHomePath } from "@/lib/site";
import { signInWithEmail } from "./actions";

/** Heading copy per sign-in audience. */
const SIGN_IN_HEADINGS: Record<
  "educator" | "official" | "developer" | "learner",
  { eyebrow: string | null; title: string; subtitle: string }
> = {
  educator: {
    eyebrow: "Teachers and school administrators",
    title: "Log in to Guide",
    subtitle: "Use the email and password for your school’s Guide account.",
  },
  official: {
    eyebrow: "Guide Official",
    title: "Log in to Guide",
    subtitle: "Use your Guide Official account.",
  },
  developer: {
    eyebrow: "Developer",
    title: "Log in to Guide",
    subtitle:
      "Use the account you applied with. Your developer portal opens once a Guide Official approves your application.",
  },
  learner: {
    eyebrow: null,
    title: `Log in to ${FIRST_APP_NAME}`,
    subtitle:
      "Save your Test Yourself scores and notes. A school account is not required.",
  },
};

const linkClass = "font-semibold text-forest-800 hover:underline";

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
  const heading = SIGN_IN_HEADINGS[as];

  return (
    <div className="auth-shell flex min-h-screen flex-col">
      <div className="flex items-center justify-between gap-4 px-4 py-5 sm:px-8">
        {isLearner ? (
          <AppWordmark
            name={FIRST_APP_NAME}
            href={publicAmudHomePath()}
            size="lg"
          />
        ) : (
          <GuideWordmark href="/" size="lg" />
        )}
        {isLearner ? (
          <Link
            href={publicAmudHomePath()}
            className="text-sm font-semibold text-forest-800 no-underline hover:underline"
          >
            Back to {FIRST_APP_NAME}
          </Link>
        ) : null}
      </div>
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 pb-16 sm:px-8">
        <AuthCard
          eyebrow={heading.eyebrow}
          title={heading.title}
          subtitle={heading.subtitle}
          footer={
            copy.joinHref && copy.joinLabel ? (
              <>
                {isEducator
                  ? "New to Guide? School administrators can "
                  : as === "developer"
                    ? "Not a Guide developer yet? "
                    : "New here? "}
                <Link href={copy.joinHref} className={linkClass}>
                  {isEducator
                    ? "apply for their school"
                    : as === "developer"
                      ? "Apply as a developer"
                      : "Create an account"}
                </Link>
                {isEducator ? "." : null}
              </>
            ) : isOfficial ? (
              <>
                Students log in from the{" "}
                <Link href="/auth/sign-in?as=student" className={linkClass}>
                  student page
                </Link>
                .
              </>
            ) : null
          }
        >
          {params.get("reset") === "1" ? (
            <p className="form-alert form-alert--success mb-5" role="status">
              Your password was updated. Log in with your new password.
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
                      ? "name@guidelearning.org"
                      : "you@example.com"
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
              <p className="form-alert form-alert--error" role="alert">
                {state.error}
              </p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="btn-primary w-full"
            >
              {pending ? "Logging in…" : "Log in"}
            </button>
            {!isLearner ? (
              <p className="text-center text-sm">
                <Link
                  href={`/auth/forgot-password?as=${as}`}
                  className={linkClass}
                >
                  Forgot password?
                </Link>
              </p>
            ) : null}
          </form>
          {isEducator ? (
            <p className="mt-5 border-t border-line pt-4 text-center text-sm text-ink-muted">
              <Link href="/schools/demo" className={linkClass}>
                View demo
              </Link>
              <span aria-hidden className="mx-2">
                ·
              </span>
              <Link href="/schools/meeting" className={linkClass}>
                Book a meeting
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
