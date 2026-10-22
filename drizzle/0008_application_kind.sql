ALTER TABLE "school_applications" ADD COLUMN IF NOT EXISTS "kind" varchar(24) DEFAULT 'school' NOT NULL;
ALTER TABLE "school_applications" ADD COLUMN IF NOT EXISTS "class_name" varchar(160);
