import { and, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { randomUUID } from "@/lib/edge-crypto";
import { getDb } from "@/lib/db";
import { audioSrc } from "@/lib/testquiz/audio";
import {
  consumeLiveGame,
  getEntitlement,
} from "@/lib/testquiz/entitlements";
import { isDiscoverCategory } from "@/lib/testquiz/discover";
import { generateGamePin, isValidPin, normalizePin } from "@/lib/testquiz/pin";
import { awardPoints, gradeAnswer } from "@/lib/testquiz/scoring";
import {
  TESTQUIZ_CORE_TYPES,
  TESTQUIZ_QUESTION_TYPES,
  type GamePhase,
  type GameSettings,
  type LiveAnswerPayload,
  type LiveGameState,
  type LiveAnswerRecord,
  type PlayerPublic,
  type TestQuizDiscoverCard,
  type TestQuizDocument,
  type TestQuizQuestion,
} from "@/lib/testquiz/types";
import { profiles, testquizGames, testquizQuizzes } from "@/lib/schema";

function nowIso(): string {
  return new Date().toISOString();
}

function monthMs(): number {
  return Date.now();
}

function asQuestions(raw: unknown): TestQuizQuestion[] {
  if (!Array.isArray(raw)) return [];
  return raw as TestQuizQuestion[];
}

function asTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((t): t is string => typeof t === "string").slice(0, 12);
}

function asState(raw: unknown): LiveGameState {
  return raw as LiveGameState;
}

