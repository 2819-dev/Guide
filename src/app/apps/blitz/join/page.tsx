import { Suspense } from "react";
import { redirect } from "next/navigation";
import { BlitzJoinPanel } from "@/components/blitz/join-panel";
import { requireProfile } from "@/lib/profile";

export const runtime = "edge";

export const metadata = { title: "Join Blitz" };

export default async function BlitzJoinPage() {
  const authz = await requireProfile();
  if (!authz) {
    redirect("/auth/sign-in?as=student");
  }

  return (
    <Suspense
      fallback={
        <p className="px-5 py-10 text-center text-[var(--tq-muted)]">Loading…</p>
      }
    >
      <BlitzJoinPanel realName={authz.profile.displayName} />
    </Suspense>
  );
}
