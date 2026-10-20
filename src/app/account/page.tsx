import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { JoinClass } from "@/components/join-class";
import { StudentBadgePanel } from "@/components/student-badge-panel";
import { SupportForm } from "@/components/support-form";
import { getDb } from "@/lib/db";
import { roleLabel } from "@/lib/roles";
import { requireProfile } from "@/lib/profile";
import type { Role } from "@/lib/roles";
import { schools } from "@/lib/schema";

export const instant = false;
export const metadata = { title: "Account" };

export default async function AccountPage() {
  const authz = await requireProfile();
  if (!authz) redirect("/auth/sign-in?as=family");

  const role = authz.profile.role as Role;
  const isOfficial = role === "admin" || role === "moderator";

  let schoolName: string | null = null;
  if (authz.profile.schoolId) {
    const db = getDb();
    const [school] = await db
      .select({ name: schools.name })
      .from(schools)
      .where(eq(schools.id, authz.profile.schoolId))
      .limit(1);
    schoolName = school?.name ?? null;
  }

  const showStudentBadge =
    (role === "customer" || role === "rebbe") &&
    Boolean(authz.profile.schoolId || authz.profile.badgeCode);

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-5 py-12 sm:px-8">
      <header>
        <h1 className="display text-3xl text-forest-950 sm:text-4xl">
          Account
        </h1>
        <p className="mt-2 text-ink-muted">
          Signed in as {authz.profile.displayName}
          {isOfficial ? "" : ` · ${roleLabel(role)}`}
        </p>
      </header>

      {isOfficial && (
        <p className="text-sm text-ink-muted">
          <Link href="/admin" className="font-semibold text-forest-800">
            Continue as Guide Official
          </Link>
        </p>
      )}

      {(role === "customer" || role === "rebbe") && <JoinClass />}

      {showStudentBadge && (
        <StudentBadgePanel
          schoolName={schoolName}
          badgeCode={authz.profile.badgeCode}
          badgeReady={Boolean(authz.profile.badgeAuthUserId)}
          canActivate={Boolean(authz.profile.schoolId)}
        />
      )}

      <SupportForm />
    </div>
  );
}
