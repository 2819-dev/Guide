/**
 * TestQuiz plan caps — Kahoot-like, slightly looser.
 * Tune numbers here only; entitlements read from this config.
 */

export type TestQuizPlanId = "free" | "plus" | "ultra";

export type TestQuizPlan = {
  id: TestQuizPlanId;
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

export const TESTQUIZ_PLANS: Record<TestQuizPlanId, TestQuizPlan> = {
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

/** Default plan for new teacher entitlements (stub until billing). */
export const DEFAULT_TESTQUIZ_PLAN: TestQuizPlanId = "free";

export function getPlan(id: TestQuizPlanId | string | null | undefined): TestQuizPlan {
  if (id && id in TESTQUIZ_PLANS) {
    return TESTQUIZ_PLANS[id as TestQuizPlanId];
  }
  return TESTQUIZ_PLANS[DEFAULT_TESTQUIZ_PLAN];
}
