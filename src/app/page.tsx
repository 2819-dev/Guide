import Link from "next/link";
import { getFeaturedTractate, studyPath } from "@/lib/tractates";

export default function HomePage() {
  const featured = getFeaturedTractate();
  const startDaf = featured.featuredChapter?.startDaf ?? "2a";
  const startHref = studyPath(featured.slug, startDaf);
  const featuredSugya = featured.featuredChapter?.hebrew;

  return (
    <div>
      {/* Clever-like hero: one product one-liner, support, calm CTAs — no card clutter */}
      <section className="hero-band">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-8 sm:py-20 lg:py-24">
          <h1 className="display text-[2.35rem] text-forest-950 sm:text-5xl lg:text-[3.25rem]">
            The calm place for Mishnayos and Gemara
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-ink-muted sm:text-lg">
            Open a daf, read Hebrew and English together, then Test Yourself —
            real study questions from the page, scored and saved with your
            account.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href={startHref} className="btn-primary">
              Start with {featured.englishName}
            </Link>
            <Link href="/study" className="btn-secondary">
              Choose what to learn
            </Link>
          </div>
          <p className="mx-auto mt-6 max-w-md text-sm text-ink-muted">
            Available now:{" "}
            <span className="hebrew font-medium text-forest-800">
              {featured.hebrewName}
              {featuredSugya ? ` · ${featuredSugya}` : ""}
            </span>
          </p>
        </div>
      </section>

      <section className="section-pad mx-auto max-w-3xl text-center">
        <p className="eyebrow">What is Guide?</p>
        <h2 className="display mt-3 text-2xl text-forest-950 sm:text-3xl lg:text-[2.15rem]">
          One study flow from the page to Test Yourself
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
          Guide is built for evenings after shiur — read the daf, keep your
          notes, and check what stuck. Schools use Guide for Education
          separately to follow home and Chromebook study.
        </p>
      </section>

      <section className="feature-rail">
        <div className="section-pad mx-auto max-w-6xl">
          <p className="eyebrow text-center">How it works</p>
          <h2 className="display mx-auto mt-3 max-w-2xl text-center text-2xl text-forest-950 sm:text-3xl">
            Built around Mishnayos and Gemara — starting with{" "}
            {featured.englishName}
          </h2>
          <div className="capability-grid mt-12">
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
                href="/study"
                className="mt-4 inline-flex text-sm font-semibold text-forest-800 no-underline hover:underline"
              >
                Choose what to learn →
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
                className="mt-4 inline-flex text-sm font-semibold text-forest-800 no-underline hover:underline"
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
                className="mt-4 inline-flex text-sm font-semibold text-forest-800 no-underline hover:underline"
              >
                Try it on a daf →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad mx-auto max-w-6xl">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="eyebrow">Guide for Education</p>
            <h2 className="display mt-3 text-2xl text-forest-950 sm:text-3xl">
              For schools that want home learning to stay visible
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-muted">
              Apply once. After approval, Rebbeim invite a class and see dapim,
              quizzes, and notes — without mixing school tools into the
              consumer study home.
            </p>
            <Link href="/education" className="btn-secondary mt-6 inline-flex">
              Explore Education
            </Link>
          </div>
          <div className="rounded-2xl bg-sky-soft px-6 py-8 sm:px-8">
            <p className="hebrew text-xl text-forest-800">למד. רשום. בדוק.</p>
            <p className="mt-3 text-base leading-relaxed text-ink-muted">
              Students study on Guide. Teachers and school administrators follow
              progress after the school is approved.
            </p>
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-5 py-14 text-center sm:px-8 lg:py-16">
          <h2 className="display max-w-xl text-2xl text-forest-950 sm:text-3xl">
            Begin with {featured.englishName}
            {featuredSugya ? (
              <>
                {" "}
                (<span className="hebrew">{featuredSugya}</span>)
              </>
            ) : null}
          </h2>
          <p className="max-w-lg text-base text-ink-muted">
            Or create an account so notes and Test Yourself scores stay with
            you.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
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
