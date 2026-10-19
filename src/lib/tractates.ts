/**
 * Tractate catalog — add new masechtot here as content becomes available.
 * Study routes: /study → /study/[slug] → /study/[slug]/[daf]
 */

export type TractateKind = "talmud" | "mishnah";

export type Tractate = {
  slug: string;
  englishName: string;
  hebrewName: string;
  kind: TractateKind;
  sefariaBook: string;
  /** First daf page number (Talmud) or chapter (Mishnah later) */
  firstPage: number;
  lastPage: number;
  /** Featured chapter / sugya for the starter CTA */
  featuredChapter?: {
    hebrew: string;
    english: string;
    startDaf: string;
  };
  available: boolean;
  blurb: string;
};

export const TRACTATES: Tractate[] = [
  {
    slug: "bava-metzia",
    englishName: "Bava Metzia",
    hebrewName: "בבא מציעא",
    kind: "talmud",
    sefariaBook: "Bava_Metzia",
    firstPage: 2,
    lastPage: 119,
    featuredChapter: {
      hebrew: "אלו מציאות",
      english: "Eilu Metzios",
      startDaf: "21a",
    },
    available: true,
    blurb:
      "Available now — open any daf, including אלו מציאות from דף כ״א.",
  },
  {
    slug: "berakhot",
    englishName: "Berakhot",
    hebrewName: "ברכות",
    kind: "talmud",
    sefariaBook: "Berakhot",
    firstPage: 2,
    lastPage: 64,
    available: false,
    blurb: "Coming soon — Mishnayos and Gemara will open here.",
  },
  {
    slug: "shabbat",
    englishName: "Shabbat",
    hebrewName: "שבת",
    kind: "talmud",
    sefariaBook: "Shabbat",
    firstPage: 2,
    lastPage: 157,
    available: false,
    blurb: "Coming soon — join the waitlist by creating an account.",
  },
  {
    slug: "pirkei-avot",
    englishName: "Pirkei Avot",
    hebrewName: "פרקי אבות",
    kind: "mishnah",
    sefariaBook: "Pirkei_Avot",
    firstPage: 1,
    lastPage: 6,
    available: false,
    blurb: "Coming soon — Mishnah study with the same calm quiz flow.",
  },
];

export function getTractate(slug: string): Tractate | undefined {
  return TRACTATES.find((t) => t.slug === slug);
}

export function getAvailableTractates(): Tractate[] {
  return TRACTATES.filter((t) => t.available);
}

export function getFeaturedTractate(): Tractate {
  return (
    getAvailableTractates()[0] ??
    TRACTATES.find((t) => t.slug === "bava-metzia")!
  );
}

export function studyPath(tractateSlug: string, dafId?: string): string {
  if (dafId) return `/study/${tractateSlug}/${dafId}`;
  return `/study/${tractateSlug}`;
}
