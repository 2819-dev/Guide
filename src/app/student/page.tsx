import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { requireProfile } from "@/lib/profile";
import { schools } from "@/lib/schema";
import { isStudentSuggestionsBlocked } from "@/lib/suggestions-access";

export const instant = false;
export const metadata = { title: "Student" };

export default async function StudentHubPage() {
  const authz = await requireProfile();
  if (!authz) redirect("/auth/sign-in?as=student");

  const db = getDb();
  let schoolName: string | null = null;
  if (authz.profile.schoolId) {
    const [school] = await db
      .select({ name: schools.name })
      .from(schools)
      .where(eq(schools.id, authz.profile.schoolId))
      .limit(1);
    schoolName = school?.name ?? null;
  }

  const suggestionsAccess = await isStudentSuggestionsBlocked(
    authz.profile.id,
  );

  const tiles = [
    {
      href: "/study",
      label: "Your learning",
      description: "Choose what to learn and Test Yourself on the daf.",
      cta: "Open study →",
      locked: false,
      lockReason: null as string | null,
    },
    {
      href: "/student/messages",
      label: "Message your teachers",
      description: "Write to the Rebbeim of classes you joined.",
      cta: "Open messages →",
      locked: false,
      lockReason: null as string | null,
    },
    {
      href: suggestionsAccess.blocked ? "#" : "/student/suggestions",
      label: "Suggestions",
      description: suggestionsAccess.blocked
        ? (suggestionsAccess.reason ?? "Suggestions are paused for now.")
        : "Open the Suggestions pad from Guide.",
      cta: suggestionsAccess.blocked ? "Paused" : "Open Suggestions →",
      locked: suggestionsAccess.blocked,
      lockReason: suggestionsAccess.reason,
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <header className="mb-10">
        <p className="text-sm font-semibold text-forest-700">Student</p>
        <h1 className="display mt-1.5 text-3xl text-forest-950 sm:text-4xl">
          Hi, {authz.profile.displayName}
        </h1>
        <p className="mt-3 text-ink-muted">
          {schoolName
            ? `${schoolName} · Choose where to go next.`
            : "Choose where to go next."}
        </p>
      </header>

      <ul className="space-y-3">
        {tiles.map((tile) => (
          <li key={tile.label}>
            {tile.locked ? (
              <div className="rounded-2xl border border-dashed border-line bg-sky-soft/40 px-5 py-6 sm:px-6">
                <p className="text-lg font-semibold text-forest-950">
                  {tile.label}
                </p>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-muted">
                  {tile.description}
                </p>
                <p className="mt-4 text-sm font-semibold text-forest-700">
                  {tile.cta}
                </p>
              </div>
            ) : (
              <Link
                href={tile.href}
                className="block rounded-2xl border border-line bg-surface px-5 py-6 no-underline transition hover:border-forest-400 hover:bg-forest-100 sm:px-6"
              >
                <p className="text-lg font-semibold text-forest-950">
                  {tile.label}
                </p>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-muted">
                  {tile.description}
                </p>
                <p className="mt-4 text-sm font-semibold text-forest-800">
                  {tile.cta}
                </p>
              </Link>
            )}
          </li>
        ))}
      </ul>

      <p className="mt-10 text-sm text-ink-muted">
        Need your badge or class invite?{" "}
        <Link href="/account" className="font-semibold text-forest-800">
          Account
        </Link>
      </p>
    </div>
  );
}
