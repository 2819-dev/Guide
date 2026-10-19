# Guide

Consumer **Mishnah and Gemara** study — calm dapim, quizzes, and notes — with **Guide for Education** for Rebbeim.

Bava Metzia (בבא מציעא), including אלו מציאות, is the first available tractate. More masechtot will open in the catalog as content is added.

## Roles

- **Customer** — study, notes, quizzes
- **Rebbe** — Education panel, student progress
- **Moderator** — account stub
- **Admin** — support panel (no PII)

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
