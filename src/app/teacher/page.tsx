import { redirect } from "next/navigation";
import { hasEducationAccess } from "@/lib/education-access";
import { requireProfile } from "@/lib/profile";

export const instant = false;
export const metadata = { title: "Teacher portal" };

/** Clever-style teacher portal alias → Education panel. */
export default async function TeacherPortalPage() {
  const authz = await requireProfile(["rebbe", "admin"]);
  if (!authz) redirect("/auth/sign-in?as=educator");

  const allowed = await hasEducationAccess(authz.profile);
  if (!allowed) redirect("/education#apply");

  redirect("/education/panel");
}
