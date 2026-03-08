"use server";
import { logger } from "@/lib/logger";

/**
 * TEACHER SERVER ACTIONS
 *
 * Server actions for teacher portal.
 * These are wrapped versions of the data fetching utilities for use in client components.
 */


import {
  getCurrentTeacherId,
  getTeacherEarnings,
  filterTransactions,
  type EarningsData,
  type TransactionData,
  type CourseStatsData,
} from "@/lib/api/teacher";
import { cache } from "react";

// Cache the teacher ID lookup
const getCachedTeacherId = cache(async () => {
  return await getCurrentTeacherId();
});

/**
 * EARNINGS ACTIONS
 */
export async function fetchTeacherEarnings(options: {
  timePeriod?: "all" | "month" | "quarter" | "year";
  status?: "all" | "completed" | "pending" | "processing";
} = {}) {
  const tutorId = await getCachedTeacherId();
  const { timePeriod = "all", status = "all" } = options;

  const { earningsData, transactions, courseStats } = await getTeacherEarnings(tutorId);

  // Filter transactions based on options
  const filteredTransactions = filterTransactions(transactions, timePeriod, status);

  return {
    earningsData,
    transactions: filteredTransactions,
    courseStats,
    allTransactions: transactions, // Return all for client-side filtering
  };
}

/**
 * REQUEST PAYOUT ACTION
 *
 * Request a payout for pending earnings.
 */
export async function requestPayout() {
  const tutorId = await getCachedTeacherId();

  if (!tutorId) {
    return { success: false, error: "Teacher not found" };
  }

  try {
    const { db } = await import("@/lib/db");
    const { tutorEarnings } = await import("@/lib/db/schema");
    const { eq, and } = await import("drizzle-orm");

    // Get all pending earnings
    const pendingEarnings = await db
      .select()
      .from(tutorEarnings)
      .where(and(
        eq(tutorEarnings.tutorId, tutorId),
        eq(tutorEarnings.payoutStatus, "pending")
      ));

    if (pendingEarnings.length === 0) {
      return { success: false, error: "No pending earnings to payout" };
    }

    // Calculate total
    const totalAmount = pendingEarnings.reduce((sum, e) => sum + (e.netAmount || 0), 0);

    // Update all pending earnings to processing
    for (const earning of pendingEarnings) {
      await db
        .update(tutorEarnings)
        .set({
          payoutStatus: "processing",
        })
        .where(eq(tutorEarnings.id, earning.id));
    }

    return {
      success: true,
      amount: totalAmount,
      count: pendingEarnings.length,
      message: `Payout request for Nu. ${totalAmount.toLocaleString()} has been submitted.`,
    };
  } catch (error) {
    logger.error("Failed to request payout:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to request payout",
    };
  }
}

// ============================================================================
// DASHBOARD ACTIONS
// ============================================================================

/**
 * Get current authenticated user data (not tutor-specific)
 */
async function getCurrentAuthUser() {
  try {
    const { requireAuth } = await import("@/lib/auth-utils");
    const authResult = await requireAuth(['teacher']);
    if ('error' in authResult) {
      return null;
    }
    const { userId, user } = authResult;
    return { id: userId, schoolId: user?.schoolId || null, user };
  } catch (error) {
    logger.error("Failed to get current auth user", error);
    return null;
  }
}

export interface TeacherStats {
  totalStudents: number;
  activeClasses: number;
  pendingAssessments: number;
  completedThisWeek: number;
  aiInteractions: number;
}

export interface TeacherClassData {
  id: string;
  name: string;
  grade: number;
  section: string;
  students: number;
  assessmentCompletion: number;
  nextClass: string;
}

export interface TeacherActivityData {
  id: number;
  type: "assessment_completed" | "assessment_started" | "career_explored";
  student: string;
  class: string;
  time: string;
  result: string;
}

export interface TeacherNeedsAttention {
  id: number;
  student: string;
  class: string;
  reason: string;
  daysSinceLogin: number;
}

export interface TeacherDashboardData {
  stats: TeacherStats;
  classes: TeacherClassData[];
  recentActivity: TeacherActivityData[];
  needsAttention: TeacherNeedsAttention[];
}

/**
 * Fetch teacher dashboard data
 */
