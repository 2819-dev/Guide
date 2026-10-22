import { redirect } from "next/navigation";
import { AdminBadgesPanel } from "@/components/admin-badges-panel";
import { AdminDevelopersPanel } from "@/components/admin-developers-panel";
import { AdminMeetingsPanel } from "@/components/admin-meetings-panel";
import { AdminRoleBadgesPanel } from "@/components/admin-role-badges-panel";
import { AdminSchoolsPanel } from "@/components/admin-schools-panel";
import { AdminSuggestionsPanel } from "@/components/admin-suggestions-panel";
import { AdminSupportPanel } from "@/components/admin-support-panel";
import { PortalShell } from "@/components/portal-shell";
import { requireProfile } from "@/lib/profile";

export const runtime = "edge";

export const metadata = { title: "Guide Official" };

export default async function AdminPage() {
  let authz = null;
  try {
    authz = await requireProfile(["admin", "moderator"]);
  } catch {
    redirect("/auth/sign-in?as=official");
  }
  if (!authz) redirect("/auth/sign-in?as=official");

  const isAdmin = authz.profile.role === "admin";

  return (
    <PortalShell
      eyebrow="Guide Official"
      title={`Hi, ${authz.profile.displayName}`}
      subtitle="Approve schools and developers, follow Book a meeting requests, and keep Roles, badge logins, and Suggestions in order."
      chips={[
        { href: "#meetings", label: "Meetings", active: true },
        { href: "#schools", label: "Schools" },
        { href: "#developers", label: "Developers" },
        { href: "#roles", label: "Roles" },
        { href: "#credentials", label: "Badge logins" },
        { href: "#suggestions", label: "Suggestions" },
        ...(isAdmin ? [{ href: "#support", label: "Get help" }] : []),
      ]}
    >
      <section id="meetings">
        <h2 className="portal-section-title">Meeting requests</h2>
        <AdminMeetingsPanel />
      </section>
      <section id="schools">
        <h2 className="portal-section-title">Schools</h2>
        <AdminSchoolsPanel />
      </section>
      <section id="developers">
        <h2 className="portal-section-title">Developers</h2>
        <AdminDevelopersPanel />
      </section>
      <section id="roles">
        <h2 className="portal-section-title">Roles</h2>
        <AdminRoleBadgesPanel />
      </section>
      <section id="credentials">
        <h2 className="portal-section-title">Badge logins</h2>
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
