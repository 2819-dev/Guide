import { redirect } from "next/navigation";
import { BlitzChallengePanel } from "@/components/blitz/challenge-panel";
import { requireProfile } from "@/lib/profile";

export const runtime = "edge";

export const metadata = { title: "Blitz challenge" };

type Props = { params: Promise<{ id: string }> };

export default async function BlitzChallengePage({ params }: Props) {
  const authz = await requireProfile();
  if (!authz) redirect("/auth/sign-in?as=student");
  const { id } = await params;
  return <BlitzChallengePanel challengeId={id} />;
}
