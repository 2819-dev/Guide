import Link from "next/link";
import { redirect } from "next/navigation";
import { StudentSuggestionsPad } from "@/components/student-suggestions";
import { requireProfile } from "@/lib/profile";

export const instant = false;
export const metadata = { title: "Suggestions" };

export default async function FamilySuggestionsPage() {
  const authz = await requireProfile();
  if (!authz) redirect("/auth/sign-in?as=family");
  if (authz.profile.schoolId || authz.profile.badgeCode) {
    redirect("/student/suggestions");
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <p className="text-sm">
        <Link href="/family" className="font-semibold text-forest-800">
          ← Family portal
        </Link>
      </p>
      <header className="mt-4 mb-8">
        <h1 className="display text-3xl text-forest-950">Suggestions</h1>
        <p className="mt-2 text-ink-muted">
          Ideas and study prompts from Guide.
        </p>
      </header>
      <StudentSuggestionsPad />
    </div>
  );
}
