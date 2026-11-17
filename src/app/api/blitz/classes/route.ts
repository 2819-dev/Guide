import { NextResponse } from "next/server";
import { hasEducationAccess } from "@/lib/education-access";
import { requireProfile } from "@/lib/profile";
import { listTeacherClasses } from "@/lib/blitz/challenge";

export const runtime = "edge";

/** The teacher's Guide classes (for assigning self-paced challenges). */
export async function GET() {
  const authz = await requireProfile(["rebbe", "admin"]);
  if (!authz || !(await hasEducationAccess(authz.profile))) {
    return NextResponse.json({ error: "This is only available to teachers." }, { status: 403 });
  }
  const classes = await listTeacherClasses(authz.profile.id);
  return NextResponse.json({ classes });
}
