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
      eyebrow="Student"
      title="Suggestions"
      subtitle="Ideas and study prompts from Guide."
      chips={[
        { href: "/student#apps", label: "My apps" },
        { href: "/student#tools", label: "Tools" },
      ]}
      utilities={[
        { href: "/student/messages", label: "Messaging" },
        { href: "/student/suggestions", label: "Suggestions", active: true },
      ]}
      accountName={authz.profile.displayName}
    >
      <StudentSuggestionsPad />
    </PortalShell>
  );
}
