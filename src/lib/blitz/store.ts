import { and, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { randomUUID } from "@/lib/edge-crypto";
import { getDb } from "@/lib/db";
import { audioSrc, musicForPhase } from "@/lib/blitz/audio";
import { DEFAULT_AVATAR_ID, isAvatarId } from "@/lib/blitz/avatars";
import {
  consumeLiveGame,
  getEntitlement,
} from "@/lib/blitz/entitlements";
import { isDiscoverCategory } from "@/lib/blitz/discover";
import { playabilityIssue } from "@/lib/blitz/validate";
import { generateGamePin, isValidPin, normalizePin } from "@/lib/blitz/pin";
import {
  gameMode,
  gameTheme,
  isThemeId,
  makeTeams,
  modeAllowed,
  smallestTeam,
  themeAllowed,
} from "@/lib/blitz/modes";
import { awardPoints, gradeAnswer, isScoredType } from "@/lib/blitz/scoring";
import {
  BLITZ_CORE_TYPES,
  BLITZ_QUESTION_TYPES,
  type GamePhase,
  type GameSettings,
  type LiveAnswerPayload,
  type LiveGameState,
  type LiveAnswerRecord,
  type PlayerPublic,
  type BlitzDiscoverCard,
  type BlitzDocument,
  type BlitzQuestion,
} from "@/lib/blitz/types";
import { profiles, testquizGames, testquizQuizzes } from "@/lib/schema";

function nowIso(): string {
  return new Date().toISOString();
}

function asQuestions(raw: unknown): BlitzQuestion[] {
  if (!Array.isArray(raw)) return [];
  return raw as BlitzQuestion[];
}

function asTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((t): t is string => typeof t === "string").slice(0, 12);
}

function asState(raw: unknown): LiveGameState {
  return raw as LiveGameState;
}

function mapQuizRow(r: typeof testquizQuizzes.$inferSelect): BlitzDocument {
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
  questions: BlitzQuestion[],
  allowAllTypes: boolean,
): string | null {
  for (const q of questions) {
    if (!BLITZ_QUESTION_TYPES.includes(q.type)) {
      return `Unknown question type: ${q.type}`;
    }
    if (!allowAllTypes && !BLITZ_CORE_TYPES.includes(q.type)) {
      return `Question type “${q.type}” needs Plus or Ultra.`;
    }
  }
  return null;
}

export async function listQuizzesForOwner(
  ownerProfileId: string,
): Promise<BlitzDocument[]> {
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
): Promise<BlitzDocument | null> {
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
  questions?: BlitzQuestion[];
}): Promise<BlitzDocument> {
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
  questions?: BlitzQuestion[];
  category?: string;
  tags?: string[];
}): Promise<BlitzDocument> {
  const existing = await getQuiz(opts.quizId);
  if (!existing || existing.ownerProfileId !== opts.ownerProfileId) {
    throw new Error("Quiz not found.");
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
}): Promise<BlitzDocument> {
  const existing = await getQuiz(opts.quizId);
  if (!existing || existing.ownerProfileId !== opts.ownerProfileId) {
    throw new Error("Quiz not found.");
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
}): Promise<BlitzDiscoverCard[]> {
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
): Promise<(BlitzDocument & { ownerDisplayName: string }) | null> {
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
}): Promise<BlitzDocument> {
  const source = await getDiscoverQuiz(opts.sourceQuizId);
  if (!source) throw new Error("This quiz is no longer on Discover.");

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
    throw new Error("Quiz not found.");
  }
  const db = getDb();
  await db.delete(testquizQuizzes).where(eq(testquizQuizzes.id, quizId));
}

/* ------------------------------------------------------------------ games */

type StoredState = LiveGameState & { rev?: number };

class GameConflict extends Error {}

/**
 * Compare-and-swap save: only writes when nobody else saved since we read.
 * Many players answer within the same second, so plain read-modify-write
 * would silently drop answers and joins.
 */
