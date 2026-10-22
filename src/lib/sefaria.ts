import { adjacentDaf, resolveTractateAndDaf, type DafRef } from "./daf";
import { getFeaturedTractate } from "./tractates";

export type DafText = {
  daf: DafRef;
  heRef: string;
  hebrew: string[];
  english: string[];
  next?: string | null;
  prev?: string | null;
};

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function asLines(value: unknown): string[] {
  if (!value) return [];
  if (typeof value === "string") {
    const cleaned = stripHtml(value);
    return cleaned ? [cleaned] : [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => asLines(item)).filter(Boolean);
  }
  return [];
}

export async function fetchDafText(
  dafId: string,
  tractateSlug: string = getFeaturedTractate().slug,
): Promise<DafText> {
  const resolved = resolveTractateAndDaf(tractateSlug, dafId);
  if (!resolved) {
    throw new Error(`Invalid daf: ${tractateSlug}/${dafId}`);
  }
  const { tractate, daf } = resolved;
  const url = `https://www.sefaria.org/api/texts/${daf.sefariaRef}?commentary=0&context=0&pad=0`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 86400 },
  });
  if (!res.ok) {
    throw new Error(`Sefaria returned ${res.status} for ${daf.sefariaRef}`);
  }
  const data = (await res.json()) as {
    heRef?: string;
    he?: unknown;
    text?: unknown;
    next?: string | null;
    prev?: string | null;
  };

  const prev = adjacentDaf(tractate, daf.id, -1);
  const next = adjacentDaf(tractate, daf.id, 1);

  return {
    daf,
    heRef: data.heRef ?? daf.hebrewLabel,
    hebrew: asLines(data.he),
    english: asLines(data.text),
    next: next?.id ?? data.next ?? null,
    prev: prev?.id ?? data.prev ?? null,
  };
}
