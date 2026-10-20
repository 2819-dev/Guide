import Link from "next/link";
import { FIRST_APP_NAME, appHomePath, studyPath } from "@/lib/apps";
import { getFeaturedTractate } from "@/lib/tractates";

export default function HomePage() {
  const featured = getFeaturedTractate();
  const startDaf = featured.featuredChapter?.startDaf ?? "2a";
  const startHref = studyPath(featured.slug, startDaf);
  const featuredSugya = featured.featuredChapter?.hebrew;
  const chazarahHome = appHomePath();

  return (
    <div>
      <section className="hero-band">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-8 sm:py-24 lg:py-28">
          <h1 className="display text-[2.5rem] text-forest-950 sm:text-5xl lg:text-[3.35rem]">
            The school platform for learning apps
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-base text-ink-muted sm:text-lg">
            Guide is Clever-like identity for schools — portals, login, and an
            app library. Teachers add apps; students open them from My apps.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/apps" className="btn-primary">
              Browse apps
            </Link>
            <Link href="/education" className="btn-secondary">
              Guide for Education
            </Link>
          </div>
        </div>
      </section>

      <section className="section-pad mx-auto max-w-3xl text-center">
        <h2 className="display text-2xl text-forest-950 sm:text-3xl lg:text-[2.15rem]">
          What is Guide?
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
          Guide is the platform: Log in as a student, teacher, family, or
          Official; message; Suggestions; Discord-style roles. Learning products
          live as installable apps — starting with {FIRST_APP_NAME}.
        </p>
      </section>

      <section className="feature-rail">
        <div className="section-pad mx-auto max-w-6xl">
          <p className="eyebrow text-center">First app</p>
          <h2 className="display mx-auto mt-3 max-w-2xl text-center text-2xl text-forest-950 sm:text-3xl">
            {FIRST_APP_NAME}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-base text-ink-muted">
            Mishnayos and Gemara — open a daf, keep notes, and Test Yourself
            with questions from the page. Teachers add {FIRST_APP_NAME} to a
            class; students launch it from their portal.
          </p>
          <div className="capability-grid mt-14">
            <div>
              <p className="text-sm font-semibold text-forest-600">01</p>
              <h3 className="mt-2 text-lg font-semibold text-forest-950">
                Pick a Gemara
              </h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-muted">
                {featured.englishName} (
                <span className="hebrew">{featured.hebrewName}</span>) is open
                now
                {featuredSugya ? (
                  <>
                    , including{" "}
                    <span className="hebrew">{featuredSugya}</span>
                  </>
                ) : null}
                .
              </p>
              <Link
                href={chazarahHome}
                className="mt-5 inline-flex text-sm font-semibold text-forest-800 no-underline hover:underline"
              >
                Open {FIRST_APP_NAME} →
              </Link>
            </div>
            <div>
              <p className="text-sm font-semibold text-forest-600">02</p>
              <h3 className="mt-2 text-lg font-semibold text-forest-950">
                Read the page
              </h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-muted">
                Hebrew and English side by side — quiet layout, room to think.
              </p>
              <Link
                href={startHref}
                className="mt-5 inline-flex text-sm font-semibold text-forest-800 no-underline hover:underline"
              >
                Open {startDaf} →
              </Link>
            </div>
            <div>
              <p className="text-sm font-semibold text-forest-600">03</p>
              <h3 className="mt-2 text-lg font-semibold text-forest-950">
                Test Yourself
              </h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-muted">
                Translation, comprehension, key terms, and who-says-what —
                scored and saved to your account.
              </p>
              <Link
                href={startHref}
                className="mt-5 inline-flex text-sm font-semibold text-forest-800 no-underline hover:underline"
              >
                Try it on a daf →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad mx-auto max-w-6xl">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="eyebrow">Guide for Education</p>
            <h2 className="display mt-3 text-2xl text-forest-950 sm:text-3xl">
              For schools that want apps and progress in one place
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-ink-muted">
              Apply once. After approval, Rebbeim create classes, add apps from
              the library, and follow student work — without mixing school tools
              into the consumer home.
            </p>
            <Link href="/education" className="btn-secondary mt-7 inline-flex">
              Explore Education
            </Link>
          </div>
          <div className="border-t border-line pt-8 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-1">
            <p className="hebrew text-xl text-forest-800">למד. רשום. בדוק.</p>
            <p className="mt-4 text-base leading-relaxed text-ink-muted">
              Students open apps on Guide. Teachers and school administrators
              add {FIRST_APP_NAME} and follow progress after the school is
              approved.
            </p>
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-5 py-16 text-center sm:px-8 lg:py-20">
          <h2 className="display max-w-xl text-2xl text-forest-950 sm:text-3xl">
            Try {FIRST_APP_NAME} with {featured.englishName}
          </h2>
          <p className="max-w-md text-base text-ink-muted">
            Or create an account so notes and Test Yourself scores stay with
            you.
          </p>
          <div className="mt-1 flex flex-wrap justify-center gap-3">
            <Link href={startHref} className="btn-primary">
              Open {startDaf}
            </Link>
            <Link href="/auth/sign-up?as=family" className="btn-secondary">
              Create account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
