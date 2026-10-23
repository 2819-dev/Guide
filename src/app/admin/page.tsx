import { redirect } from "next/navigation";
import type { ReactNode } from "react";
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

function OfficialSection({
  id,
  title,
  lede,
  children,
}: {
  id: string;
  title: string;
  lede: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="official-section">
      <div className="official-section__head">
        <h2 className="portal-section-title !mb-1">{title}</h2>
        <p className="text-sm leading-relaxed text-ink-muted">{lede}</p>
      </div>
      {children}
    </section>
  );
}

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
      accountName={authz.profile.displayName}
    >
      <OfficialSection
        id="meetings"
        title="Meeting requests"
        lede="Book a meeting from For schools lands here — mark contacted, scheduled, or closed."
      >
        <AdminMeetingsPanel />
      </OfficialSection>

      <OfficialSection
        id="schools"
        title="School applications"
        lede="Approve a school so administrators can invite teachers, create classes, and add apps."
      >
        <AdminSchoolsPanel />
      </OfficialSection>

      <OfficialSection
        id="developers"
        title="Developers"
        lede="Verified partners only — approve apps schools can add to class."
      >
        <AdminDevelopersPanel />
      </OfficialSection>

      <OfficialSection
        id="roles"
        title="Roles"
        lede="Discord-style role badges for school communities — keep distinct from student badge login."
      >
        <AdminRoleBadgesPanel />
      </OfficialSection>

      <OfficialSection
        id="credentials"
        title="Badge logins"
        lede="Issue and manage student badge codes for school login."
      >
        <AdminBadgesPanel />
      </OfficialSection>

      <OfficialSection
        id="suggestions"
        title="Suggestions"
        lede="Review student suggestions and study prompts from across Guide."
      >
        <AdminSuggestionsPanel />
      </OfficialSection>

      {isAdmin ? (
        <OfficialSection
          id="support"
          title="Get help queue"
          lede="Account help requests from school users."
        >
          <AdminSupportPanel />
        </OfficialSection>
      ) : null}
    </PortalShell>
  );
}
