/**
 * Teacher-managed student accounts: username + password per school.
 *
 * Students never sign themselves up. A teacher creates the account in a
 * class; the student logs in with school → username → password.
 *
 * Each Neon Auth identity uses a private synthetic email
 * (<username>.<random>@<school>.students.guidelearning.org) that never
 * receives mail. A password reset creates a fresh identity with the new
 * password and points the same Guide profile at it, so the student keeps
 * their username, classes, and history, and old sessions stop working.
 */
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { randomBytes } from "@/lib/edge-crypto";
import {
  classroomMembers,
  classrooms,
  passwordResetRequests,
  profileLogins,
  profiles,
  schools,
} from "@/lib/schema";

export const STUDENT_EMAIL_DOMAIN = "students.guidelearning.org";

/* ---------- schema bootstrap (no manual migration needed) ---------- */

let schemaReady: Promise<void> | null = null;

/** Idempotently adds profiles.username and password_reset_requests. */
export function ensureStudentAccountSchema(): Promise<void> {
  schemaReady ??= (async () => {
    const db = getDb();
    await db.execute(
      sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username varchar(40)`,
    );
    await db.execute(
      sql`CREATE UNIQUE INDEX IF NOT EXISTS profiles_school_username_idx ON profiles (school_id, username) WHERE username IS NOT NULL`,
    );
    await db.execute(sql`CREATE TABLE IF NOT EXISTS password_reset_requests (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      status varchar(16) NOT NULL DEFAULT 'pending',
      created_at timestamptz NOT NULL DEFAULT now(),
      resolved_at timestamptz,
      resolved_by uuid REFERENCES profiles(id) ON DELETE SET NULL
    )`);
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS password_reset_requests_student_idx ON password_reset_requests (student_id, status)`,
    );
  })().catch((e) => {
    schemaReady = null; // retry next request
    throw e;
  });
  return schemaReady;
}

/* ---------- usernames ---------- */

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

/** 3–30 chars: letters, numbers, dot, dash, underscore; starts with a letter or number. */
export function usernameError(username: string): string | null {
  if (username.length < 3) return "Usernames need at least 3 characters.";
  if (username.length > 30) return "Usernames can be at most 30 characters.";
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(username)) {
    return "Use letters, numbers, dots, dashes, or underscores (no spaces).";
  }
  return null;
}

export function isStudentSyntheticEmail(email?: string | null): boolean {
  return Boolean(email && email.toLowerCase().endsWith(`.${STUDENT_EMAIL_DOMAIN}`));
}

function syntheticEmail(schoolSlug: string, username: string): string {
  const suffix = Array.from(randomBytes(4), (b) => b.toString(16).padStart(2, "0")).join("");
  const slug = schoolSlug.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40) || "school";
  const user = username.replace(/[^a-z0-9._-]/g, "");
  return `${user}.${suffix}@${slug}.${STUDENT_EMAIL_DOMAIN}`;
}

/* ---------- Neon Auth identity (HTTP; never touches the teacher's cookies) ---------- */

function authBase(): string {
  return process.env.NEON_AUTH_BASE_URL?.trim() || "https://invalid.neonauth.local/auth";
}

