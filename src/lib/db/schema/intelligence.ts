/**
 * Intelligence Layer Database Schema
 *
 * Tables for storing AI-generated insights, triggers, and personalized recommendations
 * This is the "brain" that makes the platform intelligent
 */

import { pgTable, text, integer, boolean, timestamp, jsonb, index, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * User Insights - AI-generated personalized insights for users
 * These are displayed on dashboards to provide value
 */
export const userInsights = pgTable("user_insights", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  insightType: text("insight_type").notNull(), // 'alert', 'suggestion', 'prediction', 'achievement'
  title: text("title").notNull(),
  description: text("description"),
  actionUrl: text("action_url"), // Link to relevant page
  actionLabel: text("action_label"), // Button text like "View Report"
  data: jsonb("data"), // JSON data for the insight
  priority: integer("priority").default(0), // 0=low, 1=medium, 2=high, 3=urgent
  isRead: boolean("is_read").default(false),
  isDismissed: boolean("is_dismissed").default(false),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("user_insights_user_id_idx").on(table.userId),
  createdAtIdx: index("user_insights_created_at_idx").on(table.createdAt),
}));

/**
 * Insight Triggers - Events that generate insights
 * Defines what data events to listen for
 */
export const insightTriggers = pgTable("insight_triggers", {
  id: text("id").primaryKey(),
  triggerName: text("trigger_name").notNull(),
  eventType: text("event_type").notNull(), // 'assessment_complete', 'grade_posted', 'attendance_low', etc.
  sourceTable: text("source_table"), // Table that triggers the event
  condition: text("condition"), // SQL WHERE clause
  actionType: text("action_type").notNull(), // What to do
  templateId: text("template_id"), // Which insight templates to use
  priority: integer("priority").default(0),
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

/**
 * Assessment Completion Records - Track when assessments are completed
 */
export const assessmentCompletionEvents = pgTable("assessment_completion_events", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  assessmentType: text("assessment_type").notNull(),
  assessmentId: text("assessment_id").notNull(),
  careerMatchesGenerated: integer("career_matches_generated").default(0),
  triggeredInsights: integer("triggered_insights").default(0),
  completedAt: timestamp("completed_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("assessment_events_user_id_idx").on(table.userId),
  assessmentIdIdx: index("assessment_events_assessment_id_idx").on(table.assessmentId),
}));

/**
 * Student Progress Analytics - For predictive intelligence
 */
export const studentProgressAnalytics = pgTable("student_progress_analytics", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  currentClassGrade: text("current_class_grade"), // e.g., "Class 10", "Class 12"
  gpa: text("gpa"), // Store as string to handle decimal precision
  attendanceRate: text("attendance_rate"), // Store as decimal string (e.g., "0.85" for 85%)
  homeworkCompletionRate: text("homework_completion_rate"), // Store as decimal string
  lastAssessmentDate: timestamp("last_assessment_date"),
  careerInterests: jsonb("career_interests"), // JSON array
  skillsIdentified: jsonb("skills_identified"), // JSON array
  skillsLastUpdated: timestamp("skills_last_updated"), // Last time skills were inferred
  skillsGapAnalysis: jsonb("skills_gap_analysis"), // JSON object with career skills gaps
  areasOfImprovement: jsonb("areas_of_improvement"), // JSON array
  riskLevel: text("risk_level").default("none"), // 'low', 'medium', 'high', 'critical'
  riskFactors: jsonb("risk_factors"), // JSON array of reasons
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("student_progress_user_id_idx").on(table.userId),
}));

/**
 * Teacher Class Intelligence - AI-powered insights for teachers
 */
export const teacherClassInsights = pgTable("teacher_class_insights", {
  id: text("id").primaryKey(),
  teacherId: text("teacher_id").notNull(),
  classId: text("class_id").notNull(),
  insightType: text("insight_type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  data: jsonb("data"), // JSON data
  priority: integer("priority").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  teacherIdIdx: index("teacher_class_insights_teacher_id_idx").on(table.teacherId),
  classIdIdx: index("teacher_class_insights_class_id_idx").on(table.classId),
}));

/**
 * School Admin Analytics - Aggregate insights for schools
 */
export const schoolAdminAnalytics = pgTable("school_admin_analytics", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),
  metricType: text("metric_type").notNull(), // 'assessment_completion', 'engagement', 'performance'
  metricValue: jsonb("metric_value"), // JSON data depending on type
  trendData: jsonb("trend_data"), // JSON array of historical data
  recommendations: jsonb("recommendations"), // JSON array of actions
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  schoolIdIdx: index("school_admin_analytics_school_id_idx").on(table.schoolId),
}));

/**
 * Student Skills - Self-reported and validated skills
 * Combines inferred skills from system with student self-reports
 */
export const studentSkills = pgTable("student_skills", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  skillName: text("skill_name").notNull(),
  category: text("category").notNull(), // academic, soft, technical, creative, service, vocational, other
  level: text("level").notNull(), // beginner, intermediate, advanced, expert
  source: text("source").notNull(), // inferred, self_report, teacher_assigned
  evidence: jsonb("evidence"), // Proof of skill (homework scores, portfolio, certificates, etc.)
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  validatedBy: text("validated_by"), // Teacher who approved
  validatedAt: timestamp("validated_at", { withTimezone: true }),
  confidence: integer("confidence"), // 0-100 for inferred skills
  isInferred: boolean("is_inferred").default(false), // True if system-inferred, false if self-reported
  expiresAt: timestamp("expires_at"), // Skills may expire (e.g., certifications)
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index("student_skills_user_id_idx").on(table.userId),
  skillNameIdx: index("student_skills_skill_name_idx").on(table.skillName),
  statusIdx: index("student_skills_status_idx").on(table.status),
  categoryIdx: index("student_skills_category_idx").on(table.category),
}));

/**
 * Career Plan Progress - Track student progress toward career goals
 */
export const careerPlanProgress = pgTable("career_plan_progress", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  targetCareerId: text("target_career_id"), // Matched career from assessments
  currentStep: text("current_step"), // 'awareness', 'exploring', 'planning', 'achieving'
  completedSteps: jsonb("completed_steps"), // JSON array of step IDs
  blockers: jsonb("blockers"), // JSON array of current blockers
  nextActions: jsonb("next_actions"), // JSON array of recommended actions
  status: text("status").default('not_started'), // 'not_started', 'in_progress', 'on_track', 'achieved'
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("career_plan_progress_user_id_idx").on(table.userId),
}));

/**
 * Type exports
 */
export type UserInsight = typeof userInsights.$inferSelect;
export type NewUserInsight = typeof userInsights.$inferInsert;
export type AssessmentCompletionEvent = typeof assessmentCompletionEvents.$inferSelect;
export type NewAssessmentCompletionEvent = typeof assessmentCompletionEvents.$inferInsert;
export type StudentProgressAnalytic = typeof studentProgressAnalytics.$inferSelect;
export type NewStudentProgressAnalytic = typeof studentProgressAnalytics.$inferInsert;
export type StudentSkill = typeof studentSkills.$inferSelect;
export type NewStudentSkill = typeof studentSkills.$inferInsert;
export type TeacherClassInsight = typeof teacherClassInsights.$inferSelect;
export type NewTeacherClassInsight = typeof teacherClassInsights.$inferInsert;
export type SchoolAdminAnalytic = typeof schoolAdminAnalytics.$inferSelect;
export type NewSchoolAdminAnalytic = typeof schoolAdminAnalytics.$inferInsert;
export type CareerPlanProgress = typeof careerPlanProgress.$inferSelect;
export type NewCareerPlanProgress = typeof careerPlanProgress.$inferInsert;