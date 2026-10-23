"use client";

import Link from "next/link";
import {
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import {
  createDemoSession,
  DEMO_ROLES,
  demoRoleLabel,
  type DemoClassroom,
  type DemoRole,
  type DemoSession,
} from "@/lib/demo-fixtures";

type TeacherTab = "apps" | "classes" | "messages";
type StudentTab = "apps" | "tools";
type AdminTab = "overview" | "teachers" | "classes";

function randomInviteCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 4; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)]!;
  }
  return out;
}

function RolePicker({
  onPick,
}: {
  onPick: (role: DemoRole) => void;
}) {
  return (
    <div className="demo-role-picker" role="group" aria-label="Try a school role">
      <p className="demo-role-picker__label">Choose a role to explore</p>
      <p className="-mt-2 mb-4 text-sm leading-relaxed text-ink-muted">
        Each role opens a preview of Riverside Academy — a sample school for
        exploring Guide, not a live account.
      </p>
      <div className="demo-role-picker__grid">
        {DEMO_ROLES.map((role) => (
          <button
            key={role.id}
            type="button"
            className="demo-role-card"
            onClick={() => onPick(role.id)}
          >
            <span className="demo-role-card__cta">{role.tryAs}</span>
            <span className="demo-role-card__blurb">{role.blurb}</span>
            <span className="demo-role-card__hint">{role.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function DemoChrome({
  role,
  schoolName,
  onSwitchRole,
  children,
}: {
  role: DemoRole;
  schoolName: string;
  onSwitchRole: () => void;
  children: ReactNode;
}) {
  return (
    <div className="demo-frame" aria-label={`${demoRoleLabel(role)} demo`}>
      <div className="demo-frame__chrome">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full bg-forest-400"
          aria-hidden
        />
        <span className="flex-1 truncate">
          Guide · {demoRoleLabel(role)} · {schoolName}
        </span>
        <span className="demo-frame__badge">Preview</span>
        <button
          type="button"
          className="demo-frame__switch"
          onClick={onSwitchRole}
        >
          Switch role
        </button>
      </div>
      {children}
    </div>
  );
}

/** School-facing demo portals only — Guide Official is not a try-as role. */
function DemoRolePortal({
  role,
  session,
  setSession,
  onOpenApp,
}: {
  role: DemoRole;
  session: DemoSession;
  setSession: (next: DemoSession) => void;
  onOpenApp: (name: string) => void;
}) {
  switch (role) {
    case "student":
      return <StudentPortal session={session} onOpenApp={onOpenApp} />;
    case "teacher":
      return <TeacherPortal session={session} setSession={setSession} />;
    case "admin":
      return <AdminPortal session={session} setSession={setSession} />;
    default: {
      const _exhaustive: never = role;
      void _exhaustive;
      return <TeacherPortal session={session} setSession={setSession} />;
    }
  }
}

function DemoTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <nav className="demo-frame__tabs" aria-label="Demo portal sections">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={
            tab.id === active
              ? "demo-frame__tab demo-frame__tab--on"
              : "demo-frame__tab"
          }
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

function AppMark({ name }: { name: string }) {
  return (
    <span className="portal-app-tile__mark !h-12 !w-12 !text-lg" aria-hidden>
      {name.slice(0, 1)}
    </span>
  );
}

function StudentPortal({
  session,
  onOpenApp,
}: {
  session: DemoSession;
  onOpenApp: (name: string) => void;
}) {
  const [tab, setTab] = useState<StudentTab>("apps");
  const apps = useMemo(
    () =>
      session.catalog.filter((a) => session.studentAppSlugs.includes(a.slug)),
    [session],
  );

  return (
    <>
      <DemoTabs
        tabs={[
          { id: "apps", label: "My apps" },
          { id: "tools", label: "Tools" },
        ]}
        active={tab}
        onChange={(id) => setTab(id as StudentTab)}
      />
      <div className="demo-frame__body demo-frame__body--single">
        <div className="demo-frame__main">
          <p className="portal-eyebrow">Student portal</p>
          <h2 className="display-feature mt-1 text-[1.65rem]">
            Hi, {session.displayName.student}
          </h2>
          <p className="mt-1 text-sm text-ink-muted">{session.schoolName}</p>

          {tab === "apps" ? (
            <section className="mt-6" id="apps">
              <h3 className="portal-section-title">My apps</h3>
              {apps.length === 0 ? (
                <div className="portal-empty">
                  <p className="portal-empty__title">No apps yet</p>
                  <p className="portal-empty__body">
                    When a teacher adds an app to your class, it shows up here.
                  </p>
                </div>
              ) : (
                <ul className="portal-apps-grid">
                  {apps.map((app) => (
                    <li key={app.slug}>
                      <button
                        type="button"
                        className="portal-app-tile w-full text-left"
                        onClick={() => onOpenApp(app.name)}
                        aria-label={`Open ${app.name}`}
                      >
                        <span className="portal-app-tile__mark" aria-hidden>
                          {app.name.slice(0, 1)}
                        </span>
                        <span className="portal-app-tile__name">{app.name}</span>
                        <span className="portal-app-tile__tag">
                          {app.tagline}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-4 text-sm text-ink-muted">
                Apps open in the real product after school approval — here they
                stay inside the demo.
              </p>
            </section>
          ) : (
            <section className="mt-6" id="tools">
              <h3 className="portal-section-title">Tools</h3>
              <div className="portal-tools-grid">
                <div className="portal-tool-tile">
                  <p className="text-base font-semibold text-forest-950">
                    Messages
                  </p>
                  <p className="mt-1 text-sm leading-snug text-ink-muted">
                    Write to teachers of classes you joined.
                  </p>
                  <ul className="mt-3 space-y-2">
                    {session.messages.map((m) => (
                      <li
                        key={m.id}
                        className="rounded-[8px] border border-line bg-sky-soft px-3 py-2 text-sm"
                      >
                        <span className="font-semibold text-forest-950">
                          {m.from}
                        </span>
                        <span className="text-ink-muted"> · {m.when}</span>
                        <p className="mt-0.5 text-ink-muted">{m.preview}</p>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="portal-tool-tile">
                  <p className="text-base font-semibold text-forest-950">
                    Suggestions
                  </p>
                  <p className="mt-1 text-sm leading-snug text-ink-muted">
                    Ideas and study prompts from Guide.
                  </p>
                  <p className="mt-3 text-sm font-semibold text-forest-800">
                    2 new prompts ready
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}

function TeacherPortal({
  session,
  setSession,
}: {
  session: DemoSession;
  setSession: (next: DemoSession) => void;
}) {
  const [tab, setTab] = useState<TeacherTab>("classes");
  const [className, setClassName] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function createClass() {
    const name = className.trim();
    if (name.length < 2) return;
    const room: DemoClassroom = {
      id: `c-${Date.now()}`,
      name,
      inviteCode: randomInviteCode(),
      studentCount: 0,
      installedAppSlugs: [],
    };
    startTransition(() => {
      setSession({
        ...session,
        classrooms: [room, ...session.classrooms],
      });
      setClassName("");
      setNotice(`Created “${name}”. Share invite code ${room.inviteCode}.`);
      setTab("classes");
    });
  }

  function toggleInstall(classroomId: string, appSlug: string) {
    const key = `${classroomId}:${appSlug}`;
    setBusyKey(key);
    setNotice(null);
    startTransition(() => {
      setSession({
        ...session,
        classrooms: session.classrooms.map((c) => {
          if (c.id !== classroomId) return c;
          const has = c.installedAppSlugs.includes(appSlug);
          return {
            ...c,
            installedAppSlugs: has
              ? c.installedAppSlugs.filter((s) => s !== appSlug)
              : [...c.installedAppSlugs, appSlug],
          };
        }),
      });
      setBusyKey(null);
      setNotice(
        session.classrooms
          .find((c) => c.id === classroomId)
          ?.installedAppSlugs.includes(appSlug)
          ? "App removed from class."
          : "App added — students will see it under My apps.",
      );
    });
  }

  return (
    <>
      <DemoTabs
        tabs={[
          { id: "classes", label: "Classes" },
          { id: "apps", label: "Apps" },
          { id: "messages", label: "Messages" },
        ]}
        active={tab}
        onChange={(id) => setTab(id as TeacherTab)}
      />
      <div className="demo-frame__body">
        <aside className="demo-frame__side">
          <p className="text-xs font-semibold uppercase tracking-wide text-forest-600">
            This week
          </p>
          <ul className="mt-3 space-y-2 text-sm text-forest-950">
            <li className="rounded-[8px] border border-line bg-white px-3 py-2">
              {session.classrooms.length} classes
            </li>
            <li className="rounded-[8px] border border-line bg-white px-3 py-2">
              {session.classrooms.reduce((n, c) => n + c.studentCount, 0)}{" "}
              students
            </li>
            <li className="rounded-[8px] border border-line bg-white px-3 py-2">
              {
                new Set(
                  session.classrooms.flatMap((c) => c.installedAppSlugs),
                ).size
              }{" "}
              apps in use
            </li>
          </ul>
          <p className="mt-5 text-xs leading-relaxed text-ink-muted">
            Local demo session — nothing is saved to Guide production.
          </p>
        </aside>
        <div className="demo-frame__main">
          <p className="portal-eyebrow">Teacher portal</p>
          <h2 className="display-feature mt-1 text-[1.65rem]">
            Hi, {session.displayName.teacher}
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Keep students engaged and classes organized.
          </p>
          {notice ? (
            <p className="mt-3 rounded-[10px] border border-forest-200 bg-forest-100 px-3 py-2 text-sm text-forest-900">
              {notice}
            </p>
          ) : null}

          {tab === "classes" ? (
            <section className="mt-6 space-y-4">
              <div>
                <h3 className="portal-section-title">Classes</h3>
                <p className="-mt-2 text-sm text-ink-muted">
                  Create a class, share the invite code, then follow progress.
                </p>
              </div>
              <div className="portal-panel space-y-3">
                <label className="block text-sm font-semibold text-forest-900">
                  Class name
                  <div className="mt-1.5 flex flex-wrap gap-3">
                    <input
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      placeholder="e.g. Period 2 Science · Grade 8"
                      className="field min-w-[14rem] flex-1"
                    />
                    <button
                      type="button"
                      disabled={className.trim().length < 2}
                      onClick={createClass}
                      className="btn-primary"
                    >
                      Create class
                    </button>
                  </div>
                </label>
              </div>
              <div className="rounded-[10px] border border-line">
                {session.classrooms.map((room) => (
                  <div key={room.id} className="demo-class-row px-4">
                    <div>
                      <p className="font-semibold text-forest-950">
                        {room.name}
                      </p>
                      <p className="text-xs text-ink-muted">
                        Invite · {room.inviteCode}
                        {room.installedAppSlugs.length
                          ? ` · ${room.installedAppSlugs.length} app${room.installedAppSlugs.length === 1 ? "" : "s"}`
                          : " · pending apps"}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-forest-700">
                      {room.studentCount} students
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {tab === "apps" ? (
            <section className="mt-6 space-y-4">
              <div>
                <h3 className="portal-section-title">Apps</h3>
                <p className="-mt-2 text-sm text-ink-muted">
                  Add apps from the Guide library to a class. Students see them
                  under My apps.
                </p>
              </div>
              {session.classrooms.length === 0 ? (
                <div className="portal-empty">
                  <p className="portal-empty__title">Create a class first</p>
                  <p className="portal-empty__body">
                    Then add apps here so students see them under My apps.
                  </p>
                </div>
              ) : (
                session.catalog.map((app) => (
                  <div key={app.slug} className="portal-panel space-y-4">
                    <div className="flex flex-wrap items-start gap-3">
                      <AppMark name={app.name} />
                      <div>
                        <p className="text-lg font-semibold text-forest-950">
                          {app.name}
                        </p>
                        <p className="mt-0.5 text-sm text-forest-700">
                          {app.tagline}
                        </p>
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {session.classrooms.map((room) => {
                        const on = room.installedAppSlugs.includes(app.slug);
                        const key = `${room.id}:${app.slug}`;
                        return (
                          <li
                            key={room.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-line px-3 py-2"
                          >
                            <span className="text-sm font-medium text-forest-950">
                              {room.name}
                            </span>
                            <button
                              type="button"
                              className={on ? "btn-secondary" : "btn-primary"}
                              disabled={busyKey === key}
                              onClick={() => toggleInstall(room.id, app.slug)}
                            >
                              {on ? "Remove" : "Add to class"}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))
              )}
            </section>
          ) : null}

          {tab === "messages" ? (
            <section className="mt-6 space-y-4">
              <h3 className="portal-section-title">Messages</h3>
              <p className="-mt-2 text-sm text-ink-muted">
                Reach students in your classes — high-level preview in this demo.
              </p>
              <div className="portal-panel space-y-3">
                {session.messages.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-[8px] border border-line bg-sky-soft px-3 py-2 text-sm"
                  >
                    <p className="font-semibold text-forest-950">
                      Thread · {m.from}
                    </p>
                    <p className="mt-0.5 text-ink-muted">{m.preview}</p>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() =>
                    setNotice(
                      "In the live portal you message students in your classes. This preview stays local.",
                    )
                  }
                >
                  Compose message
                </button>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </>
  );
}

function AdminPortal({
  session,
  setSession,
}: {
  session: DemoSession;
  setSession: (next: DemoSession) => void;
}) {
  const [tab, setTab] = useState<AdminTab>("overview");
  const [emailText, setEmailText] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  function sendInvites() {
    const emails = emailText
      .split(/[\s,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.includes("@"));
    if (emails.length === 0) {
      setNotice("Enter at least one work email.");
      return;
    }
    const nextInvites = emails.map((email, i) => ({
      id: `inv-${Date.now()}-${i}`,
      email,
      status: "queued" as const,
    }));
    setSession({
      ...session,
      invites: [...nextInvites, ...session.invites],
      teachers: [
        ...session.teachers,
        ...emails.map((email, i) => ({
          id: `t-new-${Date.now()}-${i}`,
          name: email.split("@")[0] ?? "Teacher",
          email,
          status: "invited" as const,
        })),
      ],
    });
    setEmailText("");
    setNotice(
      `Queued ${emails.length} teacher invite${emails.length === 1 ? "" : "s"} (demo only — no email sent).`,
    );
    setTab("teachers");
  }

  return (
    <>
      <DemoTabs
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "teachers", label: "Teachers" },
          { id: "classes", label: "Classes" },
        ]}
        active={tab}
        onChange={(id) => setTab(id as AdminTab)}
      />
      <div className="demo-frame__body">
        <aside className="demo-frame__side">
          <p className="text-xs font-semibold uppercase tracking-wide text-forest-600">
            School
          </p>
          <p className="mt-2 text-sm font-semibold text-forest-950">
            {session.schoolName}
          </p>
          <ul className="mt-4 space-y-2 text-sm text-forest-950">
            <li className="rounded-[8px] border border-line bg-white px-3 py-2">
              {session.teachers.filter((t) => t.status === "active").length}{" "}
              teachers active
            </li>
            <li className="rounded-[8px] border border-line bg-white px-3 py-2">
              {session.teachers.filter((t) => t.status === "invited").length}{" "}
              invites pending
            </li>
            <li className="rounded-[8px] border border-line bg-white px-3 py-2">
              {session.classrooms.length} classes
            </li>
          </ul>
          <p className="mt-5 text-xs leading-relaxed text-ink-muted">
            Teachers log in only — schools invite by email. No public teacher
            signup.
          </p>
        </aside>
        <div className="demo-frame__main">
          <p className="portal-eyebrow">School administrator</p>
          <h2 className="display-feature mt-1 text-[1.65rem]">
            Hi, {session.displayName.admin}
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Invite teachers and keep the school portal ready for classes.
          </p>
          {notice ? (
            <p className="mt-3 rounded-[10px] border border-forest-200 bg-forest-100 px-3 py-2 text-sm text-forest-900">
              {notice}
            </p>
          ) : null}

          {tab === "overview" ? (
            <section className="mt-6 space-y-4">
              <h3 className="portal-section-title">School overview</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[10px] border border-line bg-sky-soft p-4">
                  <p className="text-sm font-semibold text-forest-950">
                    Engagement
                  </p>
                  <p className="mt-1 text-sm leading-snug text-ink-muted">
                    Students open learning apps from My apps. Teachers add apps
                    per class so the portal feels inviting and used.
                  </p>
                </div>
                <div className="rounded-[10px] border border-line bg-sky-soft p-4">
                  <p className="text-sm font-semibold text-forest-950">
                    Classroom management
                  </p>
                  <p className="mt-1 text-sm leading-snug text-ink-muted">
                    Classes, invite codes, and teacher invites stay in one
                    professional school portal.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setTab("teachers")}
              >
                Invite teachers →
              </button>
            </section>
          ) : null}

          {tab === "teachers" ? (
            <section className="mt-6 space-y-4">
              <div>
                <h3 className="portal-section-title">Invite teachers</h3>
                <p className="-mt-2 text-sm text-ink-muted">
                  Type work emails. Guide sends a setup link — teachers log in
                  only.
                </p>
              </div>
              <div className="portal-panel space-y-3">
                <label className="block text-sm font-semibold text-forest-900">
                  Teacher emails
                  <textarea
                    value={emailText}
                    onChange={(e) => setEmailText(e.target.value)}
                    className="field mt-1.5 min-h-[110px] font-mono text-sm"
                    placeholder={
                      "teacher1@riverside.school\nteacher2@riverside.school"
                    }
                  />
                </label>
                <button
                  type="button"
                  disabled={emailText.trim().length < 5}
                  onClick={sendInvites}
                  className="btn-primary"
                >
                  Send invites (demo)
                </button>
              </div>
              <div className="rounded-[10px] border border-line">
                {session.teachers.map((t) => (
                  <div key={t.id} className="demo-class-row px-4">
                    <div>
                      <p className="font-semibold text-forest-950">{t.name}</p>
                      <p className="text-xs text-ink-muted">{t.email}</p>
                    </div>
                    <span className="text-xs font-semibold text-forest-700">
                      {t.status === "active" ? "Active" : "Invited"}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {tab === "classes" ? (
            <section className="mt-6 space-y-4">
              <h3 className="portal-section-title">Classes across the school</h3>
              <p className="-mt-2 text-sm text-ink-muted">
                High-level view — teachers own day-to-day class setup.
              </p>
              <div className="rounded-[10px] border border-line">
                {session.classrooms.map((room) => (
                  <div key={room.id} className="demo-class-row px-4">
                    <div>
                      <p className="font-semibold text-forest-950">
                        {room.name}
                      </p>
                      <p className="text-xs text-ink-muted">
                        Code {room.inviteCode} ·{" "}
                        {room.installedAppSlugs.length || "no"} apps
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-forest-700">
                      {room.studentCount} students
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </>
  );
}

/** Interactive school demo — sandboxed role walkthrough (no Neon writes). */
export function SchoolDemo() {
  const [role, setRole] = useState<DemoRole | null>(null);
  const [session, setSession] = useState<DemoSession>(() => createDemoSession());
  const [toast, setToast] = useState<string | null>(null);

  function pickRole(next: DemoRole) {
    setRole(next);
    setToast(null);
  }

  function resetRole() {
    setRole(null);
    setToast(null);
  }

  function resetSession() {
    setSession(createDemoSession());
    setRole(null);
    setToast("Preview reset — choose a role to continue.");
  }

  return (
    <div className="demo-desktop-stage content-band portal-page__inner">
      <header className="mb-8 max-w-2xl">
        <p className="eyebrow">For schools · Demo</p>
        <h1 className="display-feature mt-2">Try Guide as your school</h1>
        <p className="mt-3 text-[1.02rem] leading-relaxed text-ink-muted">
          An interactive preview for teachers, students, and school
          administrators. Explore freely — nothing is saved to a live school.
          When you are ready, book a meeting or apply for your school.
        </p>
        <p className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-sm font-semibold text-forest-800">
          <Link href="/schools/meeting">Book a meeting →</Link>
          <Link href="/education#apply">Apply for your school →</Link>
          <Link href="/auth/sign-in?as=educator">Teacher log in →</Link>
        </p>
      </header>

      {role !== null ? (
        <div className="demo-sandbox-banner" role="status">
          <p className="demo-sandbox-banner__text">
            <strong>Preview only.</strong> You are exploring the{" "}
            {demoRoleLabel(role)} view for {session.schoolName} — not a live
            school account.
          </p>
          <button
            type="button"
            className="btn-secondary !min-h-12 !px-4 !text-sm"
            onClick={resetRole}
          >
            Back to roles
          </button>
        </div>
      ) : null}

      {toast ? (
        <p
          className="mb-4 rounded-[10px] border border-forest-200 bg-forest-100 px-3 py-2 text-sm text-forest-900"
          role="status"
        >
          {toast}
        </p>
      ) : null}

      {role === null ? (
        <RolePicker onPick={pickRole} />
      ) : (
        <DemoChrome
          role={role}
          schoolName={session.schoolName}
          onSwitchRole={resetRole}
        >
          <DemoRolePortal
            role={role}
            session={session}
            setSession={setSession}
            onOpenApp={(name) =>
              setToast(
                `${name} would open in the real student portal. Staying in the demo.`,
              )
            }
          />
        </DemoChrome>
      )}

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <Link href="/schools/meeting" className="btn-primary">
          Book a meeting
        </Link>
        <Link href="/education#apply" className="btn-secondary">
          Apply for your school
        </Link>
        {role !== null ? (
          <button
            type="button"
            className="btn-secondary"
            onClick={resetSession}
          >
            Reset demo
          </button>
        ) : null}
      </div>
    </div>
  );
}
