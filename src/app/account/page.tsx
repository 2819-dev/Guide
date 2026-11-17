import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { PortalShell } from "@/components/portal-shell";
import { RoleBadgeChip } from "@/components/role-badge-chip";
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

  const shortRole = isOfficial
    ? "Guide Official"
    : role === "rebbe"
      ? "Teacher"
      : role === "customer"
        ? "Student"
        : roleLabel(role);

  return (
    <PortalShell
      studentTabs={role === "customer"}
      eyebrow={shortRole}
      title={authz.profile.displayName}
      subtitle={
        schoolName
          ? `${schoolName} · Manage your account and get help.`
          : "Manage your account and get help."
      }
      chips={[
        { href: portalHref, label: portalLabel },
        { href: "/account", label: "Account", active: true },
      ]}
      accountName={authz.profile.displayName}
      accountHref={null}
    >
      {roles.length > 0 ? (
        <ul className="portal-role-row">
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


      <SupportForm />
    </PortalShell>
  );
}
