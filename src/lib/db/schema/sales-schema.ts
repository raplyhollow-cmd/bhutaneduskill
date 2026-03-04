/**
 * SALES & CRM SCHEMA
 *
 * Tables for managing school sales leads, trials, and conversions
 */

import { pgTable, text, integer, boolean, timestamp, pgEnum, jsonb } from "drizzle-orm/pg-core";

// ============================================================================
// ENUMS
// ============================================================================

export const leadSourceEnum = pgEnum("lead_source", [
  "website",
  "referral",
  "ministry_introduction",
  "cold_outreach",
  "conference",
  "demo_request",
  "partner",
  "other",
]);

export const leadStatusEnum = pgEnum("lead_status", [
  "new",
  "contacted",
  "qualified",
  "demo_scheduled",
  "demo_completed",
  "trial_started",
  "trial_active",
  "negotiation",
  "won",
  "lost",
  "unresponsive",
]);

export const leadTierEnum = pgEnum("lead_tier", [
  "starter",
  "growth",
  "premier",
  "enterprise",
  "undetermined",
]);

export const trialStatusEnum = pgEnum("trial_status", [
  "pending_setup",
  "active",
  "extended",
  "converted",
  "expired",
  "cancelled",
]);

// ============================================================================
// TABLES
// ============================================================================

/**
 * sales_leads - Potential school customers
 */
