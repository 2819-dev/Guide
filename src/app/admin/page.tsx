import { redirect } from "next/navigation";
import { AdminBadgesPanel } from "@/components/admin-badges-panel";
import { AdminRoleBadgesPanel } from "@/components/admin-role-badges-panel";
import { AdminSchoolsPanel } from "@/components/admin-schools-panel";
import { AdminSuggestionsPanel } from "@/components/admin-suggestions-panel";
import { AdminSupportPanel } from "@/components/admin-support-panel";
import { PortalShell } from "@/components/portal-shell";
import { requireProfile } from "@/lib/profile";

export const instant = false;
export const metadata = { title: "Guide Official" };

export default async function AdminPage() {
  const authz = await requireProfile(["admin", "moderator"]);
  if (!authz) redirect("/auth/sign-in?as=official");

  const isAdmin = authz.profile.role === "admin";

  return (
    <PortalShell
      eyebrow="Official portal"
      title={`Hi, ${authz.profile.displayName}`}
      subtitle="Approve schools, manage roles, issue scan credentials, and publish Suggestions."
      chips={[
        { href: "#schools", label: "Schools" },
        { href: "#roles", label: "Roles" },
        { href: "#credentials", label: "Credentials" },
        { href: "#suggestions", label: "Suggestions" },
        ...(isAdmin ? [{ href: "#support", label: "Get help queue" }] : []),
      ]}
    >
      <section id="schools">
        <h2 className="portal-section-title">Schools</h2>
        <AdminSchoolsPanel />
      </section>
      <section id="roles">
        <h2 className="portal-section-title">Roles</h2>
        <AdminRoleBadgesPanel />
      </section>
      <section id="credentials">
        <h2 className="portal-section-title">Scan credentials</h2>
        <AdminBadgesPanel />
      </section>
      <section id="suggestions">
        <h2 className="portal-section-title">Suggestions</h2>
        <AdminSuggestionsPanel />
      </section>
      {isAdmin ? (
        <section id="support">
          <h2 className="portal-section-title">Get help queue</h2>
          <AdminSupportPanel />
        </section>
      ) : null}
    </PortalShell>
  );
}
