import "@/components/blitz/blitz.css";
import { BlitzAppNav } from "@/components/blitz/app-nav";
import { getEntitlement } from "@/lib/blitz/entitlements";
import { hasEducationAccess } from "@/lib/education-access";
import { requireProfile } from "@/lib/profile";

export const runtime = "edge";

/**
 * Blitz is always dark. Game screens (host, play, join, challenge) render a
 * fixed full-screen stage on top of this shell.
 */
export default async function BlitzLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authz = await requireProfile();
  const teacher =
    !!authz &&
    (authz.profile.role === "rebbe" || authz.profile.role === "admin") &&
    (await hasEducationAccess(authz.profile));

  let planLabel: string | null = null;
  if (teacher && authz) {
    try {
      planLabel = (await getEntitlement(authz.profile.id)).plan.label;
    } catch {
      planLabel = null;
    }
  }

  return (
    <div className="bz bz-app">
      <BlitzAppNav teacher={teacher} planLabel={planLabel} />
      {children}
    </div>
  );
}
