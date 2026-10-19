import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const learners = pgTable("learners", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionToken: varchar("session_token", { length: 64 }).notNull().unique(),
  displayName: varchar("display_name", { length: 120 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const studyNotes = pgTable("study_notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  learnerId: uuid("learner_id")
    .notNull()
    .references(() => learners.id, { onDelete: "cascade" }),
  dafId: varchar("daf_id", { length: 8 }).notNull(),
  title: varchar("title", { length: 200 }).notNull().default("Study notes"),
  content: text("content").notNull(),
  sourceFilename: varchar("source_filename", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const progress = pgTable("progress", {
  id: uuid("id").defaultRandom().primaryKey(),
  learnerId: uuid("learner_id")
    .notNull()
    .references(() => learners.id, { onDelete: "cascade" }),
  dafId: varchar("daf_id", { length: 8 }).notNull(),
  visited: boolean("visited").notNull().default(true),
  quizAttempts: integer("quiz_attempts").notNull().default(0),
  bestScore: integer("best_score"),
  lastVisitedAt: timestamp("last_visited_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type QuizQuestionRecord = {
  id: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
  source: "daf" | "notes" | "mixed";
};

export const quizSessions = pgTable("quiz_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  learnerId: uuid("learner_id")
    .notNull()
    .references(() => learners.id, { onDelete: "cascade" }),
  dafId: varchar("daf_id", { length: 8 }).notNull(),
  mode: varchar("mode", { length: 24 }).notNull(), // daf | notes | mixed
  noteId: uuid("note_id").references(() => studyNotes.id, {
    onDelete: "set null",
  }),
  questions: jsonb("questions").$type<QuizQuestionRecord[]>().notNull(),
  answers: jsonb("answers").$type<(number | null)[]>(),
  score: integer("score"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
