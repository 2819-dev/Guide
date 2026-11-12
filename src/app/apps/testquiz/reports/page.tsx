import { redirect } from "next/navigation";
import { TestQuizReportsPanel } from "@/components/testquiz/reports-panel";
import { hasEducationAccess } from "@/lib/education-access";
import { requireProfile } from "@/lib/profile";

export const runtime = "edge";

export const metadata = { title: "TestQuiz reports" };

export default async function TestQuizReportsPage() {
  const authz = await requireProfile(["rebbe", "admin"]);
  if (!authz || !(await hasEducationAccess(authz.profile))) {
    redirect("/apps/testquiz/join");
  }
  return <TestQuizReportsPanel />;
}
