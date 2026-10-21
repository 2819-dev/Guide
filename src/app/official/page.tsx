import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/profile";

export const runtime = 'edge';

export const metadata = { title: "Guide Official" };

/** Clever-style Official portal alias → /admin. */
export default async function OfficialPortalPage() {
  const authz = await requireProfile(["admin", "moderator"]);
  if (!authz) redirect("/auth/sign-in?as=official");
  redirect("/admin");
}
