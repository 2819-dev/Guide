import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal-shell";
import { StudentMessages } from "@/components/student-messages";
import { requireProfile } from "@/lib/profile";

export const runtime = 'edge';

export const metadata = { title: "Messages" };

export default async function StudentMessagesPage() {
  const authz = await requireProfile();
  if (!authz) redirect("/auth/sign-in?as=student");

  return (
    <PortalShell
      eyebrow="Student portal"
      title="Messages"
      subtitle="Real conversations with the teachers of classes you joined."
      backHref="/student"
      backLabel="← Student portal"
    >
      <StudentMessages />
    </PortalShell>
  );
}
