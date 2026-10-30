/**
 * Guide banner art — **invite / email only**.
 * Do not use on homepage, portals, auth, Amud, apps, or other product surfaces.
 *
 * Canonical store copy: /cursor/stores/self/media/brand/guide-banner.jpg
 * App static path for invite HTML + transactional email:
 */
export const GUIDE_BANNER_SRC = "/brand/guide-banner.jpg" as const;

/** Intrinsic pixel size of guide-banner.jpg */
export const GUIDE_BANNER_WIDTH = 1200;
export const GUIDE_BANNER_HEIGHT = 434;

/** Invite letter keeps a local copy for paste/offline HTML parity */
export const INVITE_BANNER_SRC = "/invite/ohr-reuven/banner.jpg" as const;

/**
 * Homepage Clever cover — Official Release hero visual (right panel).
 * Locked user artwork — do not replace with a CSS-only panel.
 * Canonical: /cursor/stores/self/media/clever-cover/homepage-hero-official-release.png
 */
export const HOME_HERO_RELEASE_SRC =
  "/brand/homepage-hero-official-release.webp" as const;
export const HOME_HERO_RELEASE_FALLBACK_SRC =
  "/brand/homepage-hero-official-release.jpg" as const;
export const HOME_HERO_RELEASE_WIDTH = 1400;
export const HOME_HERO_RELEASE_HEIGHT = 1400;
export const HOME_HERO_RELEASE_DATE = "11.10.2026" as const;
