import type { BlitzQuestion } from "@/lib/blitz/types";

/** Stricter check before a quiz can be played (drafts may be incomplete). */
export function playabilityIssue(questions: BlitzQuestion[]): string | null {
  if (questions.length === 0) return "Add at least one question first.";
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]!;
    if (!q.prompt?.trim()) return `Question ${i + 1} needs a prompt.`;
    if (
      (q.type === "quiz" || q.type === "true_false") &&
      !(q.choices ?? []).some((c) => c.correct)
    ) {
      return `Question ${i + 1} needs a correct answer.`;
    }
    if (
      (q.type === "quiz" || q.type === "poll" || q.type === "puzzle") &&
      (q.choices ?? []).filter((c) => c.text.trim()).length < 2
    ) {
      return `Question ${i + 1} needs at least two answers.`;
    }
    if (
      q.type === "type_answer" &&
      !(q.acceptedAnswers ?? []).some((a) => a.trim())
    ) {
      return `Question ${i + 1} needs an accepted answer.`;
    }
  }
  return null;
}
