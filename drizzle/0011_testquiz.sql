-- Guide TestQuiz: entitlements, quiz library, live games

CREATE TABLE IF NOT EXISTS "testquiz_entitlements" (
  "profile_id" uuid PRIMARY KEY NOT NULL REFERENCES "profiles"("id") ON DELETE cascade,
  "plan_id" varchar(16) NOT NULL DEFAULT 'free',
  "live_games_used_this_month" integer NOT NULL DEFAULT 0,
  "usage_month" varchar(7) NOT NULL DEFAULT '',
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "testquiz_quizzes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_profile_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE cascade,
  "classroom_id" uuid REFERENCES "classrooms"("id") ON DELETE set null,
  "title" varchar(200) NOT NULL,
  "description" text NOT NULL DEFAULT '',
  "questions" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "testquiz_games" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "pin" varchar(6) NOT NULL,
  "quiz_id" uuid NOT NULL REFERENCES "testquiz_quizzes"("id") ON DELETE cascade,
  "host_profile_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE cascade,
  "classroom_id" uuid REFERENCES "classrooms"("id") ON DELETE set null,
  "phase" varchar(24) NOT NULL DEFAULT 'lobby',
  "state" jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "ended_at" timestamp with time zone
);

-- Only one non-ended game may hold a PIN at a time.
CREATE UNIQUE INDEX IF NOT EXISTS "testquiz_games_pin_active_idx"
  ON "testquiz_games" ("pin")
  WHERE "ended_at" IS NULL;

CREATE INDEX IF NOT EXISTS "testquiz_quizzes_owner_idx"
  ON "testquiz_quizzes" ("owner_profile_id");

CREATE INDEX IF NOT EXISTS "testquiz_games_host_idx"
  ON "testquiz_games" ("host_profile_id");
