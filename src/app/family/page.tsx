import { redirect } from "next/navigation";
import { amudPublicUrl } from "@/lib/site";

export const instant = false;

/** Family portal removed — Guide is school-only; learning is on Amud. */
export default function FamilyRemovedPage() {
  const amud = amudPublicUrl();
  if (amud) redirect(amud);
  redirect("/learn");
}
