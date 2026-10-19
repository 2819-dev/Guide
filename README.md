# Guide

Consumer **Mishnayos and Gemara** study — calm dapim, quizzes, and notes — with **Guide for Education** for Rebbeim on a separate `/education` surface.

Bava Metzia (בבא מציעא), including אלו מציאות, is the first available tractate. More masechtot will open in the catalog as content is added.

Brand lockup is **Guide** only (logo mark + wordmark). Supporting copy says “Mishnayos and Gemara.”

## Roles

- **Customer** — study, notes, quizzes
- **Rebbe** — Education landing + Rebbe panel (`/education/panel`)
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
