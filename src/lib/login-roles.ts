/** Clever-style “Log in as a …” — Guide school roles only (no family). */

export type LoginAs = "student" | "educator" | "official" | "learner";

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
    description: "Find your school, then username or badge",
    href: "/auth/sign-in?as=student",
  },
  {
    id: "educator",
    label: "Teacher or School Administrator",
    description: "Apply for your school, then open classes and apps",
    href: "/auth/sign-in?as=educator",
  },
  {
    id: "official",
    label: "Guide Official",
    description: "Guide Official account",
    href: "/auth/sign-in?as=official",
  },
];

export function parseLoginAs(value: string | null | undefined): LoginAs {
  if (value === "teacher" || value === "school") return "educator";
  // Legacy family/home → Amud learner (not a Guide school role)
  if (
    value === "family" ||
    value === "learner" ||
    value === "home" ||
    value === "customer"
  ) {
    return "learner";
  }
  if (value === "student" || value === "educator" || value === "official") {
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
        subtitle: "Find your school, then log in with a username or badge.",
        joinHref: "/auth/sign-up?as=student",
        joinLabel: "Create a student account",
      };
    case "educator":
      return {
        title: "Teacher or School Administrator",
        subtitle:
          "Log in to apply for your school or open your portal after approval.",
        joinHref: "/auth/sign-up?as=educator",
        joinLabel: "Create an account",
      };
    case "official":
      return {
        title: "Guide Official",
        subtitle: "Sign in to continue.",
        joinHref: null,
        joinLabel: null,
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
          "Choose your school and create an account. You’ll get a badge for quick login, then join class from Account.",
        roleValue: "customer",
        showRoleChooser: false,
      };
    case "educator":
      return {
        title: "Teacher or School Administrator",
        subtitle:
          "Create your Guide account, then apply for your school. The portal unlocks after approval.",
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
