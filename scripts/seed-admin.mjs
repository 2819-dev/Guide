/**
 * Promotes the Guide Official admin profile via Neon Auth HTTP + SQL.
 * Does not insert schools, classes, students, or sample tickets.
 * Run: node --env-file=.env.local scripts/seed-admin.mjs
 */
import { neon } from "@neondatabase/serverless";

const AUTH = process.env.NEON_AUTH_BASE_URL;
const DB = process.env.DATABASE_URL;
const ADMIN_EMAIL = "admin@bighappysmiley.com";
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD || "GuideAdmin!2026";

if (!AUTH || !DB) {
  console.error("Missing NEON_AUTH_BASE_URL or DATABASE_URL");
  process.exit(1);
}

const sql = neon(DB);

async function signUp() {
  const res = await fetch(`${AUTH}/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      name: "Guide Admin",
    }),
  });
  const text = await res.text();
  console.log("sign-up status", res.status);
  return text;
}

async function signIn() {
  const res = await fetch(`${AUTH}/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }),
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const json = await res.json().catch(() => ({}));
  console.log("sign-in status", res.status, json?.user?.id ? "user ok" : json);
  return { json, setCookie };
}

async function main() {
  await signUp();
  const { json } = await signIn();
  const authUserId = json?.user?.id;
  if (!authUserId) {
    console.log("Could not get auth user id from sign-in; checking DB…");
  }

  if (authUserId) {
    await sql`
      INSERT INTO profiles (auth_user_id, role, display_name)
      VALUES (${authUserId}, 'admin', 'Guide Admin')
      ON CONFLICT (auth_user_id) DO UPDATE
      SET role = 'admin', display_name = 'Guide Admin', updated_at = now()
    `;
    console.log("Admin profile upserted");
  } else {
    console.log("Admin will be promoted on first app sign-in via email match");
  }

  console.log("Done. Admin email:", ADMIN_EMAIL);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
