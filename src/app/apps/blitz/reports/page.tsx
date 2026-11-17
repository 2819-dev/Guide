import { Suspense } from "react";
import { redirect } from "next/navigation";
import { BlitzReportsPanel } from "@/components/blitz/reports-panel";
import { hasEducationAccess } from "@/lib/education-access";
import { requireProfile } from "@/lib/profile";

export const runtime = "edge";

export const metadata = { title: "Reports · Blitz" };

export default async function BlitzReportsPage() {
  const authz = await requireProfile(["rebbe", "admin"]);
  if (!authz || !(await hasEducationAccess(authz.profile))) {
    redirect("/apps/blitz/join");
  }
  return (
    <Suspense fallback={<p className="bz-page bz-muted" role="status">Loading…</p>}>
      <BlitzReportsPanel />
    </Suspense>
  );
}
