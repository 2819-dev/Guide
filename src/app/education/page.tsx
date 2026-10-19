import Link from "next/link";
import { ensureProfile } from "@/lib/profile";

export const instant = false;

export const metadata = {
  title: "Guide for Education",
  description:
    "Guide for Education helps Rebbeim invite students and see Mishnayos and Gemara study from home or Chromebook — dapim, quizzes, and notes.",
};

export default async function EducationLandingPage() {
  const session = await ensureProfile().catch(() => null);
  const isRebbe =
    session?.profile.role === "rebbe" || session?.profile.role === "admin";

  return (
    <div>
      <section className="relative overflow-hidden bg-sky-soft">
        <div className="mx-auto max-w-6xl px-5 pb-14 pt-12 sm:px-8 lg:pb-20 lg:pt-16">
          <p className="animate-rise text-sm font-semibold uppercase tracking-[0.14em] text-forest-600">
            Guide for Education
          </p>
          <h1 className="animate-rise-delay display mt-3 max-w-3xl text-4xl text-forest-950 sm:text-5xl lg:text-[3.4rem]">
            See the Mishnayos and Gemara learning that happens at home
          </h1>
          <p className="animate-rise-late mt-5 max-w-2xl text-lg text-ink-muted sm:text-xl">
            Create a class, share an invite code, and follow dapim, quizzes, and
            notes — so Chromebook and after-school study stay connected to the
            classroom.
          </p>
          <div className="animate-rise-late mt-8 flex flex-wrap gap-3">
            {isRebbe ? (
              <Link href="/education/panel" className="btn-primary">
                Open Rebbe panel
              </Link>
            ) : (
              <Link href="/auth/sign-up?role=rebbe" className="btn-primary">
                Join as a Rebbe
              </Link>
            )}
            <Link href="/study" className="btn-secondary">
              Back to Study
            </Link>
          </div>
        </div>
      </section>

      <section className="section-pad mx-auto max-w-6xl">
        <h2 className="display max-w-2xl text-3xl text-forest-950 sm:text-4xl">
          Built for Rebbeim — calm, clear, classroom-ready
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-ink-muted">
          Guide for Education sits beside the student product. Students study
          Mishnayos and Gemara on Guide; you see progress without turning home
          learning into a noisy dashboard.
        </p>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          <article className="color-block bg-forest-100">
            <h3 className="display text-2xl text-forest-950">Invite a class</h3>
            <p className="mt-2 text-ink-muted">
              Create a class and share a short invite code. Students join after
              they sign up.
            </p>
          </article>
          <article className="color-block bg-moss/25">
            <h3 className="display text-2xl text-forest-950">
              Track home study
            </h3>
            <p className="mt-2 text-ink-muted">
              See dapim visited, quizzes taken, and notes submitted from home or
              Chromebook.
            </p>
          </article>
          <article className="color-block bg-sun/35">
            <h3 className="display text-2xl text-forest-950">Stay focused</h3>
            <p className="mt-2 text-ink-muted">
              Clear tables, no clutter — just the learning signals that help you
              follow up in shiur.
            </p>
          </article>
        </div>
      </section>

      <section className="bg-forest-100">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-16 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="display text-3xl text-forest-950 sm:text-4xl">
              Ready to open your panel?
            </h2>
            <p className="mt-3 text-lg text-ink-muted">
              Sign up as a Rebbe, or log in if you already have an account.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            {isRebbe ? (
              <Link href="/education/panel" className="btn-primary">
                Open Rebbe panel
              </Link>
            ) : (
              <>
                <Link href="/auth/sign-up?role=rebbe" className="btn-primary">
                  Join as a Rebbe
                </Link>
                <Link href="/auth/sign-in" className="btn-secondary">
                  Log in
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
