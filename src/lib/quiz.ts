import { randomUUID } from "crypto";
import type { QuizQuestionRecord } from "./schema";

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickDistinct<T>(items: T[], count: number, prefer?: T): T[] {
  const pool = shuffle(items);
  const out: T[] = [];
  if (prefer !== undefined && items.includes(prefer)) {
    out.push(prefer);
  }
  for (const item of pool) {
    if (out.length >= count) break;
    if (!out.includes(item)) out.push(item);
  }
  return out;
}

function meaningfulSentences(text: string, minLen = 40): string[] {
  return text
    .split(/(?<=[.?!;:])\s+|\n+/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => s.length >= minLen && /[A-Za-zא-ת]/.test(s))
    .slice(0, 40);
}

function extractKeyPhrase(sentence: string): string | null {
  const words = sentence
    .replace(/[^A-Za-zא-ת\s'-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4);
  if (words.length < 3) return null;
  const start = Math.min(2, words.length - 3);
  return words.slice(start, start + 3).join(" ");
}

function fromPassage(
  lines: string[],
  source: QuizQuestionRecord["source"],
  limit: number,
): QuizQuestionRecord[] {
  const sentences = meaningfulSentences(lines.join(" "));
  if (sentences.length < 2) return [];

  const questions: QuizQuestionRecord[] = [];

  for (const sentence of shuffle(sentences)) {
    if (questions.length >= limit) break;
    const phrase = extractKeyPhrase(sentence);
    if (!phrase) continue;
    const blanked = sentence.replace(phrase, "______");
    if (blanked === sentence) continue;

    const distractors = shuffle(sentences)
      .map((s) => extractKeyPhrase(s))
      .filter((p): p is string => Boolean(p) && p !== phrase)
      .slice(0, 3);

    if (distractors.length < 2) continue;

    const choices = shuffle([phrase, ...distractors.slice(0, 3)]);
    const correctIndex = choices.indexOf(phrase);

    questions.push({
      id: randomUUID(),
      prompt: `Complete this idea from the passage:\n“${blanked}”`,
      choices,
      correctIndex,
      explanation: `The passage says: “${sentence}”`,
      source,
    });
  }

  // True / false from remaining sentences
  for (const sentence of shuffle(sentences)) {
    if (questions.length >= limit) break;
    const isTrue = Math.random() > 0.35;
    let promptSentence = sentence;
    let explanation = `The text supports: “${sentence}”`;

    if (!isTrue) {
      const other = sentences.find((s) => s !== sentence);
      if (!other) continue;
      // Swap a mid phrase to create a false claim
      const a = extractKeyPhrase(sentence);
      const b = extractKeyPhrase(other);
      if (!a || !b || a === b) continue;
      promptSentence = sentence.replace(a, b);
      explanation = `That wording is not in the text. The source says: “${sentence}”`;
    }

    questions.push({
      id: randomUUID(),
      prompt: `According to this daf / notes, is the following accurate?\n“${promptSentence}”`,
      choices: ["True", "False"],
      correctIndex: isTrue ? 0 : 1,
      explanation,
      source,
    });
  }

  // Which line belongs on this page
  if (sentences.length >= 4 && questions.length < limit) {
    const correct = sentences[0];
    const decoys = pickDistinct(sentences.slice(1), 3);
    if (decoys.length === 3) {
      const choices = shuffle([correct, ...decoys]);
      questions.push({
        id: randomUUID(),
        prompt: "Which statement appears on this page / in these notes?",
        choices,
        correctIndex: choices.indexOf(correct),
        explanation: `Found in the source: “${correct}”`,
        source,
      });
    }
  }

  return questions.slice(0, limit);
}

function notesBulletQuestions(
  notes: string,
  limit: number,
): QuizQuestionRecord[] {
  const bullets = notes
    .split(/\n+/)
    .map((l) => l.replace(/^[-*•\d.)\s]+/, "").trim())
    .filter((l) => l.length >= 20);

  if (bullets.length < 2) return [];

  const questions: QuizQuestionRecord[] = [];
  for (const bullet of shuffle(bullets)) {
    if (questions.length >= limit) break;
    const decoys = pickDistinct(
      bullets.filter((b) => b !== bullet),
      3,
    );
    if (decoys.length < 2) continue;
    const choices = shuffle([bullet, ...decoys.slice(0, 3)]);
    questions.push({
      id: randomUUID(),
      prompt: "Which point did you write in your study notes?",
      choices,
      correctIndex: choices.indexOf(bullet),
      explanation: `From your notes: “${bullet}”`,
      source: "notes",
    });
  }
  return questions;
}

export function buildQuiz(options: {
  dafEnglish: string[];
  notesContent?: string | null;
  mode: "daf" | "notes" | "mixed";
  count?: number;
}): QuizQuestionRecord[] {
  const count = options.count ?? 6;
  const mode = options.mode;

  if (mode === "notes") {
    const fromNotes = [
      ...notesBulletQuestions(options.notesContent ?? "", count),
      ...fromPassage([options.notesContent ?? ""], "notes", count),
    ];
    return shuffle(fromNotes).slice(0, count);
  }

  if (mode === "mixed") {
    const dafQs = fromPassage(options.dafEnglish, "daf", Math.ceil(count / 2));
    const noteQs = [
      ...notesBulletQuestions(options.notesContent ?? "", Math.ceil(count / 2)),
      ...fromPassage(
        [options.notesContent ?? ""],
        "notes",
        Math.ceil(count / 2),
      ),
    ];
    return shuffle(
      [...dafQs, ...noteQs].map((q) => ({ ...q, source: "mixed" as const })),
    ).slice(0, count);
  }

  return shuffle(fromPassage(options.dafEnglish, "daf", count * 2)).slice(
    0,
    count,
  );
}

export function scoreAnswers(
  questions: QuizQuestionRecord[],
  answers: (number | null)[],
): number {
  let correct = 0;
  questions.forEach((q, i) => {
    if (answers[i] === q.correctIndex) correct += 1;
  });
  return questions.length
    ? Math.round((correct / questions.length) * 100)
    : 0;
}
