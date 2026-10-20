import Link from "next/link";
import { redirect } from "next/navigation";
import { StudentMessages } from "@/components/student-messages";
import { requireProfile } from "@/lib/profile";

export const instant = false;
export const metadata = { title: "Messages" };

export default async function FamilyMessagesPage() {
  const authz = await requireProfile();
  if (!authz) redirect("/auth/sign-in?as=family");
  if (authz.profile.schoolId || authz.profile.badgeCode) {
    redirect("/student/messages");
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
      <p className="text-sm">
        <Link href="/family" className="font-semibold text-forest-800">
          ← Family portal
        </Link>
      </p>
      <header className="mt-4 mb-8">
        <h1 className="display text-3xl text-forest-950">Messages</h1>
        <p className="mt-2 text-ink-muted">
          Conversations on your account. School students message teachers from
          the Student portal after joining a class.
        </p>
      </header>
      <StudentMessages />
    </div>
  );
}