function mapQuizRow(r: typeof testquizQuizzes.$inferSelect): TestQuizDocument {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    ownerProfileId: r.ownerProfileId,
    classroomId: r.classroomId,
    questions: asQuestions(r.questions),
    isPublic: !!r.isPublic,
    publishedAt: r.publishedAt?.toISOString() ?? null,
    category: r.category || "general",
    tags: asTags(r.tags),
    copyCount: r.copyCount ?? 0,
    sourceQuizId: r.sourceQuizId ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

function validateQuestions(
  questions: TestQuizQuestion[],
  allowAllTypes: boolean,
): string | null {
  for (const q of questions) {
    if (!TESTQUIZ_QUESTION_TYPES.includes(q.type)) {
      return `Unknown question type: ${q.type}`;
    }
    if (!allowAllTypes && !TESTQUIZ_CORE_TYPES.includes(q.type)) {
      return `Question type “${q.type}” needs Plus or Ultra.`;
    }
    if (!q.prompt?.trim() && q.type !== "pin_answer" && q.type !== "drop_pin") {
      return "Each question needs a prompt.";
    }
  }
  return null;
}

export async function listQuizzesForOwner(
  ownerProfileId: string,
): Promise<TestQuizDocument[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(testquizQuizzes)
    .where(eq(testquizQuizzes.ownerProfileId, ownerProfileId))
    .orderBy(desc(testquizQuizzes.updatedAt));

  return rows.map(mapQuizRow);
}

export async function getQuiz(
  quizId: string,
): Promise<TestQuizDocument | null> {
  const db = getDb();
  const [r] = await db
    .select()
    .from(testquizQuizzes)
    .where(eq(testquizQuizzes.id, quizId))
    .limit(1);
  if (!r) return null;
  return mapQuizRow(r);
}

export async function createQuiz(opts: {
  ownerProfileId: string;
  title: string;
  description?: string;
  classroomId?: string | null;
  questions?: TestQuizQuestion[];
}): Promise<TestQuizDocument> {
  const entitlement = await getEntitlement(opts.ownerProfileId);
  const questions = opts.questions ?? [];
  if (questions.length > entitlement.plan.maxQuestionsPerQuiz) {
    throw new Error(
      `Your ${entitlement.plan.label} plan allows up to ${entitlement.plan.maxQuestionsPerQuiz} questions.`,
    );
  }
  const err = validateQuestions(
    questions,
    entitlement.plan.questionTypes === "all",
  );
  if (err) throw new Error(err);

  const db = getDb();
  const [r] = await db
    .insert(testquizQuizzes)
    .values({
      ownerProfileId: opts.ownerProfileId,
      title: opts.title.trim() || "Untitled quiz",
      description: opts.description?.trim() ?? "",
      classroomId: opts.classroomId ?? null,
      questions,
    })
    .returning();

  return mapQuizRow(r!);
}

export async function updateQuiz(opts: {
  quizId: string;
  ownerProfileId: string;
  title?: string;
  description?: string;
  classroomId?: string | null;
  questions?: TestQuizQuestion[];
  category?: string;
  tags?: string[];
}): Promise<TestQuizDocument> {
  const existing = await getQuiz(opts.quizId);
  if (!existing || existing.ownerProfileId !== opts.ownerProfileId) {
    throw new Error("Quiz not found");
  }
  const entitlement = await getEntitlement(opts.ownerProfileId);
  const questions = opts.questions ?? existing.questions;
  if (questions.length > entitlement.plan.maxQuestionsPerQuiz) {
    throw new Error(
      `Your ${entitlement.plan.label} plan allows up to ${entitlement.plan.maxQuestionsPerQuiz} questions.`,
    );
  }
  const err = validateQuestions(
    questions,
    entitlement.plan.questionTypes === "all",
  );
  if (err) throw new Error(err);

  const category =
    opts.category && isDiscoverCategory(opts.category)
      ? opts.category
      : existing.category;

  const db = getDb();
  const [r] = await db
    .update(testquizQuizzes)
    .set({
      title: opts.title?.trim() ?? existing.title,
      description: opts.description ?? existing.description,
      classroomId:
        opts.classroomId !== undefined ? opts.classroomId : existing.classroomId,
      questions,
      category,
      tags: opts.tags !== undefined ? opts.tags.slice(0, 12) : existing.tags,
      updatedAt: new Date(),
    })
    .where(eq(testquizQuizzes.id, opts.quizId))
    .returning();

  return mapQuizRow(r!);
}

export async function setQuizPublic(opts: {
  quizId: string;
  ownerProfileId: string;
  isPublic: boolean;
  category?: string;
}): Promise<TestQuizDocument> {
  const existing = await getQuiz(opts.quizId);
  if (!existing || existing.ownerProfileId !== opts.ownerProfileId) {
    throw new Error("Quiz not found");
  }
  if (opts.isPublic && existing.questions.length === 0) {
    throw new Error("Add at least one question before publishing to Discover.");
  }
  const category =
    opts.category && isDiscoverCategory(opts.category)
      ? opts.category
      : existing.category;
  const db = getDb();
  const [r] = await db
    .update(testquizQuizzes)
    .set({
      isPublic: opts.isPublic,
      publishedAt: opts.isPublic ? new Date() : null,
      category,
      updatedAt: new Date(),
    })
    .where(eq(testquizQuizzes.id, opts.quizId))
    .returning();
  return mapQuizRow(r!);
}

export async function listDiscoverQuizzes(opts: {
  q?: string;
  category?: string;
  sort?: "recent" | "popular";
  limit?: number;
}): Promise<TestQuizDiscoverCard[]> {
  const db = getDb();
  const limit = Math.min(Math.max(opts.limit ?? 48, 1), 100);
  const filters = [eq(testquizQuizzes.isPublic, true)];
  if (opts.category && isDiscoverCategory(opts.category)) {
    filters.push(eq(testquizQuizzes.category, opts.category));
  }
  if (opts.q?.trim()) {
    const term = `%${opts.q.trim().slice(0, 80)}%`;
    filters.push(
      or(
        ilike(testquizQuizzes.title, term),
        ilike(testquizQuizzes.description, term),
      )!,
    );
  }

  const order =
    opts.sort === "popular"
      ? [desc(testquizQuizzes.copyCount), desc(testquizQuizzes.publishedAt)]
      : [desc(testquizQuizzes.publishedAt), desc(testquizQuizzes.copyCount)];

  const rows = await db
    .select({
      quiz: testquizQuizzes,
      ownerName: profiles.displayName,
    })
    .from(testquizQuizzes)
    .innerJoin(profiles, eq(profiles.id, testquizQuizzes.ownerProfileId))
    .where(and(...filters))
    .orderBy(...order)
    .limit(limit);

  return rows.map(({ quiz, ownerName }) => {
    const questions = asQuestions(quiz.questions);
    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      category: quiz.category || "general",
      tags: asTags(quiz.tags),
      questionCount: questions.length,
      copyCount: quiz.copyCount ?? 0,
      publishedAt: quiz.publishedAt?.toISOString() ?? null,
      ownerDisplayName: ownerName,
      types: [...new Set(questions.map((q) => q.type))],
    };
  });
}

