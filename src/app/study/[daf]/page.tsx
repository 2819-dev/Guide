import Link from "next/link";
import { notFound } from "next/navigation";
import { StudyWorkspace } from "@/components/study-workspace";
import { adjacentDaf, parseDafId } from "@/lib/daf";
import { fetchDafText } from "@/lib/sefaria";

export const instant = false;

type Props = {
  params: Promise<{ daf: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { daf } = await params;
  const parsed = parseDafId(daf);
  if (!parsed) return { title: "Daf not found" };
  return { title: `Bava Metzia ${parsed.page}${parsed.side}` };
}

export default async function StudyDafPage({ params }: Props) {
  const { daf } = await params;
  if (!parseDafId(daf)) notFound();

  let text;
  try {
    text = await fetchDafText(daf);
  } catch {
    notFound();
  }

  const prev = adjacentDaf(daf, -1);
  const next = adjacentDaf(daf, 1);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/study"
          className="text-sm font-semibold text-forest-700 no-underline hover:underline"
        >
          ← All dapim
        </Link>
        <div className="flex gap-2">
          {prev && (
            <Link href={`/study/${prev.id}`} className="btn-ghost !py-2 text-sm">
              {prev.id}
            </Link>
          )}
          {next && (
            <Link href={`/study/${next.id}`} className="btn-ghost !py-2 text-sm">
              {next.id}
            </Link>
          )}
        </div>
      </div>
      <StudyWorkspace text={text} />
    </div>
  );
}
