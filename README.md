# Guide

**Guide** is a Clever-like **school identity platform** (Student · Teacher or School Administrator · Guide Official). Apps launch from portals — not the top bar.

**Amud** (Mishnayos and Gemara · Test Yourself) is a separate public site; schools can also add it as a Guide class app.

Brand lockup is **Guide** only (wordmark). There is no separate “Guide Education” product brand — school apply and the teacher panel live under Guide (`/education` routes for teachers).

## Roles

- **Student** — school portal, My apps, messages, Suggestions
- **Teacher / School Administrator** — apply → teacher portal (`/education/panel`)
- **Guide Official** — school approvals, Roles, scan credentials

## Stack

Next.js · Neon Postgres + Neon Auth · Vercel

## Local

```bash
cp .env.example .env.local
# DATABASE_URL, NEON_AUTH_BASE_URL, NEON_AUTH_COOKIE_SECRET
npm install
npm run db:migrate   # or apply drizzle/*.sql
npm run dev
```