async function casSave(state: StoredState): Promise<LiveGameState> {
  const db = getDb();
  const prevRev = state.rev ?? 0;
  state.rev = prevRev + 1;
  state.updatedAt = nowIso();
  const rows = await db
    .update(testquizGames)
    .set({
      phase: state.phase,
      state,
      updatedAt: new Date(),
      endedAt: state.phase === "ended" ? new Date() : undefined,
    })
    .where(
      and(
        eq(testquizGames.id, state.id),
        sql`coalesce((${testquizGames.state}->>'rev')::int, 0) = ${prevRev}`,
      ),
    )
    .returning({ id: testquizGames.id });
  if (rows.length === 0) throw new GameConflict("conflict");
  return state;
}

/**
 * Load → mutate → CAS save, retrying on conflict. `fn` returns false when
 * it made no change (no write happens).
 */
async function mutateGame<T>(
  gameId: string,
  fn: (state: StoredState) => Promise<T | false> | T | false,
): Promise<{ state: LiveGameState; result: T | null }> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const state = (await getGame(gameId)) as StoredState | null;
    if (!state) throw new Error("Game not found.");
    const result = await fn(state);
    if (result === false) return { state, result: null };
    try {
      const saved = await casSave(state);
      return { state: saved, result };
    } catch (e) {
      if (!(e instanceof GameConflict)) throw e;
      await new Promise((r) => setTimeout(r, 15 + Math.random() * 40 * (attempt + 1)));
    }
  }
  throw new Error("The game is busy. Try again.");
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
    .orderBy(desc(testquizGames.createdAt))
    .limit(1);
  if (!r) return null;
  return asState(r.state);
}

function trackFor(state: LiveGameState): string | null {
  if (!state.settings.musicEnabled) return null;
  const key = musicForPhase(state.phase);
  return key ? audioSrc(key) : null;
}

function setPhase(state: LiveGameState, phase: GamePhase) {
  state.phase = phase;
  state.phaseStartedAtMs = Date.now();
  state.musicTrack = trackFor(state);
}

/** (Re)deal every active player into balanced teams, keeping join order. */
function dealTeams(state: LiveGameState) {
  if (gameMode(state.settings) !== "team") {
    state.teams = [];
    for (const p of state.players) p.teamId = null;
    return;
  }
  state.teams = makeTeams(state.settings.teamCount ?? 2);
  const active = state.players.filter((p) => !p.kicked);
  active.forEach((p, i) => {
    p.teamId = state.teams![i % state.teams!.length]!.id;
  });
}

export type HostGameOptions = {
  quizId: string;
  hostProfileId: string;
  classroomId?: string | null;
  settings?: Partial<GameSettings>;
};

