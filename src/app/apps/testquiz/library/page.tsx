import { redirect } from "next/navigation";
import { TestQuizLibraryPanel } from "@/components/testquiz/library-panel";
import { hasEducationAccess } from "@/lib/education-access";
import { requireProfile } from "@/lib/profile";

export const runtime = "edge";

export const metadata = { title: "TestQuiz library" };

export default async function TestQuizLibraryPage() {
  const authz = await requireProfile(["rebbe", "admin"]);
  if (!authz || !(await hasEducationAccess(authz.profile))) {
    redirect("/apps/testquiz/join");
  }
  return <TestQuizLibraryPanel />;
}
