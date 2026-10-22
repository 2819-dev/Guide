/**
 * Local-only school demo fixtures.
 * Never seed these into Neon / production — sandboxed React state only.
 */

import { APP_CATALOG, type GuideApp } from "@/lib/apps";

export type DemoRole = "teacher" | "student" | "admin";

export type DemoClassroom = {
  id: string;
  name: string;
  inviteCode: string;
  studentCount: number;
  installedAppSlugs: string[];
};

export type DemoTeacher = {
  id: string;
  name: string;
  email: string;
  status: "active" | "invited";
};

export type DemoInvite = {
  id: string;
  email: string;
  status: "queued" | "sent";
};

export type DemoStudentApp = GuideApp & { installed: boolean };

export type DemoSession = {
  schoolName: string;
  displayName: Record<DemoRole, string>;
  classrooms: DemoClassroom[];
  teachers: DemoTeacher[];
  invites: DemoInvite[];
  catalog: GuideApp[];
  studentAppSlugs: string[];
  messages: { id: string; from: string; preview: string; when: string }[];
};

export const DEMO_ROLES: {
  id: DemoRole;
  tryAs: string;
  portalLabel: string;
  blurb: string;
}[] = [
  {
    id: "teacher",
    tryAs: "Try as Teacher",
    portalLabel: "Teacher portal",
    blurb: "Classes, apps for a class, and day-to-day classroom tools.",
  },
  {
    id: "student",
    tryAs: "Try as Student",
    portalLabel: "Student portal",
    blurb: "My apps in the center — open what your teacher added.",
  },
  {
    id: "admin",
    tryAs: "Try as School administrator",
    portalLabel: "School administrator",
    blurb: "Invite teachers, see school overview, keep classes organized.",
  },
];

/** Fresh sandboxed session — no DB writes. */
export function createDemoSession(): DemoSession {
  return {
    schoolName: "Riverside Academy",
    displayName: {
      teacher: "Jordan Lee",
      student: "Alex Rivera",
      admin: "Morgan Blake",
    },
    classrooms: [
      {
        id: "c1",
        name: "Period 3 · Grade 9",
        inviteCode: "8F2K",
        studentCount: 12,
        installedAppSlugs: ["amud", "arcade-education"],
      },
      {
        id: "c2",
        name: "Homeroom · Grade 7",
        inviteCode: "Q9LM",
        studentCount: 6,
        installedAppSlugs: ["amud"],
      },
      {
        id: "c3",
        name: "Enrichment cohort",
        inviteCode: "PENDING",
        studentCount: 0,
        installedAppSlugs: [],
      },
    ],
    teachers: [
      {
        id: "t1",
        name: "Jordan Lee",
        email: "j.lee@riverside.school",
        status: "active",
      },
      {
        id: "t2",
        name: "Casey Nguyen",
        email: "c.nguyen@riverside.school",
        status: "active",
      },
      {
        id: "t3",
        name: "Sam Ortiz",
        email: "s.ortiz@riverside.school",
        status: "invited",
      },
    ],
    invites: [],
    catalog: APP_CATALOG.map((a) => ({ ...a })),
    studentAppSlugs: ["amud", "arcade-education"],
    messages: [
      {
        id: "m1",
        from: "Jordan Lee",
        preview: "Reminder: finish your practice set before Friday.",
        when: "Yesterday",
      },
      {
        id: "m2",
        from: "Guide",
        preview: "Two new study prompts are ready in Suggestions.",
        when: "Mon",
      },
    ],
  };
}

export function demoRoleLabel(role: DemoRole): string {
  return DEMO_ROLES.find((r) => r.id === role)?.portalLabel ?? role;
}
