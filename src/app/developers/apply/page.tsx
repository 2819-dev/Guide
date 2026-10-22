import { DeveloperApplyForm } from "@/components/developer-apply-form";
import Link from "next/link";

export const runtime = "edge";

export const metadata = {
  title: "Apply as a developer · Guide",
  description:
    "Verified developer partners apply to Guide. Official review required.",
};

/**
 * Public apply form — no server session/DB on first paint.
 * Avoids 500 when Neon Auth/DB env is missing; logged-in redirect lives on /developer.
 */
export default function DeveloperApplyPage() {
  return (
    <div className="portal-page">
      <section className="bg-paper">
        <div className="content-band py-12 text-center sm:py-14">
          <p className="eyebrow">For developers</p>
          <h1 className="display-feature mx-auto mt-3 max-w-[18ch]">
            Build apps schools can add to class
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base font-medium leading-[1.65] text-ink-muted">
            Guide hosts verified partner apps — not a public marketplace.
            After Official approves you, teachers can add your app to a class
            and students open it from My apps.
          </p>
          <p className="hero-secondary-links mt-6 justify-center">
            <Link href="/auth/sign-in?as=developer">Partner log in</Link>
            <span aria-hidden className="hero-secondary-links__dot">
              ·
            </span>
            <a href="#apply">Apply below</a>
          </p>
        </div>
      </section>

      <div id="apply" className="content-band portal-page__inner max-w-2xl !pt-6">
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
