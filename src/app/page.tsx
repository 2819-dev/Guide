import Link from "next/link";
import { getFeaturedTractate, studyPath } from "@/lib/tractates";

export default function HomePage() {
  const featured = getFeaturedTractate();
  const startDaf = featured.featuredChapter?.startDaf ?? "2a";
  const startHref = studyPath(featured.slug, startDaf);
  const featuredSugya = featured.featuredChapter?.hebrew;

  return (
    <div>
      {/* Soft hero — Clever-like airy masthead; study product only */}
      <section className="relative overflow-hidden bg-sky-soft">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-14 pt-12 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:pb-20 lg:pt-16">
          <div>
            <h1 className="animate-rise display mt-1 max-w-xl text-4xl text-forest-950 sm:text-5xl lg:text-[3.4rem]">
              The calm place to study Mishnayos and Gemara
            </h1>
            <p className="animate-rise-delay mt-5 max-w-lg text-lg text-ink-muted sm:text-xl">
              Open a daf, read clearly, and quiz yourself. After school, upload
              your notes for a second pass that feels personal — not
              overwhelming.
            </p>
            <div className="animate-rise-late mt-8 flex flex-wrap gap-3">
              <Link href={startHref} className="btn-primary">
                Start with {featured.englishName}
              </Link>
              <Link href="/study" className="btn-secondary">
                Browse tractates
              </Link>
            </div>
          </div>

          <div className="animate-rise-late relative">
            <div
              aria-hidden
              className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-sun/70 float-soft"
            />
            <div
              aria-hidden
              className="absolute -bottom-6 -left-3 h-16 w-16 rounded-[1.5rem] bg-moss/50"
            />
            <div className="facet-frame relative bg-forest-800 p-6 text-forest-50 sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-forest-300">
                Available now
              </p>
              <p className="hebrew mt-4 text-3xl text-white sm:text-4xl">
                {featured.hebrewName}
                {featuredSugya ? ` · ${featuredSugya}` : ""}
              </p>
              <p className="mt-4 max-w-sm text-forest-100">
                Our first tractate is ready — including{" "}
                {featuredSugya ?? "the opening dapim"}. More masechtot are on
                the way.
              </p>
              <Link href={startHref} className="btn-light mt-6 inline-flex">
                Open {startDaf}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What is Guide */}
      <section className="section-pad mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-forest-600">
          What is Guide?
        </p>
        <h2 className="display mt-3 max-w-3xl text-3xl text-forest-950 sm:text-4xl">
          One calm study flow for Mishnayos and Gemara — starting with{" "}
          {featured.englishName}.
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-ink-muted">
          Built for real learners: clear pages, friendly quizzes, and notes that
          turn after-school homework into a clear second pass.
        </p>
      </section>

      {/* Feature color blocks */}
      <section className="bg-paper pb-6">
        <div className="mx-auto grid max-w-6xl gap-5 px-5 sm:px-8 lg:grid-cols-3">
          <article className="color-block bg-forest-100">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-700 text-lg font-bold text-white">
              1
            </div>
            <h3 className="display text-2xl text-forest-950">Pick a tractate</h3>
            <p className="mt-2 text-ink-muted">
              Browse the catalog. {featured.englishName} (
              <span className="hebrew">{featured.hebrewName}</span>) is open
              now
              {featuredSugya ? (
                <>
                  {" "}
                  — including <span className="hebrew">{featuredSugya}</span>
                </>
              ) : null}
              . More masechtot will appear here as they&apos;re ready.
            </p>
          </article>
          <article className="color-block bg-moss/25">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-moss text-lg font-bold text-forest-950">
              2
            </div>
            <h3 className="display text-2xl text-forest-950">Read together</h3>
            <p className="mt-2 text-ink-muted">
              Hebrew and English side by side on a quiet page — room to think,
              not a wall of chrome.
            </p>
          </article>
          <article className="color-block bg-sun/35">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-sun text-lg font-bold text-forest-950">
              3
            </div>
            <h3 className="display text-2xl text-forest-950">Quiz & notes</h3>
            <p className="mt-2 text-ink-muted">
              Check the daf, your notes, or both. After-school homework becomes
              a clear second pass.
            </p>
          </article>
        </div>
      </section>

      {/* Split story band */}
      <section className="section-pad mx-auto max-w-6xl">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="facet-frame bg-forest-900 p-8 text-white sm:p-10">
            <p className="hebrew text-2xl text-forest-200">למד. רשום. בדוק.</p>
            <p className="display mt-4 text-3xl sm:text-4xl">
              Study that feels inviting — not technical.
            </p>
            <p className="mt-4 text-forest-100">
              Soft color, clear steps, and room to breathe. Guide keeps the
              focus on the text and on your notes.
            </p>
          </div>
          <div>
            <h2 className="display text-3xl text-forest-950 sm:text-4xl">
              Made for evenings after shiur
            </h2>
            <p className="mt-4 text-lg text-ink-muted">
              Paste tonight&apos;s notes, save them to your account, and get
              questions that follow what you actually wrote — alongside the
              page itself.
            </p>
            <ul className="mt-6 space-y-3 text-ink">
              <li className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-forest-600" />
                Progress stays with your account across devices
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-moss" />
                Quizzes from the daf, notes, or mixed
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-sun" />
                Create an account free — ready when you are
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="section-pad mx-auto max-w-6xl text-center">
        <h2 className="display mx-auto max-w-2xl text-3xl text-forest-950 sm:text-4xl">
          Ready when you are
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-lg text-ink-muted">
          Begin with {featured.englishName}
          {featuredSugya ? (
            <>
              {" "}
              (<span className="hebrew">{featuredSugya}</span>)
            </>
          ) : null}
          , or create an account so your notes and scores come along for the
          ride.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/study" className="btn-primary">
            Browse tractates
          </Link>
          <Link href="/auth/sign-up" className="btn-secondary">
            Get started free
          </Link>
        </div>
      </section>
    </div>
  );
}
