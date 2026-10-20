import { redirect } from "next/navigation";
import { AdminSchoolsPanel } from "@/components/admin-schools-panel";
import { AdminSupportPanel } from "@/components/admin-support-panel";
import { requireProfile } from "@/lib/profile";

export const instant = false;
export const metadata = { title: "Operations" };

export default async function AdminPage() {
  const authz = await requireProfile(["admin", "moderator"]);
  if (!authz) redirect("/auth/sign-in?as=official");

  const isAdmin = authz.profile.role === "admin";

  return (
    <div>
      <section className="hero-band">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
          <p className="eyebrow">Operations</p>
          <h1 className="display mt-2 text-3xl text-forest-950 sm:text-4xl">
            {isAdmin ? "Support & schools" : "School applications"}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-ink-muted">
            {isAdmin
              ? "Review school applications and support tickets. Support tickets hide personal details by design; school applications show contact info needed for approval."
              : "Review school applications for Guide for Education."}
          </p>
        </div>
      </section>
      <div className="mx-auto max-w-6xl space-y-14 px-5 py-10 sm:px-8">
        <AdminSchoolsPanel />
        {isAdmin && <AdminSupportPanel />}
      </div>
    </div>
  );
}
