/**
 * STUDENT SERVER ACTIONS
 *
 * Server actions for student portal.
 * These are wrapped versions of the data fetching utilities for use in client components.
 */

"use server";

import {
  getCurrentStudentId,
  getStudentDashboardData,
  getStudentProgressData,
  getStudentHomework,
  getStudentTuitionCourses,
  type StudentDashboardData,
  type StudentProgressData,
  type StudentHomeworkItem,
  type StudentTuitionCourse,
} from "@/lib/api/student";
import { cache } from "react";

// Cache the student ID lookup
const getCachedStudentId = cache(async () => {
  return await getCurrentStudentId();
});

/**
 * DASHBOARD ACTIONS
 */
export async function fetchStudentDashboard(): Promise<StudentDashboardData> {
  const studentId = await getCachedStudentId();
  if (!studentId) {
    throw new Error("Student not found or not authenticated");
  }
  return getStudentDashboardData();
}

/**
 * PROGRESS ACTIONS
 */
export async function fetchStudentProgress(): Promise<StudentProgressData> {
  const studentId = await getCachedStudentId();
  if (!studentId) {
    throw new Error("Student not found or not authenticated");
  }
  return getStudentProgressData();
}

/**
 * HOMEWORK ACTIONS
 */
export async function fetchStudentHomework(options: {
  status?: "all" | "pending" | "submitted" | "graded";
  limit?: number;
} = {}): Promise<StudentHomeworkItem[]> {
  const studentId = await getCachedStudentId();
  if (!studentId) {
    throw new Error("Student not found or not authenticated");
  }
  return getStudentHomework(options);
}

/**
 * TUITION ACTIONS
 */
export async function fetchStudentTuitionCourses(): Promise<StudentTuitionCourse[]> {
  const studentId = await getCachedStudentId();
  if (!studentId) {
    throw new Error("Student not found or not authenticated");
  }
  return getStudentTuitionCourses();
}

/**
 * Submit Homework
 *
 * Create or update a homework submission for the current student.
 */
