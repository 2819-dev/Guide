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
      studentTabs
      eyebrow="Student"
      title={`Welcome, ${authz.profile.displayName}`}
      subtitle={
        schoolName
          ? `${schoolName} · Open the apps your teachers added to your classes.`
          : "Open the apps your teachers added to your classes."
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
              ? "Join a class with the code from your teacher. Your class apps will appear here."
              : "Your teachers haven’t added any apps yet. They will appear here when they do."
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
                <p className="mt-0.5 text-sm text-ink-muted">
                  Teacher: {c.teacher}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="portal-section-lede mb-4">
            You haven’t joined a class yet. Ask your teacher for the class code.
          </p>
        )}
        <JoinClass />
      </section>

      <section id="tools" className="hidden md:block">
        <h2 className="portal-section-title">Tools</h2>
        <div className="portal-tools-grid">
          <PortalToolTile
            href="/student/messages"
            title="Messages"
            description="Message the teachers of your classes."
            cta="Open messages"
          />
          {suggestionsAccess.blocked ? (
            <PortalToolTile
              href="/student/suggestions"
              title="Suggestions"
              description={
                suggestionsAccess.reason ?? "Your teacher has paused Suggestions."
              }
              muted
            />
          ) : (
            <PortalToolTile
              href="/student/suggestions"
              title="Suggestions"
              description="Ideas and study prompts from the Guide team."
              cta="Open suggestions"
            />
          )}
        </div>
      </section>
    </PortalShell>
  );
}
