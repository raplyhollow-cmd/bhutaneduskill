/**
 * SCHOOL ADMIN SERVER ACTIONS
 *
 * Server actions for school-admin portal.
 * These are wrapped versions of the data fetching utilities for use in client components.
 */

"use server";

import {
  getCurrentSchoolId,
  getDashboardStats,
  getStudents,
  getTeachers,
  getClasses,
  getSubjects,
  getAttendanceRecords,
  getHomeworkList,
  getExamResults,
  getFeeData,
  getCounselors,
  getTuitionCourses,
  getAnalytics,
  type DashboardStats,
  type StudentData,
  type TeacherData,
  type ClassData,
  type SubjectData,
  type AttendanceRecord,
  type HomeworkData,
  type ExamResultData,
  type FeeStructureData,
  type StudentFeeData,
  type PaymentData,
  type FeeSummaryData,
  type CounselorData,
  type TuitionCourseData,
  type AnalyticsData,
} from "@/lib/api/school-admin";
import { cache } from "react";

// Cache the school ID lookup
const getCachedSchoolId = cache(async () => {
  return await getCurrentSchoolId();
});

/**
 * DASHBOARD ACTIONS
 */
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const schoolId = await getCachedSchoolId();
  return getDashboardStats(schoolId);
}

/**
 * STUDENTS ACTIONS
 */
export async function fetchStudents(options: {
  search?: string;
  grade?: string;
  section?: string;
  status?: string;
  feeStatus?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const schoolId = await getCachedSchoolId();
  return getStudents(schoolId, options);
}

export async function fetchStudentById(id: string) {
  const schoolId = await getCachedSchoolId();
  // Implement student detail fetch
  return null;
}

/**
 * TEACHERS ACTIONS
 */
export async function fetchTeachers(options: {
  search?: string;
  subject?: string;
  status?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const schoolId = await getCachedSchoolId();
  return getTeachers(schoolId, options);
}

/**
 * CLASSES ACTIONS
 */
export async function fetchClasses(options: {
  search?: string;
  grade?: string;
  section?: string;
  status?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const schoolId = await getCachedSchoolId();
  return getClasses(schoolId, options);
}

/**
 * SUBJECTS ACTIONS
 */
export async function fetchSubjects(options: {
  search?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const schoolId = await getCachedSchoolId();
  return getSubjects(schoolId, options);
}

/**
 * ATTENDANCE ACTIONS
 */
export async function fetchAttendanceRecords(options: {
  date?: string;
  classId?: string;
  status?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const schoolId = await getCachedSchoolId();
  return getAttendanceRecords(schoolId, options);
}

/**
 * Mark Attendance
 *
 * Save attendance records for a class on a specific date.
 * Returns success status and any error message.
 */
export async function markAttendance(data: {
  classId: string;
  date: string;
  attendance: Array<{
    studentId: string;
    status: "present" | "absent" | "late" | "excused" | "sick_leave";
    checkInTime?: string;
    checkOutTime?: string;
    notes?: string;
  }>;
  entryMethod: "manual" | "fingerprint" | "csv_import" | "app_check_in";
}) {
  const schoolId = await getCachedSchoolId();

  if (!schoolId) {
    return { success: false, error: "School not found" };
  }

  try {
    const { db } = await import("@/lib/db");
    const { attendance: attendanceTable } = await import("@/lib/db/schema");
    const { eq, and } = await import("drizzle-orm");

    // Get current user ID (who is marking attendance)
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();

    // First, delete any existing attendance for this class and date
    await db
      .delete(attendanceTable)
      .where(
        and(
          eq(attendanceTable.schoolId, schoolId),
          eq(attendanceTable.classId, data.classId),
          eq(attendanceTable.date, data.date)
        )
      );

    // Insert new attendance records
    const recordsToInsert = data.attendance.map((record) => ({
      id: `ATT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      schoolId,
      classId: data.classId,
      studentId: record.studentId,
      date: data.date,
      status: record.status,
      entryMethod: data.entryMethod,
      enteredBy: userId || null,
      checkInTime: record.checkInTime || null,
      checkOutTime: record.checkOutTime || null,
      notes: record.notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await db.insert(attendanceTable).values(recordsToInsert);

    return { success: true, count: recordsToInsert.length };
  } catch (error) {
    console.error("Failed to mark attendance:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save attendance",
    };
  }
}

/**
 * HOMEWORK ACTIONS
 */
export async function fetchHomework(options: {
  search?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const schoolId = await getCachedSchoolId();
  return getHomeworkList(schoolId, options);
}

/**
 * RESULTS ACTIONS
 */
export async function fetchExamResults(options: {
  search?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const schoolId = await getCachedSchoolId();
  return getExamResults(schoolId, options);
}

/**
 * FEES ACTIONS
 */
export async function fetchFeeData() {
  const schoolId = await getCachedSchoolId();
  return getFeeData(schoolId);
}

/**
 * COUNSELORS ACTIONS
 */
export async function fetchCounselors(options: {
  search?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const schoolId = await getCachedSchoolId();
  return getCounselors(schoolId, options);
}

/**
 * TUITION ACTIONS
 */
export async function fetchTuitionCourses(options: {
  search?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const schoolId = await getCachedSchoolId();
  return getTuitionCourses(schoolId, options);
}

/**
 * ANALYTICS ACTIONS
 */
export async function fetchAnalytics(): Promise<AnalyticsData> {
  const schoolId = await getCachedSchoolId();
  return getAnalytics(schoolId);
}