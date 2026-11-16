import type { LoginAs } from "@/lib/login-roles";
import type { Role } from "@/lib/roles";

/** Clever-like school portal homes (Guide only — no family portal). */
export const PORTALS = {
  student: {
    id: "student" as const,
    label: "My portal",
    href: "/student",
    short: "Student",
  },
  teacher: {
    id: "teacher" as const,
    label: "My portal",
    href: "/teacher",
    short: "Teacher",
  },
  official: {
    id: "official" as const,
    label: "My portal",
    href: "/official",
    short: "Official",
  },
  developer: {
    id: "developer" as const,
    label: "My portal",
    href: "/developer",
    short: "Developer",
  },
} as const;

export type PortalId = keyof typeof PORTALS;

/**
 * Resolve school portal from login-as intent + profile.
 * Learners without school affiliation are not Guide portal users.
 */
export function portalFor(opts: {
  as?: LoginAs | null;
  role: Role;
  schoolId?: string | null;
  badgeCode?: string | null;
  educationOk?: boolean;
  developerOk?: boolean;
}): (typeof PORTALS)[PortalId] | null {
  const { as, role, schoolId, badgeCode, developerOk } = opts;

  if (as === "official" || role === "admin" || role === "moderator") {
    return PORTALS.official;
  }
  if (as === "developer" || developerOk === true) {
    return PORTALS.developer;
  }
  if (as === "educator" || role === "rebbe") {
    // Always route to teacher portal; panel itself is limited until approved.
    return PORTALS.teacher;
  }
  if (as === "student" || schoolId || badgeCode) {
    return PORTALS.student;
  }
  return null;
}

export function messagesHrefFor(portal: PortalId): string {
  switch (portal) {
    case "student":
      return "/student/messages";
    case "teacher":
      return "/education/panel#messages";
    case "official":
      return "/admin#suggestions";
    case "developer":
      return "/developer#docs";
  }
}

export function suggestionsHrefFor(portal: PortalId): string {
  switch (portal) {
    case "student":
      return "/student/suggestions";
    case "teacher":
      return "/education/panel#suggestions-access";
    case "official":
      return "/admin#suggestions";
    case "developer":
      return "/developer#docs";
  }
}
