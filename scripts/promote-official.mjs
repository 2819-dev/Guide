/**
 * Promote hf@guidelearning.org to Guide Official (admin) + force password change.
 * Does NOT print or set passwords — Neon Auth user is created separately.
 *
 * Run: node --env-file=.env.local scripts/promote-official.mjs
 */
import { neon } from "@neondatabase/serverless";

const DB = process.env.DATABASE_URL;
const OFFICIAL_EMAIL = "hf@guidelearning.org";

if (!DB) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const sql = neon(DB);

async function main() {
  await sql`
    ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false
  `;

  const updated = await sql`
    UPDATE profiles
    SET
      role = 'admin',
      must_change_password = true,
      login_email = ${OFFICIAL_EMAIL},
      display_name = CASE
        WHEN display_name IS NULL OR display_name = '' OR display_name = 'Learner'
          THEN 'Guide Official'
        ELSE display_name
      END,
      updated_at = now()
    WHERE lower(coalesce(login_email, '')) = ${OFFICIAL_EMAIL}
    RETURNING id, role, login_email, must_change_password
  `;

  if (updated.length === 0) {
    console.log(
      "No profile row yet for",
      OFFICIAL_EMAIL,
      "— first Guide sign-in will create admin + mustChangePassword via ensureProfile.",
    );
  } else {
    console.log("Official profile updated:", updated.length, "row(s)");
  }
  console.log("Done. Email:", OFFICIAL_EMAIL);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
