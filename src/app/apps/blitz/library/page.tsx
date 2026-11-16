import { redirect } from "next/navigation";
import { BlitzLibraryPanel } from "@/components/blitz/library-panel";
import { hasEducationAccess } from "@/lib/education-access";
import { requireProfile } from "@/lib/profile";

export const runtime = "edge";

export const metadata = { title: "Blitz library" };

export default async function BlitzLibraryPage() {
  const authz = await requireProfile(["rebbe", "admin"]);
  if (!authz || !(await hasEducationAccess(authz.profile))) {
    redirect("/apps/blitz/join");
  }
  return <BlitzLibraryPanel />;
}
