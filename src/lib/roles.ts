export const ROLES = ["customer", "rebbe", "moderator", "admin"] as const;
export type Role = (typeof ROLES)[number];

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

export function roleLabel(role: Role): string {
  switch (role) {
    case "customer":
      return "Student";
    case "rebbe":
      return "Rebbe";
    case "moderator":
      return "Moderator";
    case "admin":
      return "Admin";
  }
}

/** Stable non-PII identifier for admin / public ops views. */
export function publicStudentCode(profileId: string): string {
  return `Student-${profileId.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}
