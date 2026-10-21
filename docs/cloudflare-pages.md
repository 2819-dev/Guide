# Cloudflare Pages (Guide)

Production domain: **https://guidelearning.org**  
Host: **Cloudflare Pages** project **`guide`** — not Vercel, not a Workers app deploy.

Stack: **Next.js 15.5.x** + **`@cloudflare/next-on-pages`** (Path A).

Full iOS/dashboard steps (no CLI):

- `/cursor/stores/self/docs/cloudflare-pages.md`
- `/cursor/stores/self/docs/guidelearning-org-dns.md`

## Git-connected Pages settings

| Setting | Value |
| --- | --- |
| Project name | `guide` |
| Build command | `npx @cloudflare/next-on-pages@1` |
| Build output directory | `.vercel/output/static` |
| Compatibility flag | `nodejs_compat` |
| Production URL env | `NEXT_PUBLIC_GUIDE_URL=https://guidelearning.org` |
| Public Amud URL | `NEXT_PUBLIC_AMUD_URL=https://guidelearning.org/amudsite` |

## Local / agent only (not required for the iOS owner)

```bash
npm run pages:build
# After CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID:
npx wrangler pages project create guide --production-branch=main
npx wrangler pages deploy .vercel/output/static --project-name=guide
```

Do **not** use `npx wrangler deploy` (Workers app).

## Email (Zoho + Resend)

Inbox / template compose: **Zoho Mail** on `guidelearning.org` (owns MX).  
Transactional (Neon Auth): **Resend** SMTP — configure in Neon Console; see `.env.example` comments.  
Full DNS order + phone steps: `/cursor/stores/self/docs/guidelearning-email-setup.md`.  
Do **not** enable Cloudflare Email Routing (MX conflict with Zoho).
