/**
 * Timetable Management Database Schema
 * Handles class scheduling, teacher allocation, and conflict detection
 */

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// ============================================================================
// TIMETABLE PERIODS
// ============================================================================

/**
 * Time periods for the school day
 * e.g., Period 1: 8:00-8:45, Period 2: 8:45-9:30, etc.
 */
export const timePeriods = sqliteTable("time_periods", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // Period details
  name: text("name").notNull(), // "Period 1", "Break", "Lunch"
  type: text("type").notNull(), // "class", "break", "lunch"
  orderIndex: integer("order_index").notNull(), // Sorting order

  // Time
  startTime: text("start_time").notNull(), // HH:MM format (24h)
  endTime: text("end_time").notNull(), // HH:MM format (24h)
  duration: integer("duration").notNull(), // In minutes

  // Days applicable
  days: text("days", { mode: "json" }).$type<Array<"Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday">>(),

  isActive: integer("is_active", { mode: "boolean" }).default(true),

  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ============================================================================
// TIMETABLE ENTRIES
// ============================================================================

/**
 * Individual timetable entries
 * Links a class, subject, teacher, room, and time period
 */
export const timetableEntries = sqliteTable("timetable_entries", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // Class and section
  classId: text("class_id").notNull(), // References classes table
  grade: integer("grade").notNull(),
  section: text("section"),

  // Subject and teacher
  subjectId: text("subject_id").notNull(), // References subjects table
  subjectName: text("subject_name").notNull(), // Denormalized for easy access
  teacherId: text("teacher_id").notNull(), // References users table (type='teacher')
  teacherName: text("teacher_name"), // Denormalized

  // Room allocation
  roomId: text("room_id"), // Physical classroom/lab ID
  roomName: text("room_name"), // "Room 101", "Science Lab", etc.

  // Time slot
  periodId: text("period_id").notNull(), // References time_periods
  dayOfWeek: text("day_of_week").notNull(), // "Monday", "Tuesday", etc.

  // Additional info
  academicYear: text("academic_year").notNull(), // "2024-2025"
  termId: text("term_id"), // References academic_terms
  isElective: integer("is_elective", { mode: "boolean" }).default(false),
  isDoublePeriod: integer("is_double_period", { mode: "boolean" }).default(false),
  notes: text("notes"),

  // Status
  isActive: integer("is_active", { mode: "boolean" }).default(true),

  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ============================================================================
// ROOMS
// ============================================================================

/**
 * Physical rooms in the school
 * Classrooms, labs, halls, etc.
 */
export const rooms = sqliteTable("rooms", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // Room details
  name: text("name").notNull(), // "Room 101", "Computer Lab 1"
  roomNumber: text("room_number"), // "101", "CL1"
  type: text("type").notNull(), // "classroom", "lab", "hall", "library", "office"
  capacity: integer("capacity"), // Number of students

  // Features
  hasProjector: integer("has_projector", { mode: "boolean" }).default(false),
  hasComputers: integer("has_computers", { mode: "boolean" }).default(false),
  hasLabEquipment: integer("has_lab_equipment", { mode: "boolean" }).default(false),
  facilities: text("facilities", { mode: "json" }).$type<string[]>(), // ["projector", "smart_board", "ac"]

  // Location
  building: text("building"), // "Block A", "Main Building"
  floor: integer("floor"), // Floor number

  isActive: integer("is_active", { mode: "boolean" }).default(true),

  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ============================================================================
// TIMETALE CONFLICTS
// ============================================================================

/**
 * Recorded conflicts in timetable
 * For tracking and resolution
 */
export const timetableConflicts = sqliteTable("timetable_conflicts", {
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
  resolvedAt: integer("resolved_at", { mode: "timestamp" }),
  resolutionNotes: text("resolution_notes"),

  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ============================================================================
// EXAM SCHEDULES
// ============================================================================

/**
 * Examination schedules
 * Separate from regular timetable
 */
export const examSchedules = sqliteTable("exam_schedules", {
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

  isActive: integer("is_active", { mode: "boolean" }).default(true),

  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

/**
 * Individual exam entries
 */
export const examEntries = sqliteTable("exam_entries", {
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

  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type TimePeriod = typeof timePeriods.$inferSelect;
export type TimetableEntry = typeof timetableEntries.$inferSelect;
export type Room = typeof rooms.$inferSelect;
export type TimetableConflict = typeof timetableConflicts.$inferSelect;
export type ExamSchedule = typeof examSchedules.$inferSelect;
export type ExamEntry = typeof examEntries.$inferSelect;
