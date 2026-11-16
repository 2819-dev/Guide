import { redirect } from "next/navigation";
import { BlitzEditorPanel } from "@/components/blitz/editor-panel";
import { hasEducationAccess } from "@/lib/education-access";
import { requireProfile } from "@/lib/profile";

export const runtime = "edge";

type Props = { params: Promise<{ quizId: string }> };

export default async function BlitzEditPage({ params }: Props) {
  const authz = await requireProfile(["rebbe", "admin"]);
  if (!authz || !(await hasEducationAccess(authz.profile))) {
    redirect("/apps/blitz/join");
  }
  const { quizId } = await params;
  return <BlitzEditorPanel quizId={quizId} />;
}
