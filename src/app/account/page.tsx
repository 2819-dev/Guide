import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { JoinClass } from "@/components/join-class";
import { PortalShell } from "@/components/portal-shell";
import { RoleBadgeChip } from "@/components/role-badge-chip";
import { StudentBadgePanel } from "@/components/student-badge-panel";
import { SupportForm } from "@/components/support-form";
import { getDb } from "@/lib/db";
import { hasEducationAccess } from "@/lib/education-access";
import { portalFor } from "@/lib/portals";
import { requireProfile } from "@/lib/profile";
import { listRolesForProfile } from "@/lib/role-badges";
import type { Role } from "@/lib/roles";
import { roleLabel } from "@/lib/roles";
import { schools } from "@/lib/schema";
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
  const portalHref = isAmudSite()
    ? publicAmudLearnBase()
    : (portal?.href ?? (role === "rebbe" ? "/education/panel" : "/apps"));
  const portalLabel = isAmudSite() ? "Amud" : (portal?.label ?? "Guide");

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

  const shortRole = isOfficial
    ? "Guide Official"
    : role === "rebbe"
      ? "Teacher"
      : role === "customer"
        ? "Student"
        : roleLabel(role);

  return (
    <PortalShell
      eyebrow={shortRole}
      title={authz.profile.displayName}
      subtitle={[
        "Signed in",
        isOfficial ? null : roleLabel(role),
        schoolName,
      ]
        .filter(Boolean)
        .join(" · ")}
      chips={[
        { href: portalHref, label: portalLabel },
        { href: "/account", label: "Account", active: true },
      ]}
      accountName={authz.profile.displayName}
      accountHref={null}
    >
      {roles.length > 0 ? (
        <ul className="-mt-2 flex flex-wrap gap-2">
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
      ) : null}

      {(role === "customer" || role === "rebbe") && <JoinClass />}

      {showScanCredential ? (
        <StudentBadgePanel
          schoolName={schoolName}
          badgeCode={authz.profile.badgeCode}
          badgeReady={Boolean(authz.profile.badgeAuthUserId)}
          canActivate={Boolean(authz.profile.schoolId)}
        />
      ) : null}

      <SupportForm />
    </PortalShell>
  );
}
