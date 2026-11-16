/**
 * Blitz plan caps — Kahoot-like, slightly looser.
 * Tune numbers here only; entitlements read from this config.
 */

export type BlitzPlanId = "free" | "plus" | "ultra";

export type BlitzPlan = {
  id: BlitzPlanId;
  label: string;
  /** Live games a host may start per calendar month. -1 = unlimited */
  liveGamesPerMonth: number;
  /** Max players in one live game (including late join before start). */
  maxPlayersPerGame: number;
  /** Max questions per quiz. */
  maxQuestionsPerQuiz: number;
  /** Placeholder lobby/play music. */
  music: boolean;
  /** CSV/JSON report export. */
  reportsExport: boolean;
  /** Show Free-plan watermark on host projector. */
  watermark: boolean;
  /** Advanced reports (per-question breakdown, accuracy %). */
  advancedReports: boolean;
  /**
   * Question types allowed when creating/editing.
   * "all" = every Kahoot live type; otherwise an allow-list.
   */
  questionTypes: "all" | "core";
};

export const BLITZ_PLANS: Record<BlitzPlanId, BlitzPlan> = {
  free: {
    id: "free",
    label: "Free",
    liveGamesPerMonth: 12, // Kahoot free is tighter; we loosen slightly
    maxPlayersPerGame: 40, // Kahoot free ~10–20 historically; looser
    maxQuestionsPerQuiz: 40,
    music: false,
    reportsExport: false,
    watermark: true,
    advancedReports: false,
    questionTypes: "core", // quiz + true/false
  },
  plus: {
    id: "plus",
    label: "Plus",
    liveGamesPerMonth: 120,
    maxPlayersPerGame: 120,
    maxQuestionsPerQuiz: 80,
    music: true,
    reportsExport: true,
    watermark: false,
    advancedReports: true,
    questionTypes: "all",
  },
  ultra: {
    id: "ultra",
    label: "Ultra",
    liveGamesPerMonth: -1,
    maxPlayersPerGame: 500,
    maxQuestionsPerQuiz: 200,
    music: true,
    reportsExport: true,
    watermark: false,
    advancedReports: true,
    questionTypes: "all",
  },
};

/** Default plan for teachers with no subscription, grant, or promo. */
export const DEFAULT_BLITZ_PLAN: BlitzPlanId = "free";

export const BLITZ_PLAN_IDS: BlitzPlanId[] = ["free", "plus", "ultra"];
export const BLITZ_PAID_PLAN_IDS = ["plus", "ultra"] as const;
export type BlitzPaidPlanId = (typeof BLITZ_PAID_PLAN_IDS)[number];
export type BlitzBillingInterval = "month" | "year";

/** Higher wins when several sources (subscription, grant, promo) apply. */
export const BLITZ_PLAN_RANK: Record<BlitzPlanId, number> = {
  free: 0,
  plus: 1,
  ultra: 2,
};

export function isBlitzPlanId(v: unknown): v is BlitzPlanId {
  return typeof v === "string" && v in BLITZ_PLANS;
}

export function isPaidPlanId(v: unknown): v is BlitzPaidPlanId {
  return v === "plus" || v === "ultra";
}

/**
 * Display-only pricing and copy for the upgrade page. The amount actually
 * charged is the Stripe Price (STRIPE_PRICE_* env vars) — keep these equal
 * to what you configure in the Stripe dashboard.
 */
export const BLITZ_PLAN_DISPLAY: Record<
  BlitzPlanId,
  {
    tagline: string;
    /** USD per month when billed monthly (0 = free). */
    monthlyUsd: number;
    /** USD per year when billed yearly (0 = free). */
    yearlyUsd: number;
    highlights: string[];
  }
> = {
  free: {
    tagline: "Everything you need to try Blitz with a class.",
    monthlyUsd: 0,
    yearlyUsd: 0,
    highlights: ["Quiz and true/false questions", "Live results on the projector"],
  },
  plus: {
    tagline: "For teachers who run Blitz every week.",
    monthlyUsd: 7.99,
    yearlyUsd: 69,
    highlights: [
      "Every question type",
      "Lobby music",
      "Advanced reports + CSV export",
      "No watermark",
    ],
  },
  ultra: {
    tagline: "Unlimited games for big classes and assemblies.",
    monthlyUsd: 14.99,
    yearlyUsd: 129,
    highlights: [
      "Unlimited live games",
      "Up to 500 players",
      "Everything in Plus",
    ],
  },
};

export function getPlan(id: BlitzPlanId | string | null | undefined): BlitzPlan {
  if (id && id in BLITZ_PLANS) {
    return BLITZ_PLANS[id as BlitzPlanId];
  }
  return BLITZ_PLANS[DEFAULT_BLITZ_PLAN];
}
