import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DafPicker } from "@/components/daf-picker";
import { parseDafId } from "@/lib/daf";
import {
  getFeaturedTractate,
  getTractate,
  studyPath,
} from "@/lib/tractates";

export const instant = false;

type Props = {
  params: Promise<{ tractate: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { tractate: slug } = await params;
  const tractate = getTractate(slug);
  if (!tractate) return { title: "Tractate" };
  return { title: tractate.englishName };
}

export default async function TractateStudyPage({ params }: Props) {
  const { tractate: slug } = await params;

  // Legacy short URLs: /study/21a → /study/bava-metzia/21a
  const featured = getFeaturedTractate();
  if (parseDafId(slug, featured)) {
    redirect(studyPath(featured.slug, slug));
  }

  const tractate = getTractate(slug);
  if (!tractate) notFound();

  if (!tractate.available) {
    return (
      <div>
        <section className="bg-sky-soft">
          <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-14">
            <Link
              href="/study"
              className="text-sm font-semibold text-forest-700 no-underline hover:underline"
            >
              ← All tractates
            </Link>
            <p className="hebrew mt-4 text-lg text-forest-700">
              {tractate.hebrewName}
            </p>
            <h1 className="display mt-2 text-4xl text-forest-950 sm:text-5xl">
              {tractate.englishName}
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-ink-muted">
              Coming soon. Create an account so you&apos;re ready when this
              masechta opens.
            </p>
            <Link href="/auth/sign-up" className="btn-primary mt-8 inline-flex">
              Get started free
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const featuredChapter = tractate.featuredChapter;

  return (
    <div>
      <section className="bg-sky-soft">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-14">
          <Link
            href="/study"
            className="text-sm font-semibold text-forest-700 no-underline hover:underline"
          >
            ← All tractates
          </Link>
          <p className="hebrew mt-4 text-lg text-forest-700">
            {tractate.hebrewName}
          </p>
          <h1 className="display mt-2 text-4xl text-forest-950 sm:text-5xl">
            Choose a daf
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-ink-muted">
            {featuredChapter ? (
              <>
                Open any page of {tractate.englishName}.{" "}
                <span className="hebrew">{featuredChapter.hebrew}</span> begins
                at {featuredChapter.startDaf} — a strong place to start that
                sugya.
              </>
            ) : (
              <>Open any page of {tractate.englishName}.</>
            )}
          </p>
          {featuredChapter && (
            <Link
              href={studyPath(tractate.slug, featuredChapter.startDaf)}
              className="btn-primary mt-6 inline-flex"
            >
              Start at {featuredChapter.hebrew}
            </Link>
          )}
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-12">
        <DafPicker tractate={tractate} />
      </div>
    </div>
  );
}
