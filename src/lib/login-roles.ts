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

/** Guide school Log In menu — Student / Teacher / Official. */
export const LOGIN_AS_OPTIONS: LoginRoleOption[] = [
  {
    id: "student",
    label: "Student",
    description: "Find your school, then badge or password",
    href: "/auth/sign-in?as=student",
  },
  {
    id: "educator",
    label: "Teacher or School Administrator",
    description: "Teachers log in · schools apply first",
    href: "/auth/sign-in?as=educator",
  },
  {
    id: "official",
    label: "Guide Official",
    description: "Approve schools and meeting requests",
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
        subtitle:
          "Find your school, then open My apps — the learning and classroom tools your teachers added.",
        joinHref: "/auth/sign-up?as=student",
        joinLabel: "Create a student account",
      };
    case "educator":
      return {
        title: "Teacher or School Administrator",
        subtitle:
          "Teachers log in with the setup invite from your school. Administrators apply for Guide, then manage classes and invites from the portal.",
        // Teachers = login only. School/district apply stays for admins.
        joinHref: "/education#apply",
        joinLabel: "Apply for your school",
      };
    case "official":
      return {
        title: "Guide Official",
        subtitle: "Review school applications, developers, and meeting requests.",
        joinHref: null,
        joinLabel: null,
      };
    case "developer":
      return {
        title: "Developer",
        subtitle:
          "Verified partners only. Apply first; log in after Guide Official approves.",
        joinHref: "/developers/apply",
        joinLabel: "Apply as a developer",
      };
    case "learner":
    default:
      return {
        title: "Log in",
        subtitle: "Keep Test Yourself scores and notes on your Amud account.",
        joinHref: "/auth/sign-up?as=learner",
        joinLabel: "Create an account",
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
          "Choose your school, create an account, then join your class from Account so My apps lights up.",
        roleValue: "customer",
        showRoleChooser: false,
      };
    case "educator":
      return {
        title: "School administrator",
        subtitle:
          "Teachers are invited by email — use Log in instead. School or district administrators apply for Guide here.",
        roleValue: "customer",
        showRoleChooser: false,
      };
    case "official":
      return {
        title: "Guide Official",
        subtitle: "Please log in with your Guide Official account.",
        roleValue: "moderator",
        showRoleChooser: false,
      };
    case "developer":
      return {
        title: "Developer partner",
        subtitle:
          "Create an account only after you apply and Guide Official verifies you.",
        roleValue: "customer",
        showRoleChooser: false,
      };
    case "learner":
    default:
      return {
        title: "Create an Amud account",
        subtitle:
          "Save Test Yourself scores and notes. No school login required.",
        roleValue: "customer",
        showRoleChooser: false,
      };
  }
}
