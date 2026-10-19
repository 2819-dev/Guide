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
      <section className="bg-sky-soft">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-forest-600">
            Operations
          </p>
          <h1 className="display mt-2 text-4xl text-forest-950 sm:text-5xl">
            Support panel
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-ink-muted">
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