export async function fetchTeacherDashboard(): Promise<TeacherDashboardData> {
  const authData = await getCurrentAuthUser();
  if (!authData) {
    return {
      stats: {
        totalStudents: 0,
        activeClasses: 0,
        pendingAssessments: 0,
        completedThisWeek: 0,
        aiInteractions: 0,
      },
      classes: [],
      recentActivity: [],
      needsAttention: [],
    };
  }

  const { id: teacherId, schoolId } = authData;

  try {
    const { db } = await import("@/lib/db");
    const { users, classes: classesTable, enrollments, assessments } = await import("@/lib/db/schema");
    const { eq, and, count, desc, gte, inArray } = await import("drizzle-orm");

    // Get classes where this teacher is the class teacher
    const teacherClasses = await db
      .select()
      .from(classesTable)
      .where(eq(classesTable.classTeacherId, teacherId))
      .limit(20);

    const classIds = teacherClasses.map((c) => c.id);

    // Get students count from enrollments
    let totalStudents = 0;
    if (classIds.length > 0) {
      const [studentCount] = await db
        .select({ count: count() })
        .from(enrollments)
        .where(inArray(enrollments.classId, classIds));
      totalStudents = studentCount?.count || 0;
    }

    // Get assessment stats
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    let completedThisWeek = 0;
    let pendingAssessments = 0;

    if (schoolId && classIds.length > 0) {
      const classAssessments = await db
        .select()
        .from(assessments)
        .where(
          and(
            gte(assessments.dueDate, weekAgo.toISOString()),
            inArray(assessments.classId, classIds)
          )
        );

      completedThisWeek = classAssessments.filter((a) => a.completedAt).length;
      pendingAssessments = classAssessments.filter((a) => !a.completedAt).length;
    }

    // Build classes data with student counts
    const classes: TeacherClassData[] = await Promise.all(
      teacherClasses.map(async (cls) => {
        const [enrollmentCount] = await db
          .select({ count: count() })
          .from(enrollments)
          .where(eq(enrollments.classId, cls.id));

        const studentCount = enrollmentCount?.count || 0;

        return {
          id: cls.id,
          name: cls.name || `${cls.grade} ${cls.section || ""}`,
          grade: cls.grade || 0,
          section: cls.section || "",
          students: studentCount,
          assessmentCompletion: 0, // TODO: Calculate from assessments
          nextClass: "Tomorrow 10:00 AM", // TODO: Get from timetable
        };
      })
    );

    return {
      stats: {
        totalStudents,
        activeClasses: teacherClasses.length,
        pendingAssessments,
        completedThisWeek,
        aiInteractions: 0, // TODO: Track AI interactions
      },
      classes,
      recentActivity: [], // TODO: Populate from activity logs
      needsAttention: [], // TODO: Populate from student engagement data
    };
  } catch (error) {
    logger.error("Failed to fetch teacher dashboard", error);
    return {
      stats: {
        totalStudents: 0,
        activeClasses: 0,
        pendingAssessments: 0,
        completedThisWeek: 0,
        aiInteractions: 0,
      },
      classes: [],
      recentActivity: [],
      needsAttention: [],
    };
  }
}

// ============================================================================
// CLASSES ACTIONS
// ============================================================================

export interface TeacherClassDetail {
  id: string;
  name: string;
  grade: number;
  section: string;
  students: number;
  classTeacherId: string;
  academicYear: string;
  capacity: number | null;
}

/**
 * Fetch all classes for the current teacher
 */
export async function fetchTeacherClasses(): Promise<TeacherClassDetail[]> {
  const authData = await getCurrentAuthUser();
  if (!authData) {
    return [];
  }

  const { id: teacherId } = authData;

  try {
    const { db } = await import("@/lib/db");
    const { classes: classesTable, enrollments } = await import("@/lib/db/schema");
    const { eq, count } = await import("drizzle-orm");

    const classes = await db
      .select()
      .from(classesTable)
      .where(eq(classesTable.classTeacherId, teacherId))
      .limit(50);

    // Get student count for each class
    const classesWithCounts = await Promise.all(
      classes.map(async (cls) => {
        const [enrollmentCount] = await db
          .select({ count: count() })
          .from(enrollments)
          .where(eq(enrollments.classId, cls.id));

        return {
          id: cls.id,
          name: cls.name || `${cls.grade} ${cls.section || ""}`,
          grade: cls.grade || 0,
          section: cls.section || "",
          students: enrollmentCount?.count || 0,
          classTeacherId: cls.classTeacherId || "",
          academicYear: cls.academicYear || "",
          capacity: cls.capacity,
        };
      })
    );

    return classesWithCounts;
  } catch (error) {
    logger.error("Failed to fetch teacher classes", error);
    return [];
  }
}

// ============================================================================
// STUDENTS ACTIONS
// ============================================================================

export interface TeacherStudentData {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  grade: number | null;
  section: string | null;
  rollNumber: string | null;
  attendanceRate: number;
  careerInterests: string[];
}

/**
 * Fetch all students for the current teacher's classes
 */
export async function fetchTeacherStudents(): Promise<TeacherStudentData[]> {
  const authData = await getCurrentAuthUser();
  if (!authData) {
    return [];
  }

  const { id: teacherId } = authData;

  try {
    const { db } = await import("@/lib/db");
    const { users, classes: classesTable, enrollments: enrollmentsTable } = await import("@/lib/db/schema");
    const { eq, inArray } = await import("drizzle-orm");

    // Get teacher's classes
    const teacherClasses = await db
      .select({ id: classesTable.id })
      .from(classesTable)
      .where(eq(classesTable.classTeacherId, teacherId));

    const classIds = teacherClasses.map((c) => c.id);

    if (classIds.length === 0) {
      return [];
    }

    // Get enrollments for these classes
    const enrollments = await db
      .select({
        studentId: enrollmentsTable.studentId,
        classId: enrollmentsTable.classId,
      })
      .from(enrollmentsTable)
      .where(inArray(enrollmentsTable.classId, classIds));

    const studentIds = [...new Set(enrollments.map((e) => e.studentId))];

    if (studentIds.length === 0) {
      return [];
    }

    // Get student details
    const students = await db
      .select()
      .from(users)
      .where(inArray(users.id, studentIds));

    return students.map((student) => ({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email || "",
      grade: student.classGrade || null,
      section: student.section || null,
      rollNumber: student.rollNumber || null,
      attendanceRate: 0, // TODO: Calculate from attendance records
      careerInterests: [], // TODO: Get from assessment results
    }));
  } catch (error) {
    logger.error("Failed to fetch teacher students", error);
    return [];
  }
}
