/**
 * Timetable Management Database Schema
 * Handles class scheduling, teacher allocation, and conflict detection
 *
 * NOTE: timePeriods, rooms, and timetableEntries are defined in schema.ts
 * to maintain a single source of truth. This file re-exports them for
 * convenience and defines timetable-specific tables.
 */

import { pgTable, text, integer, boolean, timestamp, pgEnum , json} from "drizzle-orm/pg-core";

// Re-export core timetable tables from schema.ts
export {
  timePeriods,
  rooms,
  timetableEntries,
  type TimePeriod,
  type Room,
  type TimetableEntry,
} from "./schema";

// ============================================================================
// TIMETABLE CONFLICTS
// ============================================================================

/**
 * Recorded conflicts in timetable
 * For tracking and resolution
 */
export const timetableConflicts = pgTable("timetable_conflicts", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // Conflict details
  conflictType: text("conflict_type").notNull(), // "teacher_double_booked", "room_double_booked", "class_double_booked"

  // Affected entities
  entryId1: text("entry_id_1").notNull(), // First conflicting entry
  entryId2: text("entry_id_2").notNull(), // Second conflicting entry

  // Conflict info
  teacherId: text("teacher_id"), // If teacher conflict
  roomId: text("room_id"), // If room conflict
  classId: text("class_id"), // If class conflict
  dayOfWeek: text("day_of_week").notNull(),
  periodId: text("period_id").notNull(),

  // Resolution
  status: text("status").notNull().default("pending"), // "pending", "resolved", "ignored"
  resolvedBy: text("resolved_by"), // User ID who resolved
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  resolutionNotes: text("resolution_notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// EXAM SCHEDULES
// ============================================================================

/**
 * Examination schedules
 * Separate from regular timetable
 */
export const examSchedules = pgTable("exam_schedules", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // Exam details
  name: text("name").notNull(), // "Mid Term Examination 2024"
  type: text("type").notNull(), // "midterm", "final", "unit_test", "practical"
  academicYear: text("academic_year").notNull(),
  termId: text("term_id"),

  // Dates
  startDate: text("start_date").notNull(), // ISO date
  endDate: text("end_date").notNull(),

  // Status
  status: text("status").notNull().default("draft"), // "draft", "published", "completed", "cancelled"

  isActive: boolean("is_active").default(true),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

/**
 * Individual exam entries
 */
export const examEntries = pgTable("exam_entries", {
  id: text("id").primaryKey(),
  examScheduleId: text("exam_schedule_id").notNull().references(() => examSchedules.id),

  // Exam details
  grade: integer("grade").notNull(),
  section: text("section"),
  subjectId: text("subject_id").notNull(),
  subjectName: text("subject_name").notNull(),

  // Date and time
  examDate: text("exam_date").notNull(), // ISO date
  startTime: text("start_time").notNull(), // HH:MM
  endTime: text("end_time").notNull(), // HH:MM

  // Room allocation
  roomId: text("room_id"),
  roomName: text("room_name"),

  // Invigilation
  invigilatorId: text("invigilator_id"), // Teacher user ID
  invigilatorName: text("invigilator_name"),

  // Additional info
  maxMarks: integer("max_marks"),
  duration: integer("duration").notNull(), // In minutes
  instructions: text("instructions"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type TimetableConflict = typeof timetableConflicts.$inferSelect;
export type ExamSchedule = typeof examSchedules.$inferSelect;
export type ExamEntry = typeof examEntries.$inferSelect;
