/** Bava Metzia spans dapim 2a–119b. אלו מציאות (Eilu Metzios) opens at 21a. */

export type DafSide = "a" | "b";

export type DafRef = {
  page: number;
  side: DafSide;
  /** e.g. "21a" */
  id: string;
  /** Sefaria path segment, e.g. "Bava_Metzia.21a" */
  sefariaRef: string;
  hebrewLabel: string;
  englishLabel: string;
  isEiluMetzios: boolean;
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

export const BAVA_METZIA_FIRST = 2;
export const BAVA_METZIA_LAST = 119;
/** Chapter אלו מציאות begins here */
export const EILU_METZIOS_START = 21;

export function parseDafId(id: string): { page: number; side: DafSide } | null {
  const match = /^(\d{1,3})([ab])$/i.exec(id.trim());
  if (!match) return null;
  const page = Number(match[1]);
  const side = match[2].toLowerCase() as DafSide;
  if (page < BAVA_METZIA_FIRST || page > BAVA_METZIA_LAST) return null;
  return { page, side };
}

export function makeDaf(page: number, side: DafSide): DafRef {
  const id = `${page}${side}`;
  const heNum = toHebrewNumeral(page);
  const heSide = side === "a" ? "ע״א" : "ע״ב";
  return {
    page,
    side,
    id,
    sefariaRef: `Bava_Metzia.${id}`,
    hebrewLabel: `בבא מציעא דף ${heNum} ${heSide}`,
    englishLabel: `Bava Metzia ${id}`,
    isEiluMetzios: page >= EILU_METZIOS_START,
  };
}

export function listAllDafim(): DafRef[] {
  const out: DafRef[] = [];
  for (let page = BAVA_METZIA_FIRST; page <= BAVA_METZIA_LAST; page++) {
    out.push(makeDaf(page, "a"), makeDaf(page, "b"));
  }
  return out;
}

export function adjacentDaf(id: string, dir: -1 | 1): DafRef | null {
  const parsed = parseDafId(id);
  if (!parsed) return null;
  const all = listAllDafim();
  const idx = all.findIndex((d) => d.id === `${parsed.page}${parsed.side}`);
  if (idx < 0) return null;
  return all[idx + dir] ?? null;
}
