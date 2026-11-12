import {
  TESTQUIZ_SCORED_TYPES,
  type LiveAnswerPayload,
  type TestQuizQuestion,
} from "@/lib/testquiz/types";

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

export function isScoredType(type: TestQuizQuestion["type"]): boolean {
  return TESTQUIZ_SCORED_TYPES.includes(type);
}

/** Whether the answer is correct (null = opinion / no grade). */
export function gradeAnswer(
  question: TestQuizQuestion,
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
 * Kahoot-style points: base × time factor (linear from 1 → 0.5 over the limit).
 */
export function awardPoints(
  question: TestQuizQuestion,
  correct: boolean | null,
  responseMs: number,
): number {
  if (correct !== true || !question.points) return 0;
  const limitMs = Math.max(1, question.timeLimitSec) * 1000;
  const clamped = Math.min(Math.max(responseMs, 0), limitMs);
  const factor = 1 - (clamped / limitMs) * 0.5;
  return Math.round(question.points * factor);
}
