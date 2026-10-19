import { redirect } from "next/navigation";
import { AdminSupportPanel } from "@/components/admin-support-panel";
import { requireProfile } from "@/lib/profile";

export const instant = false;
export const metadata = { title: "Support" };

export default async function AdminPage() {
  const authz = await requireProfile(["admin"]);
  if (!authz) redirect("/auth/sign-in");

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
      <header className="mb-10 max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-forest-600">
          Operations
        </p>
        <h1 className="display mt-2 text-4xl font-semibold text-forest-950">
          Support panel
        </h1>
        <p className="mt-3 text-lg text-ink-muted">
          Review tickets and statuses. Names, emails, and other personal details
          are withheld from this view by design.
        </p>
      </header>
      <AdminSupportPanel />
    </div>
  );
}
