import { redirect } from "next/navigation";
import { BlitzDiscoverPanel } from "@/components/blitz/discover-panel";
import { hasEducationAccess } from "@/lib/education-access";
import { requireProfile } from "@/lib/profile";

export const runtime = "edge";

export const metadata = { title: "Discover · Blitz" };

export default async function BlitzDiscoverPage() {
  const authz = await requireProfile(["rebbe", "admin"]);
  if (!authz) redirect("/auth/sign-in?as=educator");
  if (!(await hasEducationAccess(authz.profile))) {
    redirect("/education/panel");
  }
  return <BlitzDiscoverPanel />;
}
