import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { PortalShell } from "@/components/portal-shell";
import { OpenChatButton } from "@/components/open-chat-button";
import { getDb } from "@/lib/db";
import { hasEducationAccess } from "@/lib/education-access";
import { portalFor } from "@/lib/portals";
import { requireProfile } from "@/lib/profile";
import type { Role } from "@/lib/roles";
import { roleLabel } from "@/lib/roles";
import { schools } from "@/lib/schema";

export const runtime = "edge";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const authz = await requireProfile();
  if (!authz) {
    redirect("/auth/sign-in?as=student");
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
  const portalHref =
    portal?.href ?? (role === "rebbe" ? "/education/panel" : "/apps");
  const portalLabel = portal?.label ?? "Guide";

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
      <section className="portal-panel">
        <h2 className="portal-section-title">Account details</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-[10rem_1fr]">
          <dt className="font-semibold text-forest-950">Name</dt>
          <dd className="text-ink-muted">{authz.profile.displayName}</dd>
          <dt className="font-semibold text-forest-950">Role</dt>
          <dd className="text-ink-muted">{shortRole}</dd>
          {schoolName ? (
            <>
              <dt className="font-semibold text-forest-950">School</dt>
              <dd className="text-ink-muted">{schoolName}</dd>
            </>
          ) : null}
        </dl>
      </section>

      <section className="portal-panel mt-6">
        <h2 className="portal-section-title">Need help?</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Chat with Guide Assistant for quick answers, or ask to talk with a
          member of the Guide team.
        </p>
        <div className="mt-4">
          <OpenChatButton />
        </div>
      </section>
    </PortalShell>
  );
}
