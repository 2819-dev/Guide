-- TestQuiz Discover: teachers can publish quizzes for other teachers to browse/copy

ALTER TABLE "testquiz_quizzes"
  ADD COLUMN IF NOT EXISTS "is_public" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "published_at" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "category" varchar(64) NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS "tags" jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "copy_count" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "source_quiz_id" uuid REFERENCES "testquiz_quizzes"("id") ON DELETE set null;

CREATE INDEX IF NOT EXISTS "testquiz_quizzes_public_idx"
  ON "testquiz_quizzes" ("is_public", "published_at" DESC)
  WHERE "is_public" = true;

CREATE INDEX IF NOT EXISTS "testquiz_quizzes_category_idx"
  ON "testquiz_quizzes" ("category")
  WHERE "is_public" = true;
