# Cloudflare Pages (Guide)

Production domain: **https://guidelearning.org**  
Host: **Cloudflare Pages** project **`guide`** — not Vercel, not a Workers app deploy.

Full assessment + DNS checklist live in the agent store:

- `/cursor/stores/self/docs/cloudflare-pages.md`
- `/cursor/stores/self/docs/guidelearning-org-dns.md`

## Dashboard (required until API token is available)

1. Cloudflare → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → `2819-dev/Guide`
2. Project name: `guide`
3. Custom domains: `guidelearning.org`, `www.guidelearning.org` (www → apex)
4. Env vars: see store doc (`DATABASE_URL`, Neon Auth, `NEXT_PUBLIC_GUIDE_URL=https://guidelearning.org`, …)

## Important constraint

This app is **Next.js 16** with API routes + Neon. Official Pages “static Next.js” preset is **wrong**. `@cloudflare/next-on-pages` only peers Next ≤15.5.2. OpenNext/vinext target **Workers** (out of scope unless product allows). See store assessment for path A/B.

## CLI (Pages only)

```bash
# After CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID
npx wrangler pages project create guide --production-branch=main
# Do NOT use: npx wrangler deploy
```
