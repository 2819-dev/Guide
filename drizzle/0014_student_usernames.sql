-- Teacher-created student accounts (username login) and password help.
-- Also applied automatically at runtime by ensureStudentAccountSchema().
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username varchar(40);
CREATE UNIQUE INDEX IF NOT EXISTS profiles_school_username_idx ON profiles (school_id, username) WHERE username IS NOT NULL;
CREATE TABLE IF NOT EXISTS password_reset_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status varchar(16) NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES profiles(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS password_reset_requests_student_idx ON password_reset_requests (student_id, status);
