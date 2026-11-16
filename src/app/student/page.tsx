import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { JoinClass } from "@/components/join-class";
import { MyAppsGrid } from "@/components/my-apps-grid";
import { PortalShell, PortalToolTile } from "@/components/portal-shell";
import { RoleBadgeChip } from "@/components/role-badge-chip";
import { listAppsForStudent } from "@/lib/app-installs";
import { getDb } from "@/lib/db";
import { requireProfile } from "@/lib/profile";
import { listRolesForProfile } from "@/lib/role-badges";
import {
  classroomMembers,
  classrooms,
  profiles,
  schools,
} from "@/lib/schema";
import { isStudentSuggestionsBlocked } from "@/lib/suggestions-access";

export const runtime = "edge";

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

  const myClasses = await db
    .select({
      id: classrooms.id,
      name: classrooms.name,
      teacher: profiles.displayName,
    })
    .from(classroomMembers)
    .innerJoin(classrooms, eq(classroomMembers.classroomId, classrooms.id))
    .innerJoin(profiles, eq(classrooms.rebbeId, profiles.id))
    .where(eq(classroomMembers.studentId, authz.profile.id));

  const roles = await listRolesForProfile(authz.profile.id);
  const apps = await listAppsForStudent(authz.profile.id);
  const suggestionsAccess = await isStudentSuggestionsBlocked(
    authz.profile.id,
  );

  return (
    <PortalShell
      eyebrow="Student"
      title={`Hi, ${authz.profile.displayName}`}
      subtitle={
        schoolName
          ? `${schoolName} · Open apps your teachers added for class.`
          : "Open the apps your teachers added for class."
      }
      chips={[
        { href: "/student#apps", label: "My apps", active: true },
        { href: "/student#classes", label: "Classes" },
        { href: "/student/messages", label: "Messages" },
        { href: "/student/suggestions", label: "Suggestions" },
      ]}
      accountName={authz.profile.displayName}
    >
      {roles.length > 0 ? (
        <ul className="portal-role-row">
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

      <div className="portal-primary">
        <MyAppsGrid
          apps={apps}
          emptyHint={
            myClasses.length === 0
              ? "Join your class with the code from your teacher below. Your class apps will show up here."
              : "Your teacher hasn’t added an app to your class yet. Check back soon."
          }
        />
      </div>

      <section id="classes">
        <h2 className="portal-section-title">My classes</h2>
        {myClasses.length > 0 ? (
          <ul className="mb-4 grid gap-3 sm:grid-cols-2">
            {myClasses.map((c) => (
              <li key={c.id} className="portal-panel !py-4">
                <p className="font-semibold text-forest-950">{c.name}</p>
                <p className="mt-0.5 text-sm text-ink-muted">{c.teacher}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="-mt-2 mb-4 text-sm text-ink-muted">
            You haven’t joined a class yet. Ask your teacher for the class code.
          </p>
        )}
        <JoinClass />
      </section>

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
    </PortalShell>
  );
}
