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
    description:
      "Study Mishnayos and Gemara at home — Test Yourself, notes, and progress",
    href: "/auth/sign-in?as=family",
  },
  {
    id: "student",
    label: "Student",
    description: "School student — join a class with an invite code from your Rebbe",
    href: "/auth/sign-in?as=student",
  },
  {
    id: "educator",
    label: "Teacher or School Administrator",
    description:
      "Guide for Education — apply for your school, classes, and student progress",
    href: "/auth/sign-in?as=educator",
  },
  {
    id: "official",
    label: "Guide Official",
    description: "Internal staff — school approvals and support",
    href: "/auth/sign-in?as=official",
  },
];

export function parseLoginAs(value: string | null | undefined): LoginAs {
  // Legacy query params from the previous four-way split
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
          "Log in to study Mishnayos and Gemara, Test Yourself, and join your class with an invite code.",
        joinHref: "/auth/sign-up?as=student",
        joinLabel: "Create a student account",
      };
    case "educator":
      return {
        title: "Teacher or School Administrator",
        subtitle:
          "Log in for Guide for Education. After your school is approved, open classes, invite codes, and student progress.",
        joinHref: "/auth/sign-up?as=educator",
        joinLabel: "Create an account to apply",
      };
    case "official":
      return {
        title: "Guide Official",
        subtitle:
          "Internal staff access for school approvals and support operations.",
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
          "Save progress and Test Yourself scores. After you sign up, join your class from Account with an invite code.",
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
        subtitle: "Staff accounts are provisioned internally — please log in.",
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
