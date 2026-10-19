-- Profiles, classrooms, support (replaces anonymous learners)

DROP TABLE IF EXISTS quiz_sessions CASCADE;
DROP TABLE IF EXISTS progress CASCADE;
DROP TABLE IF EXISTS study_notes CASCADE;
DROP TABLE IF EXISTS learners CASCADE;
DROP TABLE IF EXISTS classroom_members CASCADE;
DROP TABLE IF EXISTS classrooms CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

CREATE TYPE user_role AS ENUM ('customer', 'rebbe', 'moderator', 'admin');

CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  auth_user_id varchar(128) NOT NULL,
  role user_role NOT NULL DEFAULT 'customer',
  display_name varchar(120) NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX profiles_auth_user_idx ON profiles (auth_user_id);

CREATE TABLE classrooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  rebbe_id uuid NOT NULL REFERENCES profiles(id) ON DELETE cascade,
  name varchar(160) NOT NULL,
  invite_code varchar(16) NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE classroom_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  classroom_id uuid NOT NULL REFERENCES classrooms(id) ON DELETE cascade,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE cascade,
  joined_at timestamptz DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX classroom_member_unique ON classroom_members (classroom_id, student_id);

CREATE TABLE study_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE cascade,
  daf_id varchar(8) NOT NULL,
  title varchar(200) DEFAULT 'Study notes' NOT NULL,
  content text NOT NULL,
  source_filename varchar(255),
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE cascade,
  daf_id varchar(8) NOT NULL,
  visited boolean DEFAULT true NOT NULL,
  quiz_attempts integer DEFAULT 0 NOT NULL,
  best_score integer,
  last_visited_at timestamptz DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX progress_profile_daf_idx ON progress (profile_id, daf_id);

CREATE TABLE quiz_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE cascade,
  daf_id varchar(8) NOT NULL,
  mode varchar(24) NOT NULL,
  note_id uuid REFERENCES study_notes(id) ON DELETE set null,
  questions jsonb NOT NULL,
  answers jsonb,
  score integer,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  ticket_number varchar(20) NOT NULL UNIQUE,
  category varchar(64) NOT NULL,
  subject varchar(200) NOT NULL,
  body text NOT NULL,
  status varchar(32) DEFAULT 'open' NOT NULL,
  reporter_code varchar(32) NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
