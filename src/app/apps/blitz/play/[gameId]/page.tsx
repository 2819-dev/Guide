import { redirect } from "next/navigation";
import { BlitzPlayPanel } from "@/components/blitz/play-panel";
import { requireProfile } from "@/lib/profile";

export const runtime = "edge";

type Props = { params: Promise<{ gameId: string }> };

export default async function BlitzPlayPage({ params }: Props) {
  const authz = await requireProfile();
  if (!authz) {
    redirect("/auth/sign-in?as=student");
  }
  const { gameId } = await params;
  return <BlitzPlayPanel gameId={gameId} playerId={authz.profile.id} />;
}
