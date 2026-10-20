import { redirect } from "next/navigation";
import { AdminBadgesPanel } from "@/components/admin-badges-panel";
import { AdminRoleBadgesPanel } from "@/components/admin-role-badges-panel";
import { AdminSchoolsPanel } from "@/components/admin-schools-panel";
import { AdminSuggestionsPanel } from "@/components/admin-suggestions-panel";
import { AdminSupportPanel } from "@/components/admin-support-panel";
import { requireProfile } from "@/lib/profile";

export const instant = false;
export const metadata = { title: "Guide Official" };

export default async function AdminPage() {
  const authz = await requireProfile(["admin", "moderator"]);
  if (!authz) redirect("/auth/sign-in?as=official");

  const isAdmin = authz.profile.role === "admin";

  return (
    <div>
      <section className="hero-band">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
          <p className="eyebrow">Official portal</p>
          <h1 className="display mt-2 text-3xl text-forest-950 sm:text-4xl">
            Schools, roles, and suggestions
          </h1>
          <p className="mt-3 max-w-2xl text-base text-ink-muted">
            Approve schools, create Discord-style roles with icons, issue school
            scan credentials, and publish Suggestions.
          </p>
        </div>
      </section>
      <div className="mx-auto max-w-6xl space-y-14 px-5 py-10 sm:px-8">
        <AdminSchoolsPanel />
        <div id="roles">
          <AdminRoleBadgesPanel />
        </div>
        <AdminBadgesPanel />
        <div id="suggestions">
          <AdminSuggestionsPanel />
        </div>
        {isAdmin && <AdminSupportPanel />}
      </div>
    </div>
  );
}
