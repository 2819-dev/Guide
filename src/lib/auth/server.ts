import { createNeonAuth } from "@neondatabase/auth/next/server";

const cookieSecret =
  process.env.NEON_AUTH_COOKIE_SECRET?.trim() ||
  // Build-time / misconfig fallback — runtime Pages must set a real secret.
  "guide-pages-missing-neon-auth-cookie-secret-set-me";

export const auth = createNeonAuth({
  baseUrl:
    process.env.NEON_AUTH_BASE_URL?.trim() ||
    "https://invalid.neonauth.local/auth",
  cookies: {
    secret: cookieSecret,
  },
});
