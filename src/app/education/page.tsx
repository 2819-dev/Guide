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
      <section className="hero-band">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 lg:py-16">
          <p className="eyebrow">Guide for Education</p>
          <h1 className="display mt-3 max-w-3xl text-[2.15rem] text-forest-950 sm:text-4xl lg:text-[2.75rem]">
            Follow Mishnayos and Gemara study at home
          </h1>
          <p className="mt-4 max-w-2xl text-base text-ink-muted sm:text-lg">
            Create a class, share an invite code, and see dapim, quizzes, and
            notes — so Chromebook and after-school study stay connected to
            shiur.
          </p>
          <div className="mt-7 flex flex-wrap gap-2.5">
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
              Student study
            </Link>
          </div>
        </div>
      </section>

      <section className="section-pad mx-auto max-w-6xl">
        <h2 className="display max-w-2xl text-2xl text-forest-950 sm:text-3xl">
          For Rebbeim who want home learning to stay visible
        </h2>
        <p className="mt-3 max-w-2xl text-base text-ink-muted">
          Students study on Guide. You see progress without turning after-school
          work into a noisy dashboard.
        </p>
        <ol className="mt-8 grid gap-0 border border-line bg-surface lg:grid-cols-3">
          <li className="border-b border-line p-5 lg:border-b-0 lg:border-r">
            <p className="text-xs font-semibold text-forest-600">01</p>
            <h3 className="mt-2 text-base font-semibold text-forest-950">
              Invite a class
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Create a class and share a short invite code. Students join after
              they sign up.
            </p>
          </li>
          <li className="border-b border-line p-5 lg:border-b-0 lg:border-r">
            <p className="text-xs font-semibold text-forest-600">02</p>
            <h3 className="mt-2 text-base font-semibold text-forest-950">
              Track home study
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              See dapim visited, quizzes taken, and notes submitted from home or
              Chromebook.
            </p>
          </li>
          <li className="p-5">
            <p className="text-xs font-semibold text-forest-600">03</p>
            <h3 className="mt-2 text-base font-semibold text-forest-950">
              Stay focused
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Clear tables — the signals you need to follow up in shiur.
            </p>
          </li>
        </ol>
      </section>

      <section className="cta-band">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-12 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <h2 className="display text-2xl text-forest-950 sm:text-3xl">
              Open your panel
            </h2>
            <p className="mt-2 text-base text-ink-muted">
              Sign up as a Rebbe, or log in if you already have an account.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2.5">
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
