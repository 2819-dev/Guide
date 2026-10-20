import { redirect } from "next/navigation";
import { studyIndexPath } from "@/lib/apps";

export const instant = false;

/** Legacy /study → first Guide app. */
export default function StudyRedirectPage() {
  redirect(studyIndexPath());
}
