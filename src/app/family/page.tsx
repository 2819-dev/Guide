import Link from "next/link";
import { redirect } from "next/navigation";
import { RoleBadgeChip } from "@/components/role-badge-chip";
import { requireProfile } from "@/lib/profile";
import { listRolesForProfile } from "@/lib/role-badges";
import { isStudentSuggestionsBlocked } from "@/lib/suggestions-access";

export const instant = false;
export const metadata = { title: "Family portal" };

export default async function FamilyPortalPage() {
  const authz = await requireProfile();
  if (!authz) redirect("/auth/sign-in?as=family");

  // School students should use the student portal
  if (authz.profile.schoolId || authz.profile.badgeCode) {
    redirect("/student");
  }
  if (authz.profile.role === "admin" || authz.profile.role === "moderator") {
    redirect("/official");
  }
  if (authz.profile.role === "rebbe") {
    redirect("/teacher");
  }

  const roles = await listRolesForProfile(authz.profile.id);
  const suggestionsAccess = await isStudentSuggestionsBlocked(
    authz.profile.id,
  );

  const tiles = [
    {
      href: "/study",
      label: "Your learning",
      description: "Choose what to learn and Test Yourself on the daf.",
      cta: "Open study →",
      locked: false,
    },
    {
      href: "/family/messages",
      label: "Messages",
      description: "Conversations tied to your account (when available).",
      cta: "Open messages →",
      locked: false,
    },
    {
      href: suggestionsAccess.blocked ? "#" : "/family/suggestions",
      label: "Suggestions",
      description: suggestionsAccess.blocked
        ? (suggestionsAccess.reason ?? "Suggestions are paused for now.")
        : "Ideas and study prompts from Guide.",
      cta: suggestionsAccess.blocked ? "Paused" : "Open Suggestions →",
      locked: suggestionsAccess.blocked,
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <header className="mb-10">
        <p className="text-sm font-semibold text-forest-700">Family portal</p>
        <h1 className="display mt-1.5 text-3xl text-forest-950 sm:text-4xl">
          Hi, {authz.profile.displayName}
        </h1>
        {roles.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {roles.map((r) => (
              <li key={r.id}>
                <RoleBadgeChip
                  name={r.name}
                  color={r.color}
                  iconUrl={r.iconUrl}
                  size="sm"
                />
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-ink-muted">
          Study at home — Test Yourself, notes, and saved progress.
        </p>
      </header>

      <ul className="space-y-3">
        {tiles.map((tile) => (
          <li key={tile.label}>
            {tile.locked ? (
              <div className="rounded-2xl border border-dashed border-line bg-sky-soft/40 px-5 py-6 sm:px-6">
                <p className="text-lg font-semibold text-forest-950">
                  {tile.label}
                </p>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-muted">
                  {tile.description}
                </p>
                <p className="mt-4 text-sm font-semibold text-forest-700">
                  {tile.cta}
                </p>
              </div>
            ) : (
              <Link
                href={tile.href}
                className="block rounded-2xl border border-line bg-surface px-5 py-6 no-underline transition hover:border-forest-400 hover:bg-forest-100 sm:px-6"
              >
                <p className="text-lg font-semibold text-forest-950">
                  {tile.label}
                </p>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-muted">
                  {tile.description}
                </p>
                <p className="mt-4 text-sm font-semibold text-forest-800">
                  {tile.cta}
                </p>
              </Link>
            )}
          </li>
        ))}
      </ul>

      <p className="mt-10 text-sm text-ink-muted">
        Account settings ·{" "}
        <Link href="/account" className="font-semibold text-forest-800">
          Account
        </Link>
      </p>
    </div>
  );
}
