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
    description: "Choose your school, then badge or password · My apps",
    href: "/auth/sign-in?as=student",
  },
  {
    id: "educator",
    label: "Teacher or School Administrator",
    description: "Teachers use a school invite · administrators apply",
    href: "/auth/sign-in?as=educator",
  },
  {
    id: "official",
    label: "Guide Official",
    description: "Meetings, school approvals, and partner apps",
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
          "Choose your school, then sign in with a badge or password. My apps shows what your teachers added for class.",
        joinHref: "/auth/sign-up?as=student",
        joinLabel: "Create a student account",
      };
    case "educator":
      return {
        title: "Teacher or School Administrator",
        subtitle:
          "Teachers log in with the setup link from a school invite — there is no public teacher signup. School administrators apply for Guide, then invite teachers and manage classes.",
        // Teachers = login only. School/district apply stays for admins.
        joinHref: "/education#apply",
        joinLabel: "Apply for your school",
      };
    case "official":
      return {
        title: "Guide Official",
        subtitle:
          "Review meeting requests, approve schools, and verify partner apps teachers can add to class.",
        joinHref: null,
        joinLabel: null,
      };
    case "developer":
      return {
        title: "Developer partner",
        subtitle:
          "Verified partners only — not a public marketplace. Apply first; after approval, log in to manage apps schools can add to class.",
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
          "Choose your school, create an account, then join your class from Account so My apps shows what teachers added.",
        roleValue: "customer",
        showRoleChooser: false,
      };
    case "educator":
      return {
        title: "School administrator",
        subtitle:
          "Teachers are invited by email — use Log in instead. School and district administrators apply to create an account and open their portal.",
        roleValue: "customer",
        showRoleChooser: false,
      };
    case "official":
      return {
        title: "Guide Official",
        subtitle: "Log in with your Guide Official account to review schools and meetings.",
        roleValue: "moderator",
        showRoleChooser: false,
      };
    case "developer":
      return {
        title: "Developer partner",
        subtitle:
          "Create an account after you apply. Your developer portal opens when Guide Official verifies your partner app.",
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
