import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Tenants
export const tenants = sqliteTable("tenants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  domain: text("domain").unique(),
  settings: text("settings", { mode: "json" }).$type<{
    theme?: string;
    primaryColor?: string;
  }>(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// Schools
export const schools = sqliteTable("schools", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  domain: text("domain").unique(),
  address: text("address"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  settings: text("settings", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// Users
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  schoolId: text("school_id").references(() => schools.id),
  type: text("type", { enum: ["student", "teacher", "parent", "admin"] }).notNull(),
  email: text("email"),
  phone: text("phone"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  profilePicture: text("profile_picture"),
  // Student specific
  dateOfBirth: text("date_of_birth"),
  classGrade: integer("class_grade"),
  section: text("section"),
  parentId: text("parent_id").references(() => users.id),
  // Teacher specific
  employeeId: text("employee_id"),
  subjects: text("subjects", { mode: "json" }).$type<string[]>(),
  // Parent specific
  occupation: text("occupation"),
  relationship: text("relationship"),
  clerkUserId: text("clerk_user_id").unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false),
  settings: text("settings", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  lastLoginAt: integer("last_login_at", { mode: "timestamp" }),
});

// Assessments
export const assessments = sqliteTable("assessments", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  userId: text("user_id").notNull().references(() => users.id),
  type: text("type").notNull().default("riasec"),
  status: text("status", { enum: ["in_progress", "completed", "abandoned"] }).default("in_progress"),
  answers: text("answers", { mode: "json" }).notNull().$type<Record<string, number>>(),
  results: text("results", { mode: "json" }),
  startedAt: integer("started_at", { mode: "timestamp" }).notNull(),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// Questions
export const questions = sqliteTable("questions", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id),
  assessmentType: text("assessment_type").notNull(),
  questionText: text("question_text").notNull(),
  options: text("options", { mode: "json" }).notNull().$type<Array<{ value: number; text: string }>>(),
  category: text("category"), // RIASEC: R, I, A, S, E, C
  orderIndex: integer("order_index"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  language: text("language").default("en"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// Careers
export const careers = sqliteTable("careers", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  riasecCode: text("riasec_code"),
  riasecScores: text("riasec_scores", { mode: "json" }).$type<Record<string, number>>(),
  skills: text("skills", { mode: "json" }).$type<string[]>(),
  educationPath: text("education_path", { mode: "json" }).$type<string[]>(),
  subjects: text("subjects", { mode: "json" }).$type<string[]>(),
  workEnvironment: text("work_environment"),
  salaryRange: text("salary_range"),
  demandOutlook: text("demand_outlook", { enum: ["high", "medium", "low"] }),
  bhutanSpecific: integer("bhutan_specific", { mode: "boolean" }).default(false),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// Career Matches
export const careerMatches = sqliteTable("career_matches", {
  id: text("id").primaryKey(),
  assessmentId: text("assessment_id").notNull().references(() => assessments.id),
  careerId: text("career_id").notNull().references(() => careers.id),
  matchScore: integer("match_score").notNull(),
  recommendationText: text("recommendation_text"),
  isTopMatch: integer("is_top_match", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// Consent Records
export const consentRecords = sqliteTable("consent_records", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  parentId: text("parent_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  status: text("status").default("pending"),
  consentText: text("consent_text"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  consentedAt: integer("consented_at", { mode: "timestamp" }),
  revokedAt: integer("revoked_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// Classes
export const classes = sqliteTable("classes", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id),
  teacherId: text("teacher_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  grade: integer("grade").notNull(),
  section: text("section"),
  academicYear: text("academic_year").notNull(),
  students: text("students", { mode: "json" }).$type<string[]>(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// Types
export type Tenant = typeof tenants.$inferSelect;
export type School = typeof schools.$inferSelect;
export type User = typeof users.$inferSelect;
export type Assessment = typeof assessments.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type Career = typeof careers.$inferSelect;
export type CareerMatch = typeof careerMatches.$inferSelect;
export type ConsentRecord = typeof consentRecords.$inferSelect;
export type Class = typeof classes.$inferSelect;
