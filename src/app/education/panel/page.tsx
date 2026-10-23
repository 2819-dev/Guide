import { redirect } from "next/navigation";
import { EducationPanel } from "@/components/education-panel";
import { LimitedEducationPortal } from "@/components/limited-education-portal";
import { PortalShell } from "@/components/portal-shell";
import {
  getApplicantEducationStatus,
  hasEducationAccess,
} from "@/lib/education-access";
import { educatorPortalLabel } from "@/lib/educator-portal-label";
import { requireProfile } from "@/lib/profile";

export const runtime = "edge";

export const metadata = { title: "School portal · Guide" };

export default async function EducationPanelPage() {
  const authz = await requireProfile(["rebbe", "admin"]);
  if (!authz) redirect("/auth/sign-in?as=educator");

  const allowed = await hasEducationAccess(authz.profile);
  if (!allowed) {
    const appStatus = await getApplicantEducationStatus(authz.profile.id);
    const status =
      appStatus.status === "approved"
        ? "pending"
        : appStatus.status === "none"
          ? "none"
          : appStatus.status;
    const portalLabel = educatorPortalLabel({
      kind: appStatus.kind,
    });
    return (
      <LimitedEducationPortal
        displayName={authz.profile.displayName}
        status={status}
        schoolName={appStatus.schoolName}
        portalLabel={portalLabel}
        kind={appStatus.kind ?? "school"}
      />
    );
  }

  const appStatus = await getApplicantEducationStatus(authz.profile.id);
  const portalLabel = educatorPortalLabel({ kind: appStatus.kind });

  return (
    <PortalShell
      eyebrow={portalLabel}
      title={`Hi, ${authz.profile.displayName}`}
      subtitle="Add apps to classes, invite teachers, and keep students engaged — tabs across the top."
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
