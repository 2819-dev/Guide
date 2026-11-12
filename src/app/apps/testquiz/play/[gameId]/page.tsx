import { redirect } from "next/navigation";
import { TestQuizPlayPanel } from "@/components/testquiz/play-panel";
import { requireProfile } from "@/lib/profile";

export const runtime = "edge";

type Props = { params: Promise<{ gameId: string }> };

export default async function TestQuizPlayPage({ params }: Props) {
  const authz = await requireProfile();
  if (!authz) {
    redirect("/auth/sign-in?as=student");
  }
  const { gameId } = await params;
  return <TestQuizPlayPanel gameId={gameId} playerId={authz.profile.id} />;
}
