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