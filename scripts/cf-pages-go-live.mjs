#!/usr/bin/env node
/**
 * Agent-only: create/configure/deploy Cloudflare Pages project `guide`.
 * Requires CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID in the environment.
 * Never prints secret values. Does not use wrangler deploy (Workers).
 */
import { spawnSync } from "node:child_process";
import { existsSync, writeFileSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";

const PROJECT = "guide";
const ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID;
const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ROOT = resolve(process.cwd());
const OUT = resolve(ROOT, ".vercel/output/static");
const PROD_BRANCH = "cursor/guidelearning-org-domain-f0c5";

function die(msg) {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

if (!TOKEN || !ACCOUNT) {
  die("CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID must be set");
}

async function cf(method, path, body) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    const err = JSON.stringify(json.errors || json || { status: res.status });
    throw new Error(`${method} ${path} → ${res.status} ${err}`);
  }
  return json.result;
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: "utf8",
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
    ...opts,
  });
  if (r.status !== 0) {
    die(`${cmd} ${args.join(" ")}\n${r.stdout}\n${r.stderr}`);
  }
  return (r.stdout || "") + (r.stderr || "");
}

function envFromProcess() {
  const required = [
    "DATABASE_URL",
    "DATABASE_URL_UNPOOLED",
    "NEON_AUTH_BASE_URL",
    "NEON_AUTH_COOKIE_SECRET",
    "NEON_AUTH_JWKS_URL",
  ];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) die(`Missing Neon/Guide env: ${missing.join(", ")}`);

  const guideUrl =
    process.env.NEXT_PUBLIC_GUIDE_URL || "https://guidelearning.org";
  const site = process.env.NEXT_PUBLIC_SITE || "guide";
  // Prefer env; else known Amud host from invite copy (do not invent a new one).
  const amud =
    process.env.NEXT_PUBLIC_AMUD_URL ||
    "https://amud-big-happy-smiley.vercel.app";

  return {
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED,
    NEON_AUTH_BASE_URL: process.env.NEON_AUTH_BASE_URL,
    NEON_AUTH_COOKIE_SECRET: process.env.NEON_AUTH_COOKIE_SECRET,
    NEON_AUTH_JWKS_URL: process.env.NEON_AUTH_JWKS_URL,
    NEXT_PUBLIC_SITE: site,
    NEXT_PUBLIC_GUIDE_URL: guideUrl,
    NEXT_PUBLIC_AMUD_URL: amud,
    NODE_VERSION: "22",
  };
}

function toPagesEnvVars(map) {
  /** @type {Record<string, { type: string, value: string }>} */
  const out = {};
  for (const [key, value] of Object.entries(map)) {
    const secret =
      key.includes("SECRET") ||
      key.includes("DATABASE") ||
      key.includes("COOKIE");
    out[key] = { type: secret ? "secret_text" : "plain_text", value };
  }
  return out;
}

async function ensureProject() {
  try {
    const list = await cf("GET", `/accounts/${ACCOUNT}/pages/projects`);
    const existing = (list || []).find((p) => p.name === PROJECT);
    if (existing) {
      ok(`Pages project already exists: ${PROJECT}`);
      return existing;
    }
  } catch (e) {
    console.warn(`WARN: list projects: ${e.message}`);
  }

  // Direct-upload project (API token path). Git connect can be added in dashboard later.
  try {
    const created = await cf("POST", `/accounts/${ACCOUNT}/pages/projects`, {
      name: PROJECT,
      production_branch: PROD_BRANCH,
      deployment_configs: {
        production: {
          compatibility_date: "2024-09-23",
          compatibility_flags: ["nodejs_compat"],
          env_vars: toPagesEnvVars(envFromProcess()),
        },
        preview: {
          compatibility_date: "2024-09-23",
          compatibility_flags: ["nodejs_compat"],
          env_vars: toPagesEnvVars(envFromProcess()),
        },
      },
    });
    ok(`Created Pages project ${PROJECT}`);
    return created;
  } catch (e) {
    // Fallback: wrangler create then PATCH env
    console.warn(`WARN: API create failed (${e.message}); trying wrangler`);
    run("npx", [
      "wrangler",
      "pages",
      "project",
      "create",
      PROJECT,
      `--production-branch=${PROD_BRANCH}`,
      "--compatibility-flags=nodejs_compat",
      "--compatibility-date=2024-09-23",
    ]);
    ok(`Created via wrangler: ${PROJECT}`);
    return await cf("GET", `/accounts/${ACCOUNT}/pages/projects/${PROJECT}`);
  }
}

