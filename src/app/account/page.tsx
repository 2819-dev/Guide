import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { JoinClass } from "@/components/join-class";
import { RoleBadgeChip } from "@/components/role-badge-chip";
import { StudentBadgePanel } from "@/components/student-badge-panel";
import { SupportForm } from "@/components/support-form";
import { getDb } from "@/lib/db";
import { portalFor } from "@/lib/portals";
import { roleLabel } from "@/lib/roles";
import { requireProfile } from "@/lib/profile";
import { listRolesForProfile } from "@/lib/role-badges";
import type { Role } from "@/lib/roles";
import { schools } from "@/lib/schema";
import { hasEducationAccess } from "@/lib/education-access";
import { isAmudSite, publicAmudLearnBase } from "@/lib/site";

export const runtime = "edge";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const authz = await requireProfile();
  if (!authz) {
    redirect(
      isAmudSite()
        ? "/auth/sign-in?as=learner"
        : "/auth/sign-in?as=student",
    );
  }

  const role = authz.profile.role as Role;
  const isOfficial = role === "admin" || role === "moderator";
  const educationOk = await hasEducationAccess(authz.profile);
  const portal = portalFor({
    role,
    schoolId: authz.profile.schoolId,
    badgeCode: authz.profile.badgeCode,
    educationOk,
  });
  const backHref = isAmudSite()
    ? publicAmudLearnBase()
    : (portal?.href ?? (role === "rebbe" ? "/education/panel" : "/apps"));
  const backLabel = isAmudSite() ? "Amud" : (portal?.label ?? "Guide");

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

  const roles = await listRolesForProfile(authz.profile.id);
  const showScanCredential =
    (role === "customer" || role === "rebbe") &&
    Boolean(authz.profile.schoolId || authz.profile.badgeCode);

  return (
    <div className="portal-page">
      <div className="content-band portal-page__inner max-w-3xl space-y-8">
      <p className="text-sm">
        <Link href={backHref} className="font-semibold text-forest-800">
          ← Back to {backLabel}
        </Link>
      </p>
      <header className="portal-hero !mb-0">
        <p className="portal-eyebrow">Account</p>
        <h1 className="display-feature mt-1">
          {authz.profile.displayName}
        </h1>
        <p className="mt-1.5 text-[0.95rem] text-ink-muted">
          Signed in
          {isOfficial ? "" : ` · ${roleLabel(role)}`}
          {schoolName ? ` · ${schoolName}` : ""}
        </p>
        {roles.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {roles.map((r) => (
              <li key={r.id}>
                <RoleBadgeChip
                  name={r.name}
                  color={r.color}
                  iconUrl={r.iconUrl}
                />
              </li>
            ))}
          </ul>
        )}
      </header>

      {(role === "customer" || role === "rebbe") && <JoinClass />}

      {showScanCredential && (
        <StudentBadgePanel
          schoolName={schoolName}
          badgeCode={authz.profile.badgeCode}
          badgeReady={Boolean(authz.profile.badgeAuthUserId)}
          canActivate={Boolean(authz.profile.schoolId)}
        />
      )}

      <SupportForm />
      </div>
    </div>
  );
}