export async function submitHomework(data: {
  homeworkId: string;
  answers: Record<string, any>;
  textAnswers?: Record<string, string>;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
}) {
  const authData = await getCachedStudentId();
  if (!authData) {
    return { success: false, error: "Student not found or not authenticated" };
  }

  const { id: studentId } = authData;

  try {
    const { db } = await import("@/lib/db");
    const { homeworkSubmissions: homeworkSubmissionsTable, homework: homeworkTable } = await import("@/lib/db/schema");
    const { eq, and } = await import("drizzle-orm");

    // Get homework details
    const homework = await db.query.homework.findFirst({
      where: eq(homeworkTable.id, data.homeworkId),
    });

    if (!homework) {
      return { success: false, error: "Homework not found" };
    }

    // Check if already submitted
    const existingSubmission = await db.query.homeworkSubmissions.findFirst({
      where: and(
        eq(homeworkSubmissionsTable.homeworkId, data.homeworkId),
        eq(homeworkSubmissionsTable.studentId, studentId)
      ),
    });

    const now = new Date();
    const dueDate = new Date(homework.dueDate);
    const isLate = now > dueDate;

    if (existingSubmission) {
      // Update existing submission
      await db
        .update(homeworkSubmissionsTable)
        .set({
          answers: data.answers as any,
          textAnswers: data.textAnswers as any,
          attachments: data.attachments as any,
          isLate: isLate ? 1 : 0,
          submittedAt: now,
          status: "submitted",
          updatedAt: now,
        })
        .where(eq(homeworkSubmissionsTable.id, existingSubmission.id));

      return { success: true, submissionId: existingSubmission.id };
    } else {
      // Create new submission
      const [newSubmission] = await db
        .insert(homeworkSubmissionsTable)
        .values({
          id: `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          homeworkId: data.homeworkId,
          studentId,
          answers: data.answers as any,
          textAnswers: data.textAnswers as any,
          attachments: data.attachments as any,
          isLate: isLate ? 1 : 0,
          submittedAt: now,
          status: "submitted",
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return { success: true, submissionId: newSubmission.id };
    }
  } catch (error) {
    console.error("Failed to submit homework:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to submit homework",
    };
  }
}

/**
 * Get Student Profile
 *
 * Fetch the current student's profile information.
 */
export async function fetchStudentProfile() {
  const authData = await getCachedStudentId();
  if (!authData) {
    return null;
  }

  const { id: studentId } = authData;

  try {
    const { db } = await import("@/lib/db");
    const { users } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    const student = await db.query.users.findFirst({
      where: eq(users.id, studentId),
      columns: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        profilePicture: true,
        dateOfBirth: true,
        classGrade: true,
        section: true,
        schoolId: true,
      },
    });

    if (!student) {
      return null;
    }

    return {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      name: `${student.firstName} ${student.lastName || ""}`.trim(),
      email: student.email,
      phone: student.phone,
      profilePicture: student.profilePicture,
      dateOfBirth: student.dateOfBirth,
      classGrade: student.classGrade,
      section: student.section,
      schoolId: student.schoolId,
    };
  } catch (error) {
    console.error("Failed to fetch student profile:", error);
    return null;
  }
}

/**
 * Update Student Profile
 *
 * Update the current student's profile information.
 */
export async function updateStudentProfile(data: {
  firstName?: string;
  lastName?: string;
  phone?: string;
  profilePicture?: string;
  dateOfBirth?: string;
}) {
  const authData = await getCachedStudentId();
  if (!authData) {
    return { success: false, error: "Student not found or not authenticated" };
  }

  const { id: studentId } = authData;

  try {
    const { db } = await import("@/lib/db");
    const { users } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    // Build update object with only provided fields
    const updateData: Record<string, any> = {};
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.profilePicture !== undefined) updateData.profilePicture = data.profilePicture;
    if (data.dateOfBirth !== undefined) updateData.dateOfBirth = data.dateOfBirth;

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, studentId));

    return { success: true };
  } catch (error) {
    console.error("Failed to update student profile:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update profile",
    };
  }
}

/**
 * Mark Attendance (Self Check-in)
 *
 * Allow students to check themselves in.
 */
export async function selfCheckIn(data: {
  classId: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}) {
  const authData = await getCachedStudentId();
  if (!authData) {
    return { success: false, error: "Student not found or not authenticated" };
  }

  const { id: studentId, schoolId } = authData;

  if (!schoolId) {
    return { success: false, error: "School not found" };
  }

  try {
    const { db } = await import("@/lib/db");
    const { attendance: attendanceTable } = await import("@/lib/db/schema");
    const { eq, and } = await import("drizzle-orm");

    const today = new Date().toISOString().split("T")[0];
    const now = new Date();
    const checkInTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    // Check if already checked in today
    const existing = await db.query.attendance.findFirst({
      where: and(
        eq(attendanceTable.studentId, studentId),
        eq(attendanceTable.classId, data.classId),
        eq(attendanceTable.date, today)
      ),
    });

    if (existing) {
      return { success: false, error: "Already checked in today" };
    }

    // Create attendance record
    await db.insert(attendanceTable).values({
      id: `ATT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      schoolId,
      classId: data.classId,
      studentId,
      date: today,
      status: "present",
      entryMethod: "app_check_in",
      checkInTime,
      checkInLocation: data.location as any,
      enteredBy: studentId,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, checkInTime };
  } catch (error) {
    console.error("Failed to check in:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to check in",
    };
  }
}

/**
 * Get Fee Status
 *
 * Fetch the current student's fee payment status.
 */
export async function fetchFeeStatus() {
  const authData = await getCachedStudentId();
  if (!authData) {
    return null;
  }

  const { id: studentId } = authData;

  try {
    const { db } = await import("@/lib/db");
    const { studentFees: studentFeesTable, feePayments } = await import("@/lib/db/schema");
    const { eq, desc } = await import("drizzle-orm");

    const feeData = await db.query.studentFees.findFirst({
      where: eq(studentFeesTable.studentId, studentId),
    });

    if (!feeData) {
      return null;
    }

    // Get recent payments
    const recentPayments = await db.query.feePayments.findMany({
      where: eq(feePayments.studentFeeId, feeData.id),
      orderBy: [desc(feePayments.collectedAt)],
      limit: 5,
    });

    return {
      id: feeData.id,
      totalAmount: feeData.totalAmount,
      amountPaid: feeData.amountPaid || 0,
      amountPending: feeData.amountPending || 0,
      amountWaived: feeData.amountWaived || 0,
      status: feeData.status,
      dueDate: feeData.dueDate,
      recentPayments: recentPayments.map(p => ({
        id: p.id,
        amount: p.amount,
        receiptNumber: p.receiptNumber,
        collectedAt: p.collectedAt,
      })),
    };
  } catch (error) {
    console.error("Failed to fetch fee status:", error);
    return null;
  }
}
