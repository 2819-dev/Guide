/**
 * Guide school app catalog (Clever-like).
 *
 * First learning app name/slug — change only here (and next.config redirects).
 */

import { isAmudSite } from "@/lib/site";

export const FIRST_APP_NAME = "Amud";
export const FIRST_APP_SLUG = "amud";

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
      "Open a daf, read Hebrew and English, keep notes, and Test Yourself with questions from the page. Available to everyone on the Amud site; schools can also add it in Guide.",
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

/** In-Guide school app path — e.g. /apps/amud */
export function appHomePath(slug: string = FIRST_APP_SLUG): string {
  return `/apps/${slug}`;
}

/**
 * Learning paths:
 * - Amud site → /learn/...
 * - Guide site → /apps/amud/...
 */
export function studyPath(tractateSlug: string, dafId?: string): string {
  const base = isAmudSite() ? "/learn" : appHomePath(FIRST_APP_SLUG);
  if (dafId) return `${base}/${tractateSlug}/${dafId}`;
  return `${base}/${tractateSlug}`;
}

export function studyIndexPath(): string {
  return isAmudSite() ? "/learn" : appHomePath(FIRST_APP_SLUG);
}