async function createAuthIdentity(opts: {
  email: string;
  password: string;
  name: string;
  origin: string;
}): Promise<{ id: string } | { error: string }> {
  const res = await fetch(`${authBase()}/sign-up/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: opts.origin,
      Referer: opts.origin,
    },
    body: JSON.stringify({ email: opts.email, password: opts.password, name: opts.name }),
  }).catch(() => null);
  if (!res) return { error: "Couldn’t reach the sign-in service. Try again." };
  const data = (await res.json().catch(() => ({}))) as {
    user?: { id?: string };
    message?: string;
  };
  if (!res.ok || !data.user?.id) {
    const msg = data.message || "";
    if (/password/i.test(msg)) return { error: msg };
    return { error: msg || "Couldn’t create the login. Try again." };
  }
  return { id: data.user.id };
}

/* ---------- educator scope ---------- */

/** School a teacher/admin belongs to (invited teachers carry schoolId; admins via their application). */
export async function schoolIdForEducator(profile: {
  id: string;
  schoolId: string | null;
}): Promise<string | null> {
  if (profile.schoolId) return profile.schoolId;
  const db = getDb();
  const rows = await db.execute(sql`
    SELECT s.id FROM schools s
    JOIN school_applications a ON a.id = s.application_id
    WHERE a.applicant_profile_id = ${profile.id} AND a.status = 'approved'
    LIMIT 1`);
  const row = (rows as unknown as { rows?: { id: string }[] }).rows?.[0] ??
    (rows as unknown as { id: string }[])[0];
  return row?.id ?? null;
}

export async function teacherOwnsClassroom(teacherId: string, classroomId: string) {
  const db = getDb();
  const [room] = await db
    .select({ id: classrooms.id })
    .from(classrooms)
    .where(and(eq(classrooms.id, classroomId), eq(classrooms.rebbeId, teacherId)))
    .limit(1);
  return Boolean(room);
}

/** True when the student is in one of this teacher's classes. */
export async function teacherTeachesStudent(teacherId: string, studentId: string) {
  const db = getDb();
  const [row] = await db
    .select({ id: classroomMembers.id })
    .from(classroomMembers)
    .innerJoin(classrooms, eq(classroomMembers.classroomId, classrooms.id))
    .where(and(eq(classrooms.rebbeId, teacherId), eq(classroomMembers.studentId, studentId)))
    .limit(1);
  return Boolean(row);
}

/* ---------- create / reset ---------- */

export async function createStudentAccount(opts: {
  schoolId: string;
  classroomId: string;
  displayName: string;
  username: string;
  password: string;
  origin: string;
}): Promise<{ ok: true; studentId: string } | { ok: false; error: string }> {
  await ensureStudentAccountSchema();
  const db = getDb();
  const username = normalizeUsername(opts.username);
  const uErr = usernameError(username);
  if (uErr) return { ok: false, error: uErr };
  if (opts.password.length < 8) {
    return { ok: false, error: "Passwords need at least 8 characters." };
  }

  const [school] = await db.select().from(schools).where(eq(schools.id, opts.schoolId)).limit(1);
  if (!school) return { ok: false, error: "School not found." };

  const [taken] = await db
    .select({ id: profileLogins.id })
    .from(profileLogins)
    .where(and(eq(profileLogins.schoolId, opts.schoolId), eq(profileLogins.username, username)))
    .limit(1);
  if (taken) return { ok: false, error: `The username “${username}” is already used at your school.` };

  const email = syntheticEmail(school.slug, username);
  const identity = await createAuthIdentity({
    email,
    password: opts.password,
    name: opts.displayName,
    origin: opts.origin,
  });
  if ("error" in identity) return { ok: false, error: identity.error };

  const [student] = await db
    .insert(profiles)
    .values({
      authUserId: identity.id,
      displayName: opts.displayName,
      role: "customer",
      schoolId: opts.schoolId,
      loginEmail: email,
    })
    .returning({ id: profiles.id });
  await db
    .update(profileLogins)
    .set({ username })
    .where(eq(profileLogins.id, student.id));

  await db
    .insert(classroomMembers)
    .values({ classroomId: opts.classroomId, studentId: student.id })
    .onConflictDoNothing();

  return { ok: true, studentId: student.id };
}

export async function resetStudentPassword(opts: {
  studentId: string;
  password: string;
  resolvedBy: string;
  origin: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensureStudentAccountSchema();
  if (opts.password.length < 8) {
    return { ok: false, error: "Passwords need at least 8 characters." };
  }
  const db = getDb();
  const [student] = await db
    .select({
      id: profileLogins.id,
      username: profileLogins.username,
      displayName: profileLogins.displayName,
      schoolSlug: schools.slug,
    })
    .from(profileLogins)
    .innerJoin(schools, eq(profileLogins.schoolId, schools.id))
    .where(eq(profileLogins.id, opts.studentId))
    .limit(1);
  if (!student?.username) {
    return { ok: false, error: "This student doesn’t have a username login." };
  }

  const email = syntheticEmail(student.schoolSlug, student.username);
  const identity = await createAuthIdentity({
    email,
    password: opts.password,
    name: student.displayName,
    origin: opts.origin,
  });
  if ("error" in identity) return { ok: false, error: identity.error };

  await db
    .update(profiles)
    .set({ authUserId: identity.id, loginEmail: email, updatedAt: new Date() })
    .where(eq(profiles.id, student.id));

  await db
    .update(passwordResetRequests)
    .set({ status: "resolved", resolvedAt: new Date(), resolvedBy: opts.resolvedBy })
    .where(
      and(
        eq(passwordResetRequests.studentId, student.id),
        eq(passwordResetRequests.status, "pending"),
      ),
    );
  return { ok: true };
}

/* ---------- login lookup ---------- */

export async function loginEmailForStudent(
  schoolId: string,
  rawUsername: string,
): Promise<string | null> {
  await ensureStudentAccountSchema();
  const db = getDb();
  const [row] = await db
    .select({ loginEmail: profileLogins.loginEmail })
    .from(profileLogins)
    .where(
      and(
        eq(profileLogins.schoolId, schoolId),
        eq(profileLogins.username, normalizeUsername(rawUsername)),
      ),
    )
    .limit(1);
  return row?.loginEmail ?? null;
}

/* ---------- password help requests ---------- */

/**
 * Records a request and returns the teachers to notify. Silently does
 * nothing for unknown usernames so the form can't be used to probe them.
 */
export async function requestPasswordHelp(schoolId: string, rawUsername: string) {
  await ensureStudentAccountSchema();
  const db = getDb();
  const [student] = await db
    .select({ id: profileLogins.id, displayName: profileLogins.displayName })
    .from(profileLogins)
    .where(
      and(
        eq(profileLogins.schoolId, schoolId),
        eq(profileLogins.username, normalizeUsername(rawUsername)),
      ),
    )
    .limit(1);
  if (!student) return { created: false as const, teachers: [] };

  const [pending] = await db
    .select({ id: passwordResetRequests.id })
    .from(passwordResetRequests)
    .where(
      and(
        eq(passwordResetRequests.studentId, student.id),
        eq(passwordResetRequests.status, "pending"),
      ),
    )
    .limit(1);
  if (!pending) {
    await db.insert(passwordResetRequests).values({ studentId: student.id });
  }

  const teachers = await db
    .selectDistinct({
      id: profiles.id,
      displayName: profiles.displayName,
      loginEmail: profiles.loginEmail,
    })
    .from(classroomMembers)
    .innerJoin(classrooms, eq(classroomMembers.classroomId, classrooms.id))
    .innerJoin(profiles, eq(classrooms.rebbeId, profiles.id))
    .where(eq(classroomMembers.studentId, student.id));

  return { created: !pending, student, teachers };
}

export async function pendingRequestsForTeacher(teacherId: string) {
  await ensureStudentAccountSchema();
  const db = getDb();
  return db
    .selectDistinct({
      id: passwordResetRequests.id,
      studentId: profileLogins.id,
      displayName: profileLogins.displayName,
      username: profileLogins.username,
      createdAt: passwordResetRequests.createdAt,
    })
    .from(passwordResetRequests)
    .innerJoin(profileLogins, eq(passwordResetRequests.studentId, profileLogins.id))
    .innerJoin(classroomMembers, eq(classroomMembers.studentId, profileLogins.id))
    .innerJoin(classrooms, eq(classroomMembers.classroomId, classrooms.id))
    .where(and(eq(classrooms.rebbeId, teacherId), eq(passwordResetRequests.status, "pending")))
    .orderBy(desc(passwordResetRequests.createdAt));
}

export async function usernamesForStudents(ids: string[]) {
  if (ids.length === 0) return new Map<string, string | null>();
  await ensureStudentAccountSchema();
  const db = getDb();
  const rows = await db
    .select({ id: profileLogins.id, username: profileLogins.username })
    .from(profileLogins)
    .where(inArray(profileLogins.id, ids));
  return new Map(rows.map((r) => [r.id, r.username]));
}
