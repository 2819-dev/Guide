/**
 * Guide → Arcade launch bridge: short-lived HMAC JWTs + one-time jti rows.
 * Shared secret: ARCADE_LAUNCH_JWT_SECRET (also used by Arcade after exchange).
 */

import { and, eq, inArray, isNull } from "drizzle-orm";
import { getApp, isExternalLaunchApp, type GuideApp } from "@/lib/apps";
import { getDb } from "@/lib/db";
import { randomBytes, randomUUID } from "@/lib/edge-crypto";
import type { Profile } from "@/lib/profile";
import {
  appLaunchTokens,
  classroomAppInstalls,
  classroomMembers,
  classrooms,
  profiles,
  schools,
} from "@/lib/schema";
import { arcadePublicUrl } from "@/lib/site";

const LAUNCH_TTL_SEC = 120;
const ACCESS_TTL_SEC = 60 * 60;

export type AppLaunchClaims = {
  typ: "launch" | "access";
  jti: string;
  slug: string;
  profileId: string;
  authUserId: string;
  role: string;
  displayName: string;
  schoolId: string | null;
  schoolSlug: string | null;
  schoolName: string | null;
  classroomIds: string[];
  classroomNames: string[];
  iat: number;
  exp: number;
};

function b64url(data: ArrayBuffer | Uint8Array | string): string {
  const bytes =
    typeof data === "string"
      ? new TextEncoder().encode(data)
      : data instanceof Uint8Array
        ? data
        : new Uint8Array(data);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlJson(obj: unknown): string {
  return b64url(JSON.stringify(obj));
}

function fromB64url(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function getLaunchJwtSecret(): string | null {
  const s = process.env.ARCADE_LAUNCH_JWT_SECRET?.trim();
  return s || null;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function signJwt(
  payload: Record<string, unknown>,
  secret: string,
): Promise<string> {
  const header = b64urlJson({ alg: "HS256", typ: "JWT" });
  const body = b64urlJson(payload);
  const key = await importHmacKey(secret);
  const data = new TextEncoder().encode(`${header}.${body}`);
  const sig = await crypto.subtle.sign("HMAC", key, data);
  return `${header}.${body}.${b64url(sig)}`;
}

async function verifyJwt(
  token: string,
  secret: string,
): Promise<Record<string, unknown> | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const key = await importHmacKey(secret);
  const sigBytes = fromB64url(sig);
  const payload = new TextEncoder().encode(`${header}.${body}`);
  const ok = await crypto.subtle.verify(
    "HMAC",
    key,
    toArrayBuffer(sigBytes),
    toArrayBuffer(payload),
  );
  if (!ok) return null;
  try {
    const json = new TextDecoder().decode(fromB64url(body));
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

function parseClaims(raw: Record<string, unknown>): AppLaunchClaims | null {
  if (raw.typ !== "launch" && raw.typ !== "access") return null;
  if (typeof raw.jti !== "string" || typeof raw.slug !== "string") return null;
  if (typeof raw.profileId !== "string" || typeof raw.authUserId !== "string") {
    return null;
  }
  if (typeof raw.iat !== "number" || typeof raw.exp !== "number") return null;
  const classroomIds = Array.isArray(raw.classroomIds)
    ? raw.classroomIds.filter((x): x is string => typeof x === "string")
    : [];
  const classroomNames = Array.isArray(raw.classroomNames)
    ? raw.classroomNames.filter((x): x is string => typeof x === "string")
    : [];
  return {
    typ: raw.typ,
    jti: raw.jti,
    slug: raw.slug,
    profileId: raw.profileId,
    authUserId: raw.authUserId,
    role: typeof raw.role === "string" ? raw.role : "customer",
    displayName:
      typeof raw.displayName === "string" ? raw.displayName : "Learner",
    schoolId: typeof raw.schoolId === "string" ? raw.schoolId : null,
    schoolSlug: typeof raw.schoolSlug === "string" ? raw.schoolSlug : null,
    schoolName: typeof raw.schoolName === "string" ? raw.schoolName : null,
    classroomIds,
    classroomNames,
    iat: raw.iat,
    exp: raw.exp,
  };
}

export type EntitlementResult = {
  entitled: boolean;
  app: GuideApp | null;
  classroomIds: string[];
  classroomNames: string[];
  schoolId: string | null;
  schoolSlug: string | null;
  schoolName: string | null;
};

/** Classrooms where this profile has the app installed (student member or teacher). */
export async function getAppEntitlement(
  profile: Profile,
  slug: string,
): Promise<EntitlementResult> {
  const app = getApp(slug) ?? null;
  if (!app) {
    return {
      entitled: false,
      app: null,
      classroomIds: [],
      classroomNames: [],
      schoolId: profile.schoolId,
      schoolSlug: null,
      schoolName: null,
    };
  }

  const db = getDb();
  let schoolSlug: string | null = null;
  let schoolName: string | null = null;
  if (profile.schoolId) {
    const [school] = await db
      .select({ slug: schools.slug, name: schools.name })
      .from(schools)
      .where(eq(schools.id, profile.schoolId))
      .limit(1);
    schoolSlug = school?.slug ?? null;
    schoolName = school?.name ?? null;
  }

  const classroomIds: string[] = [];
  const classroomNames: string[] = [];

  if (profile.role === "rebbe" || profile.role === "admin") {
    const teacherRooms = await db
      .select({
        id: classrooms.id,
        name: classrooms.name,
      })
      .from(classrooms)
      .innerJoin(
        classroomAppInstalls,
        and(
          eq(classroomAppInstalls.classroomId, classrooms.id),
          eq(classroomAppInstalls.appSlug, slug),
        ),
      )
      .where(eq(classrooms.rebbeId, profile.id));

    for (const r of teacherRooms) {
      classroomIds.push(r.id);
      classroomNames.push(r.name);
    }
  }

  const memberships = await db
    .select({ classroomId: classroomMembers.classroomId })
    .from(classroomMembers)
    .where(eq(classroomMembers.studentId, profile.id));

  if (memberships.length > 0) {
    const ids = memberships.map((m) => m.classroomId);
    const studentRooms = await db
      .select({
        id: classrooms.id,
        name: classrooms.name,
      })
      .from(classrooms)
      .innerJoin(
        classroomAppInstalls,
        and(
          eq(classroomAppInstalls.classroomId, classrooms.id),
          eq(classroomAppInstalls.appSlug, slug),
        ),
      )
      .where(inArray(classrooms.id, ids));

    for (const r of studentRooms) {
      if (!classroomIds.includes(r.id)) {
        classroomIds.push(r.id);
        classroomNames.push(r.name);
      }
    }
  }

  // Guide Official can open known external apps for ops/smoke without a class.
  const entitled =
    classroomIds.length > 0 ||
    (profile.role === "admin" && isExternalLaunchApp(app));

  return {
    entitled,
    app,
    classroomIds,
    classroomNames,
    schoolId: profile.schoolId,
    schoolSlug,
    schoolName,
  };
}

export async function mintLaunchToken(opts: {
  profile: Profile;
  authUserId: string;
  slug: string;
}): Promise<
  | { ok: true; token: string; redirectUrl: string; claims: AppLaunchClaims }
  | { ok: false; error: string; status: number }
> {
  const secret = getLaunchJwtSecret();
  if (!secret) {
    return {
      ok: false,
      error: "Launch bridge is not configured",
      status: 503,
    };
  }

  const app = getApp(opts.slug);
  if (!app?.launchUrl) {
    return {
      ok: false,
      error: "App does not support launch bridge",
      status: 400,
    };
  }

  const ent = await getAppEntitlement(opts.profile, opts.slug);
  if (!ent.entitled) {
    return {
      ok: false,
      error: "App is not installed for your classes",
      status: 403,
    };
  }

  const now = Math.floor(Date.now() / 1000);
  const jti = randomUUID().replace(/-/g, "") + b64url(randomBytes(8));
  const claims: AppLaunchClaims = {
    typ: "launch",
    jti,
    slug: opts.slug,
    profileId: opts.profile.id,
    authUserId: opts.authUserId,
    role: opts.profile.role,
    displayName: opts.profile.displayName,
    schoolId: ent.schoolId,
    schoolSlug: ent.schoolSlug,
    schoolName: ent.schoolName,
    classroomIds: ent.classroomIds,
    classroomNames: ent.classroomNames,
    iat: now,
    exp: now + LAUNCH_TTL_SEC,
  };

  const db = getDb();
  await db.insert(appLaunchTokens).values({
    jti,
    profileId: opts.profile.id,
    appSlug: opts.slug,
    expiresAt: new Date(claims.exp * 1000),
  });

  const token = await signJwt({ ...claims }, secret);
  const base = app.launchUrl.replace(/\/$/, "") || arcadePublicUrl();
  const redirectUrl = `${base}/launch?token=${encodeURIComponent(token)}`;

  return { ok: true, token, redirectUrl, claims };
}

export async function exchangeLaunchToken(token: string): Promise<
  | { ok: true; claims: AppLaunchClaims; accessToken: string }
  | { ok: false; error: string; status: number }
> {
  const secret = getLaunchJwtSecret();
  if (!secret) {
    return {
      ok: false,
      error: "Launch bridge is not configured",
      status: 503,
    };
  }

  const raw = await verifyJwt(token, secret);
  if (!raw) {
    return { ok: false, error: "Invalid token", status: 401 };
  }
  const claims = parseClaims(raw);
  if (!claims || claims.typ !== "launch") {
    return { ok: false, error: "Invalid launch token", status: 401 };
  }

  const now = Math.floor(Date.now() / 1000);
  if (claims.exp < now) {
    return { ok: false, error: "Token expired", status: 401 };
  }

  const db = getDb();
  const [row] = await db
    .select()
    .from(appLaunchTokens)
    .where(eq(appLaunchTokens.jti, claims.jti))
    .limit(1);

  if (!row) {
    return { ok: false, error: "Unknown token", status: 401 };
  }
  if (row.redeemedAt) {
    return { ok: false, error: "Token already used", status: 409 };
  }
  if (row.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: "Token expired", status: 401 };
  }

  const redeemed = await db
    .update(appLaunchTokens)
    .set({ redeemedAt: new Date() })
    .where(
      and(eq(appLaunchTokens.jti, claims.jti), isNull(appLaunchTokens.redeemedAt)),
    )
    .returning({ jti: appLaunchTokens.jti });

  if (redeemed.length === 0) {
    return { ok: false, error: "Token already used", status: 409 };
  }

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, claims.profileId))
    .limit(1);

  if (profile) {
    const ent = await getAppEntitlement(profile, claims.slug);
    if (!ent.entitled) {
      return {
        ok: false,
        error: "App is not installed for your classes",
        status: 403,
      };
    }
    claims.classroomIds = ent.classroomIds;
    claims.classroomNames = ent.classroomNames;
    claims.schoolId = ent.schoolId;
    claims.schoolSlug = ent.schoolSlug;
    claims.schoolName = ent.schoolName;
  }

  const accessNow = Math.floor(Date.now() / 1000);
  const accessClaims: AppLaunchClaims = {
    ...claims,
    typ: "access",
    jti: randomUUID().replace(/-/g, ""),
    iat: accessNow,
    exp: accessNow + ACCESS_TTL_SEC,
  };
  const accessToken = await signJwt({ ...accessClaims }, secret);

  return { ok: true, claims, accessToken };
}

export async function verifyAccessToken(
  token: string,
): Promise<AppLaunchClaims | null> {
  const secret = getLaunchJwtSecret();
  if (!secret) return null;
  const raw = await verifyJwt(token, secret);
  if (!raw) return null;
  const claims = parseClaims(raw);
  if (!claims || claims.typ !== "access") return null;
  if (claims.exp < Math.floor(Date.now() / 1000)) return null;
  return claims;
}

export function arcadeCorsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("Origin") ?? "";
  const allowed = new Set([
    arcadePublicUrl(),
    "http://localhost:3000",
    "http://localhost:3001",
  ]);
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
  const normalized = origin.replace(/\/$/, "");
  if (origin && allowed.has(normalized)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Vary"] = "Origin";
  }
  return headers;
}
