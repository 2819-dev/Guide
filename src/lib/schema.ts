import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("user_role", [
  "customer",
  "rebbe",
  "moderator",
  "admin",
]);

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authUserId: varchar("auth_user_id", { length: 128 }).notNull(),
    role: roleEnum("role").notNull().default("customer"),
    displayName: varchar("display_name", { length: 120 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("profiles_auth_user_idx").on(t.authUserId)],
);

export const classrooms = pgTable("classrooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  rebbeId: uuid("rebbe_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 160 }).notNull(),
  inviteCode: varchar("invite_code", { length: 16 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const classroomMembers = pgTable(
  "classroom_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    classroomId: uuid("classroom_id")
      .notNull()
      .references(() => classrooms.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("classroom_member_unique").on(t.classroomId, t.studentId),
  ],
);

export const studyNotes = pgTable("study_notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  /** Catalog slug from TRACTATES — e.g. bava-metzia */
  tractateSlug: varchar("tractate_slug", { length: 64 })
    .notNull()
    .default("bava-metzia"),
  dafId: varchar("daf_id", { length: 8 }).notNull(),
  title: varchar("title", { length: 200 }).notNull().default("Study notes"),
  content: text("content").notNull(),
  sourceFilename: varchar("source_filename", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const progress = pgTable(
  "progress",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    tractateSlug: varchar("tractate_slug", { length: 64 })
      .notNull()
      .default("bava-metzia"),
    dafId: varchar("daf_id", { length: 8 }).notNull(),
    visited: boolean("visited").notNull().default(true),
    quizAttempts: integer("quiz_attempts").notNull().default(0),
    bestScore: integer("best_score"),
    lastVisitedAt: timestamp("last_visited_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("progress_profile_tractate_daf_idx").on(
      t.profileId,
      t.tractateSlug,
      t.dafId,
    ),
  ],
);

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
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  tractateSlug: varchar("tractate_slug", { length: 64 })
    .notNull()
    .default("bava-metzia"),
  dafId: varchar("daf_id", { length: 8 }).notNull(),
  mode: varchar("mode", { length: 24 }).notNull(),
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

export const supportTickets = pgTable("support_tickets", {
  id: uuid("id").defaultRandom().primaryKey(),
  ticketNumber: varchar("ticket_number", { length: 20 }).notNull().unique(),
  category: varchar("category", { length: 64 }).notNull(),
  subject: varchar("subject", { length: 200 }).notNull(),
  body: text("body").notNull(),
  status: varchar("status", { length: 32 }).notNull().default("open"),
  /** Opaque code only — never store email/name for admin views */
  reporterCode: varchar("reporter_code", { length: 32 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
