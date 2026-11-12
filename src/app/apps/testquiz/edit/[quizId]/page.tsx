import { redirect } from "next/navigation";
import { TestQuizEditorPanel } from "@/components/testquiz/editor-panel";
import { hasEducationAccess } from "@/lib/education-access";
import { requireProfile } from "@/lib/profile";

export const runtime = "edge";

type Props = { params: Promise<{ quizId: string }> };

export default async function TestQuizEditPage({ params }: Props) {
  const authz = await requireProfile(["rebbe", "admin"]);
  if (!authz || !(await hasEducationAccess(authz.profile))) {
    redirect("/apps/testquiz/join");
  }
  const { quizId } = await params;
  return <TestQuizEditorPanel quizId={quizId} />;
}
