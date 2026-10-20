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

function AmudHomePage() {
  const featured = getFeaturedTractate();
  const startDaf = featured.featuredChapter?.startDaf ?? "2a";
  const startHref = studyPath(featured.slug, startDaf);
  const featuredSugya = featured.featuredChapter?.hebrew;

  return (
    <div>
      <section className="hero-band">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-8 sm:py-24 lg:py-28">
          <p
            className="display text-[2.75rem] tracking-tight text-forest-950 sm:text-5xl lg:text-[3.5rem]"
            style={{
              fontFamily:
                "var(--font-manrope), var(--font-body), system-ui, sans-serif",
            }}
          >
            {FIRST_APP_NAME}
          </p>
          <h1 className="sr-only">{FIRST_APP_NAME}</h1>
          <p className="mx-auto mt-5 max-w-lg text-base text-ink-muted sm:text-lg">
            The calm place for Mishnayos and Gemara — open a daf, read Hebrew
            and English, then Test Yourself with questions from the page.
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

      <section className="feature-rail">
        <div className="section-pad mx-auto max-w-6xl">
          <p className="eyebrow text-center">How it works</p>
          <h2 className="display mx-auto mt-3 max-w-2xl text-center text-2xl text-forest-950 sm:text-3xl">
            From the page to Test Yourself
          </h2>
          <div className="capability-grid mt-14">
            <div>
              <p className="text-sm font-semibold text-forest-600">01</p>
              <h3 className="mt-2 text-lg font-semibold text-forest-950">
                Pick a Gemara
              </h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-muted">
                {featured.englishName} is open now
                {featuredSugya ? (
                  <>
                    , including{" "}
                    <span className="hebrew">{featuredSugya}</span>
                  </>
                ) : null}
                .
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-forest-600">02</p>
              <h3 className="mt-2 text-lg font-semibold text-forest-950">
                Read the page
              </h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-muted">
                Hebrew and English side by side — quiet layout, room to think.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-forest-600">03</p>
              <h3 className="mt-2 text-lg font-semibold text-forest-950">
                Test Yourself
              </h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-muted">
                Questions from the daf — scored and saved when you create an
                account.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-5 py-16 text-center sm:px-8">
          <h2 className="display max-w-xl text-2xl text-forest-950 sm:text-3xl">
            Begin with {featured.englishName}
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href={startHref} className="btn-primary">
              Open {startDaf}
            </Link>
            <Link href="/auth/sign-up?as=learner" className="btn-secondary">
              Create account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function GuideHomePage() {
  const amudHref = amudPublicUrl() || appHomePath();

  return (
    <div>
      {/* Clever-like: one product one-liner, short support, dual CTAs */}
      <section className="hero-band">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-8 sm:py-24 lg:py-28">
          <h1 className="display text-[2.5rem] text-forest-950 sm:text-5xl lg:text-[3.35rem]">
            The identity platform for schools
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-base text-ink-muted sm:text-lg">
            One secure place for students and teachers to open learning apps,
            message, and stay in sync — without cluttering the top bar.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/auth/sign-in?as=student" className="btn-primary">
              Log In
            </Link>
            <Link href="/education" className="btn-secondary">
              Guide for Education
            </Link>
          </div>
        </div>
      </section>

      <section className="section-pad mx-auto max-w-3xl text-center">
        <h2 className="display text-2xl text-forest-950 sm:text-3xl">
          What is Guide?
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
          Guide is built for schools. Log in as a Student, Teacher or School
          Administrator, or Guide Official. Teachers add apps to a class;
          students open them from My apps on their portal — just like Clever.
        </p>
      </section>

      <section className="feature-rail">
        <div className="section-pad mx-auto max-w-6xl">
          <p className="eyebrow text-center">Power classroom learning</p>
          <h2 className="display mx-auto mt-3 max-w-2xl text-center text-2xl text-forest-950 sm:text-3xl">
            Apps live in the portal
          </h2>
          <div className="capability-grid mt-14">
            <div>
              <p className="text-sm font-semibold text-forest-600">01</p>
              <h3 className="mt-2 text-lg font-semibold text-forest-950">
                Log in once
              </h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-muted">
                School picker and badge login for students; Education access for
                teachers after school approval.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-forest-600">02</p>
              <h3 className="mt-2 text-lg font-semibold text-forest-950">
                Open My apps
              </h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-muted">
                Your portal is the launcher. Teachers add {FIRST_APP_NAME};{" "}
                students tap the tile — not a list of apps in the header.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-forest-600">03</p>
              <h3 className="mt-2 text-lg font-semibold text-forest-950">
                Stay connected
              </h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-muted">
                Messaging and Suggestions sit with the portal. {FIRST_APP_NAME}{" "}
                also has its own public site for anyone.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad mx-auto max-w-6xl">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="eyebrow">Guide for Education</p>
            <h2 className="display mt-3 text-2xl text-forest-950 sm:text-3xl">
              Classes and apps in one place
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-ink-muted">
              Apply once. After approval, Rebbeim create classes, add apps, and
              follow student progress.
            </p>
            <Link href="/education" className="btn-secondary mt-7 inline-flex">
              Explore Education
            </Link>
          </div>
          <div className="border-t border-line pt-8 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-1">
            <p className="eyebrow">{FIRST_APP_NAME}</p>
            <h2 className="display mt-3 text-2xl text-forest-950 sm:text-3xl">
              Learning for everyone
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-muted">
              Mishnayos and Gemara · Test Yourself. Schools add it in Guide;
              anyone can study on the {FIRST_APP_NAME} site without a school
              login.
            </p>
            <a href={amudHref} className="btn-secondary mt-7 inline-flex">
              Visit {FIRST_APP_NAME}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
