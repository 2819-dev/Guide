-- Blitz self-paced challenges (also created idempotently at runtime by
-- src/lib/blitz/challenge-schema.ts → ensureChallengeSchema).
CREATE TABLE IF NOT EXISTS blitz_challenges (
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
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS blitz_challenges_classroom_idx ON blitz_challenges (classroom_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS blitz_challenges_owner_idx ON blitz_challenges (owner_profile_id);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS blitz_challenge_attempts (
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
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS blitz_challenge_attempt_unique ON blitz_challenge_attempts (challenge_id, profile_id);
