import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { MyAppsGrid } from "@/components/my-apps-grid";
import { RoleBadgeChip } from "@/components/role-badge-chip";
import { listAppsForStudent } from "@/lib/app-installs";
import { getDb } from "@/lib/db";
import { requireProfile } from "@/lib/profile";
import { listRolesForProfile } from "@/lib/role-badges";
import { schools } from "@/lib/schema";
import { isStudentSuggestionsBlocked } from "@/lib/suggestions-access";

export const instant = false;
export const metadata = { title: "Student portal" };

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

  const roles = await listRolesForProfile(authz.profile.id);
  const apps = await listAppsForStudent(authz.profile.id);
  const suggestionsAccess = await isStudentSuggestionsBlocked(
    authz.profile.id,
  );

  return (
    <div className="content-band py-12 sm:py-16">
      <header className="mb-10 max-w-3xl">
        <p className="text-sm font-semibold text-forest-700">Student portal</p>
        <h1 className="display-feature mt-1.5">
          Hi, {authz.profile.displayName}
        </h1>
        {roles.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {roles.map((r) => (
              <li key={r.id}>
                <RoleBadgeChip
                  name={r.name}
                  color={r.color}
                  iconUrl={r.iconUrl}
                  size="sm"
                />
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-ink-muted">
          {schoolName
            ? `${schoolName} · Your apps and school tools.`
            : "Your apps and school tools."}
        </p>
      </header>

      <div className="mb-10">
        <MyAppsGrid
          apps={apps}
          emptyHint="No apps yet. Join a class from Account, then ask your teacher to add an app (like Amud)."
        />
      </div>

      <ul className="space-y-3">
        <li>
          <Link href="/student/messages" className="portal-tile">
            <p className="text-lg font-semibold text-forest-950">
              Message your teachers
            </p>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-muted">
              Write to the Rebbeim of classes you joined.
            </p>
            <p className="mt-4 text-sm font-semibold text-forest-800">
              Open messages →
            </p>
          </Link>
        </li>
        <li>
          {suggestionsAccess.blocked ? (
            <div className="rounded-[10px] border border-dashed border-line bg-sky-soft/40 px-5 py-6 sm:px-6">
              <p className="text-lg font-semibold text-forest-950">
                Suggestions
              </p>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-muted">
                {suggestionsAccess.reason ?? "Suggestions are paused for now."}
              </p>
              <p className="mt-4 text-sm font-semibold text-forest-700">
                Paused
              </p>
            </div>
          ) : (
            <Link href="/student/suggestions" className="portal-tile">
              <p className="text-lg font-semibold text-forest-950">
                Suggestions
              </p>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-muted">
                Open the Suggestions pad from Guide.
              </p>
              <p className="mt-4 text-sm font-semibold text-forest-800">
                Open Suggestions →
              </p>
            </Link>
          )}
        </li>
      </ul>

      <p className="mt-10 text-sm text-ink-muted">
        Scan credential or class invite ·{" "}
        <Link href="/account" className="font-semibold text-forest-800">
          Account
        </Link>
      </p>
    </div>
  );
}
