import { DeveloperApplyForm } from "@/components/developer-apply-form";
import Link from "next/link";

export const runtime = "edge";

export const metadata = {
  alternates: { canonical: "/developers/apply" },
  title: "For developers",
  description:
    "Publish your learning app on Guide. Teachers add approved apps to their classes, and students open them with one login.",
};

/**
 * Public apply form — no server session or database read on first paint.
 * The logged-in redirect lives on /developer.
 */
export default function DeveloperApplyPage() {
  return (
    <div className="portal-page">
      <section className="schools-hero-band">
        <div className="content-band py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow">For developers</p>
            <h1 className="display-feature mx-auto mt-3 max-w-[18ch] lg:max-w-[12em]">
              Bring your app to classrooms on Guide
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base font-medium leading-[1.65] text-ink-muted lg:text-lg">
              Apply to publish your learning app on Guide. After approval,
              teachers can add it to their classes and students open it with
              their Guide login.
            </p>
            <div className="mt-8 flex flex-col items-center gap-2">
              <a href="#apply" className="btn-primary">
                Apply as a developer
              </a>
              <p className="hero-secondary-links !mt-2">
                <Link href="/auth/sign-in?as=developer">Developer log in</Link>
                <span aria-hidden className="hero-secondary-links__dot">
                  ·
                </span>
                <Link href="/auth/sign-up?as=developer">Sign up</Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="content-band py-10 sm:py-14">
        <div className="schools-feature-grid">
          <article className="schools-feature">
            <h2 className="schools-feature__title">A reviewed library</h2>
            <p className="schools-feature__body">
              The Guide team reviews every developer and app before it is
              listed, so schools can add apps with confidence.
            </p>
          </article>
          <article className="schools-feature">
            <h2 className="schools-feature__title">One login for students</h2>
            <p className="schools-feature__body">
              Teachers add your app to a class. Students open it from My apps,
              alongside the other apps their school uses.
            </p>
          </article>
          <article className="schools-feature">
            <h2 className="schools-feature__title">Your developer portal</h2>
            <p className="schools-feature__body">
              After approval, manage your listing details and documentation
              from the developer portal.
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
              Tell us about your organization, website, and app.
            </p>
          </li>
          <li className="border-b border-line p-6 lg:border-b-0 lg:border-r">
            <p className="text-xs font-semibold text-forest-600">02</p>
            <h2 className="mt-2 text-lg font-semibold text-forest-950">
              Guide reviews your application
            </h2>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-muted">
              After approval, log in to open your developer portal.
            </p>
          </li>
          <li className="p-6">
            <p className="text-xs font-semibold text-forest-600">03</p>
            <h2 className="mt-2 text-lg font-semibold text-forest-950">
              Reach classrooms
            </h2>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-muted">
              Teachers add your app to their classes, and students open it from
              My apps.
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
            Log in
          </Link>
          . Prefer to create an account first?{" "}
          <Link
            href="/auth/sign-up?as=developer"
            className="font-semibold text-forest-800"
          >
            Sign up
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
