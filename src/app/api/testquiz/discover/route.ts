import { NextResponse } from "next/server";
import { z } from "zod";
import { hasEducationAccess } from "@/lib/education-access";
import { requireProfile } from "@/lib/profile";
import { listDiscoverQuizzes } from "@/lib/testquiz/store";

export const runtime = "edge";

async function requireTeacher() {
  const authz = await requireProfile(["rebbe", "admin"]);
  if (!authz) return null;
  if (!(await hasEducationAccess(authz.profile))) return null;
  return authz;
}

/** Teacher Discover browse — search / filter public quizzes. */
export async function GET(request: Request) {
  const authz = await requireTeacher();
  if (!authz) {
    return NextResponse.json({ error: "Teachers only" }, { status: 403 });
  }
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? undefined;
  const category = url.searchParams.get("category") ?? undefined;
  const quizzes = await listDiscoverQuizzes({ q, category });
  return NextResponse.json({ quizzes });
}
