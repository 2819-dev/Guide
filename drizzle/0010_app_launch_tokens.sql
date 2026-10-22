CREATE TABLE IF NOT EXISTS "app_launch_tokens" (
  "jti" varchar(80) PRIMARY KEY NOT NULL,
  "profile_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE cascade,
  "app_slug" varchar(64) NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "redeemed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
