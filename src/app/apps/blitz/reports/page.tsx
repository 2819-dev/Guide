import { redirect } from "next/navigation";
import { BlitzReportsPanel } from "@/components/blitz/reports-panel";
import { hasEducationAccess } from "@/lib/education-access";
import { requireProfile } from "@/lib/profile";

export const runtime = "edge";

export const metadata = { title: "Blitz reports" };

export default async function BlitzReportsPage() {
  const authz = await requireProfile(["rebbe", "admin"]);
  if (!authz || !(await hasEducationAccess(authz.profile))) {
    redirect("/apps/blitz/join");
  }
  return <BlitzReportsPanel />;
}
