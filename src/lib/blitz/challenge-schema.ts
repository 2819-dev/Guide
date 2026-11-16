/**
 * Blitz self-paced challenges: a teacher assigns a quiz snapshot to one of
 * their classes with a deadline; each student plays solo once.
 *
 * Tables are created at runtime (ensureChallengeSchema) because production
 * migrations can't be run by hand. drizzle/0015_blitz_challenges.sql mirrors
 * the same DDL for the record.
 */
import { sql } from "drizzle-orm";
import {
  integer,
  jsonb,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { getDb } from "@/lib/db";

export const blitzChallenges = pgTable("blitz_challenges", {
  id: uuid("id").defaultRandom().primaryKey(),
  /** Source quiz (no FK: the quiz may be edited/deleted; questions are snapshotted). */
  quizId: uuid("quiz_id"),
  ownerProfileId: uuid("owner_profile_id").notNull(),
  classroomId: uuid("classroom_id").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  questions: jsonb("questions").notNull().default([]),
  /** { mode: "classic" | "accuracy", theme } */
  settings: jsonb("settings").notNull().default({}),
  dueAt: timestamp("due_at", { withTimezone: true }),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const blitzChallengeAttempts = pgTable(
  "blitz_challenge_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    challengeId: uuid("challenge_id").notNull(),
    profileId: uuid("profile_id").notNull(),
    displayName: varchar("display_name", { length: 120 }).notNull(),
    /** { index, questionStartedAtMs, streak, answers: [...] } */
    state: jsonb("state").notNull().default({}),
    score: integer("score").notNull().default(0),
    correctCount: integer("correct_count").notNull().default(0),
    answeredCount: integer("answered_count").notNull().default(0),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("blitz_challenge_attempt_unique").on(t.challengeId, t.profileId),
  ],
);

let ready: Promise<void> | null = null;

export function ensureChallengeSchema(): Promise<void> {
  ready ??= (async () => {
    const db = getDb();
    await db.execute(sql`CREATE TABLE IF NOT EXISTS blitz_challenges (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      quiz_id uuid,
      owner_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      classroom_id uuid NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
      title varchar(200) NOT NULL,
      questions jsonb NOT NULL DEFAULT '[]'::jsonb,
      settings jsonb NOT NULL DEFAULT '{}'::jsonb,
      due_at timestamptz,
      closed_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now()
    )`);
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS blitz_challenges_classroom_idx ON blitz_challenges (classroom_id)`,
    );
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS blitz_challenges_owner_idx ON blitz_challenges (owner_profile_id)`,
    );
    await db.execute(sql`CREATE TABLE IF NOT EXISTS blitz_challenge_attempts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      challenge_id uuid NOT NULL REFERENCES blitz_challenges(id) ON DELETE CASCADE,
      profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      display_name varchar(120) NOT NULL,
      state jsonb NOT NULL DEFAULT '{}'::jsonb,
      score integer NOT NULL DEFAULT 0,
      correct_count integer NOT NULL DEFAULT 0,
      answered_count integer NOT NULL DEFAULT 0,
      started_at timestamptz NOT NULL DEFAULT now(),
      finished_at timestamptz
    )`);
    await db.execute(
      sql`CREATE UNIQUE INDEX IF NOT EXISTS blitz_challenge_attempt_unique ON blitz_challenge_attempts (challenge_id, profile_id)`,
    );
  })().catch((e) => {
    ready = null;
    throw e;
  });
  return ready;
}
