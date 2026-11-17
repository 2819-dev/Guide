import { redirect } from "next/navigation";

export const runtime = "edge";

/** Family portal was removed; old links go to the homepage. */
export default function FamilyRemovedPage() {
  redirect("/");
}
