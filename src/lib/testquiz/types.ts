/**
 * Kahoot-parity live question types (help center live set).
 * Multi-select is a flag on `quiz`, not a separate type.
 */

export const TESTQUIZ_QUESTION_TYPES = [
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

export type TestQuizQuestionType = (typeof TESTQUIZ_QUESTION_TYPES)[number];

/** Free-plan core types (always editable). */
export const TESTQUIZ_CORE_TYPES: TestQuizQuestionType[] = [
  "quiz",
  "true_false",
];

export const TESTQUIZ_TYPE_LABEL: Record<TestQuizQuestionType, string> = {
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
export const TESTQUIZ_SCORED_TYPES: TestQuizQuestionType[] = [
  "quiz",
  "true_false",
  "type_answer",
  "puzzle",
  "slider",
  "pin_answer",
];

export type TestQuizChoice = {
  id: string;
  text: string;
  correct?: boolean;
  imageUrl?: string;
};

export type TestQuizQuestion = {
  id: string;
  type: TestQuizQuestionType;
  prompt: string;
  /** Optional image / media URL */
  mediaUrl?: string;
  timeLimitSec: number;
  /** 0 | 1000 | 2000 — Kahoot-style base points */
  points: 0 | 1000 | 2000;
  /** Quiz: allow selecting more than one correct answer */
  multiSelect?: boolean;
  choices?: TestQuizChoice[];
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

export type TestQuizDocument = {
  id: string;
  title: string;
  description: string;
  ownerProfileId: string;
  classroomId: string | null;
  questions: TestQuizQuestion[];
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
export type TestQuizDiscoverCard = {
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

export type GameSettings = {
  allowNicknames: boolean;
  allowAvatars: boolean;
  musicEnabled: boolean;
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
  questions: TestQuizQuestion[];
  players: PlayerPublic[];
  answers: LiveAnswerRecord[];
  phaseStartedAtMs: number;
  questionStartedAtMs: number | null;
  musicTrack: string | null;
  planWatermark: boolean;
  createdAt: string;
  updatedAt: string;
};
