CREATE TABLE IF NOT EXISTS "classroom_app_installs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "classroom_id" uuid NOT NULL REFERENCES "classrooms"("id") ON DELETE cascade,
  "app_slug" varchar(64) NOT NULL,
  "installed_by_profile_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE cascade,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "classroom_app_install_unique"
  ON "classroom_app_installs" ("classroom_id", "app_slug");
