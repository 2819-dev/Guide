import { makeDaf, parseDafId, type DafRef } from "./daf";

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

export async function fetchDafText(dafId: string): Promise<DafText> {
  const parsed = parseDafId(dafId);
  if (!parsed) {
    throw new Error(`Invalid daf: ${dafId}`);
  }
  const daf = makeDaf(parsed.page, parsed.side);
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

  return {
    daf,
    heRef: data.heRef ?? daf.hebrewLabel,
    hebrew: asLines(data.he),
    english: asLines(data.text),
    next: data.next ?? null,
    prev: data.prev ?? null,
  };
}
