import Link from "next/link";
import { FIRST_APP_NAME, publicStudyIndexPath, publicStudyPath } from "@/lib/apps";
import { getFeaturedTractate } from "@/lib/tractates";

/** Public Amud marketing home (root on Amud deploy; /amudsite on Guide). */
export function AmudHomePage() {
  const featured = getFeaturedTractate();
  const startDaf = featured.featuredChapter?.startDaf ?? "2a";
  const startHref = publicStudyPath(featured.slug, startDaf);
  const featuredSugya = featured.featuredChapter?.hebrew;

  return (
    <div>
      <section className="hero-band">
        <div className="content-band py-14 text-center sm:py-20">
          <p className="display-hero mx-auto">{FIRST_APP_NAME}</p>
          <h1 className="sr-only">{FIRST_APP_NAME}</h1>
          <p className="mx-auto mt-5 max-w-lg text-lg font-medium leading-relaxed text-ink-muted">
            The calm place for Mishnayos and Gemara — open a daf, then Test
            Yourself with questions from the page.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href={startHref} className="btn-primary">
              Start with {featured.englishName}
            </Link>
            <Link href={publicStudyIndexPath()} className="btn-secondary">
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

      <section className="content-band py-12 sm:py-16">
        <div className="schools-feature-grid">
          <article className="schools-feature">
            <h2 className="schools-feature__title">Open a daf</h2>
            <p className="schools-feature__body">
              Pick a Gemara or Mishnah and read with Hebrew and English side by
              side — clear and steady.
            </p>
          </article>
          <article className="schools-feature">
            <h2 className="schools-feature__title">Test Yourself</h2>
            <p className="schools-feature__body">
              Varied questions from the page, including translation — so review
              after class stays engaging.
            </p>
          </article>
          <article className="schools-feature">
            <h2 className="schools-feature__title">Keep your notes</h2>
            <p className="schools-feature__body">
              Log in to save scores and notes. Schools can also add{" "}
              {FIRST_APP_NAME} as a Guide class app.
            </p>
          </article>
        </div>
      </section>

      <section className="cta-band">
        <div className="content-band cta-band__inner">
          <h2 className="display-section cta-band__title">
            Start learning on {FIRST_APP_NAME}
          </h2>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <Link href={startHref} className="btn-light shrink-0">
              Start with {featured.englishName}
            </Link>
            <Link
              href="/auth/sign-in?as=learner"
              className="text-center text-sm font-semibold text-white/90 underline-offset-4 hover:underline"
            >
              Log In →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
