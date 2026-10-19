import { redirect } from "next/navigation";
import { AdminSupportPanel } from "@/components/admin-support-panel";
import { requireProfile } from "@/lib/profile";

export const instant = false;
export const metadata = { title: "Support" };

export default async function AdminPage() {
  const authz = await requireProfile(["admin"]);
  if (!authz) redirect("/auth/sign-in");

  return (
    <div>
      <section className="hero-band">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
          <p className="eyebrow">Operations</p>
          <h1 className="display mt-2 text-3xl text-forest-950 sm:text-4xl">
            Support panel
          </h1>
          <p className="mt-3 max-w-2xl text-base text-ink-muted">
            Review tickets and statuses. Names, emails, and other personal
            details are withheld from this view by design.
          </p>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <AdminSupportPanel />
      </div>
    </div>
  );
}
