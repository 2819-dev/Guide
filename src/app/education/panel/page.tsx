import { redirect } from "next/navigation";
import { EducationPanel } from "@/components/education-panel";
import { PortalShell } from "@/components/portal-shell";
import { hasEducationAccess } from "@/lib/education-access";
import { requireProfile } from "@/lib/profile";

export const instant = false;
export const metadata = { title: "Teacher portal" };

export default async function EducationPanelPage() {
  const authz = await requireProfile(["rebbe", "admin"]);
  if (!authz) redirect("/auth/sign-in?as=educator");

  const allowed = await hasEducationAccess(authz.profile);
  if (!allowed) {
    // Pending / declined / no application — wait or re-apply on /education.
    redirect("/education");
  }

  return (
    <PortalShell
      eyebrow="Teacher or School Administrator"
      title={`Hi, ${authz.profile.displayName}`}
      subtitle="Add apps to a class, invite students, manage Suggestions, and message."
      chips={[
        { href: "#apps", label: "Apps" },
        { href: "#classes", label: "Classes" },
        { href: "#suggestions-access", label: "Suggestions" },
        { href: "#messages", label: "Messages" },
      ]}
    >
      <EducationPanel />
    </PortalShell>
  );
}
