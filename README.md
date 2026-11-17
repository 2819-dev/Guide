# Guide

**Guide** is a school platform (in the spirit of Clever): one login for students, a
portal for teachers and school administrators, and learning apps that open from a
student's portal. Live at **https://guidelearning.org**.

## Who uses it

| Role | Where | How they get in |
| --- | --- | --- |
| Student | `/student` | Find their school → sign up / log in → join a class with the class code |
| Teacher | `/education/panel` | Setup link from their school administrator |
| School administrator | `/education/panel` | Apply at `/education` → Guide Official approves |
| Developer partner | `/developer` | Apply at `/developers/apply` |
| Guide Official | `/admin` | Staff accounts only |

Apps live in `src/lib/apps.ts` (TestQuiz, Amud, Arcade Education). Teachers add an
app to a class; students in that class see it under **My apps**.

## Stack

Next.js 15 (edge runtime) · Neon Postgres (HTTP driver) + Neon Auth · Drizzle ·
Tailwind 4 · Resend (email) · Cloudflare Pages via `@cloudflare/next-on-pages`.

## Local development

```bash
cp .env.example .env.local   # fill DATABASE_URL, NEON_AUTH_BASE_URL, NEON_AUTH_COOKIE_SECRET
npm install
npm run dev
```

Point `.env.local` at a **staging** Neon project, never production.

### Database migrations

The SQL files in `drizzle/` are applied in order (`0000` → latest). Only `0000` is in
drizzle's journal, so apply new files by hand (Neon SQL editor or `psql`) — don't rely
on `drizzle-kit migrate`.

## Deploying

Deploys run from GitHub Actions (`.github/workflows/deploy-pages.yml`) with
`wrangler pages deploy` to the Cloudflare **Pages** project `guide` (not Workers).

- Push / merge to `main` → production (guidelearning.org)
- Actions → *Deploy to Cloudflare Pages* → *Run workflow* on another branch → preview URL

One-time setup: add the repository secret `CLOUDFLARE_API_TOKEN`
(Account · Cloudflare Pages · Edit). Runtime secrets (`DATABASE_URL`, Neon Auth,
`RESEND_API_KEY`, `ANTHROPIC_API_KEY` for the Guide Assistant live chat) live in the Pages project settings, not in GitHub.

## Checks

```bash
npx eslint .
npx tsc --noEmit
```
