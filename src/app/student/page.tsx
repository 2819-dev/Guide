import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { MyAppsGrid } from "@/components/my-apps-grid";
import { PortalShell, PortalToolTile } from "@/components/portal-shell";
import { RoleBadgeChip } from "@/components/role-badge-chip";
import { listAppsForStudent } from "@/lib/app-installs";
import { getDb } from "@/lib/db";
import { requireProfile } from "@/lib/profile";
import { listRolesForProfile } from "@/lib/role-badges";
import { schools } from "@/lib/schema";
import { isStudentSuggestionsBlocked } from "@/lib/suggestions-access";

export const runtime = 'edge';

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
    <PortalShell
      eyebrow="Student portal"
      title={`Hi, ${authz.profile.displayName}`}
      subtitle={schoolName ?? "Your apps and tools are below."}
      chips={[
        { href: "#apps", label: "My apps" },
        { href: "#tools", label: "Tools" },
      ]}
    >
      {roles.length > 0 ? (
        <ul className="-mt-2 flex flex-wrap gap-2">
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
      ) : null}

      <MyAppsGrid
        apps={apps}
        emptyHint="Join a class from Account, then ask your teacher to add an app."
      />

      <section id="tools">
        <h2 className="portal-section-title">Tools</h2>
        <div className="portal-tools-grid">
          <PortalToolTile
            href="/student/messages"
            title="Messages"
            description="Write to teachers of classes you joined."
            cta="Open →"
          />
          {suggestionsAccess.blocked ? (
            <PortalToolTile
              href="/student/suggestions"
              title="Suggestions"
              description={
                suggestionsAccess.reason ?? "Suggestions are paused for now."
              }
              muted
            />
          ) : (
            <PortalToolTile
              href="/student/suggestions"
              title="Suggestions"
              description="Ideas and study prompts from Guide."
              cta="Open →"
            />
          )}
        </div>
      </section>

      <p className="text-sm text-ink-muted">
        Class invite and badge login ·{" "}
        <Link href="/account" className="font-semibold text-forest-800">
          Account
        </Link>
      </p>
    </PortalShell>
  );
}
