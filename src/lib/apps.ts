/**
 * Guide app catalog (Clever-like).
 *
 * Rename the first learning app in ONE place:
 *   FIRST_APP_NAME + FIRST_APP_SLUG
 * e.g. Amud / Limud / Bechina — URLs and wordmark follow the slug/name.
 */

export const FIRST_APP_NAME = "Chazarah";
export const FIRST_APP_SLUG = "chazarah";

export type GuideApp = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
};

export const APP_CATALOG: GuideApp[] = [
  {
    slug: FIRST_APP_SLUG,
    name: FIRST_APP_NAME,
    tagline: "Mishnayos and Gemara · Test Yourself",
    description:
      "Open a daf, read Hebrew and English, keep notes, and Test Yourself with questions from the page.",
  },
];

export function getApp(slug: string): GuideApp | undefined {
  return APP_CATALOG.find((a) => a.slug === slug);
}

export function getFirstApp(): GuideApp {
  return APP_CATALOG.find((a) => a.slug === FIRST_APP_SLUG) ?? APP_CATALOG[0]!;
}

export function isKnownAppSlug(slug: string): boolean {
  return APP_CATALOG.some((a) => a.slug === slug);
}

/** App home — e.g. /apps/chazarah */
export function appHomePath(slug: string = FIRST_APP_SLUG): string {
  return `/apps/${slug}`;
}

/** Learning paths inside the first app (Chazarah). */
export function studyPath(tractateSlug: string, dafId?: string): string {
  const base = appHomePath(FIRST_APP_SLUG);
  if (dafId) return `${base}/${tractateSlug}/${dafId}`;
  return `${base}/${tractateSlug}`;
}

export function studyIndexPath(): string {
  return appHomePath(FIRST_APP_SLUG);
}
