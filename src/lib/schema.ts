import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("user_role", [
  "customer",
  "rebbe",
  "moderator",
  "admin",
]);

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authUserId: varchar("auth_user_id", { length: 128 }).notNull(),
    role: roleEnum("role").notNull().default("customer"),
    displayName: varchar("display_name", { length: 120 }).notNull(),
    /** School chosen at student login / signup (approved schools). */
    schoolId: uuid("school_id"),
    /** Clever-style badge code for student login (unique when set). */
    badgeCode: varchar("badge_code", { length: 32 }),
    /** Real email from signup (username/password path). */
    loginEmail: varchar("login_email", { length: 254 }),
    /**
     * Neon Auth user id for badge.{slug}.{code}@guide.student identity.
     * ensureProfile resolves sessions for either authUserId or this id.
     */
    badgeAuthUserId: varchar("badge_auth_user_id", { length: 128 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("profiles_auth_user_idx").on(t.authUserId),
    uniqueIndex("profiles_badge_code_idx").on(t.badgeCode),
    uniqueIndex("profiles_badge_auth_user_idx").on(t.badgeAuthUserId),
  ],
);

export const classrooms = pgTable("classrooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  rebbeId: uuid("rebbe_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 160 }).notNull(),
  inviteCode: varchar("invite_code", { length: 16 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const classroomMembers = pgTable(
  "classroom_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    classroomId: uuid("classroom_id")
      .notNull()
      .references(() => classrooms.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("classroom_member_unique").on(t.classroomId, t.studentId),
  ],
);

export const studyNotes = pgTable("study_notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  /** Catalog slug from TRACTATES — e.g. bava-metzia */
  tractateSlug: varchar("tractate_slug", { length: 64 })
    .notNull()
    .default("bava-metzia"),
  dafId: varchar("daf_id", { length: 8 }).notNull(),
  title: varchar("title", { length: 200 }).notNull().default("Study notes"),
  content: text("content").notNull(),
  sourceFilename: varchar("source_filename", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const progress = pgTable(
  "progress",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    tractateSlug: varchar("tractate_slug", { length: 64 })
      .notNull()
      .default("bava-metzia"),
    dafId: varchar("daf_id", { length: 8 }).notNull(),
    visited: boolean("visited").notNull().default(true),
    quizAttempts: integer("quiz_attempts").notNull().default(0),
    bestScore: integer("best_score"),
    lastVisitedAt: timestamp("last_visited_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("progress_profile_tractate_daf_idx").on(
      t.profileId,
      t.tractateSlug,
      t.dafId,
    ),
  ],
);

export type QuizQuestionRecord = {
  id: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
  source: "daf" | "notes" | "mixed";
  kind:
    | "translation"
    | "comprehension"
    | "key_term"
    | "attribution"
    | "notes";
};

export const quizSessions = pgTable("quiz_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  tractateSlug: varchar("tractate_slug", { length: 64 })
    .notNull()
    .default("bava-metzia"),
  dafId: varchar("daf_id", { length: 8 }).notNull(),
  mode: varchar("mode", { length: 24 }).notNull(),
  noteId: uuid("note_id").references(() => studyNotes.id, {
    onDelete: "set null",
  }),
  questions: jsonb("questions").$type<QuizQuestionRecord[]>().notNull(),
  answers: jsonb("answers").$type<(number | null)[]>(),
  score: integer("score"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const supportTickets = pgTable("support_tickets", {
  id: uuid("id").defaultRandom().primaryKey(),
  ticketNumber: varchar("ticket_number", { length: 20 }).notNull().unique(),
  category: varchar("category", { length: 64 }).notNull(),
  subject: varchar("subject", { length: 200 }).notNull(),
  body: text("body").notNull(),
  status: varchar("status", { length: 32 }).notNull().default("open"),
  /** Opaque code only — never store email/name for admin views */
  reporterCode: varchar("reporter_code", { length: 32 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/** Schools apply for Guide Education; approve before Rebbe access. */
export const schoolApplications = pgTable("school_applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  schoolName: varchar("school_name", { length: 200 }).notNull(),
  contactName: varchar("contact_name", { length: 120 }).notNull(),
  contactEmail: varchar("contact_email", { length: 254 }).notNull(),
  contactRole: varchar("contact_role", { length: 120 }).notNull(),
  studentCountEstimate: varchar("student_count_estimate", {
    length: 64,
  }).notNull(),
  intendedUse: text("intended_use").notNull(),
  status: varchar("status", { length: 24 }).notNull().default("pending"),
  applicantProfileId: uuid("applicant_profile_id").references(
    () => profiles.id,
    { onDelete: "set null" },
  ),
  reviewNote: text("review_note"),
  reviewedByProfileId: uuid("reviewed_by_profile_id").references(
    () => profiles.id,
    { onDelete: "set null" },
  ),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/** Approved schools — students pick one at Clever-style login. */
export const schools = pgTable(
  "schools",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 120 }).notNull(),
    applicationId: uuid("application_id").references(
      () => schoolApplications.id,
      { onDelete: "set null" },
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("schools_slug_idx").on(t.slug)],
);

/** Guide Official–authored suggestions for the student Suggestions pad. */
export const suggestions = pgTable("suggestions", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  body: text("body").notNull(),
  createdByProfileId: uuid("created_by_profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * Teacher blocks students from Suggestions.
 * studentId null = entire classroom blocked.
 */
export const suggestionBlocks = pgTable(
  "suggestion_blocks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    classroomId: uuid("classroom_id")
      .notNull()
      .references(() => classrooms.id, { onDelete: "cascade" }),
    studentId: uuid("student_id").references(() => profiles.id, {
      onDelete: "cascade",
    }),
    blockedByProfileId: uuid("blocked_by_profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("suggestion_block_class_student_idx").on(
      t.classroomId,
      t.studentId,
    ),
  ],
);

/** Student ↔ Rebbe message threads (one per student–teacher pair). */
export const messageThreads = pgTable(
  "message_threads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    classroomId: uuid("classroom_id").references(() => classrooms.id, {
      onDelete: "set null",
    }),
    subject: varchar("subject", { length: 200 }).notNull().default("Message"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("message_thread_student_teacher_idx").on(
      t.studentId,
      t.teacherId,
    ),
  ],
);

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  threadId: uuid("thread_id")
    .notNull()
    .references(() => messageThreads.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * Discord-style Roles (Official) — name, color, uploadable icon.
 * Distinct from student school scan credentials (`profiles.badgeCode`).
 */
export const roleBadges = pgTable(
  "role_badges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 80 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    /** Hex color e.g. #3a7d58 */
    color: varchar("color", { length: 7 }).notNull().default("#245239"),
    /** data:image/… URL or absolute https URL for the role icon */
    iconUrl: text("icon_url"),
    iconMime: varchar("icon_mime", { length: 64 }),
    createdByProfileId: uuid("created_by_profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("role_badges_slug_idx").on(t.slug)],
);

export const roleBadgeAssignments = pgTable(
  "role_badge_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roleBadgeId: uuid("role_badge_id")
      .notNull()
      .references(() => roleBadges.id, { onDelete: "cascade" }),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    assignedByProfileId: uuid("assigned_by_profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("role_badge_assignment_unique").on(t.roleBadgeId, t.profileId),
  ],
);

/**
 * Clever-style: teacher adds a catalog app to a class.
 * Students see installed apps on their portal. Catalog lives in code (`lib/apps`).
 */
export const classroomAppInstalls = pgTable(
  "classroom_app_installs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    classroomId: uuid("classroom_id")
      .notNull()
      .references(() => classrooms.id, { onDelete: "cascade" }),
    /** Matches GuideApp.slug — e.g. amud */
    appSlug: varchar("app_slug", { length: 64 }).notNull(),
    installedByProfileId: uuid("installed_by_profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("classroom_app_install_unique").on(t.classroomId, t.appSlug),
  ],
);
