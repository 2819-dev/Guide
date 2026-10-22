-- Guide product refine: meetings, teacher invites, developer partners
CREATE TABLE IF NOT EXISTS "meeting_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "contact_name" varchar(120) NOT NULL,
  "contact_email" varchar(254) NOT NULL,
  "organization" varchar(200) NOT NULL,
  "contact_role" varchar(120) NOT NULL,
  "message" text DEFAULT '' NOT NULL,
  "preferred_time" varchar(200),
  "status" varchar(24) DEFAULT 'pending' NOT NULL,
  "review_note" text,
  "reviewed_by_profile_id" uuid REFERENCES "profiles"("id") ON DELETE SET NULL,
  "reviewed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "teacher_invites" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" varchar(254) NOT NULL,
  "school_id" uuid REFERENCES "schools"("id") ON DELETE SET NULL,
  "school_name" varchar(200) NOT NULL,
  "invited_by_profile_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "token" varchar(64) NOT NULL,
  "status" varchar(24) DEFAULT 'pending' NOT NULL,
  "accepted_profile_id" uuid REFERENCES "profiles"("id") ON DELETE SET NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "sent_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "teacher_invites_token_idx" ON "teacher_invites" ("token");

CREATE TABLE IF NOT EXISTS "developer_applications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "contact_name" varchar(120) NOT NULL,
  "contact_email" varchar(254) NOT NULL,
  "organization" varchar(200) NOT NULL,
  "website_url" varchar(500) NOT NULL,
  "app_name" varchar(160) NOT NULL,
  "app_about" text NOT NULL,
  "status" varchar(24) DEFAULT 'pending' NOT NULL,
  "applicant_profile_id" uuid REFERENCES "profiles"("id") ON DELETE SET NULL,
  "review_note" text,
  "reviewed_by_profile_id" uuid REFERENCES "profiles"("id") ON DELETE SET NULL,
  "reviewed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "developer_apps" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_profile_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "application_id" uuid REFERENCES "developer_applications"("id") ON DELETE SET NULL,
  "name" varchar(160) NOT NULL,
  "slug" varchar(64) NOT NULL,
  "website_url" varchar(500),
  "about" text DEFAULT '' NOT NULL,
  "status" varchar(24) DEFAULT 'active' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "developer_apps_slug_idx" ON "developer_apps" ("slug");
