-- Force password change gate (Guide Official first login, etc.)
ALTER TABLE "profiles"
  ADD COLUMN IF NOT EXISTS "must_change_password" boolean NOT NULL DEFAULT false;
