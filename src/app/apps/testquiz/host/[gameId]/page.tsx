import { redirect } from "next/navigation";
import { TestQuizHostPanel } from "@/components/testquiz/host-panel";
import { hasEducationAccess } from "@/lib/education-access";
import { requireProfile } from "@/lib/profile";

export const runtime = "edge";

type Props = { params: Promise<{ gameId: string }> };

export default async function TestQuizHostPage({ params }: Props) {
  const authz = await requireProfile(["rebbe", "admin"]);
  if (!authz || !(await hasEducationAccess(authz.profile))) {
    redirect("/apps/testquiz/join");
  }
  const { gameId } = await params;
  return <TestQuizHostPanel gameId={gameId} />;
}
