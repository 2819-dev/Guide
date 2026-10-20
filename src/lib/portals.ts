import type { LoginAs } from "@/lib/login-roles";
import type { Role } from "@/lib/roles";

/** Clever-like portal homes per audience. */
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
  family: {
    id: "family" as const,
    label: "My portal",
    href: "/family",
    short: "Family",
  },
} as const;

export type PortalId = keyof typeof PORTALS;

/**
 * Resolve portal from login-as intent + profile.
 * Students (schoolId/badge) win over plain customer family portal.
 */
export function portalFor(opts: {
  as?: LoginAs | null;
  role: Role;
  schoolId?: string | null;
  badgeCode?: string | null;
  educationOk?: boolean;
}): (typeof PORTALS)[PortalId] {
  const { as, role, schoolId, badgeCode, educationOk } = opts;

  if (as === "official" || role === "admin" || role === "moderator") {
    return PORTALS.official;
  }
  if (as === "educator" || role === "rebbe") {
    return educationOk === false ? PORTALS.family : PORTALS.teacher;
  }
  if (as === "student" || schoolId || badgeCode) {
    return PORTALS.student;
  }
  return PORTALS.family;
}

export function messagesHrefFor(portal: PortalId): string {
  switch (portal) {
    case "student":
      return "/student/messages";
    case "teacher":
      // Alias /teacher redirects to panel — hash must target the real page.
      return "/education/panel#messages";
    case "official":
      return "/admin#suggestions";
    case "family":
    default:
      return "/family/messages";
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
    case "family":
    default:
      return "/family/suggestions";
  }
}
