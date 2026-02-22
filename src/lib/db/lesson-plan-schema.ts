/**
 * LESSON PLAN SCHEMA
 *
 * Tables for teacher lesson planning and syllabus tracking.
 * Helps teachers track progress against REC (Royal Education Council) curriculum.
 */

import { pgTable, text, integer, timestamp, index, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./schema";
import { classes } from "./schema";

// Import subjects if it exists
import { subjects } from "./schema";

// ============================================================================
// LESSON PLANS TABLE
// ============================================================================

/**
 * Lesson plans - teacher's lesson planning and tracking
 * Integrates with syllabus/curriculum for progress tracking
 */
export const lessonPlans = pgTable("lesson_plans", {
  id: text("id").primaryKey(),
  teacherId: text("teacher_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  classId: text("class_id").references(() => classes.id, { onDelete: "cascade" }).notNull(),
  subjectId: text("subject_id").references(() => subjects.id, { onDelete: "set null" }),

  // Lesson details
  title: text("title").notNull(),
  chapter: text("chapter").notNull(), // Chapter number/name from curriculum
  chapterNumber: integer("chapter_number"), // Numeric chapter for sorting

  // Learning objectives (JSON array)
  objectives: text("objectives"), // JSON string array of objectives

  // Activities and resources
  activities: text("activities"), // Lesson activities description
  resources: text("resources"), // JSON string array of resource links/attachments

  // Scheduling
  scheduledDate: text("scheduled_date"), // ISO date string
  duration: integer("duration"), // Duration in minutes

  // Status tracking
  status: text("status").notNull().default("planned"), // "planned" | "completed" | "skipped" | "cancelled"

  // Completion tracking
  completedAt: timestamp("completed_at", { withTimezone: true }),
  coveragePercentage: integer("coverage_percentage").default(0), // 0-100, how much of lesson was covered

  // Notes and reflection
  notes: text("notes"), // Teacher's reflection or notes
  homeworkAssigned: text("homework_assigned"), // Any homework assigned

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  // Indexes for common queries
  teacherIdIdx: index("idx_lesson_plans_teacher").on(table.teacherId),
  classIdIdx: index("idx_lesson_plans_class").on(table.classId),
  subjectIdIdx: index("idx_lesson_plans_subject").on(table.subjectId),
  statusIdx: index("idx_lesson_plans_status").on(table.status),
  scheduledDateIdx: index("idx_lesson_plans_scheduled").on(table.scheduledDate),
  // Composite index for teacher's active lessons
  teacherClassIdx: index("idx_lesson_plans_teacher_class").on(table.teacherId, table.classId),
}));

export type LessonPlan = typeof lessonPlans.$inferSelect;
export type NewLessonPlan = typeof lessonPlans.$inferInsert;

// ============================================================================
// SYLLABUS PROGRESS TABLE
// ============================================================================

/**
 * Syllabus progress - tracks overall syllabus completion per class/subject
 * Updated automatically when lessons are marked complete
 */
export const syllabusProgress = pgTable("syllabus_progress", {
  id: text("id").primaryKey(),
  classId: text("class_id").references(() => classes.id, { onDelete: "cascade" }).notNull(),
  subjectId: text("subject_id"),
  teacherId: text("teacher_id").references(() => users.id, { onDelete: "cascade" }).notNull(),

  // Progress tracking
  totalChapters: integer("total_chapters").notNull().default(0),
  completedChapters: integer("completed_chapters").notNull().default(0),
  progressPercentage: integer("progress_percentage").notNull().default(0),

  // Current chapter info
  currentChapter: text("current_chapter"),
  currentChapterNumber: integer("current_chapter_number"),

  // Academic year
  academicYear: text("academic_year").notNull(),

  // Timestamps
  lastUpdated: timestamp("last_updated", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
}, (table) => ({
  // Indexes
  classIdIdx: index("idx_syllabus_progress_class").on(table.classId),
  teacherIdIdx: index("idx_syllabus_progress_teacher").on(table.teacherId),
  academicYearIdx: index("idx_syllabus_progress_year").on(table.academicYear),
  // Unique constraint: one progress record per class/subject/teacher/year
  uniqueClassSubjectTeacherYear: index("idx_syllabus_progress_unique").on(table.classId, table.subjectId, table.teacherId, table.academicYear),
}));

export type SyllabusProgress = typeof syllabusProgress.$inferSelect;
export type NewSyllabusProgress = typeof syllabusProgress.$inferInsert;

// ============================================================================
// RELATIONS
// ============================================================================

export const lessonPlansRelations = relations(lessonPlans, ({ one }) => ({
  teacher: one(users, {
    fields: [lessonPlans.teacherId],
    references: [users.id],
  }),
  class: one(classes, {
    fields: [lessonPlans.classId],
    references: [classes.id],
  }),
}));

export const syllabusProgressRelations = relations(syllabusProgress, ({ one }) => ({
  teacher: one(users, {
    fields: [syllabusProgress.teacherId],
    references: [users.id],
  }),
  class: one(classes, {
    fields: [syllabusProgress.classId],
    references: [classes.id],
  }),
}));
