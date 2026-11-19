/** Guide app catalog: every app schools can add to a class. */

import { arcadePublicUrl } from "@/lib/site";

/** Classroom game center — product lives on Arcade subdomain, not Guide path. */
export const ARCADE_APP_SLUG = "arcade-education";
export const ARCADE_APP_NAME = "Arcade Education";

/** Live classroom quizzes, hosted in Guide at /apps/blitz. */
export const BLITZ_APP_SLUG = "blitz";
export const BLITZ_APP_NAME = "Blitz";

export type AppAvailability = "available" | "temporarily_unavailable";

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
  /** Default available. Temporarily unavailable apps stay listed but are not openable. */
  availability?: AppAvailability;
  /**
   * Short facts Guide Assistant (live chat) may share about this app. Each app
   * carries its own notes, so the assistant learns new apps from the catalog.
   */
  helpNotes?: string;
};

export const APP_UNAVAILABLE_LABEL = "Coming soon";

export const APP_UNAVAILABLE_DETAIL =
  "Teachers will be able to add this app to a class when it launches.";

/** Catalog with available apps first, "Coming soon" apps last. */
export function sortAppsAvailableFirst<T extends GuideApp>(apps: T[]): T[] {
  return [...apps].sort(
    (a, b) => Number(isAppAvailable(b)) - Number(isAppAvailable(a)),
  );
}

export const APP_CATALOG: GuideApp[] = [
  {
    slug: ARCADE_APP_SLUG,
    name: ARCADE_APP_NAME,
    tagline: "Learning games for the classroom",
    description:
      "A collection of learning games teachers add to a class. Students open it from My apps.",
    launchUrl: arcadePublicUrl(),
    availability: "temporarily_unavailable",
  },
  {
    slug: BLITZ_APP_SLUG,
    name: BLITZ_APP_NAME,
    tagline: "Live classroom quizzes",
    description:
      "Teachers host live quizzes and polls on a shared screen. Students join with a game PIN from their own device after logging in to Guide.",
    helpNotes:
      "Teachers create a quiz or start from a template, then host it on the classroom screen; students join with the game PIN. Also offers self-paced challenges, team play, and several question types. Plans: Free, Plus, and Ultra; paid checkout is coming soon, and promo codes from Guide can unlock a plan now.",
  },
];

export function getApp(slug: string): GuideApp | undefined {
  return APP_CATALOG.find((a) => a.slug === slug);
}

export function isKnownAppSlug(slug: string): boolean {
  return APP_CATALOG.some((a) => a.slug === slug);
}

export function isAppAvailable(app: GuideApp): boolean {
  return (app.availability ?? "available") === "available";
}

/** True when the app opens on an external host (not Guide `/apps/{slug}`). */
export function isExternalLaunchApp(app: GuideApp): boolean {
  return Boolean(app.launchUrl);
}

/** In-Guide school app path, e.g. /apps/blitz */
export function appHomePath(slug: string): string {
  return `/apps/${slug}`;
}

/**
 * Href for My apps / teacher Open.
 * Unavailable apps return null (UI shows status instead of a link).
 * External apps (Arcade) go through the Guide launch bridge so a token can be minted.
 * Same-origin apps keep `/apps/{slug}`.
 */
export function appOpenHref(app: GuideApp): string | null {
  if (!isAppAvailable(app)) return null;
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