export async function getDiscoverQuiz(
  quizId: string,
): Promise<(TestQuizDocument & { ownerDisplayName: string }) | null> {
  const db = getDb();
  const [row] = await db
    .select({
      quiz: testquizQuizzes,
      ownerName: profiles.displayName,
    })
    .from(testquizQuizzes)
    .innerJoin(profiles, eq(profiles.id, testquizQuizzes.ownerProfileId))
    .where(and(eq(testquizQuizzes.id, quizId), eq(testquizQuizzes.isPublic, true)))
    .limit(1);
  if (!row) return null;
  return { ...mapQuizRow(row.quiz), ownerDisplayName: row.ownerName };
}

/** Copy a public Discover quiz into the teacher's private library. */
export async function copyDiscoverQuiz(opts: {
  sourceQuizId: string;
  ownerProfileId: string;
}): Promise<TestQuizDocument> {
  const source = await getDiscoverQuiz(opts.sourceQuizId);
  if (!source) throw new Error("Discover quiz not found");

  const copy = await createQuiz({
    ownerProfileId: opts.ownerProfileId,
    title: source.title,
    description: source.description,
    questions: structuredClone(source.questions),
  });

  const db = getDb();
  await db
    .update(testquizQuizzes)
    .set({
      sourceQuizId: source.id,
      category: source.category,
      tags: source.tags,
      updatedAt: new Date(),
    })
    .where(eq(testquizQuizzes.id, copy.id));

  await db
    .update(testquizQuizzes)
    .set({
      copyCount: sql`${testquizQuizzes.copyCount} + 1`,
    })
    .where(eq(testquizQuizzes.id, source.id));

  const updated = await getQuiz(copy.id);
  return updated!;
}

export async function deleteQuiz(
  quizId: string,
  ownerProfileId: string,
): Promise<void> {
  const existing = await getQuiz(quizId);
  if (!existing || existing.ownerProfileId !== ownerProfileId) {
    throw new Error("Quiz not found");
  }
  const db = getDb();
  await db.delete(testquizQuizzes).where(eq(testquizQuizzes.id, quizId));
}

async function saveGameState(state: LiveGameState): Promise<LiveGameState> {
  const db = getDb();
  const ended = state.phase === "ended" || state.phase === "podium";
  state.updatedAt = nowIso();
  await db
    .update(testquizGames)
    .set({
      phase: state.phase,
      state,
      updatedAt: new Date(),
      endedAt: ended && state.phase === "ended" ? new Date() : undefined,
    })
    .where(eq(testquizGames.id, state.id));
  return state;
}

export async function getGame(gameId: string): Promise<LiveGameState | null> {
  const db = getDb();
  const [r] = await db
    .select()
    .from(testquizGames)
    .where(eq(testquizGames.id, gameId))
    .limit(1);
  if (!r) return null;
  return asState(r.state);
}

export async function getGameByPin(pinRaw: string): Promise<LiveGameState | null> {
  const pin = normalizePin(pinRaw);
  if (!isValidPin(pin)) return null;
  const db = getDb();
  const [r] = await db
    .select()
    .from(testquizGames)
    .where(and(eq(testquizGames.pin, pin), isNull(testquizGames.endedAt)))
    .limit(1);
  if (!r) return null;
  return asState(r.state);
}

