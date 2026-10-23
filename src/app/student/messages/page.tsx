import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal-shell";
import { StudentMessages } from "@/components/student-messages";
import { requireProfile } from "@/lib/profile";

export const runtime = "edge";

export const metadata = { title: "Messages" };

export default async function StudentMessagesPage() {
  const authz = await requireProfile();
  if (!authz) redirect("/auth/sign-in?as=student");

  return (
    <PortalShell
      eyebrow="Student"
      title="Messages"
      subtitle="Write to teachers of classes you joined — keep class work moving."
      chips={[
        { href: "/student#apps", label: "My apps" },
        { href: "/student#tools", label: "Tools" },
      ]}
      utilities={[
        { href: "/student/messages", label: "Messaging", active: true },
        { href: "/student/suggestions", label: "Suggestions" },
      ]}
      accountName={authz.profile.displayName}
    >
      <StudentMessages />
    </PortalShell>
  );
}
