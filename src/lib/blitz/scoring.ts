import {
  BLITZ_SCORED_TYPES,
  type BlitzGameMode,
  type LiveAnswerPayload,
  type BlitzQuestion,
} from "@/lib/blitz/types";

function normalizeText(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[~`!@#$%^&*(){}\[\];:"'<,>.?\/\\|_\-+=]+/g, "")
    .replace(/\s+/g, " ");
}

function dist(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

export function isScoredType(type: BlitzQuestion["type"]): boolean {
  return BLITZ_SCORED_TYPES.includes(type);
}

/** Whether the answer is correct (null = opinion / no grade). */
export function gradeAnswer(
  question: BlitzQuestion,
  payload: LiveAnswerPayload,
): boolean | null {
  switch (question.type) {
    case "poll":
    case "word_cloud":
    case "brainstorm":
    case "drop_pin":
    case "open_ended":
    case "scale":
    case "nps_scale":
      return null;
    case "quiz":
    case "true_false": {
      const correctIds = (question.choices ?? [])
        .filter((c) => c.correct)
        .map((c) => c.id)
        .sort();
      const picked = [...(payload.choiceIds ?? [])].sort();
      if (question.multiSelect || correctIds.length > 1) {
        return (
          correctIds.length === picked.length &&
          correctIds.every((id, i) => id === picked[i])
        );
      }
      return picked.length === 1 && picked[0] === correctIds[0];
    }
    case "type_answer": {
      const text = normalizeText(payload.text ?? "");
      if (!text) return false;
      return (question.acceptedAnswers ?? []).some(
        (a) => normalizeText(a) === text,
      );
    }
    case "puzzle": {
      const expected = question.correctOrder ?? [];
      const got = payload.order ?? [];
      return (
        expected.length === got.length &&
        expected.every((id, i) => id === got[i])
      );
    }
    case "slider": {
      if (typeof payload.number !== "number") return false;
      const target = question.sliderCorrect ?? 0;
      const tol = question.sliderTolerance ?? 0;
      return Math.abs(payload.number - target) <= tol;
    }
    case "pin_answer": {
      if (typeof payload.pinX !== "number" || typeof payload.pinY !== "number") {
        return false;
      }
      const r = question.pinRadius ?? 0.08;
      return (
        dist(
          payload.pinX,
          payload.pinY,
          question.pinX ?? 0.5,
          question.pinY ?? 0.5,
        ) <= r
      );
    }
    default:
      return false;
  }
}

/**
 * Points for one answer.
 *
 * - classic / team: base × time factor (linear 1 → 0.5 across the time limit)
 *   plus a streak bonus of 100 per streak step (2nd correct in a row = +100,
 *   capped at +500).
 * - accuracy: flat base points, no speed or streak bonus.
 *
 * `streakBefore` is the player's streak before this answer.
 */
export function awardPoints(
  question: BlitzQuestion,
  correct: boolean | null,
  responseMs: number,
  mode: BlitzGameMode = "classic",
  streakBefore = 0,
): { points: number; streakBonus: number } {
  if (correct !== true || !question.points) return { points: 0, streakBonus: 0 };
  if (mode === "accuracy") return { points: question.points, streakBonus: 0 };
  const limitMs = Math.max(1, question.timeLimitSec) * 1000;
  const clamped = Math.min(Math.max(responseMs, 0), limitMs);
  const factor = 1 - (clamped / limitMs) * 0.5;
  const base = Math.round(question.points * factor);
  const streakBonus = Math.min(500, Math.max(0, streakBefore) * 100);
  return { points: base + streakBonus, streakBonus };
}
