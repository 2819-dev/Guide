import { redirect } from "next/navigation";
import { hasEducationAccess } from "@/lib/education-access";
import { requireProfile } from "@/lib/profile";

export const runtime = "edge";

export const metadata = {
  title: "TestQuiz",
};

export default async function TestQuizHomePage() {
  const authz = await requireProfile();
  if (!authz) {
    redirect("/auth/sign-in?as=student");
  }

  const isTeacher =
    (authz.profile.role === "rebbe" || authz.profile.role === "admin") &&
    (await hasEducationAccess(authz.profile));

  if (isTeacher) {
    redirect("/apps/testquiz/library");
  }

  // Students land on join (PIN always required).
  redirect("/apps/testquiz/join");
}
