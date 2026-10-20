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
    description: "Study at home with Test Yourself and notes",
    href: "/auth/sign-in?as=family",
  },
  {
    id: "student",
    label: "Student",
    description: "Find your school, then username or badge",
    href: "/auth/sign-in?as=student",
  },
  {
    id: "educator",
    label: "Teacher or School Administrator",
    description: "Classes and school study in Guide for Education",
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
        subtitle: "Find your school, then log in with a username or badge.",
        joinHref: "/auth/sign-up?as=student",
        joinLabel: "Create a student account",
      };
    case "educator":
      return {
        title: "Teacher or School Administrator",
        subtitle:
          "Sign in for Guide for Education. After your school is approved, invite a class and follow student study.",
        joinHref: "/auth/sign-up?as=educator",
        joinLabel: "Create an account to apply",
      };
    case "official":
      return {
        title: "Guide Official",
        subtitle: "Sign in to continue.",
        joinHref: null,
        joinLabel: null,
      };
    case "family":
    default:
      return {
        title: "Parent or family",
        subtitle:
          "Sign in to keep Test Yourself scores, notes, and progress at home.",
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
          "Choose your school and create an account. You’ll get a badge for quick login, then join class from Account.",
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
