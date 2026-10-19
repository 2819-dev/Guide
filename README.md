# Guide

Consumer Gemara study for **Bava Metzia** (אלו מציאות), with **Guide for Education** for Rebbeim.

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
npm run dev
```
