/**
 * Self-paced Blitz challenges — server logic.
 * Questions are snapshotted at assign time; timing is server-authoritative.
 */
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { getEntitlement } from "@/lib/blitz/entitlements";
import {
  blitzChallengeAttempts,
  blitzChallenges,
  ensureChallengeSchema,
} from "@/lib/blitz/challenge-schema";
import { challengesAllowed, isThemeId } from "@/lib/blitz/modes";
import { awardPoints, gradeAnswer, isScoredType } from "@/lib/blitz/scoring";
import { getQuiz, playabilityIssue } from "@/lib/blitz/store";
import type {
  BlitzQuestion,
  BlitzThemeId,
  LiveAnswerPayload,
} from "@/lib/blitz/types";
import { classroomMembers, classrooms, profiles } from "@/lib/schema";

export type ChallengeMode = "classic" | "accuracy";

export type ChallengeSettings = {
  mode: ChallengeMode;
  theme: BlitzThemeId;
};

export type ChallengeAnswer = {
  questionId: string;
  payload: LiveAnswerPayload;
  correct: boolean | null;
  points: number;
  streakBonus: number;
  responseMs: number;
  timedOut: boolean;
};

export type AttemptState = {
  index: number;
  questionStartedAtMs: number | null;
  streak: number;
  answers: ChallengeAnswer[];
};

export type ChallengeSummary = {
  id: string;
  title: string;
  classroomId: string;
  classroomName: string;
  questionCount: number;
  dueAt: string | null;
  closedAt: string | null;
  createdAt: string;
  settings: ChallengeSettings;
};

type ChallengeRow = typeof blitzChallenges.$inferSelect;
type AttemptRow = typeof blitzChallengeAttempts.$inferSelect;

function settingsOf(raw: unknown): ChallengeSettings {
  const s = (raw ?? {}) as Partial<ChallengeSettings>;
  return {
    mode: s.mode === "accuracy" ? "accuracy" : "classic",
    theme: s.theme && isThemeId(s.theme) ? s.theme : "night",
  };
}

function questionsOf(raw: unknown): BlitzQuestion[] {
  return Array.isArray(raw) ? (raw as BlitzQuestion[]) : [];
}

function attemptStateOf(raw: unknown): AttemptState {
  const s = (raw ?? {}) as Partial<AttemptState>;
  return {
    index: s.index ?? 0,
    questionStartedAtMs: s.questionStartedAtMs ?? null,
    streak: s.streak ?? 0,
    answers: Array.isArray(s.answers) ? s.answers : [],
  };
}

export function isChallengeOpen(c: { dueAt: Date | null; closedAt: Date | null }) {
  if (c.closedAt) return false;
  if (c.dueAt && c.dueAt.getTime() < Date.now()) return false;
  return true;
}

function sanitize(q: BlitzQuestion): BlitzQuestion {
  return {
    ...q,
    choices: q.choices?.map((c) => ({ ...c, correct: undefined })),
    acceptedAnswers: undefined,
    correctOrder: undefined,
    sliderCorrect: undefined,
    sliderTolerance: undefined,
    pinX: undefined,
    pinY: undefined,
  };
}

/* ---------------------------------------------------------------- teacher */

export async function listTeacherClasses(
  profileId: string,
): Promise<{ id: string; name: string; studentCount: number }[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: classrooms.id,
      name: classrooms.name,
      studentCount: sql<number>`count(${classroomMembers.id})::int`,
    })
    .from(classrooms)
    .leftJoin(classroomMembers, eq(classroomMembers.classroomId, classrooms.id))
    .where(eq(classrooms.rebbeId, profileId))
    .groupBy(classrooms.id, classrooms.name)
    .orderBy(classrooms.name);
  return rows;
}

