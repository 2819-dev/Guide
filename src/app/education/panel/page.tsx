import { redirect } from "next/navigation";
import { EducationPanel } from "@/components/education-panel";
import { PortalShell } from "@/components/portal-shell";
import { hasEducationAccess } from "@/lib/education-access";
import { requireProfile } from "@/lib/profile";

export const runtime = "edge";

export const metadata = { title: "Teacher portal" };

export default async function EducationPanelPage() {
  const authz = await requireProfile(["rebbe", "admin"]);
  if (!authz) redirect("/auth/sign-in?as=educator");

  const allowed = await hasEducationAccess(authz.profile);
  if (!allowed) {
    redirect("/education");
  }

  return (
    <PortalShell
      eyebrow="Teacher or School Administrator"
      title={`Hi, ${authz.profile.displayName}`}
      subtitle="Tabs across the top. Add apps, invite teachers, manage classes, and message — Clever-like density."
      chips={[
        { href: "#apps", label: "Apps", active: true },
        { href: "#teachers", label: "Teachers" },
        { href: "#classes", label: "Classes" },
        { href: "#suggestions-access", label: "Suggestions" },
        { href: "#messages", label: "Messages" },
      ]}
    >
      <EducationPanel />
    </PortalShell>
  );
}
