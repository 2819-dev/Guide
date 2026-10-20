import Link from "next/link";
import { FIRST_APP_NAME, appHomePath, studyIndexPath, studyPath } from "@/lib/apps";
import { amudPublicUrl, isAmudSite } from "@/lib/site";
import { getFeaturedTractate } from "@/lib/tractates";

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
        <div className="content-band grid items-center gap-12 py-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.95fr)] lg:gap-10 lg:py-20">
          <div>
            <h1 className="display-hero max-w-[20ch]">
              The{" "}
              <span className="sun-underline">identity</span> platform for
              schools
            </h1>
            <p className="mt-5 max-w-[32rem] text-lg font-medium leading-[1.65] text-ink">
              One secure place for students and teachers to open learning apps,
              message, and stay in sync — without cluttering the top bar.
            </p>

            <div className="mt-10 max-w-[40rem] space-y-6">
              <Link
                href="/auth/sign-in?as=student"
                className="btn-hero-bar"
              >
                <span>Log in as a student</span>
                <span className="btn-hero-bar__arrow">
                  <ArrowIcon />
                </span>
              </Link>
              <div className="grid gap-5 sm:grid-cols-2">
                <Link href="/education" className="hero-link-card">
                  <span className="hero-link-card__label">For schools</span>
                  <span className="hero-link-card__arrow">
                    <ArrowIcon />
                  </span>
                </Link>
                <Link
                  href="/auth/sign-in?as=educator"
                  className="hero-link-card"
                >
                  <span className="hero-link-card__label">For teachers</span>
                  <span className="hero-link-card__arrow">
                    <ArrowIcon />
                  </span>
                </Link>
              </div>
            </div>
          </div>

          <div
            className="relative min-h-[280px] overflow-hidden rounded-[10px] lg:min-h-[340px]"
            aria-hidden
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(145deg, #c5dccf 0%, #5a9a76 42%, #1c3d2e 100%)",
              }}
            />
            <div className="absolute inset-0 opacity-40">
              <div className="absolute -left-10 top-10 h-40 w-40 rounded-full bg-forest-100/80 blur-2xl" />
              <div className="absolute bottom-8 right-6 h-48 w-48 rounded-full bg-sun/30 blur-2xl" />
            </div>
            <div className="absolute inset-0 flex items-end p-8">
              <p className="max-w-[16rem] text-lg font-semibold leading-snug text-white">
                Portals for students and teachers. Apps open from My apps —
                not the header.
              </p>
            </div>
          </div>
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
            One secure place for teachers and students to access the apps they
            depend on — launched from the portal, Clever-style.
          </p>
          <div className="capability-grid mt-14">
            <div>
              <p className="text-sm font-semibold text-forest-600">01</p>
              <h3 className="mt-2 text-xl font-semibold text-forest-950">
                Secure school identity
              </h3>
              <p className="mt-2 text-base leading-relaxed text-ink-muted">
                School picker and badge or password login for students.
                Education tools unlock after school approval.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-forest-600">02</p>
              <h3 className="mt-2 text-xl font-semibold text-forest-950">
                Portal app launcher
              </h3>
              <p className="mt-2 text-base leading-relaxed text-ink-muted">
                Teachers add {FIRST_APP_NAME} to a class. Students tap the tile
                on My apps — never a list of apps in the top bar.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-forest-600">03</p>
              <h3 className="mt-2 text-xl font-semibold text-forest-950">
                Messaging &amp; Suggestions
              </h3>
              <p className="mt-2 text-base leading-relaxed text-ink-muted">
                Platform actions stay with the portal. Learning for everyone
                also lives on the {FIRST_APP_NAME} site.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="content-band grid items-start gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="eyebrow">Guide for Education</p>
            <h2 className="display-feature mt-3">
              Classes and apps in one place
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-ink-muted">
              Apply once. After approval, Rebbeim create classes, add apps, and
              follow student progress.
            </p>
            <Link href="/education" className="btn-secondary mt-8 inline-flex">
              Explore Education
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

function AmudHomePage() {
  const featured = getFeaturedTractate();
  const startDaf = featured.featuredChapter?.startDaf ?? "2a";
  const startHref = studyPath(featured.slug, startDaf);
  const featuredSugya = featured.featuredChapter?.hebrew;

  return (
    <div>
      <section className="hero-band">
        <div className="content-band py-20 text-center sm:py-24">
          <p className="display-hero mx-auto">{FIRST_APP_NAME}</p>
          <h1 className="sr-only">{FIRST_APP_NAME}</h1>
          <p className="mx-auto mt-5 max-w-lg text-lg font-medium text-ink-muted">
            The calm place for Mishnayos and Gemara — open a daf, then Test
            Yourself with questions from the page.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href={startHref} className="btn-primary">
              Start with {featured.englishName}
            </Link>
            <Link href={studyIndexPath()} className="btn-secondary">
              Choose what to learn
            </Link>
          </div>
          <p className="mx-auto mt-7 max-w-md text-sm text-ink-muted">
            Available now:{" "}
            <span className="hebrew font-medium text-forest-800">
              {featured.hebrewName}
              {featuredSugya ? ` · ${featuredSugya}` : ""}
            </span>
          </p>
        </div>
      </section>
    </div>
  );
}
