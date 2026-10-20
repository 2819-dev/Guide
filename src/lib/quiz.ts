import { randomUUID } from "crypto";
import type { QuizQuestionRecord } from "./schema";
import type { QuizKind } from "./quiz-kinds";

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickDistinct<T>(items: T[], count: number): T[] {
  return shuffle(items).slice(0, count);
}

function clean(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function stripForCompare(s: string): string {
  return clean(s)
    .replace(/[״"']/g, "")
    .toLowerCase();
}

function isHebrewHeavy(s: string): boolean {
  const he = (s.match(/[\u0590-\u05FF]/g) ?? []).length;
  const la = (s.match(/[A-Za-z]/g) ?? []).length;
  return he >= 8 && he > la;
}

function isEnglishHeavy(s: string): boolean {
  const la = (s.match(/[A-Za-z]/g) ?? []).length;
  return la >= 24;
}

function meaningfulEnglish(lines: string[], minLen = 45): string[] {
  return lines
    .map(clean)
    .filter((s) => isEnglishHeavy(s) && s.length >= minLen)
    .slice(0, 60);
}

function meaningfulHebrew(lines: string[], minLen = 12): string[] {
  return lines
    .map(clean)
    .filter((s) => isHebrewHeavy(s) && s.length >= minLen)
    .slice(0, 60);
}

/** Pair EN/HE segments by index when both sides look usable */
function pairedSegments(
  hebrew: string[],
  english: string[],
): { he: string; en: string }[] {
  const n = Math.min(hebrew.length, english.length);
  const pairs: { he: string; en: string }[] = [];
  for (let i = 0; i < n; i++) {
    const he = clean(hebrew[i] ?? "");
    const en = clean(english[i] ?? "");
    if (!isHebrewHeavy(he) || !isEnglishHeavy(en)) continue;
    if (he.length < 12 || en.length < 40) continue;
    pairs.push({ he, en });
  }
  return pairs;
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

const ATTRIBUTION_RE =
  /\b((?:Rav|Rabbi|R\.|Abaye|Rava|Shmuel|Ulla|Reish Lakish|Rabba|Rabbah|Mar)\s+[A-Z][\w'’-]*|(?:Abaye|Rava|Shmuel|Ulla|Reish Lakish))\b[^.]{0,80}?(?:says?|said|teaches?|asks?|answers?|objects?)/i;

function attributionFromLine(line: string): { who: string; claim: string } | null {
  const m = ATTRIBUTION_RE.exec(line);
  if (!m) return null;
  const who = m[1].replace(/^R\.\s*/, "R. ").trim();
  const claim = clean(line);
  if (claim.length < 40) return null;
  return { who, claim };
}

function q(
  partial: Omit<QuizQuestionRecord, "id"> & { kind: QuizKind },
): QuizQuestionRecord {
  return { id: randomUUID(), ...partial };
}

function translationQuestions(
  pairs: { he: string; en: string }[],
  limit: number,
): QuizQuestionRecord[] {
  if (pairs.length < 2) return [];
  const out: QuizQuestionRecord[] = [];

  for (const pair of shuffle(pairs)) {
    if (out.length >= limit) break;
    const decoys = pickDistinct(
      pairs.filter((p) => stripForCompare(p.en) !== stripForCompare(pair.en)),
      3,
    ).map((p) => p.en);
    if (decoys.length < 2) continue;

    const hePrompt =
      pair.he.length > 140 ? `${pair.he.slice(0, 137)}…` : pair.he;
    const choices = shuffle([pair.en, ...decoys.slice(0, 3)]);
    out.push(
      q({
        kind: "translation",
        prompt: `Translate this Hebrew into English:\n${hePrompt}`,
        choices,
        correctIndex: choices.indexOf(pair.en),
        explanation: `English rendering on this daf:\n“${pair.en}”`,
        source: "daf",
      }),
    );
  }

  // Reverse direction: English → Hebrew
  for (const pair of shuffle(pairs)) {
    if (out.length >= limit) break;
    const decoys = pickDistinct(
      pairs.filter((p) => stripForCompare(p.he) !== stripForCompare(pair.he)),
      3,
    ).map((p) => p.he);
    if (decoys.length < 2) continue;

    const enPrompt =
      pair.en.length > 160 ? `${pair.en.slice(0, 157)}…` : pair.en;
    const choices = shuffle([pair.he, ...decoys.slice(0, 3)]);
    out.push(
      q({
        kind: "translation",
        prompt: `Which Hebrew matches this English?\n“${enPrompt}”`,
        choices,
        correctIndex: choices.indexOf(pair.he),
        explanation: `Hebrew on this daf:\n${pair.he}`,
        source: "daf",
      }),
    );
  }

  return out;
}

function comprehensionQuestions(
  english: string[],
  limit: number,
): QuizQuestionRecord[] {
  const sentences = meaningfulEnglish(english);
  if (sentences.length < 3) return [];
  const out: QuizQuestionRecord[] = [];

  for (const sentence of shuffle(sentences)) {
    if (out.length >= limit) break;
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
    out.push(
      q({
        kind: "comprehension",
        prompt: `Complete this idea from the daf:\n“${blanked}”`,
        choices,
        correctIndex: choices.indexOf(phrase),
        explanation: `The daf says: “${sentence}”`,
        source: "daf",
      }),
    );
  }

  // True / false grounded in the page
  for (const sentence of shuffle(sentences)) {
    if (out.length >= limit) break;
    const isTrue = Math.random() > 0.4;
    let promptSentence = sentence;
    let explanation = `Supported by the daf: “${sentence}”`;

    if (!isTrue) {
      const other = sentences.find((s) => s !== sentence);
      if (!other) continue;
      const a = extractKeyPhrase(sentence);
      const b = extractKeyPhrase(other);
      if (!a || !b || a === b) continue;
      promptSentence = sentence.replace(a, b);
      explanation = `Not accurate. The daf says: “${sentence}”`;
    }

    out.push(
      q({
        kind: "comprehension",
        prompt: `According to this daf, is the following accurate?\n“${promptSentence}”`,
        choices: ["True", "False"],
        correctIndex: isTrue ? 0 : 1,
        explanation,
        source: "daf",
      }),
    );
  }

  // Which line appears on the page
  if (sentences.length >= 4 && out.length < limit) {
    const correct = sentences[0];
    const decoys = pickDistinct(sentences.slice(1), 3);
    if (decoys.length === 3) {
      const choices = shuffle([correct, ...decoys]);
      out.push(
        q({
          kind: "comprehension",
          prompt: "Which statement appears on this daf?",
          choices,
          correctIndex: choices.indexOf(correct),
          explanation: `Found on the page: “${correct}”`,
          source: "daf",
        }),
      );
    }
  }

  return out;
}

function keyTermQuestions(
  english: string[],
  limit: number,
): QuizQuestionRecord[] {
  const sentences = meaningfulEnglish(english, 50);
  if (sentences.length < 3) return [];
  const out: QuizQuestionRecord[] = [];

  for (const sentence of shuffle(sentences)) {
    if (out.length >= limit) break;
    const words = sentence
      .replace(/[^A-Za-z\s'-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 5);
    // Prefer capitalized / longer terms
    const candidates = words.filter(
      (w) =>
        /^[A-Z]/.test(w) ||
        w.length >= 7 ||
        /^(simpon|baraita|mishnah|gemara|halakha|tanna)/i.test(w),
    );
    const term = shuffle(candidates.length ? candidates : words)[0];
    if (!term) continue;

    const distractors = shuffle(sentences)
      .flatMap((s) =>
        s
          .replace(/[^A-Za-z\s'-]/g, " ")
          .split(/\s+/)
          .filter((w) => w.length >= 5 && w.toLowerCase() !== term.toLowerCase()),
      )
      .filter((w, i, arr) => arr.findIndex((x) => x.toLowerCase() === w.toLowerCase()) === i)
      .slice(0, 6);
    if (distractors.length < 2) continue;

    const cloze = sentence.replace(
      new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`),
      "______",
    );
    if (cloze === sentence) continue;

    const choices = shuffle([term, ...distractors.slice(0, 3)]);
    out.push(
      q({
        kind: "key_term",
        prompt: `Which key term belongs in this line from the daf?\n“${cloze}”`,
        choices,
        correctIndex: choices.indexOf(term),
        explanation: `The line reads: “${sentence}”`,
        source: "daf",
      }),
    );
  }

  return out;
}

function attributionQuestions(
  english: string[],
  limit: number,
): QuizQuestionRecord[] {
  const found = english
    .map(clean)
    .map(attributionFromLine)
    .filter((x): x is { who: string; claim: string } => Boolean(x));

  if (found.length < 2) return [];
  const speakers = [
    ...new Set(found.map((f) => f.who)),
  ];
  if (speakers.length < 2) return [];

  const out: QuizQuestionRecord[] = [];
  for (const item of shuffle(found)) {
    if (out.length >= limit) break;
    const decoys = pickDistinct(
      speakers.filter((s) => s !== item.who),
      3,
    );
    if (decoys.length < 1) continue;
    const choices = shuffle([item.who, ...decoys.slice(0, 3)]);
    const claim =
      item.claim.length > 180 ? `${item.claim.slice(0, 177)}…` : item.claim;
    out.push(
      q({
        kind: "attribution",
        prompt: `Who is speaking / teaching in this line from the sugya?\n“${claim}”`,
        choices,
        correctIndex: choices.indexOf(item.who),
        explanation: `${item.who} — from the daf: “${item.claim}”`,
        source: "daf",
      }),
    );
  }
  return out;
}

function notesQuestions(notes: string, limit: number): QuizQuestionRecord[] {
  const bullets = notes
    .split(/\n+/)
    .map((l) => l.replace(/^[-*•\d.)\s]+/, "").trim())
    .filter((l) => l.length >= 20);
  if (bullets.length < 2) {
    return comprehensionQuestions([notes], limit).map((x) => ({
      ...x,
      kind: "notes" as const,
      source: "notes" as const,
    }));
  }

  const out: QuizQuestionRecord[] = [];
  for (const bullet of shuffle(bullets)) {
    if (out.length >= limit) break;
    const decoys = pickDistinct(
      bullets.filter((b) => b !== bullet),
      3,
    );
    if (decoys.length < 2) continue;
    const choices = shuffle([bullet, ...decoys.slice(0, 3)]);
    out.push(
      q({
        kind: "notes",
        prompt: "Which point did you write in your study notes?",
        choices,
        correctIndex: choices.indexOf(bullet),
        explanation: `From your notes: “${bullet}”`,
        source: "notes",
      }),
    );
  }
  return out;
}

export function buildQuiz(options: {
  dafHebrew: string[];
  dafEnglish: string[];
  notesContent?: string | null;
  mode: "daf" | "notes" | "mixed";
  count?: number;
}): QuizQuestionRecord[] {
  const count = options.count ?? 8;
  const mode = options.mode;
  const pairs = pairedSegments(options.dafHebrew, options.dafEnglish);
  const english = options.dafEnglish.length
    ? options.dafEnglish
    : options.dafHebrew;

  if (mode === "notes") {
    return shuffle(
      notesQuestions(options.notesContent ?? "", count * 2),
    ).slice(0, count);
  }

  const bank: QuizQuestionRecord[] = [
    ...translationQuestions(pairs, Math.max(3, Math.ceil(count * 0.4))),
    ...comprehensionQuestions(english, Math.max(2, Math.ceil(count * 0.35))),
    ...keyTermQuestions(english, Math.max(1, Math.ceil(count * 0.2))),
    ...attributionQuestions(english, Math.max(1, Math.ceil(count * 0.2))),
  ];

  if (mode === "mixed" && options.notesContent) {
    bank.push(
      ...notesQuestions(options.notesContent, Math.ceil(count / 3)).map(
        (x) => ({ ...x, source: "mixed" as const }),
      ),
    );
  }

  // Prefer variety: at least some translation when pairs exist
  const byKind = new Map<string, QuizQuestionRecord[]>();
  for (const item of shuffle(bank)) {
    const list = byKind.get(item.kind) ?? [];
    list.push(item);
    byKind.set(item.kind, list);
  }

  const picked: QuizQuestionRecord[] = [];
  const order: QuizKind[] = [
    "translation",
    "comprehension",
    "key_term",
    "attribution",
    "notes",
  ];
  // Round-robin kinds for variety
  let guard = 0;
  while (picked.length < count && guard < count * 6) {
    guard += 1;
    let added = false;
    for (const kind of order) {
      const list = byKind.get(kind);
      if (!list?.length) continue;
      picked.push(list.shift()!);
      added = true;
      if (picked.length >= count) break;
    }
    if (!added) break;
  }

  // Fill remainder from leftover bank
  if (picked.length < count) {
    const leftover = shuffle(bank.filter((q) => !picked.includes(q)));
    picked.push(...leftover.slice(0, count - picked.length));
  }

  return shuffle(picked).slice(0, count);
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

export { QUIZ_KIND_LABEL } from "./quiz-kinds";
export type { QuizKind } from "./quiz-kinds";
