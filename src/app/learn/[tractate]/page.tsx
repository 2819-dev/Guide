import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DafPicker } from "@/components/daf-picker";
import { studyIndexPath, studyPath } from "@/lib/apps";
import { parseDafId } from "@/lib/daf";
import { getFeaturedTractate, getTractate } from "@/lib/tractates";

export const runtime = 'edge';

type Props = {
  params: Promise<{ tractate: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { tractate: slug } = await params;
  const tractate = getTractate(slug);
  if (!tractate) return { title: "Learn" };
  return { title: tractate.englishName };
}

export default async function LearnTractatePage({ params }: Props) {
  const { tractate: slug } = await params;

  const featured = getFeaturedTractate();
  if (parseDafId(slug, featured)) {
    redirect(studyPath(featured.slug, slug));
  }

  const tractate = getTractate(slug);
  if (!tractate) notFound();

  if (!tractate.available) {
    return (
      <div>
        <section className="hero-band">
          <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-12">
            <Link
              href={studyIndexPath()}
              className="text-sm font-medium text-forest-700 no-underline hover:underline"
            >
              ← Choose what to learn
            </Link>
            <p className="hebrew mt-4 text-lg text-forest-800">
              {tractate.hebrewName}
            </p>
            <h1 className="display mt-2 text-3xl text-forest-950 sm:text-4xl">
              {tractate.englishName}
            </h1>
            <p className="mt-3 max-w-2xl text-base text-ink-muted">
              Coming soon. Create an account so you&apos;re ready when this
              opens.
            </p>
            <Link
              href="/auth/sign-up?as=learner"
              className="btn-primary mt-6 inline-flex"
            >
              Create account
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const featuredChapter = tractate.featuredChapter;

  return (
    <div>
      <section className="hero-band">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-12">
          <Link
            href={studyIndexPath()}
            className="text-sm font-medium text-forest-700 no-underline hover:underline"
          >
            ← Choose what to learn
          </Link>
          <p className="hebrew mt-4 text-lg text-forest-800">
            {tractate.hebrewName}
          </p>
          <h1 className="display mt-2 text-3xl text-forest-950 sm:text-4xl">
            Choose a daf
          </h1>
          <p className="mt-3 max-w-2xl text-base text-ink-muted">
            {featuredChapter ? (
              <>
                Open any page of {tractate.englishName}.{" "}
                <span className="hebrew">{featuredChapter.hebrew}</span> begins
                at {featuredChapter.startDaf}.
              </>
            ) : (
              <>Open any page of {tractate.englishName}.</>
            )}
          </p>
          {featuredChapter && (
            <Link
              href={studyPath(tractate.slug, featuredChapter.startDaf)}
              className="btn-primary mt-5 inline-flex"
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
