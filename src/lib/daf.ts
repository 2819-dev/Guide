import {
  getTractate,
  type Tractate,
} from "@/lib/tractates";

/** Daf / amud helpers — scoped to a tractate from the catalog. */

export type DafSide = "a" | "b";

export type DafRef = {
  tractateSlug: string;
  page: number;
  side: DafSide;
  /** e.g. "21a" */
  id: string;
  /** Sefaria path segment, e.g. "Bava_Metzia.21a" */
  sefariaRef: string;
  hebrewLabel: string;
  englishLabel: string;
  /** True when this amud is in the featured chapter (e.g. אלו מציאות) */
  isFeaturedChapter: boolean;
};

const HEBREW_NUMERALS: Record<number, string> = {
  1: "א",
  2: "ב",
  3: "ג",
  4: "ד",
  5: "ה",
  6: "ו",
  7: "ז",
  8: "ח",
  9: "ט",
  10: "י",
  11: "יא",
  12: "יב",
  13: "יג",
  14: "יד",
  15: "טו",
  16: "טז",
  17: "יז",
  18: "יח",
  19: "יט",
  20: "כ",
  30: "ל",
  40: "מ",
  50: "נ",
  60: "ס",
  70: "ע",
  80: "פ",
  90: "צ",
  100: "ק",
};

export function toHebrewNumeral(n: number): string {
  if (HEBREW_NUMERALS[n]) return HEBREW_NUMERALS[n];
  if (n > 100) {
    const hundreds = Math.floor(n / 100) * 100;
    const rest = n % 100;
    return (
      (HEBREW_NUMERALS[hundreds] ?? "") + (rest ? toHebrewNumeral(rest) : "")
    );
  }
  if (n > 20) {
    const tens = Math.floor(n / 10) * 10;
    const ones = n % 10;
    return (HEBREW_NUMERALS[tens] ?? "") + (ones ? HEBREW_NUMERALS[ones] : "");
  }
  return String(n);
}

export function parseDafId(
  id: string,
  tractate: Tractate,
): { page: number; side: DafSide } | null {
  const match = /^(\d{1,3})([ab])$/i.exec(id.trim());
  if (!match) return null;
  const page = Number(match[1]);
  const side = match[2].toLowerCase() as DafSide;
  if (page < tractate.firstPage || page > tractate.lastPage) return null;
  return { page, side };
}

function featuredStartPage(tractate: Tractate): number | null {
  const start = tractate.featuredChapter?.startDaf;
  if (!start) return null;
  const m = /^(\d+)/.exec(start);
  return m ? Number(m[1]) : null;
}

export function makeDaf(
  tractate: Tractate,
  page: number,
  side: DafSide,
): DafRef {
  const id = `${page}${side}`;
  const heNum = toHebrewNumeral(page);
  const heSide = side === "a" ? "ע״א" : "ע״ב";
  const featuredFrom = featuredStartPage(tractate);
  return {
    tractateSlug: tractate.slug,
    page,
    side,
    id,
    sefariaRef: `${tractate.sefariaBook}.${id}`,
    hebrewLabel: `${tractate.hebrewName} דף ${heNum} ${heSide}`,
    englishLabel: `${tractate.englishName} ${id}`,
    isFeaturedChapter:
      featuredFrom != null ? page >= featuredFrom : false,
  };
}

export function listDafim(tractate: Tractate): DafRef[] {
  const out: DafRef[] = [];
  for (let page = tractate.firstPage; page <= tractate.lastPage; page++) {
    out.push(makeDaf(tractate, page, "a"), makeDaf(tractate, page, "b"));
  }
  return out;
}

export function adjacentDaf(
  tractate: Tractate,
  id: string,
  dir: -1 | 1,
): DafRef | null {
  const parsed = parseDafId(id, tractate);
  if (!parsed) return null;
  const all = listDafim(tractate);
  const idx = all.findIndex((d) => d.id === `${parsed.page}${parsed.side}`);
  if (idx < 0) return null;
  return all[idx + dir] ?? null;
}

export function resolveTractateAndDaf(
  tractateSlug: string,
  dafId: string,
): { tractate: Tractate; daf: DafRef } | null {
  const tractate = getTractate(tractateSlug);
  if (!tractate?.available) return null;
  const parsed = parseDafId(dafId, tractate);
  if (!parsed) return null;
  return {
    tractate,
    daf: makeDaf(tractate, parsed.page, parsed.side),
  };
}
