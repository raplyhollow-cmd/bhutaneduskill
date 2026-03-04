-- Full Database Migration
-- Generated: 2026-03-04T04:27:14.079Z
-- Bhutan EduSkill Platform - Unified Architecture
--
-- This migration was auto-generated from feature definitions using the Unified Architecture.
--
-- To apply this migration:
--   bunx drizzle-kit push
--   OR
--   psql $DATABASE_URL -f drizzle/0001_unified_features.sql
--
-- NOTE: This migration creates NEW tables. For existing tables (users, classes, etc.),
-- use the existing schema. The migration generator supports both:
--   1. Full Unification - Features generate new tables
--   2. Hybrid Mode - Features reference existing tables (tableName property)

-- ============================================================================
-- ATTENDANCE FEATURE
-- ============================================================================

-- Migration: attendance
-- Generated: 2026-03-04T04:27:14.079Z

CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  studentId TEXT NOT NULL,
  classId TEXT NOT NULL,
  schoolId TEXT,
  date TEXT NOT NULL,
  checkInTime TEXT,
  status TEXT NOT NULL,
  recordedBy TEXT,
  notes TEXT,
  reason TEXT,
  entryMethod TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT attendance_studentId_fk FOREIGN KEY (studentId) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT attendance_classId_fk FOREIGN KEY (classId) REFERENCES classes (id) ON DELETE NO ACTION,
  CONSTRAINT attendance_schoolId_fk FOREIGN KEY (schoolId) REFERENCES schools (id) ON DELETE NO ACTION,
  CONSTRAINT attendance_recordedBy_fk FOREIGN KEY (recordedBy) REFERENCES users (id) ON DELETE SET NULL
);

-- Indexes for attendance
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance (date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance (status);
CREATE INDEX IF NOT EXISTS idx_attendance_studentId ON attendance (studentId);
CREATE INDEX IF NOT EXISTS idx_attendance_classId ON attendance (classId);
CREATE INDEX IF NOT EXISTS idx_attendance_schoolId ON attendance (schoolId);

COMMENT ON TABLE attendance IS 'Student attendance records with check-in/check-out tracking';

-- ============================================================================
-- NEW FEATURES (when using full unification mode)
-- ============================================================================

-- Example: Textbooks Feature (NEW table generated from feature definition)
-- CREATE TABLE IF NOT EXISTS textbooks (
--   id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
--   title TEXT NOT NULL,
--   isbn TEXT NOT NULL UNIQUE,
--   subjectId TEXT NOT NULL,
--   classId TEXT,
--   grade INTEGER,
--   publisher TEXT,
--   publicationYear INTEGER,
--   quantity INTEGER DEFAULT 0,
--   chapters INTEGER DEFAULT 0,
--   description TEXT,
--   coverImageUrl TEXT,
--   isActive BOOLEAN DEFAULT TRUE,
--   created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
--   updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
--   CONSTRAINT textbooks_subjectId_fk FOREIGN KEY (subjectId) REFERENCES subjects (id) ON DELETE RESTRICT,
--   CONSTRAINT textbooks_classId_fk FOREIGN KEY (classId) REFERENCES classes (id) ON DELETE SET NULL
-- );
--
-- CREATE INDEX IF NOT EXISTS idx_textbooks_subject_grade ON textbooks (subjectId, grade);
-- CREATE INDEX IF NOT EXISTS idx_textbooks_isbn_unique ON textbooks (isbn);
--
-- COMMENT ON TABLE textbooks IS 'School textbooks inventory';
