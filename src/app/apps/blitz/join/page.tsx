import { Suspense } from "react";
import { redirect } from "next/navigation";
import { BlitzJoinPanel } from "@/components/blitz/join-panel";
import { hasEducationAccess } from "@/lib/education-access";
import { requireProfile } from "@/lib/profile";

export const runtime = "edge";

export const metadata = { title: "Join Blitz" };

export default async function BlitzJoinPage() {
  const authz = await requireProfile();
  if (!authz) {
    redirect("/auth/sign-in?as=student");
  }
  const isTeacher =
    (authz.profile.role === "rebbe" || authz.profile.role === "admin") &&
    (await hasEducationAccess(authz.profile));

  return (
    <Suspense fallback={<p className="bz-page bz-muted">Loading…</p>}>
      <BlitzJoinPanel realName={authz.profile.displayName} isTeacher={isTeacher} />
    </Suspense>
  );
}
