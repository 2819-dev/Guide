import { redirect } from "next/navigation";
import type { ReactNode } from "react";
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
  if (authz.profile.mustChangePassword) {
    redirect("/auth/change-password");
  }

  const isAdmin = authz.profile.role === "admin";

  return (
    <PortalShell
      eyebrow="Guide Official"
      title={`Hi, ${authz.profile.displayName}`}
      subtitle="Approve schools and partners, follow up on meetings, and manage Roles and Suggestions."
      chips={[
        { href: "#schools", label: "Schools", active: true },
        { href: "#meetings", label: "Meetings" },
        { href: "#developers", label: "Developers" },
        { href: "#roles", label: "Roles" },
        { href: "#suggestions", label: "Suggestions" },
        ...(isAdmin ? [{ href: "#support", label: "Get help" }] : []),
      ]}
      accountName={authz.profile.displayName}
    >
      <OfficialSection
        id="schools"
        title="School applications"
        lede="Approve a school so its administrator can create classes, add students, and invite teachers. They get an email either way."
      >
        <AdminSchoolsPanel />
      </OfficialSection>

      <OfficialSection
        id="meetings"
        title="Meeting requests"
        lede="Book a meeting from For schools lands here — mark contacted, scheduled, or closed."
      >
        <AdminMeetingsPanel />
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
        lede="Community role badges people can show on their profile."
      >
        <AdminRoleBadgesPanel />
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
