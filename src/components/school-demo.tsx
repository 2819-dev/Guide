"use client";

import Link from "next/link";
import {
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { PortalShell } from "@/components/portal-shell";
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
        Pick a role to preview Riverside Academy — a sample school for exploring
        Guide.
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

function DemoEmbedShell({
  role,
  title,
  subtitle,
  accountName,
  chips,
  utilities,
  onSwitchRole,
  children,
}: {
  role: DemoRole;
  title: string;
  subtitle: string;
  accountName: string;
  chips: { id: string; label: string; active: boolean; onClick: () => void }[];
  utilities?: { id: string; label: string; active?: boolean; onClick: () => void }[];
  onSwitchRole: () => void;
  children: ReactNode;
}) {
  return (
    <PortalShell
      embed
      eyebrow={demoRoleLabel(role)}
      title={title}
      subtitle={subtitle}
      accountName={accountName}
      accountHref={null}
      embedBadge="Preview"
      embedActions={
        <button
          type="button"
          className="portal-topbar__link"
          onClick={onSwitchRole}
        >
          Switch role
        </button>
      }
      chips={chips.map((c) => ({
        href: `#${c.id}`,
        label: c.label,
        active: c.active,
        onClick: c.onClick,
      }))}
      utilities={utilities?.map((u) => ({
        href: `#${u.id}`,
        label: u.label,
        active: u.active,
        onClick: u.onClick,
      }))}
    >
      {children}
    </PortalShell>
  );
}

/** School-facing demo portals only — Guide Official is not a try-as role. */
function DemoRolePortal({
  role,
  session,
  setSession,
  onOpenApp,
  onSwitchRole,
}: {
  role: DemoRole;
  session: DemoSession;
  setSession: (next: DemoSession) => void;
  onOpenApp: (name: string) => void;
  onSwitchRole: () => void;
}) {
  switch (role) {
    case "student":
      return (
        <StudentPortal
          session={session}
          onOpenApp={onOpenApp}
          onSwitchRole={onSwitchRole}
        />
      );
    case "teacher":
      return (
        <TeacherPortal
          session={session}
          setSession={setSession}
          onSwitchRole={onSwitchRole}
        />
      );
    case "admin":
      return (
        <AdminPortal
          session={session}
          setSession={setSession}
          onSwitchRole={onSwitchRole}
        />
      );
    default: {
      const _exhaustive: never = role;
      void _exhaustive;
      return (
        <TeacherPortal
          session={session}
          setSession={setSession}
          onSwitchRole={onSwitchRole}
        />
      );
    }
  }
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
  onSwitchRole,
}: {
  session: DemoSession;
  onOpenApp: (name: string) => void;
  onSwitchRole: () => void;
}) {
  const [tab, setTab] = useState<StudentTab>("apps");
  const apps = useMemo(
    () =>
      session.catalog.filter((a) => session.studentAppSlugs.includes(a.slug)),
    [session],
  );

  return (
    <DemoEmbedShell
      role="student"
      title={`Hi, ${session.displayName.student}`}
      subtitle={`${session.schoolName} · Open apps your teachers added for class.`}
      accountName={session.displayName.student}
      onSwitchRole={onSwitchRole}
      chips={[
        {
          id: "apps",
          label: "My apps",
          active: tab === "apps",
          onClick: () => setTab("apps"),
        },
        {
          id: "tools",
          label: "Tools",
          active: tab === "tools",
          onClick: () => setTab("tools"),
        },
      ]}
      utilities={[
        {
          id: "messaging",
          label: "Messaging",
          active: tab === "tools",
          onClick: () => setTab("tools"),
        },
        {
          id: "suggestions",
          label: "Suggestions",
          onClick: () => setTab("tools"),
        },
      ]}
    >
      {tab === "apps" ? (
        <section id="apps">
          <h2 className="portal-section-title">My apps</h2>
          {apps.length === 0 ? (
            <div className="portal-empty">
              <p className="portal-empty__title">Ready when your class is</p>
              <p className="portal-empty__body">
                When a teacher adds an app, it appears here for class.
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
                    <span className="portal-app-tile__tag">{app.tagline}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-sm text-ink-muted">
            Apps open in the real product after school approval — here they stay
            inside the preview.
          </p>
        </section>
      ) : (
        <section id="tools">
          <h2 className="portal-section-title">Tools</h2>
          <div className="portal-tools-grid">
            <div className="portal-tool-tile">
              <p className="text-base font-semibold text-forest-950">Messages</p>
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
    </DemoEmbedShell>
  );
}

function TeacherPortal({
  session,
  setSession,
  onSwitchRole,
}: {
  session: DemoSession;
  setSession: (next: DemoSession) => void;
  onSwitchRole: () => void;
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
    <DemoEmbedShell
      role="teacher"
      title={`Hi, ${session.displayName.teacher}`}
      subtitle="Invite teachers, manage classes, and add apps students will open."
      accountName={session.displayName.teacher}
      onSwitchRole={onSwitchRole}
      chips={[
        {
          id: "classes",
          label: "Classes",
          active: tab === "classes",
          onClick: () => setTab("classes"),
        },
        {
          id: "apps",
          label: "Apps",
          active: tab === "apps",
          onClick: () => setTab("apps"),
        },
        {
          id: "messages",
          label: "Messages",
          active: tab === "messages",
          onClick: () => setTab("messages"),
        },
      ]}
      utilities={[
        {
          id: "messaging",
          label: "Messaging",
          active: tab === "messages",
          onClick: () => setTab("messages"),
        },
      ]}
    >
      {notice ? (
        <p className="rounded-[10px] border border-forest-200 bg-forest-100 px-3 py-2 text-sm text-forest-900">
          {notice}
        </p>
      ) : null}

      {tab === "classes" ? (
        <section className="space-y-4">
          <div>
            <h2 className="portal-section-title">Classes</h2>
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
                  <p className="font-semibold text-forest-950">{room.name}</p>
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
        <section className="space-y-4">
          <div>
            <h2 className="portal-section-title">Apps</h2>
            <p className="-mt-2 text-sm text-ink-muted">
              Add apps from the Guide library to a class. Students see them under
              My apps.
            </p>
          </div>
          {session.classrooms.length === 0 ? (
            <div className="portal-empty">
              <p className="portal-empty__title">Start with a class</p>
              <p className="portal-empty__body">
                Create a class, then add apps so students see them under My
                apps.
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
        <section className="space-y-4">
          <h2 className="portal-section-title">Messages</h2>
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
    </DemoEmbedShell>
  );
}

function AdminPortal({
  session,
  setSession,
  onSwitchRole,
}: {
  session: DemoSession;
  setSession: (next: DemoSession) => void;
  onSwitchRole: () => void;
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
      `Queued ${emails.length} teacher invite${emails.length === 1 ? "" : "s"} for this preview — no email is sent.`,
    );
    setTab("teachers");
  }

  return (
    <DemoEmbedShell
      role="admin"
      title={`Hi, ${session.displayName.admin}`}
      subtitle="Invite teachers and keep the school portal ready for classes."
      accountName={session.displayName.admin}
      onSwitchRole={onSwitchRole}
      chips={[
        {
          id: "overview",
          label: "Overview",
          active: tab === "overview",
          onClick: () => setTab("overview"),
        },
        {
          id: "teachers",
          label: "Teachers",
          active: tab === "teachers",
          onClick: () => setTab("teachers"),
        },
        {
          id: "classes",
          label: "Classes",
          active: tab === "classes",
          onClick: () => setTab("classes"),
        },
      ]}
    >
      {notice ? (
        <p className="rounded-[10px] border border-forest-200 bg-forest-100 px-3 py-2 text-sm text-forest-900">
          {notice}
        </p>
      ) : null}

      {tab === "overview" ? (
        <section className="space-y-4">
          <h2 className="portal-section-title">School overview</h2>
          <p className="-mt-2 text-sm text-ink-muted">
            {session.schoolName} ·{" "}
            {session.teachers.filter((t) => t.status === "active").length}{" "}
            teachers active · {session.classrooms.length} classes
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[10px] border border-line bg-sky-soft p-4">
              <p className="text-sm font-semibold text-forest-950">Engagement</p>
              <p className="mt-1 text-sm leading-snug text-ink-muted">
                Students open learning apps from My apps. Teachers add apps per
                class so the portal feels inviting and used.
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
        <section className="space-y-4">
          <div>
            <h2 className="portal-section-title">Invite teachers</h2>
            <p className="-mt-2 text-sm text-ink-muted">
              Enter work emails (one per line). Each teacher gets a setup link
              for their Teacher Portal.
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
              Send invites
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
        <section className="space-y-4">
          <h2 className="portal-section-title">Classes across the school</h2>
          <p className="-mt-2 text-sm text-ink-muted">
            High-level view — teachers own day-to-day class setup.
          </p>
          <div className="rounded-[10px] border border-line">
            {session.classrooms.map((room) => (
              <div key={room.id} className="demo-class-row px-4">
                <div>
                  <p className="font-semibold text-forest-950">{room.name}</p>
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
    </DemoEmbedShell>
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
    setToast("Back to roles — pick one to continue.");
  }

  return (
    <div className="demo-desktop-stage content-band portal-page__inner">
      <header className="mb-8 max-w-3xl lg:mb-10">
        <p className="eyebrow">For schools · Demo</p>
        <h1 className="display-feature mt-2 lg:mt-3">
          Try Guide as your school
        </h1>
        <p className="mt-3 text-[1.02rem] leading-relaxed text-ink-muted lg:mt-4 lg:text-lg lg:max-w-2xl">
          An interactive preview for teachers, students, and school
          administrators. Explore freely — this is a preview, not your school
          account. When you are ready, book a meeting or apply for your school.
        </p>
        <p className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-sm font-semibold text-forest-800">
          <Link href="/schools/meeting">Book a meeting →</Link>
          <Link href="/education#apply">Apply for your school →</Link>
          <Link href="/auth/sign-in?as=educator">Admin →</Link>
        </p>
      </header>

      {role !== null ? (
        <div className="demo-sandbox-banner" role="status">
          <p className="demo-sandbox-banner__text">
            <strong>Preview only.</strong> Viewing the{" "}
            {demoRoleLabel(role)} portal at {session.schoolName}.
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
        <DemoRolePortal
          role={role}
          session={session}
          setSession={setSession}
          onSwitchRole={resetRole}
          onOpenApp={(name) =>
            setToast(
              `${name} would open in the real student portal. Staying in the preview.`,
            )
          }
        />
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
