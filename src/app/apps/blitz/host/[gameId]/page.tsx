import { redirect } from "next/navigation";
import { BlitzHostPanel } from "@/components/blitz/host-panel";
import { hasEducationAccess } from "@/lib/education-access";
import { requireProfile } from "@/lib/profile";

export const runtime = "edge";

export const metadata = { title: "Host · Blitz" };

type Props = { params: Promise<{ gameId: string }> };

export default async function BlitzHostPage({ params }: Props) {
  const authz = await requireProfile(["rebbe", "admin"]);
  if (!authz || !(await hasEducationAccess(authz.profile))) {
    redirect("/apps/blitz/join");
  }
  const { gameId } = await params;
  return <BlitzHostPanel gameId={gameId} />;
}
