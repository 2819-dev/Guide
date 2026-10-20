/** Client-safe quiz kind labels (no Node crypto). */

export type QuizKind =
  | "translation"
  | "comprehension"
  | "key_term"
  | "attribution"
  | "notes";

export const QUIZ_KIND_LABEL: Record<QuizKind, string> = {
  translation: "Translation",
  comprehension: "Comprehension",
  key_term: "Key term",
  attribution: "Who says what",
  notes: "Your notes",
};
