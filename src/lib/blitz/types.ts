/**
 * Live question types. Multi-select is a flag on `quiz`, not a separate type.
 */

export const BLITZ_QUESTION_TYPES = [
  "quiz",
  "true_false",
  "type_answer",
  "puzzle",
  "slider",
  "pin_answer",
  "poll",
  "word_cloud",
  "brainstorm",
  "drop_pin",
  "open_ended",
  "scale",
  "nps_scale",
] as const;

export type BlitzQuestionType = (typeof BLITZ_QUESTION_TYPES)[number];

/** Free-plan core types (always editable). */
export const BLITZ_CORE_TYPES: BlitzQuestionType[] = [
  "quiz",
  "true_false",
];

export const BLITZ_TYPE_LABEL: Record<BlitzQuestionType, string> = {
  quiz: "Quiz",
  true_false: "True or false",
  type_answer: "Type answer",
  puzzle: "Puzzle",
  slider: "Slider",
  pin_answer: "Pin answer",
  poll: "Poll",
  word_cloud: "Word cloud",
  brainstorm: "Brainstorm",
  drop_pin: "Drop pin",
  open_ended: "Open-ended",
  scale: "Scale",
  nps_scale: "NPS scale",
};

/** Types that award points / show competitive leaderboard after. */
export const BLITZ_SCORED_TYPES: BlitzQuestionType[] = [
  "quiz",
  "true_false",
  "type_answer",
  "puzzle",
  "slider",
  "pin_answer",
];

export type BlitzChoice = {
  id: string;
  text: string;
  correct?: boolean;
  imageUrl?: string;
};

export type BlitzQuestion = {
  id: string;
  type: BlitzQuestionType;
  prompt: string;
  /** Optional image / media URL */
  mediaUrl?: string;
  timeLimitSec: number;
  /** 0 | 1000 | 2000 base points (2000 = double) */
  points: 0 | 1000 | 2000;
  /** Quiz: allow selecting more than one correct answer */
  multiSelect?: boolean;
  choices?: BlitzChoice[];
  /** Type answer accepted strings */
  acceptedAnswers?: string[];
  /** Puzzle: correct order of choice ids */
  correctOrder?: string[];
  /** Slider / scale */
  sliderMin?: number;
  sliderMax?: number;
  sliderStep?: number;
  sliderCorrect?: number;
  sliderTolerance?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
  /** Pin answer / drop pin — normalized 0–1 coords on media */
  pinX?: number;
  pinY?: number;
  pinRadius?: number;
};

export type BlitzDocument = {
  id: string;
  title: string;
  description: string;
  ownerProfileId: string;
  classroomId: string | null;
  questions: BlitzQuestion[];
  isPublic: boolean;
  publishedAt: string | null;
  category: string;
  tags: string[];
  copyCount: number;
  sourceQuizId: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Public Discover listing card (teacher browse). */
export type BlitzDiscoverCard = {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  questionCount: number;
  copyCount: number;
  publishedAt: string | null;
  ownerDisplayName: string;
  types: string[];
};

export type GamePhase =
  | "lobby"
  | "countdown"
  | "question"
  | "lock"
  | "reveal"
  | "leaderboard"
  | "podium"
  | "ended";

/** How points are awarded in a live game (host picks at start). */
export type BlitzGameMode = "classic" | "accuracy" | "team";

/** Stage theme the host picks per game. Tile colors never change. */
export type BlitzThemeId = "night" | "arcade" | "ocean" | "sunset" | "space";

export type GameSettings = {
  allowNicknames: boolean;
  allowAvatars: boolean;
  musicEnabled: boolean;
  /** Older games stored before modes existed read as "classic". */
  mode?: BlitzGameMode;
  theme?: BlitzThemeId;
  /** Team mode only: 2–4 teams, auto-balanced. */
  teamCount?: number;
};

export type BlitzTeam = {
  id: string;
  name: string;
  color: string;
};

export type PlayerPublic = {
  id: string;
  displayName: string;
  nickname: string | null;
  avatarId: string | null;
  score: number;
  /** Consecutive correct answers this game (scored questions only). */
  streak: number;
  connected: boolean;
  kicked: boolean;
  /** Team mode: assigned team id. */
  teamId?: string | null;
};

export type LiveAnswerPayload = {
  choiceIds?: string[];
  text?: string;
  number?: number;
  order?: string[];
  pinX?: number;
  pinY?: number;
};

export type LiveAnswerRecord = {
  playerId: string;
  questionId: string;
  payload: LiveAnswerPayload;
  correct: boolean | null;
  pointsAwarded: number;
  answeredAtMs: number;
  responseMs: number;
  /** Bonus share of pointsAwarded that came from an answer streak. */
  streakBonus?: number;
};

export type LiveGameState = {
  id: string;
  pin: string;
  quizId: string;
  quizTitle: string;
  hostProfileId: string;
  classroomId: string | null;
  settings: GameSettings;
  phase: GamePhase;
  questionIndex: number;
  questions: BlitzQuestion[];
  players: PlayerPublic[];
  answers: LiveAnswerRecord[];
  /** Team mode teams (empty / missing otherwise). */
  teams?: BlitzTeam[];
  phaseStartedAtMs: number;
  questionStartedAtMs: number | null;
  musicTrack: string | null;
  planWatermark: boolean;
  createdAt: string;
  updatedAt: string;
};
