import { redirect } from "next/navigation";
import { EducationPanel } from "@/components/education-panel";
import { requireProfile } from "@/lib/profile";

export const instant = false;
export const metadata = { title: "Guide for Education" };

export default async function EducationPage() {
  const authz = await requireProfile(["rebbe", "admin"]);
  if (!authz) redirect("/auth/sign-in");

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
      <header className="mb-10 max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-forest-600">
          Guide for Education
        </p>
        <h1 className="display mt-2 text-4xl font-semibold text-forest-950">
          Rebbe panel
        </h1>
        <p className="mt-3 text-lg text-ink-muted">
          Invite students with a class code. Track dapim studied, quizzes, and
          notes from home or Chromebook study — without leaving the forest calm
          of Guide.
        </p>
      </header>
      <EducationPanel />
    </div>
  );
}
