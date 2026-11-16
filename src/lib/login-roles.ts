/** Guide school “Log in as a …” — school roles only (no family). */

export type LoginAs =
  | "student"
  | "educator"
  | "official"
  | "learner"
  | "developer";

export type LoginRoleOption = {
  id: LoginAs;
  label: string;
  description: string;
  href: string;
};

/** Header Log In menu — Student · Teachers · Developer · Guide Official. */
export const LOGIN_AS_OPTIONS: LoginRoleOption[] = [
  {
    id: "student",
    label: "Student",
    description: "Find your school, then enter your password",
    href: "/auth/sign-in?as=student",
  },
  {
    id: "educator",
    label: "Teachers",
    description: "Teachers and school administrators",
    href: "/auth/sign-in?as=educator",
  },
  {
    id: "developer",
    label: "Developer",
    description: "Partners who build apps for Guide",
    href: "/auth/sign-in?as=developer",
  },
  {
    id: "official",
    label: "Guide Official",
    description: "Guide team",
    href: "/auth/sign-in?as=official",
  },
];

export function parseLoginAs(value: string | null | undefined): LoginAs {
  if (value === "teacher" || value === "school") return "educator";
  if (value === "partner" || value === "developer") return "developer";
  // Legacy family/home → Amud learner (not a Guide school role)
  if (
    value === "family" ||
    value === "learner" ||
    value === "home" ||
    value === "customer"
  ) {
    return "learner";
  }
  if (
    value === "student" ||
    value === "educator" ||
    value === "official" ||
    value === "developer"
  ) {
    return value;
  }
  return "student";
}

export function loginAsCopy(as: LoginAs): {
  title: string;
  subtitle: string;
  joinHref: string | null;
  joinLabel: string | null;
} {
  switch (as) {
    case "student":
      return {
        title: "Student",
        subtitle: "Find your school, then log in with your password.",
        joinHref: null,
        joinLabel: "Create a student account",
      };
    case "educator":
      return {
        title: "Teachers",
        subtitle:
          "For teachers and school administrators. Use the email and password for your Guide account.",
        // Teachers = login only. School/district apply stays for admins.
        joinHref: "/education#apply",
        joinLabel: "Apply for your school",
      };
    case "official":
      return {
        title: "Guide Official",
        subtitle: "Sign in with your Guide Official account.",
        joinHref: null,
        joinLabel: null,
      };
    case "developer":
      return {
        title: "Developer",
        subtitle: "Apply first, then log in after Guide Official approves.",
        joinHref: "/developers/apply",
        joinLabel: "Apply as a developer",
      };
    case "learner":
    default:
      return {
        title: "Amud log in",
        subtitle:
          "Save Test Yourself scores and notes. No school login required — Amud is for everyone.",
        joinHref: "/auth/sign-up?as=learner",
        joinLabel: "Create an Amud account",
      };
  }
}

export function signupAsCopy(as: LoginAs): {
  title: string;
  subtitle: string;
  roleValue: "customer" | "rebbe" | "moderator";
  showRoleChooser: boolean;
} {
  switch (as) {
    case "student":
      return {
        title: "Join as a Student",
        subtitle:
          "Choose your school and create an account. Then join class from Account.",
        roleValue: "customer",
        showRoleChooser: false,
      };
    case "educator":
      return {
        title: "School administrator",
        subtitle:
          "Teachers are invited by their school — use Log in instead. Administrators can apply for Guide.",
        roleValue: "customer",
        showRoleChooser: false,
      };
    case "official":
      return {
        title: "Guide Official",
        subtitle: "Sign in with your Guide Official account.",
        roleValue: "moderator",
        showRoleChooser: false,
      };
    case "developer":
      return {
        title: "Developer partner",
        subtitle:
          "Create an account after you apply and Guide Official verifies you.",
        roleValue: "customer",
        showRoleChooser: false,
      };
    case "learner":
    default:
      return {
        title: "Create an Amud account",
        subtitle:
          "Keep Test Yourself scores and notes after you learn. No school login required — Amud is for everyone.",
        roleValue: "customer",
        showRoleChooser: false,
      };
  }
}
