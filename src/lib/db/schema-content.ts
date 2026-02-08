import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// ============================================================================
// COLLEGES & PROGRAMS DATABASE
// ============================================================================

// Colleges (imported from external or manual)
export const colleges = sqliteTable("colleges", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  dataSource: text("data_source"), // "ipedx", "rub_manual", "common_app"
  externalId: text("external_id"), // ID from original source

  // Basic info
  location: text("location"), // City, Country
  website: text("website"),
  type: text("type"), // "public", "private", "community"

  // Bhutan-specific
  isBhutanCollege: integer("is_bhutan_college", { mode: "boolean" }).default(false),
  bhutanCollegeType: text("bhutan_college_type"), // "rub", "private", "rtc"

  // Admissions data
  acceptanceRate: integer("acceptance_rate"),
  avgSAT: integer("avg_sat"),
  avgACT: integer("avg_act"),
  requiredGPA: text("required_gpa"),

  // Programs (JSON or separate table)
  programs: text("programs", { mode: "json" }),

  // Metadata
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }),
});

// RUB Programs (local manual entry)
export const rubPrograms = sqliteTable("rub_programs", {
  id: text("id").primaryKey(),
  collegeId: text("college_id"),
  name: text("name").notNull(),
  code: text("code").notNull(), // e.g., "BSc-CS", "BBA"

  // Program details
  duration: text("duration"), // "4 years", "2 years"
  seats: integer("seats"),
  minMarks: integer("min_marks"), // Minimum percentage required

  // Eligibility
  requiredSubjects: text("required_subjects", { mode: "json" }),
  eligibilityCriteria: text("eligibility_criteria"),

  // Career connections
  relatedCareerClusters: text("related_career_clusters", { mode: "json" }),

  // Metadata
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  academicYear: text("academic_year"), // "2024-2025"
  updatedAt: integer("updated_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }),
});

// Scholarships
export const scholarships = sqliteTable("scholarships", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  provider: text("provider").notNull(), // Organization offering
  dataSource: text("data_source"), // "manual", "external_api"

  // Details
  amount: text("amount"), // "Nu. 50,000", "Full tuition"
  amountMin: integer("amount_min"),
  amountMax: integer("amount_max"),
  currency: text("currency").default("BTN"),

  // Eligibility
  eligibilityCriteria: text("eligibility_criteria", { mode: "json" }),
  requiredGPA: text("required_gpa"),
  requiredClass: text("required_class"), // "Class 12", "Any"

  // Deadlines
  applicationDeadline: text("application_deadline"), // ISO date
  announcementDate: text("announcement_date"),

  // Category
  category: text("category"), // "merit", "need-based", "sports", "specific_college"
  targetGroups: text("target_groups", { mode: "json" }), // ["female", "stem", "rural"]

  // Matching
  careerClusters: text("career_clusters", { mode: "json" }),
  requiredInterests: text("required_interests", { mode: "json" }), // RIASEC codes

  // Links
  applicationUrl: text("application_url"),
  moreInfoUrl: text("more_info_url"),

  isActive: integer("is_active", { mode: "boolean" }).default(true),
  academicYear: text("academic_year"),
  createdAt: integer("created_at", { mode: "timestamp" }),
});

// Data Sources for external integrations
export const dataSources = sqliteTable("data_sources", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "ipedx", "onet", "rub_local", "manual"
  apiUrl: text("api_url"),
  lastSyncAt: integer("last_sync_at", { mode: "timestamp" }),
  syncStatus: text("sync_status"), // "active", "error", "disabled"
  config: text("config", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" }),
});

// Content audit trail
export const contentAudit = sqliteTable("content_audit", {
  id: text("id").primaryKey(),
  entityType: text("entity_type").notNull(), // "college", "rub_program", "scholarship"
  entityId: text("entity_id").notNull(),
  action: text("action").notNull(), // "created", "updated", "deleted"
  userId: text("user_id"),
  changes: text("changes", { mode: "json" }), // What changed
  ipAddress: text("ip_address"),
  createdAt: integer("created_at", { mode: "timestamp" }),
});

// Types
export type College = typeof colleges.$inferSelect;
export type RubProgram = typeof rubPrograms.$inferSelect;
export type Scholarship = typeof scholarships.$inferSelect;
export type DataSource = typeof dataSources.$inferSelect;
export type ContentAudit = typeof contentAudit.$inferSelect;