export async function hostGame(opts: HostGameOptions): Promise<LiveGameState> {
  const quiz = await getQuiz(opts.quizId);
  if (!quiz || quiz.ownerProfileId !== opts.hostProfileId) {
    throw new Error("Quiz not found.");
  }
  const issue = playabilityIssue(quiz.questions);
  if (issue) throw new Error(issue);

  const entitlement = await getEntitlement(opts.hostProfileId);
  const mode = opts.settings?.mode ?? "classic";
  if (!modeAllowed(entitlement.plan, mode)) {
    throw new Error("Team battle is included with Plus and Ultra.");
  }
  const theme = opts.settings?.theme ?? "night";
  if (!isThemeId(theme) || !themeAllowed(entitlement.plan, theme)) {
    throw new Error("That theme is included with Plus and Ultra.");
  }
  const consumed = await consumeLiveGame(opts.hostProfileId);
  if ("error" in consumed) throw new Error(consumed.error);

  const settings: GameSettings = {
    allowNicknames: opts.settings?.allowNicknames ?? true,
    allowAvatars: opts.settings?.allowAvatars ?? true,
    musicEnabled: entitlement.plan.music && (opts.settings?.musicEnabled ?? true),
    mode,
    theme,
    teamCount: Math.min(4, Math.max(2, opts.settings?.teamCount ?? 2)),
  };

  let pin = generateGamePin();
  for (let i = 0; i < 8; i++) {
    const clash = await getGameByPin(pin);
    if (!clash) break;
    pin = generateGamePin();
  }

  const state: StoredState = {
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
    teams: mode === "team" ? makeTeams(settings.teamCount ?? 2) : [],
    phaseStartedAtMs: Date.now(),
    questionStartedAtMs: null,
    musicTrack: null,
    planWatermark: entitlement.plan.watermark,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    rev: 0,
  };
  state.musicTrack = trackFor(state);

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

const REVEALED: GamePhase[] = ["reveal", "leaderboard", "podium", "ended"];

function publicView(
  state: LiveGameState,
  viewer: "host" | "player",
  playerId?: string,
): LiveGameState {
  const clone: LiveGameState = structuredClone(state);
  delete (clone as StoredState).rev;

  if (viewer === "player") {
    const current = state.questions[state.questionIndex];
    const hideCurrent = !REVEALED.includes(state.phase);
    clone.questions = clone.questions.map((q) => {
      // Future questions + the live one stay secret until revealed.
      const idx = state.questions.findIndex((x) => x.id === q.id);
      const secret =
        idx > state.questionIndex || (hideCurrent && q.id === current?.id);
      if (!secret) return q;
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
    });
    // Players only ever see their own answers.
    clone.answers = clone.answers.filter((a) => a.playerId === playerId);
  }

  clone.players = clone.players
    .filter((p) => !p.kicked || p.id === playerId)
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

/** Lightweight lookup for the join screen (title + what the player may set). */
export async function peekGame(pinRaw: string): Promise<{
  id: string;
  quizTitle: string;
  phase: GamePhase;
  allowNicknames: boolean;
  allowAvatars: boolean;
  mode: string;
  theme: string;
  playerCount: number;
} | null> {
  const state = await getGameByPin(pinRaw);
  if (!state) return null;
  return {
    id: state.id,
    quizTitle: state.quizTitle,
    phase: state.phase,
    allowNicknames: state.settings.allowNicknames,
    allowAvatars: state.settings.allowAvatars,
    mode: gameMode(state.settings),
    theme: gameTheme(state.settings),
    playerCount: state.players.filter((p) => !p.kicked).length,
  };
}

export async function joinGame(opts: {
  pin: string;
  profileId: string;
  realName: string;
  nickname?: string | null;
  avatarId?: string | null;
}): Promise<{ state: LiveGameState; playerId: string }> {
  const found = await getGameByPin(opts.pin);
  if (!found) throw new Error("No game found for that PIN.");
  if (found.hostProfileId === opts.profileId) {
    throw new Error("Hosts can’t join their own game as players.");
  }
  const entitlement = await getEntitlement(found.hostProfileId);
  const nickname = opts.nickname?.trim().slice(0, 24) || null;
  const avatarId =
    opts.avatarId && isAvatarId(opts.avatarId) ? opts.avatarId : DEFAULT_AVATAR_ID;

  const { state } = await mutateGame(found.id, (state) => {
    const existing = state.players.find((p) => p.id === opts.profileId);
    if (existing) {
      if (existing.kicked) throw new Error("You were removed from this game.");
      existing.connected = true;
      if (state.settings.allowNicknames && nickname) existing.nickname = nickname;
      if (state.settings.allowAvatars && opts.avatarId) existing.avatarId = avatarId;
      return true;
    }
    if (state.phase !== "lobby") throw new Error("This game has already started.");
    const active = state.players.filter((p) => !p.kicked);
    if (active.length >= entitlement.plan.maxPlayersPerGame) {
      throw new Error("This game is full.");
    }
    const team =
      gameMode(state.settings) === "team" && state.teams?.length
        ? smallestTeam(state.teams, state.players)
        : null;
    const player: PlayerPublic = {
      id: opts.profileId,
      displayName: opts.realName.trim().slice(0, 80) || "Student",
      nickname: state.settings.allowNicknames ? nickname : null,
      avatarId: state.settings.allowAvatars ? avatarId : null,
      score: 0,
      streak: 0,
      connected: true,
      kicked: false,
      teamId: team?.id ?? null,
    };
    state.players.push(player);
    return true;
  });
  return { state, playerId: opts.profileId };
}

export async function updateHostSettings(
  gameId: string,
  hostProfileId: string,
  patch: Partial<GameSettings>,
): Promise<LiveGameState> {
  const entitlement = await getEntitlement(hostProfileId);
  const { state } = await mutateGame(gameId, (state) => {
    if (state.hostProfileId !== hostProfileId) throw new Error("Game not found.");
    if (state.phase !== "lobby") {
      throw new Error("Settings can only be changed in the lobby.");
    }
    if (patch.allowNicknames !== undefined) {
      state.settings.allowNicknames = patch.allowNicknames;
    }
    if (patch.allowAvatars !== undefined) {
      state.settings.allowAvatars = patch.allowAvatars;
    }
    if (patch.musicEnabled !== undefined) {
      state.settings.musicEnabled = entitlement.plan.music && patch.musicEnabled;
    }
    if (patch.theme !== undefined) {
      if (!isThemeId(patch.theme) || !themeAllowed(entitlement.plan, patch.theme)) {
        throw new Error("That theme is included with Plus and Ultra.");
      }
      state.settings.theme = patch.theme;
    }
    let redeal = false;
    if (patch.mode !== undefined && patch.mode !== gameMode(state.settings)) {
      if (!modeAllowed(entitlement.plan, patch.mode)) {
        throw new Error("Team battle is included with Plus and Ultra.");
      }
      state.settings.mode = patch.mode;
      redeal = true;
    }
    if (patch.teamCount !== undefined) {
      state.settings.teamCount = Math.min(4, Math.max(2, patch.teamCount));
      redeal = true;
    }
    if (redeal) dealTeams(state);
    state.musicTrack = trackFor(state);
    return true;
  });
  return state;
}

export type HostAction =
  | { type: "start" }
  | { type: "advance" }
  | { type: "lock" }
  | { type: "reveal" }
  | { type: "leaderboard" }
  | { type: "next" }
  | { type: "skip" }
  | { type: "podium" }
  | { type: "end" }
  | { type: "kick"; playerId: string }
  | { type: "shuffle_teams" }
  | { type: "mute_music"; muted: boolean };

function goNextQuestion(state: LiveGameState) {
  const next = state.questionIndex + 1;
  if (next >= state.questions.length) {
    setPhase(state, "podium");
  } else {
    state.questionIndex = next;
    state.questionStartedAtMs = null;
    setPhase(state, "countdown");
  }
}

function startGame(state: LiveGameState) {
  if (state.phase !== "lobby") throw new Error("This game has already started.");
  if (state.players.filter((p) => !p.kicked).length === 0) {
    throw new Error("Wait for at least one player to join.");
  }
  if (gameMode(state.settings) === "team") {
    // Rebalance (kicks may have unbalanced the lobby).
    dealTeams(state);
  }
  state.questionIndex = 0;
  state.questionStartedAtMs = null;
  setPhase(state, "countdown");
}

export async function hostAction(
  gameId: string,
  hostProfileId: string,
  action: HostAction,
): Promise<LiveGameState> {
  const entitlement =
    action.type === "mute_music" ? await getEntitlement(hostProfileId) : null;

  const { state } = await mutateGame(gameId, (state) => {
    if (state.hostProfileId !== hostProfileId) throw new Error("Game not found.");
    const q = state.questions[state.questionIndex];
    switch (action.type) {
      case "start":
        startGame(state);
        break;
      case "advance": {
        switch (state.phase) {
          case "lobby":
            startGame(state);
            break;
          case "countdown":
          case "question":
          case "lock":
            setPhase(state, "reveal");
            break;
          case "reveal": {
            const last = state.questionIndex >= state.questions.length - 1;
            if (!last && q && isScoredType(q.type)) setPhase(state, "leaderboard");
            else goNextQuestion(state);
            break;
          }
          case "leaderboard":
            goNextQuestion(state);
            break;
          case "podium":
            setPhase(state, "ended");
            break;
          default:
            return false;
        }
        break;
      }
      case "lock":
        if (state.phase !== "question" && state.phase !== "countdown") {
          throw new Error("There’s no question to close right now.");
        }
        setPhase(state, "lock");
        break;
      case "reveal":
        if (!["lock", "question", "countdown"].includes(state.phase)) {
          throw new Error("Results aren’t available yet.");
        }
        setPhase(state, "reveal");
        break;
      case "leaderboard":
        setPhase(state, "leaderboard");
        break;
      case "next":
      case "skip":
        goNextQuestion(state);
        break;
      case "podium":
        setPhase(state, "podium");
        break;
      case "end":
        setPhase(state, "ended");
        break;
      case "kick": {
        const p = state.players.find((x) => x.id === action.playerId);
        if (!p) return false;
        p.kicked = true;
        p.connected = false;
        break;
      }
      case "shuffle_teams": {
        if (state.phase !== "lobby" || gameMode(state.settings) !== "team") {
          return false;
        }
        // Fisher–Yates then deal.
        const arr = state.players;
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j]!, arr[i]!];
        }
        dealTeams(state);
        break;
      }
      case "mute_music": {
        state.settings.musicEnabled = !!entitlement?.plan.music && !action.muted;
        state.musicTrack = trackFor(state);
        break;
      }
      default:
        throw new Error("That action isn’t available right now.");
    }
    return true;
  });
  return state;
}

