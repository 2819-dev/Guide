import { DeveloperApplyForm } from "@/components/developer-apply-form";
import Link from "next/link";

export const runtime = "edge";

export const metadata = {
  title: "For developers · Guide",
  description:
    "Build apps schools can add to class. Verified partners apply; Guide Official reviews each one.",
};

/**
 * Public apply form — no server session/DB on first paint.
 * Avoids 500 when Neon Auth/DB env is missing; logged-in redirect lives on /developer.
 */
export default function DeveloperApplyPage() {
  return (
    <div className="portal-page">
      <section className="schools-hero-band">
        <div className="content-band py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow">For developers</p>
            <h1 className="display-feature mx-auto mt-3 max-w-[18ch] lg:max-w-[12em]">
              Build apps schools can add to class
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base font-medium leading-[1.65] text-ink-muted lg:text-lg">
              Build verified apps schools can trust. After Official approves
              you, teachers add your app to class and students open it from My
              apps.
            </p>
            <div className="mt-8 flex flex-col items-center gap-2">
              <a href="#apply" className="btn-primary">
                Apply as a developer
              </a>
              <p className="hero-secondary-links !mt-2">
                <Link href="/auth/sign-in?as=developer">Partner log in</Link>
                <span aria-hidden className="hero-secondary-links__dot">
                  ·
                </span>
                <Link href="/auth/sign-up?as=developer">Create account</Link>
                <span aria-hidden className="hero-secondary-links__dot">
                  ·
                </span>
                <Link href="/schools/demo">Demo</Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="content-band py-10 sm:py-14">
        <div className="schools-feature-grid">
          <article className="schools-feature">
            <h2 className="schools-feature__title">Verified partners only</h2>
            <p className="schools-feature__body">
              Guide Official reviews every application. Schools trust the
              library because listings stay curated.
            </p>
          </article>
          <article className="schools-feature">
            <h2 className="schools-feature__title">Sit in My apps</h2>
            <p className="schools-feature__body">
              Teachers add your app to a class. Students open it from the same
              calm place they use for everything else.
            </p>
          </article>
          <article className="schools-feature">
            <h2 className="schools-feature__title">Manage after approval</h2>
            <p className="schools-feature__body">
              The developer portal keeps your apps in the center — listing
              details, docs, and contact for Official.
            </p>
          </article>
        </div>
      </section>

      <section className="content-band py-2 sm:py-4">
        <ol className="grid gap-0 overflow-hidden rounded-[10px] border border-line bg-surface shadow-[var(--shadow-soft)] lg:grid-cols-3">
          <li className="border-b border-line p-6 lg:border-b-0 lg:border-r">
            <p className="text-xs font-semibold text-forest-600">01</p>
            <h2 className="mt-2 text-lg font-semibold text-forest-950">
              Apply
            </h2>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-muted">
              Share your organization, website, and app. Official reviews each
              partner.
            </p>
          </li>
          <li className="border-b border-line p-6 lg:border-b-0 lg:border-r">
            <p className="text-xs font-semibold text-forest-600">02</p>
            <h2 className="mt-2 text-lg font-semibold text-forest-950">
              Get approved
            </h2>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-muted">
              When approved, partner log in unlocks the developer portal.
            </p>
          </li>
          <li className="p-6">
            <p className="text-xs font-semibold text-forest-600">03</p>
            <h2 className="mt-2 text-lg font-semibold text-forest-950">
              Reach classrooms
            </h2>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-muted">
              Teachers add your app to class. Students stay engaged from My
              apps.
            </p>
          </li>
        </ol>
      </section>

      <div id="apply" className="content-band portal-page__inner max-w-2xl !pt-10 sm:!pt-12">
        <DeveloperApplyForm />
        <p className="mt-4 text-sm text-ink-muted">
          Already approved?{" "}
          <Link
            href="/auth/sign-in?as=developer"
            className="font-semibold text-forest-800"
          >
            Partner log in
          </Link>
          {" · "}
          Prefer an account first?{" "}
          <Link
            href="/auth/sign-up?as=developer"
            className="font-semibold text-forest-800"
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
