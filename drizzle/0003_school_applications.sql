CREATE TABLE IF NOT EXISTS "school_applications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "school_name" varchar(200) NOT NULL,
  "contact_name" varchar(120) NOT NULL,
  "contact_email" varchar(254) NOT NULL,
  "contact_role" varchar(120) NOT NULL,
  "student_count_estimate" varchar(64) NOT NULL,
  "intended_use" text NOT NULL,
  "status" varchar(24) DEFAULT 'pending' NOT NULL,
  "applicant_profile_id" uuid,
  "review_note" text,
  "reviewed_by_profile_id" uuid,
  "reviewed_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "school_applications" ADD CONSTRAINT "school_applications_applicant_profile_id_profiles_id_fk" FOREIGN KEY ("applicant_profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "school_applications" ADD CONSTRAINT "school_applications_reviewed_by_profile_id_profiles_id_fk" FOREIGN KEY ("reviewed_by_profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
