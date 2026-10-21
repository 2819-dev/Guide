import Link from "next/link";
import { AmudHomePage } from "@/components/amud-home";
import { FIRST_APP_NAME, appHomePath } from "@/lib/apps";
import { amudPublicUrl, isAmudSite } from "@/lib/site";

export const runtime = "edge";

export default function HomePage() {
  if (isAmudSite()) {
    return <AmudHomePage />;
  }
  return <GuideHomePage />;
}

function ArrowIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path
        d="M3 8h9M8 3.5 12.5 8 8 12.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Clever.com cover 1:1 structure — Guide forest only.
 * Spec: internal/clever-layout-spec-forest-replica.md
 * Refs: media/clever-1to1/guide-clever-home.png · artifacts/screenshots/clever-home.png
 *
 * Left: H1 + lede + primary bar + twin white cards under it.
 * Right: hero visual. Soft wave behind CTA stack. No banner.
 */
function GuideHomePage() {
  const amudHref = amudPublicUrl() || appHomePath();

  return (
    <div>
      <section className="hero-band">
        <div className="content-band hero-band__grid">
          <div className="hero-copy">
            <h1 className="display-hero max-w-[16ch]">
              The{" "}
              <span className="sun-underline">identity</span> platform for
              schools
            </h1>
            <p className="hero-lede">
              One secure place for students and teachers to open learning apps,
              message, and stay in sync.
            </p>

            <div className="hero-cta-stack">
              <Link href="/auth/sign-in?as=student" className="btn-hero-bar">
                <span>Log in as a student</span>
                <span className="btn-hero-bar__arrow">
                  <ArrowIcon />
                </span>
              </Link>

              <div className="hero-link-row">
                <Link href="/education" className="hero-link-card">
                  <span className="hero-link-card__label">For schools</span>
                  <span className="hero-link-card__arrow" aria-hidden>
                    <ArrowIcon size={15} />
                  </span>
                </Link>
                <Link href="/developers/apply" className="hero-link-card">
                  <span className="hero-link-card__label">For developers</span>
                  <span className="hero-link-card__arrow" aria-hidden>
                    <ArrowIcon size={15} />
                  </span>
                </Link>
              </div>
            </div>
          </div>

          <div className="hero-visual-panel" aria-hidden>
            <p className="hero-visual-panel__caption">
              Students and teachers. One place to open learning apps.
            </p>
          </div>
        </div>
      </section>

      <section id="what" className="section-pad !pt-14 !pb-10">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="display-section">What is Guide?</h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-muted">
            Guide is an identity platform for schools. Students open apps from
            their portal. Teachers manage classes after a school invite. School
            administrators apply once; Guide Official approves.
          </p>
        </div>
      </section>

      <section className="feature-rail">
        <div className="content-band section-pad !pt-16 !pb-20">
          <h2 className="display-feature max-w-2xl">
            Power classroom learning
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-muted">
            One secure place for teachers and students to open the apps they
            depend on — right from their portal.
          </p>
          <div className="capability-grid mt-14">
            <div>
              <p className="text-sm font-semibold text-forest-600">01</p>
              <h3 className="mt-2 text-xl font-semibold text-forest-950">
                Secure school identity
              </h3>
              <p className="mt-2 text-base leading-relaxed text-ink-muted">
                School picker and badge or password login for students. School
                tools unlock after your school is approved.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-forest-600">02</p>
              <h3 className="mt-2 text-xl font-semibold text-forest-950">
                Portal app launcher
              </h3>
              <p className="mt-2 text-base leading-relaxed text-ink-muted">
                Teachers add learning apps to a class. Students open them from
                My apps on their portal.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-forest-600">03</p>
              <h3 className="mt-2 text-xl font-semibold text-forest-950">
                Messaging &amp; Suggestions
              </h3>
              <p className="mt-2 text-base leading-relaxed text-ink-muted">
                Messaging and Suggestions stay with the portal — alongside the
                apps your school chooses.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="content-band grid items-start gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="eyebrow">For schools</p>
            <h2 className="display-feature mt-3">
              Classes and apps in one place
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-ink-muted">
              Apply once as a school or district. After approval, invite
              teachers by email, create classes, and add apps — all inside
              Guide.
            </p>
            <Link
              href="/education#apply"
              className="btn-secondary mt-8 inline-flex"
            >
              Apply for your school
            </Link>
          </div>
          <div className="border-t border-line pt-8 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-1">
            <p className="eyebrow">{FIRST_APP_NAME}</p>
            <h2 className="display-feature mt-3">Learning for everyone</h2>
            <p className="mt-4 text-base leading-relaxed text-ink-muted">
              Mishnayos and Gemara · Test Yourself. Schools add it in Guide;
              anyone can study on the {FIRST_APP_NAME} site without a school
              login.
            </p>
            <a href={amudHref} className="btn-secondary mt-8 inline-flex">
              Visit {FIRST_APP_NAME}
            </a>
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="content-band flex flex-col items-start gap-6 py-16 sm:py-20 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="display-section max-w-xl !text-white">
            Connecting every student to the apps they need
          </h2>
          <Link href="/auth/sign-in?as=student" className="btn-light shrink-0">
            Log in as a student
          </Link>
        </div>
      </section>
    </div>
  );
}
