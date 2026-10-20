import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal-shell";
import { StudentSuggestionsPad } from "@/components/student-suggestions";
import { requireProfile } from "@/lib/profile";

export const instant = false;
export const metadata = { title: "Suggestions" };

export default async function StudentSuggestionsPage() {
  const authz = await requireProfile();
  if (!authz) redirect("/auth/sign-in?as=student");

  return (
    <PortalShell
      eyebrow="Student portal"
      title="Suggestions"
      subtitle="Ideas and study prompts from Guide."
      backHref="/student"
      backLabel="← Student portal"
    >
      <StudentSuggestionsPad />
    </PortalShell>
  );
}
