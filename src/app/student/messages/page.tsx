import Link from "next/link";
import { redirect } from "next/navigation";
import { StudentMessages } from "@/components/student-messages";
import { requireProfile } from "@/lib/profile";

export const instant = false;
export const metadata = { title: "Messages" };

export default async function StudentMessagesPage() {
  const authz = await requireProfile();
  if (!authz) redirect("/auth/sign-in?as=student");

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
      <p className="text-sm">
        <Link href="/student" className="font-semibold text-forest-800">
          ← Student
        </Link>
      </p>
      <header className="mt-4 mb-8">
        <h1 className="display text-3xl text-forest-950">
          Message your teachers
        </h1>
        <p className="mt-2 text-ink-muted">
          Real conversations with the Rebbeim of classes you joined.
        </p>
      </header>
      <StudentMessages />
    </div>
  );
}
