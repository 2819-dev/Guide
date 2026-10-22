-- Approved schools for Clever-style student login + student badge fields

CREATE TABLE IF NOT EXISTS "schools" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(200) NOT NULL,
  "slug" varchar(120) NOT NULL,
  "application_id" uuid,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "schools_slug_idx" ON "schools" ("slug");
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schools" ADD CONSTRAINT "schools_application_id_school_applications_id_fk"
   FOREIGN KEY ("application_id") REFERENCES "public"."school_applications"("id")
   ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "school_id" uuid;
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "badge_code" varchar(32);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "login_email" varchar(254);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "badge_auth_user_id" varchar(128);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "profiles_badge_code_idx" ON "profiles" ("badge_code");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "profiles_badge_auth_user_idx" ON "profiles" ("badge_auth_user_id");
