import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AdminDevelopersPanel } from "@/components/admin-developers-panel";
import { AdminMeetingsPanel } from "@/components/admin-meetings-panel";
import { AdminRoleBadgesPanel } from "@/components/admin-role-badges-panel";
import { AdminSchoolsPanel } from "@/components/admin-schools-panel";
import { AdminSuggestionsPanel } from "@/components/admin-suggestions-panel";
import { AdminSupportPanel } from "@/components/admin-support-panel";
import { PortalShell } from "@/components/portal-shell";
import { getBlitzOverview, type BlitzOverview } from "@/lib/blitz/admin";
import { checkoutConfigured } from "@/lib/blitz/billing-config";
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

async function BlitzOfficialCard() {
  let overview: BlitzOverview | null = null;
  try {
    overview = await getBlitzOverview();
  } catch (error) {
    console.error("[admin] blitz overview", error);
  }
  const payments = checkoutConfigured();
  const stats = overview
    ? [
        { value: overview.planCounts.plus + overview.planCounts.ultra, label: "Teachers on Plus / Ultra" },
        { value: overview.liveGamesThisMonth, label: "Live games this month" },
        { value: overview.activePromoCodes, label: "Active promo codes" },
      ]
    : [];
  return (
    <div className="flex flex-col gap-4">
      {stats.length > 0 ? (
        <div className="official-stat-row">
          {stats.map((s) => (
            <div key={s.label} className="official-stat">
              <p className="official-stat__value">{s.value.toLocaleString()}</p>
              <p className="official-stat__label">{s.label}</p>
            </div>
          ))}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/apps/blitz/admin" className="btn-primary no-underline">
          Open Blitz admin
        </Link>
        <Link href="/apps/blitz/admin?tab=plans" className="btn-secondary no-underline">
          Grant a plan
        </Link>
        <span className="text-sm text-ink-muted">
          {payments ? "Stripe payments are on." : "Payments coming soon (Stripe not connected yet). Codes and grants still work."}
        </span>
      </div>
    </div>
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
        { href: "#blitz", label: "Blitz" },
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

      <OfficialSection
        id="blitz"
        title="Blitz"
        lede="Live classroom quizzes: promo codes, teacher plans, subscribers, and usage."
      >
        <BlitzOfficialCard />
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
