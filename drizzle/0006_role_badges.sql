-- Discord-style Official Roles (distinct from school scan credentials)

CREATE TABLE IF NOT EXISTS "role_badges" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(80) NOT NULL,
  "slug" varchar(100) NOT NULL,
  "color" varchar(7) DEFAULT '#245239' NOT NULL,
  "icon_url" text,
  "icon_mime" varchar(64),
  "created_by_profile_id" uuid NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "role_badges_slug_idx" ON "role_badges" ("slug");
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "role_badges" ADD CONSTRAINT "role_badges_created_by_profile_id_profiles_id_fk"
   FOREIGN KEY ("created_by_profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "role_badge_assignments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "role_badge_id" uuid NOT NULL,
  "profile_id" uuid NOT NULL,
  "assigned_by_profile_id" uuid NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "role_badge_assignments" ADD CONSTRAINT "role_badge_assignments_role_badge_id_role_badges_id_fk"
   FOREIGN KEY ("role_badge_id") REFERENCES "public"."role_badges"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "role_badge_assignments" ADD CONSTRAINT "role_badge_assignments_profile_id_profiles_id_fk"
   FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "role_badge_assignments" ADD CONSTRAINT "role_badge_assignments_assigned_by_profile_id_profiles_id_fk"
   FOREIGN KEY ("assigned_by_profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "role_badge_assignment_unique"
  ON "role_badge_assignments" ("role_badge_id", "profile_id");