async function patchEnvAndFlags() {
  const envVars = toPagesEnvVars(envFromProcess());
  await cf("PATCH", `/accounts/${ACCOUNT}/pages/projects/${PROJECT}`, {
    production_branch: PROD_BRANCH,
    deployment_configs: {
      production: {
        compatibility_date: "2024-09-23",
        compatibility_flags: ["nodejs_compat"],
        env_vars: envVars,
      },
      preview: {
        compatibility_date: "2024-09-23",
        compatibility_flags: ["nodejs_compat"],
        env_vars: envVars,
      },
    },
  });
  ok("Patched env vars + nodejs_compat (values not logged)");
}

async function ensureBuild() {
  if (!existsSync(resolve(OUT, "_worker.js/index.js"))) {
    ok("Running pages:build…");
    run("npm", ["run", "pages:build"], { stdio: "inherit" });
  } else {
    ok("Using existing .vercel/output/static");
  }
}

async function deploy() {
  const out = run("npx", [
    "wrangler",
    "pages",
    "deploy",
    OUT,
    `--project-name=${PROJECT}`,
    `--branch=${PROD_BRANCH}`,
    "--commit-dirty=true",
  ]);
  console.log(out.trim().split("\n").slice(-20).join("\n"));
  ok("Deploy finished");
}

async function attachDomain(name) {
  try {
    await cf(
      "POST",
      `/accounts/${ACCOUNT}/pages/projects/${PROJECT}/domains`,
      { name },
    );
    ok(`Attached custom domain ${name}`);
  } catch (e) {
    const msg = e.message || "";
    if (/already|exists|duplicate/i.test(msg)) {
      ok(`Domain already attached: ${name}`);
      return;
    }
    console.warn(`WARN: domain ${name}: ${msg}`);
  }
}

async function smoke(url) {
  const res = await fetch(url, { redirect: "follow" });
  const text = await res.text();
  const looksOk =
    res.ok &&
    (text.includes("Guide") ||
      text.includes("guide") ||
      text.includes("<!DOCTYPE html") ||
      text.includes("<html"));
  console.log(`SMOKE ${url} → ${res.status} bytes=${text.length} ok=${looksOk}`);
  return looksOk;
}

async function main() {
  ok(`account=${ACCOUNT.slice(0, 4)}… project=${PROJECT}`);
  await ensureProject();
  await patchEnvAndFlags();
  await ensureBuild();
  await deploy();
  await attachDomain("guidelearning.org");
  await attachDomain("www.guidelearning.org");

  const pagesDev = `https://${PROJECT}.pages.dev`;
  const custom = "https://guidelearning.org";
  const a = await smoke(pagesDev);
  const b = await smoke(custom).catch((e) => {
    console.warn(`WARN: custom smoke: ${e.message}`);
    return false;
  });

  // Write a tiny status file for the agent (no secrets)
  const statusPath = resolve(ROOT, ".cf-pages-go-live-status.json");
  writeFileSync(
    statusPath,
    JSON.stringify(
      {
        project: PROJECT,
        pagesDev,
        custom,
        smokePagesDev: a,
        smokeCustom: b,
        at: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
  ok(`Status written to ${statusPath}`);
  if (!a) die("Homepage smoke failed on pages.dev");
}

main().catch((e) => die(e.stack || e.message));