export async function createChallenge(opts: {
  ownerProfileId: string;
  quizId: string;
  classroomId: string;
  dueAt: Date | null;
  mode: ChallengeMode;
  theme: BlitzThemeId;
}): Promise<ChallengeSummary> {
  await ensureChallengeSchema();
  const entitlement = await getEntitlement(opts.ownerProfileId);
  if (!challengesAllowed(entitlement.plan)) {
    throw new Error("Self-paced challenges are included with Plus and Ultra.");
  }
  const quiz = await getQuiz(opts.quizId);
  if (!quiz || quiz.ownerProfileId !== opts.ownerProfileId) {
    throw new Error("Quiz not found.");
  }
  const issue = playabilityIssue(quiz.questions);
  if (issue) throw new Error(issue);
  const db = getDb();
  const [cls] = await db
    .select()
    .from(classrooms)
    .where(
      and(
        eq(classrooms.id, opts.classroomId),
        eq(classrooms.rebbeId, opts.ownerProfileId),
      ),
    )
    .limit(1);
  if (!cls) throw new Error("Class not found.");
  if (opts.dueAt && opts.dueAt.getTime() < Date.now()) {
    throw new Error("Choose a due date in the future.");
  }
  const [row] = await db
    .insert(blitzChallenges)
    .values({
      quizId: quiz.id,
      ownerProfileId: opts.ownerProfileId,
      classroomId: cls.id,
      title: quiz.title,
      questions: quiz.questions,
      settings: { mode: opts.mode, theme: opts.theme },
      dueAt: opts.dueAt,
    })
    .returning();
  return toSummary(row!, cls.name);
}

function toSummary(r: ChallengeRow, classroomName: string): ChallengeSummary {
  return {
    id: r.id,
    title: r.title,
    classroomId: r.classroomId,
    classroomName,
    questionCount: questionsOf(r.questions).length,
    dueAt: r.dueAt?.toISOString() ?? null,
    closedAt: r.closedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    settings: settingsOf(r.settings),
  };
}

export async function listTeacherChallenges(ownerProfileId: string): Promise<
  (ChallengeSummary & {
    rosterCount: number;
    finishedCount: number;
    startedCount: number;
    averageAccuracy: number | null;
  })[]
> {
  await ensureChallengeSchema();
  const db = getDb();
  const rows = await db
    .select({ c: blitzChallenges, className: classrooms.name })
    .from(blitzChallenges)
    .innerJoin(classrooms, eq(classrooms.id, blitzChallenges.classroomId))
    .where(eq(blitzChallenges.ownerProfileId, ownerProfileId))
    .orderBy(desc(blitzChallenges.createdAt))
    .limit(60);
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.c.id);
  const attempts = await db
    .select()
    .from(blitzChallengeAttempts)
    .where(inArray(blitzChallengeAttempts.challengeId, ids));
  const classIds = [...new Set(rows.map((r) => r.c.classroomId))];
  const roster = await db
    .select({
      classroomId: classroomMembers.classroomId,
      n: sql<number>`count(*)::int`,
    })
    .from(classroomMembers)
    .where(inArray(classroomMembers.classroomId, classIds))
    .groupBy(classroomMembers.classroomId);

  return rows.map(({ c, className }) => {
    const mine = attempts.filter((a) => a.challengeId === c.id);
    const finished = mine.filter((a) => a.finishedAt);
    const graded = finished
      .map((a) => accuracyOf(a, questionsOf(c.questions)))
      .filter((x): x is number => x != null);
    return {
      ...toSummary(c, className),
      rosterCount: roster.find((r) => r.classroomId === c.classroomId)?.n ?? 0,
      startedCount: mine.length,
      finishedCount: finished.length,
      averageAccuracy: graded.length
        ? Math.round(graded.reduce((s, x) => s + x, 0) / graded.length)
        : null,
    };
  });
}

function accuracyOf(a: AttemptRow, questions: BlitzQuestion[]): number | null {
  const scored = questions.filter((q) => isScoredType(q.type)).length;
  if (!scored) return null;
  return Math.round((a.correctCount / scored) * 100);
}

