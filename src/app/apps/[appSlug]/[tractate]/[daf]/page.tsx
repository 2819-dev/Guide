import Link from "next/link";
import { notFound } from "next/navigation";
import { StudyWorkspace } from "@/components/study-workspace";
import { FIRST_APP_SLUG, getApp, studyPath } from "@/lib/apps";
import { adjacentDaf, resolveTractateAndDaf } from "@/lib/daf";
import { ensureProfile } from "@/lib/profile";
import { fetchDafText } from "@/lib/sefaria";

export const instant = false;

type Props = {
  params: Promise<{ appSlug: string; tractate: string; daf: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { appSlug, tractate: slug, daf } = await params;
  if (!getApp(appSlug)) return { title: "App" };
  const resolved = resolveTractateAndDaf(slug, daf);
  if (!resolved) return { title: "Daf not found" };
  return {
    title: `${resolved.tractate.englishName} ${resolved.daf.id}`,
  };
}

export default async function AppDafPage({ params }: Props) {
  const { appSlug, tractate: slug, daf } = await params;
  if (appSlug !== FIRST_APP_SLUG || !getApp(appSlug)) notFound();

  const resolved = resolveTractateAndDaf(slug, daf);
  if (!resolved) notFound();

  let text;
  try {
    text = await fetchDafText(daf, slug);
  } catch {
    notFound();
  }

  const session = await ensureProfile().catch(() => null);
  const prev = adjacentDaf(resolved.tractate, daf, -1);
  const next = adjacentDaf(resolved.tractate, daf, 1);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={studyPath(slug)}
          className="text-sm font-semibold text-forest-700 no-underline hover:underline"
        >
          ← {resolved.tractate.englishName} dapim
        </Link>
        <div className="flex gap-2">
          {prev && (
            <Link
              href={studyPath(slug, prev.id)}
              className="btn-secondary !py-2 text-sm"
            >
              {prev.id}
            </Link>
          )}
          {next && (
            <Link
              href={studyPath(slug, next.id)}
              className="btn-secondary !py-2 text-sm"
            >
              {next.id}
            </Link>
          )}
        </div>
      </div>
      <StudyWorkspace text={text} signedIn={Boolean(session)} />
    </div>
  );
}
