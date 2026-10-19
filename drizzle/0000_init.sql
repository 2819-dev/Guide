CREATE TABLE IF NOT EXISTS "learners" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "session_token" varchar(64) NOT NULL UNIQUE,
  "display_name" varchar(120),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "last_seen_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "study_notes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "learner_id" uuid NOT NULL REFERENCES "learners"("id") ON DELETE cascade,
  "daf_id" varchar(8) NOT NULL,
  "title" varchar(200) DEFAULT 'Study notes' NOT NULL,
  "content" text NOT NULL,
  "source_filename" varchar(255),
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "progress" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "learner_id" uuid NOT NULL REFERENCES "learners"("id") ON DELETE cascade,
  "daf_id" varchar(8) NOT NULL,
  "visited" boolean DEFAULT true NOT NULL,
  "quiz_attempts" integer DEFAULT 0 NOT NULL,
  "best_score" integer,
  "last_visited_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "quiz_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "learner_id" uuid NOT NULL REFERENCES "learners"("id") ON DELETE cascade,
  "daf_id" varchar(8) NOT NULL,
  "mode" varchar(24) NOT NULL,
  "note_id" uuid REFERENCES "study_notes"("id") ON DELETE set null,
  "questions" jsonb NOT NULL,
  "answers" jsonb,
  "score" integer,
  "completed_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "progress_learner_daf_idx"
  ON "progress" ("learner_id", "daf_id");

CREATE INDEX IF NOT EXISTS "study_notes_learner_daf_idx"
  ON "study_notes" ("learner_id", "daf_id");

CREATE INDEX IF NOT EXISTS "quiz_sessions_learner_idx"
  ON "quiz_sessions" ("learner_id", "created_at");
