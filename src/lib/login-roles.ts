/** Clever-style “Log in as” roles — consumer-facing labels. */

export type LoginAs =
  | "student"
  | "teacher"
  | "school"
  | "official";

export type LoginRoleOption = {
  id: LoginAs;
  label: string;
  description: string;
  href: string;
};

export const LOGIN_AS_OPTIONS: LoginRoleOption[] = [
  {
    id: "student",
    label: "Student",
    description: "Study Mishnayos and Gemara, Test Yourself, save notes",
    href: "/auth/sign-in?as=student",
  },
  {
    id: "teacher",
    label: "Teacher / Rebbe",
    description: "Guide for Education — classes and home study progress",
    href: "/auth/sign-in?as=teacher",
  },
  {
    id: "school",
    label: "School or district administrator",
    description: "Apply for your school and manage Education access",
    href: "/auth/sign-in?as=school",
  },
  {
    id: "official",
    label: "Guide Official",
    description: "Internal staff — school approvals and support",
    href: "/auth/sign-in?as=official",
  },
];

export function parseLoginAs(value: string | null | undefined): LoginAs {
  if (
    value === "student" ||
    value === "teacher" ||
    value === "school" ||
    value === "official"
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
    case "teacher":
      return {
        title: "Log in as Teacher / Rebbe",
        subtitle:
          "Access Guide for Education after your school is approved — classes, invite codes, and student progress.",
        joinHref: "/auth/sign-up?as=teacher",
        joinLabel: "Create a Rebbe account",
      };
    case "school":
      return {
        title: "Log in as school administrator",
        subtitle:
          "Apply for Guide for Education or check your school’s application status.",
        joinHref: "/auth/sign-up?as=school",
        joinLabel: "Create an account to apply",
      };
    case "official":
      return {
        title: "Log in as Guide Official",
        subtitle:
          "Internal staff access for school approvals and support operations.",
        joinHref: null,
        joinLabel: null,
      };
    case "student":
    default:
      return {
        title: "Log in as Student",
        subtitle:
          "Continue Mishnayos and Gemara study, Test Yourself, and keep your notes.",
        joinHref: "/auth/sign-up?as=student",
        joinLabel: "Create a student account",
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
    case "teacher":
      return {
        title: "Join as Teacher / Rebbe",
        subtitle:
          "Create an account, then apply for your school. Education tools unlock after approval.",
        roleValue: "rebbe",
        showRoleChooser: false,
      };
    case "school":
      return {
        title: "Join as school administrator",
        subtitle:
          "Create an account and submit a school application for Guide for Education.",
        roleValue: "customer",
        showRoleChooser: false,
      };
    case "official":
      return {
        title: "Guide Official",
        subtitle: "Staff accounts are provisioned internally — please log in.",
        roleValue: "moderator",
        showRoleChooser: false,
      };
    case "student":
    default:
      return {
        title: "Join as Student",
        subtitle:
          "Save progress, notes, and Test Yourself scores for Mishnayos and Gemara.",
        roleValue: "customer",
        showRoleChooser: false,
      };
  }
}