/**
 * Time-based transitions, run on every poll:
 * countdown (3s) → question → reveal when time is up or everyone answered.
 */
export async function tickGame(gameId: string): Promise<LiveGameState | null> {
  const current = await getGame(gameId);
  if (!current) return null;
  if (current.phase !== "countdown" && current.phase !== "question") {
    return current;
  }
  const { state } = await mutateGame(gameId, (state) => {
    const now = Date.now();
    if (state.phase === "countdown") {
      if (now - state.phaseStartedAtMs < 3000) return false;
      setPhase(state, "question");
      state.questionStartedAtMs = now;
      return true;
    }
    if (state.phase === "question" && state.questionStartedAtMs) {
      const q = state.questions[state.questionIndex];
      if (!q) return false;
      if (now - state.questionStartedAtMs >= q.timeLimitSec * 1000 + 400) {
        setPhase(state, "reveal");
        return true;
      }
      const active = state.players.filter((p) => !p.kicked);
      if (active.length > 0) {
        const answered = new Set(
          state.answers.filter((a) => a.questionId === q.id).map((a) => a.playerId),
        );
        if (active.every((p) => answered.has(p.id))) {
          setPhase(state, "reveal");
          return true;
        }
      }
    }
    return false;
  });
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
  streakBonus: number;
  state: LiveGameState;
}> {
  await tickGame(opts.gameId);
  const { state, result } = await mutateGame(opts.gameId, (state) => {
    if (state.phase !== "question") throw new Error("Time’s up. Answers are closed.");
    const player = state.players.find((p) => p.id === opts.playerId && !p.kicked);
    if (!player) throw new Error("You’re not in this game.");
    const question = state.questions[state.questionIndex];
    if (!question) throw new Error("There’s no active question right now.");
    if (
      state.answers.some(
        (a) => a.playerId === opts.playerId && a.questionId === question.id,
      )
    ) {
      throw new Error("You’ve already answered this question.");
    }
    const now = Date.now();
    const responseMs = Math.max(0, now - (state.questionStartedAtMs ?? now));
    const correct = gradeAnswer(question, opts.payload);
    const { points, streakBonus } = awardPoints(
      question,
      correct,
      responseMs,
      gameMode(state.settings),
      player.streak ?? 0,
    );
    const record: LiveAnswerRecord = {
      playerId: opts.playerId,
      questionId: question.id,
      payload: opts.payload,
      correct,
      pointsAwarded: points,
      streakBonus,
      answeredAtMs: now,
      responseMs,
    };
    state.answers.push(record);
    player.score += points;
    if (correct === true) player.streak = (player.streak ?? 0) + 1;
    else if (correct === false) player.streak = 0;
    return { correct, pointsAwarded: points, streak: player.streak ?? 0, streakBonus };
  });
  if (!result) throw new Error("Could not save your answer. Try again.");
  return { ...result, state };
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
    mode: string;
    questionCount: number;
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
      mode: gameMode(s.settings),
      questionCount: s.questions.length,
      createdAt: r.createdAt.toISOString(),
      endedAt: r.endedAt?.toISOString() ?? null,
    };
  });
}

export { newBlankQuestion } from "@/lib/blitz/blank-question";
export { playabilityIssue };
