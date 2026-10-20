import Link from "next/link";
import { getFeaturedTractate, studyPath } from "@/lib/tractates";

export default function HomePage() {
  const featured = getFeaturedTractate();
  const startDaf = featured.featuredChapter?.startDaf ?? "2a";
  const startHref = studyPath(featured.slug, startDaf);
  const featuredSugya = featured.featuredChapter?.hebrew;

  return (
    <div>
      <section className="hero-band">
        <div className="mx-auto grid max-w-6xl items-start gap-10 px-5 py-12 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:py-16">
          <div>
            <h1 className="display max-w-xl text-[2.15rem] text-forest-950 sm:text-4xl lg:text-[2.75rem]">
              Study Mishnayos and Gemara with clarity
            </h1>
            <p className="mt-4 max-w-lg text-base text-ink-muted sm:text-lg">
              Open a daf, read Hebrew and English together, then Test Yourself —
              translation and other real study questions from the page. After
              school, upload notes for a second pass grounded in what you wrote.
            </p>
            <div className="mt-7 flex flex-wrap gap-2.5">
              <Link href={startHref} className="btn-primary">
                Start with {featured.englishName}
              </Link>
              <Link href="/study" className="btn-secondary">
                Browse tractates
              </Link>
            </div>
          </div>

          <aside className="panel !p-6 sm:!p-7">
            <p className="eyebrow">Available now</p>
            <p className="hebrew mt-3 text-2xl text-forest-900 sm:text-3xl">
              {featured.hebrewName}
              {featuredSugya ? ` · ${featuredSugya}` : ""}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted sm:text-base">
              First tractate open — including{" "}
              {featuredSugya ?? "the opening dapim"}. More masechtot will appear
              in the catalog as they are ready.
            </p>
            <Link href={startHref} className="btn-primary mt-5 inline-flex">
              Open {startDaf}
            </Link>
          </aside>
        </div>
      </section>

      <section className="section-pad mx-auto max-w-6xl">
        <p className="eyebrow">How it works</p>
        <h2 className="display mt-2 max-w-2xl text-2xl text-forest-950 sm:text-3xl">
          One study flow for Mishnayos and Gemara — starting with{" "}
          {featured.englishName}.
        </h2>
        <ol className="mt-8 grid gap-0 border border-line bg-surface lg:grid-cols-3">
          <li className="border-b border-line p-5 lg:border-b-0 lg:border-r">
            <p className="text-xs font-semibold text-forest-600">01</p>
            <h3 className="mt-2 text-base font-semibold text-forest-950">
              Pick a tractate
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              {featured.englishName} (
              <span className="hebrew">{featured.hebrewName}</span>) is available
              now
              {featuredSugya ? (
                <>
                  , including <span className="hebrew">{featuredSugya}</span>
                </>
              ) : null}
              .
            </p>
          </li>
          <li className="border-b border-line p-5 lg:border-b-0 lg:border-r">
            <p className="text-xs font-semibold text-forest-600">02</p>
            <h3 className="mt-2 text-base font-semibold text-forest-950">
              Read the page
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Hebrew and English side by side — quiet layout, room to think.
            </p>
          </li>
          <li className="p-5">
            <p className="text-xs font-semibold text-forest-600">03</p>
            <h3 className="mt-2 text-base font-semibold text-forest-950">
              Test Yourself
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Translation, comprehension, key terms, and who-says-what — scored
              and saved to your account.
            </p>
          </li>
        </ol>
      </section>

      <section className="feature-rail">
        <div className="section-pad mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:gap-16 lg:!py-14">
          <div>
            <p className="hebrew text-xl text-forest-700">למד. רשום. בדוק.</p>
            <h2 className="display mt-3 text-2xl text-forest-950 sm:text-3xl">
              Built for evenings after shiur
            </h2>
            <p className="mt-3 text-base leading-relaxed text-ink-muted">
              Paste tonight&apos;s notes, save them to your account, and get
              questions that follow what you wrote — alongside the page itself.
            </p>
          </div>
          <ul className="space-y-3 text-sm text-ink sm:text-base">
            <li className="flex gap-3 border-b border-line pb-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-forest-700" />
              Progress across devices
            </li>
            <li className="flex gap-3 border-b border-line pb-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-forest-700" />
              Test Yourself from the daf, notes, or mixed
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-forest-700" />
              Free account — ready when you need it
            </li>
          </ul>
        </div>
      </section>

      <section className="section-pad mx-auto max-w-6xl text-center">
        <h2 className="display mx-auto max-w-xl text-2xl text-forest-950 sm:text-3xl">
          Begin with {featured.englishName}
          {featuredSugya ? (
            <>
              {" "}
              (<span className="hebrew">{featuredSugya}</span>)
            </>
          ) : null}
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-base text-ink-muted">
          Or create an account so notes and scores stay with you.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          <Link href="/study" className="btn-primary">
            Browse tractates
          </Link>
          <Link href="/auth/sign-up" className="btn-secondary">
            Create account
          </Link>
        </div>
      </section>
    </div>
  );
}
