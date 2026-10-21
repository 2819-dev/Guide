import Link from "next/link";
import { AmudHomePage } from "@/components/amud-home";
import { GuideBrandBanner } from "@/components/guide-brand-banner";
import { FIRST_APP_NAME, appHomePath } from "@/lib/apps";
import { amudPublicUrl, isAmudSite } from "@/lib/site";

export const runtime = 'edge';

export default function HomePage() {
  if (isAmudSite()) {
    return <AmudHomePage />;
  }
  return <GuideHomePage />;
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
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

/** Clever 1:1 marketing home — Guide forest brand. */
function GuideHomePage() {
  const amudHref = amudPublicUrl() || appHomePath();

  return (
    <div>
      <section className="hero-band">
        <div className="content-band hero-band__grid">
          <div>
            <h1 className="display-hero max-w-[18ch]">
              The{" "}
              <span className="sun-underline">identity</span> platform for
              schools
            </h1>
            <p className="mt-4 max-w-[30rem] text-lg font-medium leading-[1.6] text-ink">
              One secure place for students and teachers to open learning apps,
              message, and stay in sync.
            </p>

            <div className="mt-9 max-w-[40rem]">
              <Link
                href="/auth/sign-in?as=student"
                className="btn-hero-bar"
              >
                <span>Log in as a student</span>
                <span className="btn-hero-bar__arrow">
                  <ArrowIcon />
                </span>
              </Link>
              <p className="hero-secondary-links">
                <Link href="/education#apply">For schools</Link>
                <span aria-hidden className="hero-secondary-links__dot">
                  ·
                </span>
                <Link href="/auth/sign-in?as=educator">For teachers</Link>
              </p>
            </div>
          </div>

          <GuideBrandBanner variant="panel" priority />
        </div>
      </section>

      <section id="what" className="section-pad">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="display-section">What is Guide?</h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-muted">
            Guide is an identity platform for schools. Log in as a Student,
            Teacher or School Administrator, or Guide Official. Teachers add
            apps to a class; students open them from My apps on their portal.
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
                School picker and badge or password login for students.
                School tools unlock after your school is approved.
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
              Apply once. After approval, teachers create classes, add apps, and
              follow student progress — all inside Guide.
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
          <Link
            href="/auth/sign-in?as=student"
            className="btn-light shrink-0"
          >
            Log in as a student
          </Link>
        </div>
      </section>
    </div>
  );
}
