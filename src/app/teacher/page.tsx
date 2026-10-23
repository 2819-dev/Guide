import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/profile";

export const runtime = "edge";

export const metadata = { title: "Teacher portal · Guide" };

/** Clever-style teacher / school-admin portal alias → Education panel. */
export default async function TeacherPortalPage() {
  const authz = await requireProfile(["rebbe", "admin"]);
  if (!authz) redirect("/auth/sign-in?as=educator");

  // Full tools or limited pending/declined view — both live on the panel.
  redirect("/education/panel");
}
