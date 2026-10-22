import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DafPicker } from "@/components/daf-picker";
import { studyIndexPath, studyPath } from "@/lib/apps";
import { parseDafId } from "@/lib/daf";
import { publicAmudLearnBase } from "@/lib/site";
import { getFeaturedTractate, getTractate } from "@/lib/tractates";

export const runtime = "edge";

type Props = {
  params: Promise<{ tractate: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { tractate: slug } = await params;
  const tractate = getTractate(slug);
  if (!tractate) return { title: "Learn" };
  return { title: tractate.englishName };
}

export default async function AmudSiteLearnTractatePage({ params }: Props) {
  const { tractate: slug } = await params;
  const learnBase = publicAmudLearnBase();

  const featured = getFeaturedTractate();
  if (parseDafId(slug, featured)) {
    redirect(studyPath(featured.slug, slug, learnBase));
  }

  const tractate = getTractate(slug);
  if (!tractate) notFound();

  if (!tractate.available) {
    return (
      <div className="portal-page">
        <div className="content-band portal-page__inner max-w-2xl">
          <p className="text-sm font-semibold text-forest-800">
            <Link href={studyIndexPath(learnBase)}>← Choose what to learn</Link>
          </p>
          <div className="portal-empty mt-6">
            <p className="hebrew text-base text-forest-800">
              {tractate.hebrewName}
            </p>
            <p className="portal-empty__title mt-2">{tractate.englishName}</p>
            <p className="portal-empty__body">
              Coming soon. Log in or create an Amud account so you&apos;re ready
              when this opens.
            </p>
            <p className="mt-5">
              <Link
                href="/auth/sign-in?as=learner"
                className="btn-primary inline-flex"
              >
                Log In
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const featuredChapter = tractate.featuredChapter;

  return (
    <div className="portal-page">
      <div className="content-band portal-page__inner">
        <header className="portal-hero !border-0 !pb-2">
          <p className="text-sm font-semibold text-forest-800">
            <Link href={studyIndexPath(learnBase)}>← Choose what to learn</Link>
          </p>
          <p className="hebrew mt-4 text-lg text-forest-800">
            {tractate.hebrewName}
          </p>
          <h1 className="display-feature mt-1">Choose a daf</h1>
          <p className="mt-2 max-w-xl text-[0.95rem] leading-relaxed text-ink-muted">
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
          {featuredChapter ? (
            <p className="mt-5">
              <Link
                href={studyPath(
                  tractate.slug,
                  featuredChapter.startDaf,
                  learnBase,
                )}
                className="btn-primary inline-flex"
              >
                Start at {featuredChapter.hebrew}
              </Link>
            </p>
          ) : null}
        </header>
        <div className="mt-6">
          <DafPicker tractate={tractate} learnBase={learnBase} />
        </div>
      </div>
    </div>
  );
}
