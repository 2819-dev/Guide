/**
 * Blitz game modes, themes and teams — plus the small plan-gating helper for
 * features plans.ts has no explicit cap for yet.
 *
 * GATING NOTE: plans.ts has no flags for team mode, self-paced challenges or
 * premium themes. Until it does, `hasPremiumPlay(plan)` treats every paid
 * plan (anything but "free") as allowed. Swap the helper for a plan flag
 * when one exists — every check goes through this file.
 */
import type { BlitzPlan } from "@/lib/blitz/plans";
import type {
  BlitzGameMode,
  BlitzTeam,
  BlitzThemeId,
  GameSettings,
} from "@/lib/blitz/types";

export function hasPremiumPlay(plan: Pick<BlitzPlan, "id">): boolean {
  return plan.id !== "free";
}

export type BlitzModeInfo = {
  id: BlitzGameMode;
  label: string;
  tagline: string;
  premium: boolean;
};

export const BLITZ_MODES: BlitzModeInfo[] = [
  {
    id: "classic",
    label: "Classic",
    tagline: "Faster correct answers score more. Includes streaks.",
    premium: false,
  },
  {
    id: "accuracy",
    label: "Accuracy",
    tagline: "No time pressure. Every correct answer scores the same.",
    premium: false,
  },
  {
    id: "team",
    label: "Team battle",
    tagline: "Players are split into balanced teams. Highest team average wins.",
    premium: true,
  },
];

/** Self-paced challenge is not a live mode but shares the same gate. */
export const CHALLENGE_PREMIUM = true;

export function modeAllowed(plan: Pick<BlitzPlan, "id">, mode: BlitzGameMode) {
  const info = BLITZ_MODES.find((m) => m.id === mode);
  if (!info) return false;
  return !info.premium || hasPremiumPlay(plan);
}

export function challengesAllowed(plan: Pick<BlitzPlan, "id">) {
  return !CHALLENGE_PREMIUM || hasPremiumPlay(plan);
}

export function gameMode(settings: Pick<GameSettings, "mode">): BlitzGameMode {
  return settings.mode ?? "classic";
}

/* ---------------------------------------------------------------- themes */

export type BlitzThemeInfo = {
  id: BlitzThemeId;
  label: string;
  blurb: string;
  premium: boolean;
  /** Three swatches for the picker card (stage top, stage bottom, accent). */
  swatch: [string, string, string];
};

export const BLITZ_THEMES: BlitzThemeInfo[] = [
  {
    id: "night",
    label: "Night",
    blurb: "Deep indigo with neon accents",
    premium: false,
    swatch: ["#15123b", "#2a1d6e", "#b6f03a"],
  },
  {
    id: "arcade",
    label: "Arcade",
    blurb: "Pixel grid with bright magenta",
    premium: false,
    swatch: ["#1a0b2e", "#3b0d4f", "#ff4fd8"],
  },
  {
    id: "ocean",
    label: "Ocean",
    blurb: "Deep teal with wave lines",
    premium: true,
    swatch: ["#04223a", "#08506b", "#22d3ee"],
  },
  {
    id: "sunset",
    label: "Sunset",
    blurb: "Plum to warm orange",
    premium: true,
    swatch: ["#2b0f3a", "#7a2045", "#ffc93c"],
  },
  {
    id: "space",
    label: "Space",
    blurb: "Starfield with planet rings",
    premium: true,
    swatch: ["#05061a", "#13163f", "#9ae6ff"],
  },
];

export function themeAllowed(plan: Pick<BlitzPlan, "id">, theme: BlitzThemeId) {
  const info = BLITZ_THEMES.find((t) => t.id === theme);
  if (!info) return false;
  return !info.premium || hasPremiumPlay(plan);
}

export function isThemeId(v: unknown): v is BlitzThemeId {
  return BLITZ_THEMES.some((t) => t.id === v);
}

export function gameTheme(settings: Pick<GameSettings, "theme">): BlitzThemeId {
  return settings.theme && isThemeId(settings.theme) ? settings.theme : "night";
}

/* ---------------------------------------------------------------- teams */

const TEAM_PRESETS: BlitzTeam[] = [
  { id: "volt", name: "Team Volt", color: "#b6f03a" },
  { id: "ember", name: "Team Ember", color: "#ff5a5f" },
  { id: "tide", name: "Team Tide", color: "#22d3ee" },
  { id: "flare", name: "Team Flare", color: "#ffc93c" },
];

export function makeTeams(count: number): BlitzTeam[] {
  const n = Math.min(4, Math.max(2, Math.round(count)));
  return TEAM_PRESETS.slice(0, n).map((t) => ({ ...t }));
}

/** Team with the fewest active members (ties → first). */
export function smallestTeam(
  teams: BlitzTeam[],
  players: { teamId?: string | null; kicked: boolean }[],
): BlitzTeam | null {
  let best: BlitzTeam | null = null;
  let bestCount = Infinity;
  for (const t of teams) {
    const c = players.filter((p) => !p.kicked && p.teamId === t.id).length;
    if (c < bestCount) {
      best = t;
      bestCount = c;
    }
  }
  return best;
}

export type TeamStanding = BlitzTeam & {
  members: number;
  total: number;
  /** Average score per member — the number that ranks teams. */
  average: number;
};

export function teamStandings(
  teams: BlitzTeam[] | undefined,
  players: { teamId?: string | null; kicked: boolean; score: number }[],
): TeamStanding[] {
  if (!teams?.length) return [];
  return teams
    .map((t) => {
      const ms = players.filter((p) => !p.kicked && p.teamId === t.id);
      const total = ms.reduce((s, p) => s + p.score, 0);
      return {
        ...t,
        members: ms.length,
        total,
        average: ms.length ? Math.round(total / ms.length) : 0,
      };
    })
    .sort((a, b) => b.average - a.average || b.total - a.total);
}