export async function hostGame(opts: {
  quizId: string;
  hostProfileId: string;
  classroomId?: string | null;
  settings?: Partial<GameSettings>;
}): Promise<LiveGameState> {
  const quiz = await getQuiz(opts.quizId);
  if (!quiz || quiz.ownerProfileId !== opts.hostProfileId) {
    throw new Error("Quiz not found");
  }
  if (quiz.questions.length === 0) {
    throw new Error("Add at least one question before hosting.");
  }

  const entitlement = await getEntitlement(opts.hostProfileId);
  const consumed = await consumeLiveGame(opts.hostProfileId);
  if ("error" in consumed) throw new Error(consumed.error);

  const settings: GameSettings = {
    allowNicknames: opts.settings?.allowNicknames ?? true,
    allowAvatars: opts.settings?.allowAvatars ?? true,
    musicEnabled:
      entitlement.plan.music && (opts.settings?.musicEnabled ?? true),
  };

  let pin = generateGamePin();
  for (let i = 0; i < 8; i++) {
    const clash = await getGameByPin(pin);
    if (!clash) break;
    pin = generateGamePin();
  }

  const state: LiveGameState = {
    id: randomUUID(),
    pin,
    quizId: quiz.id,
    quizTitle: quiz.title,
    hostProfileId: opts.hostProfileId,
    classroomId: opts.classroomId ?? quiz.classroomId,
    settings,
    phase: "lobby",
    questionIndex: 0,
    questions: quiz.questions,
    players: [],
    answers: [],
    phaseStartedAtMs: monthMs(),
    questionStartedAtMs: null,
    musicTrack: settings.musicEnabled ? audioSrc("lobby") : null,
    planWatermark: entitlement.plan.watermark,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  const db = getDb();
  await db.insert(testquizGames).values({
    id: state.id,
    pin: state.pin,
    quizId: quiz.id,
    hostProfileId: opts.hostProfileId,
    classroomId: state.classroomId,
    phase: state.phase,
    state,
  });

  return state;
}

function publicView(
  state: LiveGameState,
  viewer: "host" | "player",
  playerId?: string,
): LiveGameState {
  const clone: LiveGameState = structuredClone(state);
  // Hide correct answers from students until reveal/podium/ended
  const hideAnswers =
    viewer === "player" &&
    !["reveal", "leaderboard", "podium", "ended"].includes(state.phase);

  if (hideAnswers) {
    clone.questions = clone.questions.map((q) => ({
      ...q,
      choices: q.choices?.map((c) => ({ ...c, correct: undefined })),
      acceptedAnswers: undefined,
      correctOrder: undefined,
      sliderCorrect: undefined,
      pinX: undefined,
      pinY: undefined,
    }));
    clone.answers = clone.answers.filter((a) => a.playerId === playerId);
  }

  clone.players = clone.players
    .filter((p) => !p.kicked)
    .map((p) => ({
      ...p,
      streak: p.streak ?? 0,
      displayName: state.settings.allowNicknames
        ? p.nickname || p.displayName
        : p.displayName,
      avatarId: state.settings.allowAvatars ? p.avatarId : null,
    }));

  return clone;
}

export function viewForHost(state: LiveGameState): LiveGameState {
  return publicView(state, "host");
}

export function viewForPlayer(
  state: LiveGameState,
  playerId: string,
): LiveGameState {
  return publicView(state, "player", playerId);
}

export async function joinGame(opts: {
  pin: string;
  profileId: string;
  realName: string;
  nickname?: string | null;
  avatarId?: string | null;
}): Promise<{ state: LiveGameState; playerId: string }> {
  const state = await getGameByPin(opts.pin);
  if (!state) throw new Error("No game found for that PIN.");
  if (state.phase !== "lobby") {
    throw new Error("This game already started.");
  }
  if (state.hostProfileId === opts.profileId) {
    throw new Error("Hosts cannot join as players.");
  }

  const entitlement = await getEntitlement(state.hostProfileId);
  const active = state.players.filter((p) => !p.kicked);
  if (active.length >= entitlement.plan.maxPlayersPerGame) {
    throw new Error("This game is full for the host’s plan.");
  }

  const existing = state.players.find((p) => p.id === opts.profileId);
  if (existing) {
    if (existing.kicked) throw new Error("You were removed from this game.");
    existing.connected = true;
    if (state.settings.allowNicknames && opts.nickname) {
      existing.nickname = opts.nickname.trim().slice(0, 24);
    }
    if (state.settings.allowAvatars && opts.avatarId) {
      existing.avatarId = opts.avatarId;
    }
    await saveGameState(state);
    return { state, playerId: existing.id };
  }

  const player: PlayerPublic = {
    id: opts.profileId,
    displayName: opts.realName.trim().slice(0, 80) || "Student",
    nickname: state.settings.allowNicknames
      ? (opts.nickname?.trim().slice(0, 24) ?? null)
      : null,
    avatarId: state.settings.allowAvatars ? (opts.avatarId ?? "oak") : null,
    score: 0,
    streak: 0,
    connected: true,
    kicked: false,
  };
  state.players.push(player);
  await saveGameState(state);
  return { state, playerId: player.id };
}

export async function updateHostSettings(
  gameId: string,
  hostProfileId: string,
  patch: Partial<GameSettings>,
): Promise<LiveGameState> {
  const state = await getGame(gameId);
  if (!state || state.hostProfileId !== hostProfileId) {
    throw new Error("Game not found");
  }
  if (state.phase !== "lobby") {
    throw new Error("Settings can only change in the lobby.");
  }
  const entitlement = await getEntitlement(hostProfileId);
  if (patch.allowNicknames !== undefined) {
    state.settings.allowNicknames = patch.allowNicknames;
  }
  if (patch.allowAvatars !== undefined) {
    state.settings.allowAvatars = patch.allowAvatars;
  }
  if (patch.musicEnabled !== undefined) {
    state.settings.musicEnabled = entitlement.plan.music && patch.musicEnabled;
    state.musicTrack = state.settings.musicEnabled ? audioSrc("lobby") : null;
  }
  return saveGameState(state);
}

export type HostAction =
  | { type: "start" }
  | { type: "lock" }
  | { type: "reveal" }
  | { type: "leaderboard" }
  | { type: "next" }
  | { type: "skip" }
  | { type: "podium" }
  | { type: "end" }
  | { type: "kick"; playerId: string }
  | { type: "mute_music"; muted: boolean };

function setPhase(state: LiveGameState, phase: GamePhase) {
  state.phase = phase;
  state.phaseStartedAtMs = monthMs();
}

export async function hostAction(
  gameId: string,
  hostProfileId: string,
  action: HostAction,
): Promise<LiveGameState> {
  const state = await getGame(gameId);
  if (!state || state.hostProfileId !== hostProfileId) {
    throw new Error("Game not found");
  }

  switch (action.type) {
    case "start": {
      if (state.phase !== "lobby") throw new Error("Already started");
      state.questionIndex = 0;
      setPhase(state, "countdown");
      state.musicTrack = state.settings.musicEnabled ? audioSrc("play") : null;
      break;
    }
    case "lock": {
      if (state.phase !== "question" && state.phase !== "countdown") {
        throw new Error("Nothing to lock");
      }
      setPhase(state, "lock");
      break;
    }
    case "reveal": {
      if (!["lock", "question", "countdown"].includes(state.phase)) {
        throw new Error("Reveal not available");
      }
      setPhase(state, "reveal");
      break;
    }
    case "leaderboard": {
      setPhase(state, "leaderboard");
      break;
    }
    case "next":
    case "skip": {
      const next = state.questionIndex + 1;
      if (next >= state.questions.length) {
        setPhase(state, "podium");
        state.musicTrack = state.settings.musicEnabled
          ? audioSrc("podium")
          : null;
      } else {
        state.questionIndex = next;
        setPhase(state, "countdown");
        state.questionStartedAtMs = null;
        state.musicTrack = state.settings.musicEnabled
          ? audioSrc("play")
          : null;
      }
      break;
    }
    case "podium": {
      setPhase(state, "podium");
      state.musicTrack = state.settings.musicEnabled
        ? audioSrc("podium")
        : null;
      break;
    }
    case "end": {
      setPhase(state, "ended");
      state.musicTrack = null;
      break;
    }
    case "kick": {
      const p = state.players.find((x) => x.id === action.playerId);
      if (p) {
        p.kicked = true;
        p.connected = false;
      }
      break;
    }
    case "mute_music": {
      const entitlement = await getEntitlement(hostProfileId);
      if (!entitlement.plan.music) {
        state.settings.musicEnabled = false;
        state.musicTrack = null;
      } else {
        state.settings.musicEnabled = !action.muted;
        if (!state.settings.musicEnabled) state.musicTrack = null;
        else if (state.phase === "lobby") state.musicTrack = audioSrc("lobby");
        else if (state.phase === "podium") state.musicTrack = audioSrc("podium");
        else state.musicTrack = audioSrc("play");
      }
      break;
    }
    default:
      throw new Error("Unknown action");
  }

  return saveGameState(state);
}

/** Advance countdown → question when client polls after countdown window. */
export async function tickGame(gameId: string): Promise<LiveGameState | null> {
  const state = await getGame(gameId);
  if (!state) return null;

  if (state.phase === "countdown") {
    const elapsed = monthMs() - state.phaseStartedAtMs;
    if (elapsed >= 3000) {
      setPhase(state, "question");
      state.questionStartedAtMs = monthMs();
      return saveGameState(state);
    }
  }

  if (state.phase === "question" && state.questionStartedAtMs) {
    const q = state.questions[state.questionIndex];
    if (q) {
      const elapsed = monthMs() - state.questionStartedAtMs;
      if (elapsed >= q.timeLimitSec * 1000) {
        setPhase(state, "lock");
        return saveGameState(state);
      }
      // Auto-lock when every active player has answered
      const active = state.players.filter((p) => !p.kicked);
      if (active.length > 0) {
        const answered = new Set(
          state.answers
            .filter((a) => a.questionId === q.id)
            .map((a) => a.playerId),
        );
        if (active.every((p) => answered.has(p.id))) {
          setPhase(state, "lock");
          return saveGameState(state);
        }
      }
    }
  }

  return state;
}

export async function submitAnswer(opts: {
  gameId: string;
  playerId: string;
  payload: LiveAnswerPayload;
}): Promise<{
  correct: boolean | null;
  pointsAwarded: number;
  streak: number;
}> {
  let state = await getGame(opts.gameId);
  if (!state) throw new Error("Game not found");
  state = (await tickGame(opts.gameId)) ?? state;

  if (state.phase !== "question") {
    throw new Error("Answers are locked.");
  }
  const player = state.players.find((p) => p.id === opts.playerId && !p.kicked);
  if (!player) throw new Error("Player not in this game");

  const question = state.questions[state.questionIndex];
  if (!question) throw new Error("No active question");

  const already = state.answers.find(
    (a) => a.playerId === opts.playerId && a.questionId === question.id,
  );
  if (already) throw new Error("Already answered");

  const started = state.questionStartedAtMs ?? monthMs();
  const responseMs = Math.max(0, monthMs() - started);
  const correct = gradeAnswer(question, opts.payload);
  const pointsAwarded = awardPoints(question, correct, responseMs);

  const record: LiveAnswerRecord = {
    playerId: opts.playerId,
    questionId: question.id,
    payload: opts.payload,
    correct,
    pointsAwarded,
    answeredAtMs: monthMs(),
    responseMs,
  };
  state.answers.push(record);
  player.score += pointsAwarded;
  if (correct === true) {
    player.streak = (player.streak ?? 0) + 1;
  } else if (correct === false) {
    player.streak = 0;
  }
  await saveGameState(state);
  return { correct, pointsAwarded, streak: player.streak ?? 0 };
}

export async function listGamesForHost(
  hostProfileId: string,
  limit = 20,
): Promise<
  {
    id: string;
    pin: string;
    quizTitle: string;
    phase: string;
    playerCount: number;
    createdAt: string;
    endedAt: string | null;
  }[]
> {
  const db = getDb();
  const rows = await db
    .select()
    .from(testquizGames)
    .where(eq(testquizGames.hostProfileId, hostProfileId))
    .orderBy(desc(testquizGames.createdAt))
    .limit(limit);

  return rows.map((r) => {
    const s = asState(r.state);
    return {
      id: r.id,
      pin: r.pin,
      quizTitle: s.quizTitle,
      phase: r.phase,
      playerCount: s.players.filter((p) => !p.kicked).length,
      createdAt: r.createdAt.toISOString(),
      endedAt: r.endedAt?.toISOString() ?? null,
    };
  });
}

export { newBlankQuestion } from "@/lib/testquiz/blank-question";
