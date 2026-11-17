import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal-shell";
import { StudentSuggestionsPad } from "@/components/student-suggestions";
import { requireProfile } from "@/lib/profile";

export const runtime = "edge";

export const metadata = { title: "Suggestions" };

export default async function StudentSuggestionsPage() {
  const authz = await requireProfile();
  if (!authz) redirect("/auth/sign-in?as=student");

  return (
    <PortalShell
      studentTabs
      eyebrow="Student"
      title="Suggestions"
      subtitle="Ideas and study prompts from the Guide team."
      chips={[
        { href: "/student#apps", label: "My apps" },
        { href: "/student#classes", label: "Classes" },
        { href: "/student/messages", label: "Messages" },
        { href: "/student/suggestions", label: "Suggestions", active: true },
      ]}
      accountName={authz.profile.displayName}
    >
      <StudentSuggestionsPad />
    </PortalShell>
  );
}
