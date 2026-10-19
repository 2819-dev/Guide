# Guide

Consumer-facing Gemara study site for **Bava Metzia** — especially **אלו מציאות (Eilu Metzios)**.

Students pick a daf, read Hebrew/English from Sefaria, quiz themselves on the page, and can upload after-school notes for a notes-based quiz.

## Stack

- Next.js (App Router) + Tailwind
- Neon Postgres (Drizzle ORM)
- Deployed on Vercel — production domain `guide.rhfd.net`

## Local setup

```bash
cp .env.example .env.local
# set DATABASE_URL (+ optional DATABASE_URL_UNPOOLED)
npm install
npm run db:push   # or apply drizzle/0000_init.sql
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Flows

1. **Landing** → Study / start at 21a  
2. **Daf picker** → open a page  
3. **Read** Gemara → **upload notes** → **quiz** (daf / notes / mixed)
