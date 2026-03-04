/**
 * DATABASE INDEXES
 *
 * Query optimization indexes for common queries
 */

import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

/**
 * Create indexes for better query performance
 * Run these migrations to optimize common queries
 */

export const INDEXES = [
  // User table indexes
  "CREATE INDEX IF NOT EXISTS idx_users_type ON users(type)",
  "CREATE INDEX IF NOT EXISTS idx_users_school ON users(school_id)",
  "CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = true",
  "CREATE INDEX IF NOT EXISTS idx_users_portal ON users(portal)",
  "CREATE INDEX IF NOT EXISTS idx_users_class ON users(class_id)",

  // Assessment result indexes
  "CREATE INDEX IF NOT EXISTS idx_assessment_results_user ON assessment_results(user_id)",
  "CREATE INDEX IF NOT EXISTS idx_assessment_results_type ON assessment_results(assessment_type)",
  "CREATE INDEX IF NOT EXISTS idx_assessment_results_date ON assessment_results(completed_at)",

  // Enrollment indexes
  "CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id)",
  "CREATE INDEX IF NOT EXISTS idx_enrollments_class ON enrollments(class_id)",
  "CREATE INDEX IF NOT EXISTS idx_enrollments_teacher ON enrollments(teacher_id)",

  // Homework indexes
  "CREATE INDEX IF NOT EXISTS idx_homework_class ON homework(class_id)",
  "CREATE INDEX IF NOT EXISTS idx_homework_due ON homework(due_date)",
  "CREATE INDEX IF NOT EXISTS idx_homework_teacher ON homework(teacher_id)",

  // Submission indexes
  "CREATE INDEX IF NOT EXISTS idx_submissions_homework ON submissions(homework_id)",
  "CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id)",
  "CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status)",

  // Attendance indexes
  "CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id)",
  "CREATE INDEX IF NOT EXISTS idx_attendance_class ON attendance(class_id)",
  "CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date)",

  // Grade indexes
  "CREATE INDEX IF NOT EXISTS idx_grades_student ON grades(student_id)",
  "CREATE INDEX IF NOT EXISTS idx_grades_subject ON grades(subject_id)",
  "CREATE INDEX IF NOT EXISTS idx_grades_exam ON grades(exam_id)",

  // Notification indexes
  "CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)",
  "CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read) WHERE is_read = false",
  "CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at)",

  // Career match indexes
  "CREATE INDEX IF NOT EXISTS idx_career_matches_user ON career_matches(user_id)",
  "CREATE INDEX IF NOT EXISTS idx_career_matches_score ON career_matches(match_score)",

  // Roadmap indexes
  "CREATE INDEX IF NOT EXISTS idx_roadmaps_user ON student_roadmaps(user_id)",
  "CREATE INDEX IF NOT EXISTS idx_roadmaps_status ON student_roadmaps(status)",

  // Insight indexes
  "CREATE INDEX IF NOT EXISTS idx_insights_user ON user_insights(user_id)",
  "CREATE INDEX IF NOT EXISTS idx_insights_type ON user_insights(insight_type)",
  "CREATE INDEX IF NOT EXISTS idx_insights_read ON user_insights(is_read) WHERE is_read = false",

  // School indexes
  "CREATE INDEX IF NOT EXISTS idx_schools_active ON schools(is_active) WHERE is_active = true",
  "CREATE INDEX IF NOT EXISTS idx_schools_type ON schools(school_type)",

  // Class indexes
  "CREATE INDEX IF NOT EXISTS idx_classes_school ON classes(school_id)",
  "CREATE INDEX IF NOT EXISTS idx_classes_grade ON classes(grade)",
] as const;

/**
 * Create all indexes
 * Note: Neon HTTP database doesn't support db.run() - use direct SQL execution
 */
export async function createIndexes() {
  const results: { index: string; success: boolean; error?: string }[] = [];

  for (const indexSql of INDEXES) {
    try {
      // Neon HTTP doesn't support db.run() - execute via session
      await db.execute(sql.raw(indexSql));
      results.push({ index: indexSql, success: true });
    } catch (error) {
      results.push({
        index: indexSql,
        success: false,
        error: String(error),
      });
    }
  }

  return results;
}

/**
 * Check if indexes exist
 * Note: Neon PostgreSQL uses pg_indexes, not sqlite_master
 */
export async function checkIndexes() {
  // Neon HTTP doesn't support db.all() - use db.select
  const indexes = await db.execute(sql.raw(`
    SELECT name, tablename
    FROM pg_indexes
    WHERE name LIKE 'idx_%'
    ORDER BY name
  `));
  return indexes;
}
