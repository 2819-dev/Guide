/** Clever-style “Log in as a …” roles — consumer-facing labels. */

export type LoginAs = "family" | "student" | "educator" | "official";

export type LoginRoleOption = {
  id: LoginAs;
  label: string;
  description: string;
  href: string;
};

export const LOGIN_AS_OPTIONS: LoginRoleOption[] = [
  {
    id: "family",
    label: "Parent or family",
    description: "Study at home — Test Yourself, notes, and progress",
    href: "/auth/sign-in?as=family",
  },
  {
    id: "student",
    label: "Student",
    description: "Pick your school — username & password or badge",
    href: "/auth/sign-in?as=student",
  },
  {
    id: "educator",
    label: "Teacher or School Administrator",
    description: "Guide for Education — classes and school study",
    href: "/auth/sign-in?as=educator",
  },
  {
    id: "official",
    label: "Guide Official",
    description: "Continue with a Guide Official account",
    href: "/auth/sign-in?as=official",
  },
];

export function parseLoginAs(value: string | null | undefined): LoginAs {
  // Legacy query params from earlier role splits
  if (value === "teacher" || value === "school") return "educator";
  if (value === "learner" || value === "home" || value === "customer") {
    return "family";
  }
  if (
    value === "family" ||
    value === "student" ||
    value === "educator" ||
    value === "official"
  ) {
    return value;
  }
  return "family";
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
          "Choose your school, then log in with your username and password or scan your badge.",
        joinHref: "/auth/sign-up?as=student",
        joinLabel: "Create a student account",
      };
    case "educator":
      return {
        title: "Teacher or School Administrator",
        subtitle:
          "Open Guide for Education. After your school is approved, invite a class and follow student study.",
        joinHref: "/auth/sign-up?as=educator",
        joinLabel: "Create an account to apply",
      };
    case "official":
      return {
        title: "Guide Official",
        subtitle: "Welcome back.",
        joinHref: null,
        joinLabel: null,
      };
    case "family":
    default:
      return {
        title: "Parent or family",
        subtitle:
          "Continue Mishnayos and Gemara at home — Test Yourself, notes, and saved progress.",
        joinHref: "/auth/sign-up?as=family",
        joinLabel: "Create a family account",
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
          "Choose your school, create your account, and get a badge code for quick login. Join your class from Account with an invite code.",
        roleValue: "customer",
        showRoleChooser: false,
      };
    case "educator":
      return {
        title: "Join as Teacher or School Administrator",
        subtitle:
          "Create an account, then apply for your school. Education tools unlock after approval.",
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
    case "family":
    default:
      return {
        title: "Join as Parent or family",
        subtitle:
          "Study Mishnayos and Gemara at home — Test Yourself, notes, and progress on your account.",
        roleValue: "customer",
        showRoleChooser: false,
      };
  }
}