export async function getChallengeReport(id: string, ownerProfileId: string) {
  await ensureChallengeSchema();
  const db = getDb();
  const [row] = await db
    .select({ c: blitzChallenges, className: classrooms.name })
    .from(blitzChallenges)
    .innerJoin(classrooms, eq(classrooms.id, blitzChallenges.classroomId))
    .where(
      and(
        eq(blitzChallenges.id, id),
        eq(blitzChallenges.ownerProfileId, ownerProfileId),
      ),
    )
    .limit(1);
  if (!row) return null;
  const questions = questionsOf(row.c.questions);
  const attempts = await db
    .select()
    .from(blitzChallengeAttempts)
    .where(eq(blitzChallengeAttempts.challengeId, id));
  const members = await db
    .select({ id: profiles.id, name: profiles.displayName })
    .from(classroomMembers)
    .innerJoin(profiles, eq(profiles.id, classroomMembers.studentId))
    .where(eq(classroomMembers.classroomId, row.c.classroomId));

  const byId = new Map(attempts.map((a) => [a.profileId, a]));
  const students = [
    ...members.map((m) => ({ id: m.id, name: m.name })),
    // Students who left the class but already played keep their row.
    ...attempts
      .filter((a) => !members.some((m) => m.id === a.profileId))
      .map((a) => ({ id: a.profileId, name: a.displayName })),
  ].map((s) => {
    const a = byId.get(s.id);
    const st = a ? attemptStateOf(a.state) : null;
    return {
      profileId: s.id,
      name: s.name,
      status: !a ? "not_started" : a.finishedAt ? "finished" : "in_progress",
      score: a?.score ?? 0,
      correctCount: a?.correctCount ?? 0,
      answeredCount: a?.answeredCount ?? 0,
      accuracy: a ? accuracyOf(a, questions) : null,
      finishedAt: a?.finishedAt?.toISOString() ?? null,
      results: questions.map((q) => {
        const ans = st?.answers.find((x) => x.questionId === q.id);
        if (!ans) return "none" as const;
        return ans.correct === true ? ("ok" as const) : ans.correct === false ? ("miss" as const) : ("na" as const);
      }),
    };
  });
  students.sort(
    (a, b) =>
      (b.status === "finished" ? 1 : 0) - (a.status === "finished" ? 1 : 0) ||
      b.score - a.score ||
      a.name.localeCompare(b.name),
  );

  const byQuestion = questions.map((q) => {
    const answers = attempts
      .map((a) => attemptStateOf(a.state).answers.find((x) => x.questionId === q.id))
      .filter((x): x is ChallengeAnswer => !!x);
    const graded = answers.filter((x) => x.correct !== null);
    return {
      questionId: q.id,
      prompt: q.prompt,
      type: q.type,
      responses: answers.length,
      accuracy: graded.length
        ? Math.round((graded.filter((x) => x.correct).length / graded.length) * 100)
        : null,
    };
  });

  return {
    challenge: {
      ...toSummary(row.c, row.className),
      open: isChallengeOpen(row.c),
    },
    students,
    byQuestion,
  };
}

export async function setChallengeClosed(
  id: string,
  ownerProfileId: string,
  closed: boolean,
) {
  await ensureChallengeSchema();
  const db = getDb();
  const rows = await db
    .update(blitzChallenges)
    .set({ closedAt: closed ? new Date() : null })
    .where(
      and(
        eq(blitzChallenges.id, id),
        eq(blitzChallenges.ownerProfileId, ownerProfileId),
      ),
    )
    .returning({ id: blitzChallenges.id });
  if (!rows.length) throw new Error("Challenge not found.");
}

export async function deleteChallenge(id: string, ownerProfileId: string) {
  await ensureChallengeSchema();
  const db = getDb();
  await db
    .delete(blitzChallenges)
    .where(
      and(
        eq(blitzChallenges.id, id),
        eq(blitzChallenges.ownerProfileId, ownerProfileId),
      ),
    );
}

/* ---------------------------------------------------------------- student */

