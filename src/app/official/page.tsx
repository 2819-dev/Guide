import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/profile";

export const runtime = 'edge';

export const metadata = { title: "Guide Official" };

/** Clever-style Official portal alias → /admin. */
export default async function OfficialPortalPage() {
  let authz = null;
  try {
    authz = await requireProfile(["admin", "moderator"]);
  } catch {
    redirect("/auth/sign-in?as=official");
  }
  if (!authz) redirect("/auth/sign-in?as=official");
  redirect("/admin");
}
