import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AdminLiveChatPanel } from "@/components/admin-live-chat-panel";
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
        { value: overview.planCounts.plus + overview.planCounts.ultra, label: "Teachers on paid plans" },
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
          {payments
            ? "Online payments are on."
            : "Online payments are not set up yet. Promo codes and plan grants still work."}
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
      title={`Welcome, ${authz.profile.displayName}`}
      subtitle="Review school and developer applications, follow up on requests, and manage platform content."
      chips={[
        { href: "#schools", label: "Schools", active: true },
        { href: "#live-chat", label: "Live chat" },
        { href: "#meetings", label: "Meetings" },
        { href: "#developers", label: "Developers" },
        { href: "#roles", label: "Roles" },
        { href: "#suggestions", label: "Suggestions" },
        { href: "#blitz", label: "Blitz" },
        ...(isAdmin ? [{ href: "#support", label: "Help" }] : []),
      ]}
      accountName={authz.profile.displayName}
    >
      <OfficialSection
        id="schools"
        title="School applications"
        lede="Approving a school lets its administrator create classes, add students, and invite teachers. The applicant is emailed either way."
      >
        <AdminSchoolsPanel />
      </OfficialSection>

      <OfficialSection
        id="live-chat"
        title="Live chat"
        lede="Guide Assistant (AI) answers the chat on Guide pages and hands the conversation to the Guide team when someone needs a person. Replying takes over the chat."
      >
        <AdminLiveChatPanel />
      </OfficialSection>

      <OfficialSection
        id="meetings"
        title="Meeting requests"
        lede="Requests from the Book a meeting form. Update each request as you follow up."
      >
        <AdminMeetingsPanel />
      </OfficialSection>

      <OfficialSection
        id="developers"
        title="Developers"
        lede="Applications from developers who want to publish apps on Guide."
      >
        <AdminDevelopersPanel />
      </OfficialSection>

      <OfficialSection
        id="roles"
        title="Roles"
        lede="Badges that appear on a person’s profile, such as Star Student."
      >
        <AdminRoleBadgesPanel />
      </OfficialSection>

      <OfficialSection
        id="suggestions"
        title="Suggestions"
        lede="Ideas and study prompts shown to students. Teachers can pause Suggestions for their classes."
      >
        <AdminSuggestionsPanel />
      </OfficialSection>

      <OfficialSection
        id="blitz"
        title="Blitz"
        lede="Plans, promo codes, and usage for the Blitz app."
      >
        <BlitzOfficialCard />
      </OfficialSection>

      {isAdmin ? (
        <OfficialSection
          id="support"
          title="Help requests"
          lede="Requests sent from Get help on the account page."
        >
          <AdminSupportPanel />
        </OfficialSection>
      ) : null}
    </PortalShell>
  );
}