export async function listStudentChallenges(profileId: string) {
  await ensureChallengeSchema();
  const db = getDb();
  const rows = await db
    .select({ c: blitzChallenges, className: classrooms.name })
    .from(blitzChallenges)
    .innerJoin(classrooms, eq(classrooms.id, blitzChallenges.classroomId))
    .innerJoin(
      classroomMembers,
      and(
        eq(classroomMembers.classroomId, blitzChallenges.classroomId),
        eq(classroomMembers.studentId, profileId),
      ),
    )
    .orderBy(desc(blitzChallenges.createdAt))
    .limit(30);
  if (!rows.length) return [];
  const attempts = await db
    .select()
    .from(blitzChallengeAttempts)
    .where(
      and(
        eq(blitzChallengeAttempts.profileId, profileId),
        inArray(
          blitzChallengeAttempts.challengeId,
          rows.map((r) => r.c.id),
        ),
      ),
    );
  return rows.map(({ c, className }) => {
    const a = attempts.find((x) => x.challengeId === c.id);
    return {
      ...toSummary(c, className),
      open: isChallengeOpen(c),
      status: !a ? "not_started" : a.finishedAt ? "finished" : "in_progress",
      score: a?.score ?? null,
    };
  });
}

async function loadForStudent(id: string, profileId: string) {
  await ensureChallengeSchema();
  const db = getDb();
  const [row] = await db
    .select({ c: blitzChallenges, className: classrooms.name })
    .from(blitzChallenges)
    .innerJoin(classrooms, eq(classrooms.id, blitzChallenges.classroomId))
    .innerJoin(
      classroomMembers,
      and(
        eq(classroomMembers.classroomId, blitzChallenges.classroomId),
        eq(classroomMembers.studentId, profileId),
      ),
    )
    .where(eq(blitzChallenges.id, id))
    .limit(1);
  if (!row) return null;
  const [attempt] = await db
    .select()
    .from(blitzChallengeAttempts)
    .where(
      and(
        eq(blitzChallengeAttempts.challengeId, id),
        eq(blitzChallengeAttempts.profileId, profileId),
      ),
    )
    .limit(1);
  return { ...row, attempt: attempt ?? null };
}

export type StudentChallengeView = {
  challenge: ChallengeSummary & { open: boolean };
  status: "not_started" | "in_progress" | "finished";
  index: number;
  total: number;
  score: number;
  streak: number;
  correctCount: number;
  /** Current question (answers hidden) while in progress. */
  question: BlitzQuestion | null;
  questionStartedAtMs: number | null;
  serverNowMs: number;
  /** Full review once finished. */
  review:
    | {
        question: BlitzQuestion;
        answer: ChallengeAnswer | null;
      }[]
    | null;
};

function studentView(
  c: ChallengeRow,
  className: string,
  attempt: AttemptRow | null,
): StudentChallengeView {
  const questions = questionsOf(c.questions);
  const st = attempt ? attemptStateOf(attempt.state) : null;
  const finished = !!attempt?.finishedAt;
  const index = st?.index ?? 0;
  return {
    challenge: { ...toSummary(c, className), open: isChallengeOpen(c) },
    status: !attempt ? "not_started" : finished ? "finished" : "in_progress",
    index,
    total: questions.length,
    score: attempt?.score ?? 0,
    streak: st?.streak ?? 0,
    correctCount: attempt?.correctCount ?? 0,
    question:
      attempt && !finished && questions[index] ? sanitize(questions[index]!) : null,
    questionStartedAtMs: st?.questionStartedAtMs ?? null,
    serverNowMs: Date.now(),
    review: finished
      ? questions.map((q) => ({
          question: q,
          answer: st?.answers.find((a) => a.questionId === q.id) ?? null,
        }))
      : null,
  };
}

export async function getStudentChallenge(id: string, profileId: string) {
  const row = await loadForStudent(id, profileId);
  if (!row) return null;
  return studentView(row.c, row.className, row.attempt);
}

