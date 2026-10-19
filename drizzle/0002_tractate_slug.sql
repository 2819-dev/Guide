-- Scope study progress / notes / quizzes to a tractate (multi-masechta ready)

ALTER TABLE study_notes
  ADD COLUMN IF NOT EXISTS tractate_slug varchar(64) NOT NULL DEFAULT 'bava-metzia';

ALTER TABLE progress
  ADD COLUMN IF NOT EXISTS tractate_slug varchar(64) NOT NULL DEFAULT 'bava-metzia';

ALTER TABLE quiz_sessions
  ADD COLUMN IF NOT EXISTS tractate_slug varchar(64) NOT NULL DEFAULT 'bava-metzia';

DROP INDEX IF EXISTS progress_profile_daf_idx;
CREATE UNIQUE INDEX IF NOT EXISTS progress_profile_tractate_daf_idx
  ON progress (profile_id, tractate_slug, daf_id);
