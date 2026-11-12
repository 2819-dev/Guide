import { Suspense } from "react";
import { redirect } from "next/navigation";
import { TestQuizJoinPanel } from "@/components/testquiz/join-panel";
import { requireProfile } from "@/lib/profile";

export const runtime = "edge";

export const metadata = { title: "Join TestQuiz" };

export default async function TestQuizJoinPage() {
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
      <TestQuizJoinPanel realName={authz.profile.displayName} />
    </Suspense>
  );
}
