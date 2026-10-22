import { redirect } from "next/navigation";
import { amudPublicUrl } from "@/lib/site";

export const runtime = "edge";

/** Family portal removed — Guide is school-only; learning is on Amud. */
export default function FamilyRemovedPage() {
  redirect(amudPublicUrl());
}
