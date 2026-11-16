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
  const portalLabel = educatorPortalLabel({
    kind: appStatus.kind,
    contactRole: appStatus.contactRole,
  });
  const isTeacher = portalLabel === "Teacher Portal";
  const shortRole = isTeacher ? "Teacher" : "School administrator";

  return (
    <PortalShell
      eyebrow={shortRole}
      title={`Hi, ${authz.profile.displayName}`}
      subtitle={
        isTeacher
          ? "Create classes, add apps, and message your students."
          : "Create classes, add apps, invite teachers, and message students."
      }
      chips={[
        { href: "#classes", label: "Classes", active: true },
        { href: "#apps", label: "Apps" },
        ...(isTeacher ? [] : [{ href: "#teachers", label: "Teachers" }]),
        { href: "#suggestions-access", label: "Suggestions" },
        { href: "#messages", label: "Messages" },
      ]}
      accountName={authz.profile.displayName}
    >
      <EducationPanel canInviteTeachers={!isTeacher} />
    </PortalShell>
  );
}