/** Start (or resume) the attempt and start the current question's clock. */
export async function beginChallengeQuestion(
  id: string,
  profile: { id: string; displayName: string },
): Promise<StudentChallengeView> {
  const row = await loadForStudent(id, profile.id);
  if (!row) throw new Error("Challenge not found.");
  const db = getDb();
  let attempt = row.attempt;
  if (!attempt) {
    if (!isChallengeOpen(row.c)) throw new Error("This challenge is closed.");
    const [created] = await db
      .insert(blitzChallengeAttempts)
      .values({
        challengeId: id,
        profileId: profile.id,
        displayName: profile.displayName.slice(0, 120),
        state: { index: 0, questionStartedAtMs: null, streak: 0, answers: [] },
      })
      .onConflictDoNothing()
      .returning();
    attempt =
      created ??
      (
        await db
          .select()
          .from(blitzChallengeAttempts)
          .where(
            and(
              eq(blitzChallengeAttempts.challengeId, id),
              eq(blitzChallengeAttempts.profileId, profile.id),
            ),
          )
          .limit(1)
      )[0] ??
      null;
    if (!attempt) throw new Error("Could not start the challenge. Try again.");
  }
  if (attempt.finishedAt) return studentView(row.c, row.className, attempt);
  const st = attemptStateOf(attempt.state);
  if (st.questionStartedAtMs == null) {
    st.questionStartedAtMs = Date.now();
    const [saved] = await db
      .update(blitzChallengeAttempts)
      .set({ state: st })
      .where(eq(blitzChallengeAttempts.id, attempt.id))
      .returning();
    attempt = saved ?? attempt;
  }
  return studentView(row.c, row.className, attempt);
}

export async function answerChallengeQuestion(
  id: string,
  profileId: string,
  questionId: string,
  payload: LiveAnswerPayload,
): Promise<{
  result: ChallengeAnswer & { streak: number };
  /** The question with its answers, so the player can see what was right. */
  revealed: BlitzQuestion;
  view: StudentChallengeView;
}> {
  const row = await loadForStudent(id, profileId);
  if (!row?.attempt) throw new Error("Start the challenge first.");
  const attempt = row.attempt;
  if (attempt.finishedAt) throw new Error("You already finished this challenge.");
  const questions = questionsOf(row.c.questions);
  const st = attemptStateOf(attempt.state);
  const q = questions[st.index];
  if (!q || q.id !== questionId) throw new Error("That question has already closed.");
  if (st.questionStartedAtMs == null) throw new Error("This question hasn’t started yet.");

  const responseMs = Math.max(0, Date.now() - st.questionStartedAtMs);
  const timedOut = responseMs > q.timeLimitSec * 1000 + 1500;
  const correct = timedOut
    ? isScoredType(q.type)
      ? false
      : null
    : gradeAnswer(q, payload);
  const mode = settingsOf(row.c.settings).mode;
  const { points, streakBonus } = awardPoints(q, correct, responseMs, mode, st.streak);
  if (correct === true) st.streak += 1;
  else if (correct === false) st.streak = 0;
  const ans: ChallengeAnswer = {
    questionId: q.id,
    payload: timedOut ? {} : payload,
    correct,
    points,
    streakBonus,
    responseMs,
    timedOut,
  };
  st.answers.push(ans);
  st.index += 1;
  st.questionStartedAtMs = null;
  const done = st.index >= questions.length;

  const db = getDb();
  const [saved] = await db
    .update(blitzChallengeAttempts)
    .set({
      state: st,
      score: attempt.score + points,
      correctCount: attempt.correctCount + (correct === true ? 1 : 0),
      answeredCount: attempt.answeredCount + 1,
      finishedAt: done ? new Date() : null,
    })
    .where(
      and(
        eq(blitzChallengeAttempts.id, attempt.id),
        // Guard against double-submits racing each other.
        eq(blitzChallengeAttempts.answeredCount, attempt.answeredCount),
      ),
    )
    .returning();
  if (!saved) throw new Error("You’ve already answered this question.");

  return {
    result: { ...ans, streak: st.streak },
    revealed: q,
    view: studentView(row.c, row.className, saved),
  };
}
