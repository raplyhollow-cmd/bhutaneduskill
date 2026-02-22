/**
 * TEACHER BEHAVIOR LOGS SCHEMA
 *
 * Tables for tracking student behavior incidents logged by teachers.
 * Integrates with existing notifications system for parent alerts.
 */

import { pgTable, text, integer, timestamp, index, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./schema";
import { classes } from "./schema";

// ============================================================================
// TEACHER BEHAVIOR LOGS TABLE
// ============================================================================

/**
 * Teacher behavior logs - records merit/demerit incidents
 * Used by teachers to track student behavior and send notifications to parents
 */
export const teacherBehaviorLogs = pgTable("teacher_behavior_logs", {
  id: text("id").primaryKey(),
  teacherId: text("teacher_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  studentId: text("student_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  classId: text("class_id").references(() => classes.id, { onDelete: "set null" }),

  // Type of log
  type: text("type").notNull(), // "merit" | "demerit"

  // Category for better organization
  category: text("category").notNull(), // "attendance" | "participation" | "discipline" | "homework" | "leadership" | "other"

  // Points (positive for merit, negative for demerit)
  points: integer("points").notNull(),

  // Description of the incident
  description: text("description").notNull(),

  // Action taken for demerits
  actionTaken: text("action_taken"), // "warning" | "counseling" | "parent_call" | "detention" | "none"

  // Severity level
  severity: text("severity").notNull().default("low"), // "low" | "medium" | "high"

  // Whether parent was notified
  parentNotified: boolean("parent_notified").default(false),
  parentNotifiedAt: timestamp("parent_notified_at", { withTimezone: true }),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
}, (table) => ({
  // Indexes for common queries
  teacherIdIdx: index("idx_teacher_behavior_teacher").on(table.teacherId),
  studentIdIdx: index("idx_teacher_behavior_student").on(table.studentId),
  classIdIdx: index("idx_teacher_behavior_class").on(table.classId),
  typeIdx: index("idx_teacher_behavior_type").on(table.type),
  createdAtIdx: index("idx_teacher_behavior_created").on(table.createdAt),
  // Composite index for teacher's recent logs
  teacherCreatedIdx: index("idx_teacher_behavior_teacher_created").on(table.teacherId, table.createdAt),
}));

export type TeacherBehaviorLog = typeof teacherBehaviorLogs.$inferSelect;
export type NewTeacherBehaviorLog = typeof teacherBehaviorLogs.$inferInsert;

// ============================================================================
// RELATIONS
// ============================================================================

export const teacherBehaviorLogsRelations = relations(teacherBehaviorLogs, ({ one }) => ({
  teacher: one(users, {
    fields: [teacherBehaviorLogs.teacherId],
    references: [users.id],
  }),
  student: one(users, {
    fields: [teacherBehaviorLogs.studentId],
    references: [users.id],
  }),
  class: one(classes, {
    fields: [teacherBehaviorLogs.classId],
    references: [classes.id],
  }),
}));
