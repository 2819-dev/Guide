/**
 * Guide school app catalog (Clever-like).
 *
 * First learning app name/slug — change only here (and next.config redirects).
 */

import {
  arcadePublicUrl,
  isAmudSite,
  publicAmudLearnBase,
} from "@/lib/site";

export const FIRST_APP_NAME = "Amud";
export const FIRST_APP_SLUG = "amud";

/** Classroom game center — product lives on Arcade subdomain, not Guide path. */
export const ARCADE_APP_SLUG = "arcade-education";
export const ARCADE_APP_NAME = "Arcade Education";

export type GuideApp = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  /**
   * Absolute product home when the app is hosted off Guide (e.g. Arcade subdomain).
   * When set, My apps / Open use the launch bridge (or this URL), not `/apps/{slug}` as home.
   */
  launchUrl?: string;
};

export const APP_CATALOG: GuideApp[] = [
  {
    slug: FIRST_APP_SLUG,
    name: FIRST_APP_NAME,
    tagline: "Mishnayos and Gemara · Test Yourself",
    description:
      "Open a daf, read Hebrew and English, keep notes, and Test Yourself with questions from the page. Available to everyone on the Amud site; schools can also add it in Guide.",
  },
  {
    slug: ARCADE_APP_SLUG,
    name: ARCADE_APP_NAME,
    tagline: "Classroom games for every school",
    description:
      "A school game center teachers add to a class. Students open Arcade from My apps and play classroom games on the Arcade Education site.",
    launchUrl: arcadePublicUrl(),
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

/** True when the app opens on an external host (not Guide `/apps/{slug}`). */
export function isExternalLaunchApp(app: GuideApp): boolean {
  return Boolean(app.launchUrl);
}

/** In-Guide school app path — e.g. /apps/amud */
export function appHomePath(slug: string = FIRST_APP_SLUG): string {
  return `/apps/${slug}`;
}

/**
 * Href for My apps / teacher Open.
 * External apps (Arcade) go through the Guide launch bridge so a token can be minted.
 * Same-origin apps keep `/apps/{slug}`.
 */
export function appOpenHref(app: GuideApp): string {
  if (app.launchUrl) {
    return `/api/apps/launch?slug=${encodeURIComponent(app.slug)}`;
  }
  return appHomePath(app.slug);
}

/**
 * Canonical product URL for an app (absolute when external).
 */
export function appProductUrl(app: GuideApp): string {
  if (app.launchUrl) return app.launchUrl;
  return appHomePath(app.slug);
}

/**
 * Default learning base for the current site mode:
 * - Dedicated Amud deploy → /learn
 * - Guide deploy (classroom) → /apps/amud
 *
 * Pass `learnBase` explicitly for the public /amudsite mount.
 */
export function defaultLearnBase(): string {
  return isAmudSite() ? "/learn" : appHomePath(FIRST_APP_SLUG);
}

/**
 * Learning paths. Optional `learnBase` overrides (use publicAmudLearnBase()
 * under /amudsite).
 */
export function studyPath(
  tractateSlug: string,
  dafId?: string,
  learnBase?: string,
): string {
  const base = learnBase ?? defaultLearnBase();
  if (dafId) return `${base}/${tractateSlug}/${dafId}`;
  return `${base}/${tractateSlug}`;
}

export function studyIndexPath(learnBase?: string): string {
  return learnBase ?? defaultLearnBase();
}

/** Public Amud study helpers ( /learn or /amudsite/learn ). */
export function publicStudyPath(tractateSlug: string, dafId?: string): string {
  return studyPath(tractateSlug, dafId, publicAmudLearnBase());
}

export function publicStudyIndexPath(): string {
  return publicAmudLearnBase();
}
