import { redirect } from "next/navigation";
import { JoinClass } from "@/components/join-class";
import { SupportForm } from "@/components/support-form";
import { roleLabel } from "@/lib/roles";
import { requireProfile } from "@/lib/profile";
import type { Role } from "@/lib/roles";

export const instant = false;
export const metadata = { title: "Account" };

export default async function AccountPage() {
  const authz = await requireProfile();
  if (!authz) redirect("/auth/sign-in");

  const role = authz.profile.role as Role;

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-5 py-12 sm:px-8">
      <header>
        <h1 className="display text-4xl font-semibold text-forest-950">
          Account
        </h1>
        <p className="mt-2 text-ink-muted">
          Signed in as {authz.profile.displayName} · {roleLabel(role)}
        </p>
      </header>

      {role === "moderator" && (
        <div className="panel">
          <h2 className="display text-2xl font-semibold text-forest-900">
            Moderator
          </h2>
          <p className="mt-2 text-ink-muted">
            Your moderator account is ready. Tools for this role will arrive in a
            later release.
          </p>
        </div>
      )}

      {(role === "customer" || role === "rebbe") && <JoinClass />}

      <SupportForm />
    </div>
  );
}
