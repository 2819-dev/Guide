import Link from "next/link";
import { redirect } from "next/navigation";
import { EducationPanel } from "@/components/education-panel";
import { hasEducationAccess } from "@/lib/education-access";
import { requireProfile } from "@/lib/profile";

export const instant = false;
export const metadata = { title: "Rebbe panel" };

export default async function EducationPanelPage() {
  const authz = await requireProfile(["rebbe", "admin"]);
  if (!authz) redirect("/auth/sign-in?as=educator");

  const allowed = await hasEducationAccess(authz.profile);
  if (!allowed) {
    redirect("/education#apply");
  }

  return (
    <div>
      <section className="hero-band">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
          <Link
            href="/education"
            className="text-sm font-medium text-forest-700 no-underline hover:underline"
          >
            ← Guide for Education
          </Link>
          <p className="eyebrow mt-4">Teacher portal</p>
          <h1 className="display mt-2 text-3xl text-forest-950 sm:text-4xl">
            Classes and students
          </h1>
          <p className="mt-3 max-w-2xl text-base text-ink-muted">
            Invite with a class code, add apps (like Amud), pause
            Suggestions, message students, and follow progress from home or
            Chromebook.
          </p>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <EducationPanel />
      </div>
    </div>
  );
}
