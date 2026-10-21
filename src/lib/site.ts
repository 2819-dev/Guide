/**
 * Dual surface from one repo / one Pages deploy:
 *   NEXT_PUBLIC_SITE=guide  → school platform at / (default)
 *   NEXT_PUBLIC_SITE=amud   → dedicated Amud host at / (optional)
 *
 * On Guide, the public Amud site is also mounted at /amudsite
 * (https://guidelearning.org/amudsite). Classroom installs stay at /apps/amud.
 */

export type SiteId = "guide" | "amud";

/** Path prefix for the public Amud site on the Guide host. */
export const AMUD_SITE_PATH = "/amudsite";

export function getSiteId(): SiteId {
  return process.env.NEXT_PUBLIC_SITE === "amud" ? "amud" : "guide";
}

export function isAmudSite(): boolean {
  return getSiteId() === "amud";
}

export function isGuideSite(): boolean {
  return getSiteId() === "guide";
}

/** True when the request path is the public Amud mount on Guide. */
export function isAmudPublicPath(pathname: string): boolean {
  return (
    pathname === AMUD_SITE_PATH ||
    pathname.startsWith(`${AMUD_SITE_PATH}/`)
  );
}

/**
 * Base path for the public Amud chrome (home).
 * Dedicated Amud deploy → ""; Guide deploy → "/amudsite".
 */
export function publicAmudHomePath(): string {
  return isAmudSite() ? "/" : AMUD_SITE_PATH;
}

/**
 * Learn index base for the public Amud site.
 * Dedicated Amud deploy → "/learn"; Guide deploy → "/amudsite/learn".
 */
export function publicAmudLearnBase(): string {
  return isAmudSite() ? "/learn" : `${AMUD_SITE_PATH}/learn`;
}

/** Guide school platform URL (canonical: https://guidelearning.org on Cloudflare Pages). */
export function guidePublicUrl(): string {
  const raw = process.env.NEXT_PUBLIC_GUIDE_URL?.replace(/\/$/, "") ?? "";
  return raw || "https://guidelearning.org";
}

/**
 * Public Amud URL. Prefer NEXT_PUBLIC_AMUD_URL; otherwise Guide host + /amudsite.
 */
export function amudPublicUrl(): string {
  const raw = process.env.NEXT_PUBLIC_AMUD_URL?.replace(/\/$/, "") ?? "";
  if (raw) return raw;
  return `${guidePublicUrl()}${AMUD_SITE_PATH}`;
}
