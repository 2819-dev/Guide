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
    </div>
  );
}