export const salesLeads = pgTable("sales_leads", {
  id: text("id").primaryKey(),
  schoolName: text("school_name").notNull(),
  schoolNameDz: text("school_name_dz"), // Dzongkha name
  contactName: text("contact_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  role: text("role"), // Principal, Vice Principal, Counselor, etc.

  // School details
  district: text("district"), // Dzongkhag
  schoolType: text("school_type"), // Private, Government, Public
  studentCount: integer("student_count"),
  teacherCount: integer("teacher_count"),
  website: text("website"),

  // Lead qualification
  status: leadStatusEnum("lead_status").default("new").notNull(),
  tier: leadTierEnum("lead_tier").default("undetermined"),
  source: leadSourceEnum("lead_source"),
  sourceDetails: text("source_details"), // UTM parameters, referral name, etc.

  // Budget & timeline
  estimatedBudget: integer("estimated_budget"), // In Nu.
  budgetApproved: boolean("budget_approved").default(false),
  timeline: text("timeline"), // "Immediate", "This quarter", "This year", "Next year"

  // Interest & requirements
  interestedFeatures: jsonb("interested_features"), // ["assessments", "roadmap", "analytics"]
  painPoints: jsonb("pain_points"), // ["No career counselor", "Low BCSE scores"]
  currentSolution: text("current_solution"), // What they use now

  // Trial info
  trialStartDate: timestamp("trial_start_date"),
  trialEndDate: timestamp("trial_end_date"),
  trialStatus: trialStatusEnum("trial_status"),

  // Deal tracking
  estimatedValue: integer("estimated_value"), // Potential annual value
  probability: integer("probability"), // 0-100
  expectedCloseDate: timestamp("expected_close_date"),

  // Notes
  notes: text("notes"),
  lastContactDate: timestamp("last_contact_date"),
  nextFollowUpDate: timestamp("next_follow_up_date"),

  // Assigned to
  assignedTo: text("assigned_to"), // Sales rep user ID

  // Conversion
  convertedSchoolId: text("converted_school_id"), // Link to schools table
  convertedAt: timestamp("converted_at"),
  subscriptionTier: text("subscription_tier"),

  // Lost reasons
  lostReason: text("lost_reason"), // "Price", "Went with competitor", "No budget"
  competitor: text("competitor"), // If they chose someone else

  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: text("created_by"),
});

/**
 * sales_activities - Interactions with leads
 */
export const salesActivities = pgTable("sales_activities", {
  id: text("id").primaryKey(),
  leadId: text("lead_id").notNull(),

  type: text("type").notNull(), // "call", "email", "meeting", "demo", "follow_up"
  title: text("title").notNull(),
  description: text("description"),

  duration: integer("duration"), // In minutes for calls/meetings
  outcome: text("outcome"), // "interested", "not_interested", "follow_up_scheduled"
  nextAction: text("next_action"),

  // Participants
  conductedBy: text("conducted_by").notNull(), // User ID
  attendees: jsonb("attendees"), // List of participant names/emails

  // Metadata
  activityDate: timestamp("activity_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

/**
 * sales_tasks - Follow-up tasks for sales team
 */
export const salesTasks = pgTable("sales_tasks", {
  id: text("id").primaryKey(),
  leadId: text("lead_id").notNull(),

  title: text("title").notNull(),
  description: text("description"),
  taskType: text("task_type").notNull(), // "call", "email", "demo", "proposal", "follow_up"

  dueDate: timestamp("due_date").notNull(),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),

  priority: text("priority").notNull(), // "high", "medium", "low"

  assignedTo: text("assigned_to").notNull(),
  createdBy: text("created_by"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * sales_documents - Shared documents with leads
 */
export const salesDocuments = pgTable("sales_documents", {
  id: text("id").primaryKey(),
  leadId: text("lead_id"),

  name: text("name").notNull(),
  type: text("type").notNull(), // "proposal", "invoice", "contract", "demo_recording"
  fileUrl: text("file_url"),
  fileSize: integer("file_size"),

  description: text("description"),
  version: text("version"),

  sentAt: timestamp("sent_at"),
  viewedAt: timestamp("viewed_at"),
  downloadedAt: timestamp("downloaded_at"),

  uploadedBy: text("uploaded_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

/**
 * competitor_info - Track competitive landscape
 */
export const competitorInfo = pgTable("competitor_info", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  website: text("website"),
  description: text("description"),

  pricing: text("pricing"), // General pricing info
  strengths: jsonb("strengths"), // ["Cheaper", "Government contract"]
  weaknesses: jsonb("weaknesses"), // ["No BCSE alignment", "No RUB data"]

  marketShare: integer("market_share"), // Estimated %

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * sales_pipeline - Pipeline stages and metrics
 */
export const salesPipeline = pgTable("sales_pipeline", {
  id: text("id").primaryKey(),

  month: text("month").notNull(), // "2026-03"
  stage: text("stage").notNull(), // "new", "demo", "trial", "negotiation", "won", "lost"

  leadCount: integer("lead_count").default(0),
  totalValue: integer("total_value").default(0),

  conversions: integer("conversions").default(0),
  conversionRate: integer("conversion_rate"), // Percentage

  avgDaysInStage: integer("avg_days_in_stage"),

  createdAt: timestamp("created_at").defaultNow(),
});

/**
 * referral_partners - Organizations that refer schools
 */
export const referralPartners = pgTable("referral_partners", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "ministry", "district", "consulting_firm", "other"

  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),

  commissionRate: integer("commission_rate"), // Percentage commission

  referredCount: integer("referred_count").default(0),
  convertedCount: integer("converted_count").default(0),
  totalCommission: integer("total_commission").default(0),

  status: text("status").notNull(), // "active", "inactive"

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================================
// TYPES
// ============================================================================

export type SalesLead = typeof salesLeads.$inferSelect;
export type NewSalesLead = typeof salesLeads.$inferInsert;

export type SalesActivity = typeof salesActivities.$inferSelect;
export type NewSalesActivity = typeof salesActivities.$inferInsert;

export type SalesTask = typeof salesTasks.$inferSelect;
export type NewSalesTask = typeof salesTasks.$inferInsert;

export type SalesDocument = typeof salesDocuments.$inferSelect;
export type NewSalesDocument = typeof salesDocuments.$inferInsert;

export type CompetitorInfo = typeof competitorInfo.$inferSelect;
export type NewCompetitorInfo = typeof competitorInfo.$inferInsert;

export type SalesPipeline = typeof salesPipeline.$inferSelect;
export type NewSalesPipeline = typeof salesPipeline.$inferInsert;

export type ReferralPartner = typeof referralPartners.$inferSelect;
export type NewReferralPartner = typeof referralPartners.$inferInsert;
