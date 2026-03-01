"use server";
import { logger } from "@/lib/logger";
import { parseJsonArray } from "@/lib/db/json-helpers";

/**
 * STUDENT SERVER ACTIONS
 *
 * Server actions for student portal.
 * These are wrapped versions of the data fetching utilities for use in client components.
 */


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

// CRITICAL FIX: Removed React cache() wrapper
// The cache() function with no arguments causes cross-user data leakage!
// React's cache() caches results based on function arguments.
// With no arguments, the result is cached globally across ALL requests.
// This caused Student B to see Student A's data.
// getCurrentStudentId() already calls requireAuth() which validates
// the session on each call, so caching here is both redundant AND harmful.

/**
 * DASHBOARD ACTIONS
 */
export async function fetchStudentDashboard(): Promise<StudentDashboardData> {
  // Call getStudentDashboardData directly - it handles auth internally
  return getStudentDashboardData();
}

/**
 * PROGRESS ACTIONS
 */
export async function fetchStudentProgress(): Promise<StudentProgressData> {
  // Call getStudentProgressData directly - it handles auth internally
  return getStudentProgressData();
}

/**
 * HOMEWORK ACTIONS
 */
export async function fetchStudentHomework(options: {
  status?: "all" | "pending" | "submitted" | "graded";
  limit?: number;
} = {}): Promise<StudentHomeworkItem[]> {
  // Call getStudentHomework directly - it handles auth internally
  return getStudentHomework(options);
}

/**
 * TUITION ACTIONS
 */
export async function fetchStudentTuitionCourses(): Promise<StudentTuitionCourse[]> {
  // Call getStudentTuitionCourses directly - it handles auth internally
  return getStudentTuitionCourses();
}

/**
 * Submit Homework
 *
 * Create or update a homework submission for the current student.
 */
export async function submitHomework(data: {
  homeworkId: string;
  answers: Record<string, unknown>;
  textAnswers?: Record<string, string>;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
}) {
  const authData = await getCurrentStudentId();
  if (!authData) {
    return { success: false, error: "Student not found or not authenticated" };
  }

  const { id: studentId } = authData;

  try {
    const { db } = await import("@/lib/db");
    const { homeworkSubmissions: homeworkSubmissionsTable, homework: homeworkTable } = await import("@/lib/db/schema");
    const { eq, and, sql } = await import("drizzle-orm");

    // Get homework details
    const [homework] = await db
      .select()
      .from(homeworkTable)
      .where(eq(homeworkTable.id, data.homeworkId))
      .limit(1);

    if (!homework[0]) {
      return { success: false, error: "Homework not found" };
    }

    // Check if already submitted
    const [existingSubmission] = await db
      .select()
      .from(homeworkSubmissionsTable)
      .where(and(
        eq(homeworkSubmissionsTable.homeworkId, data.homeworkId),
        eq(homeworkSubmissionsTable.studentId, studentId)
      ))
      .limit(1);

    const now = new Date();
    const dueDate = new Date(homework[0].dueDate);
    const isLate = now > dueDate;

    // Create content object - use unknown intermediate to satisfy type checker
    const contentObject = {
      answers: data.answers,
      textAnswers: data.textAnswers,
      attachments: data.attachments,
    };

    // Use unknown intermediate to satisfy type checker for JSON column
    const contentValue = contentObject as unknown as typeof homeworkSubmissionsTable.$inferInsert.content;

    if (existingSubmission) {
      // Update existing submission
      await db
        .update(homeworkSubmissionsTable)
        .set({
          content: contentValue,
          isLate: !!isLate,
          submittedAt: now,
          status: "submitted",
          updatedAt: now,
        })
        .where(eq(homeworkSubmissionsTable.id, existingSubmission[0].id));

      // Broadcast homework submission to teacher
      if (homework[0].classId) {
        const { broadcastHomeworkSubmitted } = await import("@/lib/notifications-broadcast");
        const { users } = await import("@/lib/db/schema");
        const [student] = await db
          .select({ firstName: users.firstName, lastName: users.lastName })
          .from(users)
          .where(eq(users.id, studentId))
          .limit(1);

        if (student[0]) {
          broadcastHomeworkSubmitted(homework[0].classId, {
            id: existingSubmission[0].id,
            homeworkId: data.homeworkId,
            homeworkTitle: homework[0].title || "Homework",
            studentId,
            studentName: `${student[0].firstName} ${student[0].lastName || ""}`.trim(),
            classId: homework[0].classId,
            submittedAt: now.toISOString(),
            isLate,
          }).catch((err) => {
            // Don't fail the submission if broadcast fails
            logger.error("Failed to broadcast homework submission", { error: err });
          });
        }
      }

      return { success: true, submissionId: existingSubmission[0].id };
    } else {
      // Create new submission
      const [newSubmission] = await db
        .insert(homeworkSubmissionsTable)
        .values({
          id: `SUB-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          homeworkId: data.homeworkId,
          studentId,
          content: contentValue,
          isLate: !!isLate,
          submittedAt: now,
          status: "submitted",
          // Required fields with default values for new submissions
          gradedAt: now, // Will be updated when graded
          score: 0, // Will be updated when graded
          feedback: "", // Will be updated when graded
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      // Broadcast homework submission to teacher
      if (homework[0].classId) {
        const { broadcastHomeworkSubmitted } = await import("@/lib/notifications-broadcast");
        const { users } = await import("@/lib/db/schema");
        const [student] = await db
          .select({ firstName: users.firstName, lastName: users.lastName })
          .from(users)
          .where(eq(users.id, studentId))
          .limit(1);

        if (student[0]) {
          broadcastHomeworkSubmitted(homework[0].classId, {
            id: newSubmission.id,
            homeworkId: data.homeworkId,
            homeworkTitle: homework[0].title || "Homework",
            studentId,
            studentName: `${student[0].firstName} ${student[0].lastName || ""}`.trim(),
            classId: homework[0].classId,
            submittedAt: now.toISOString(),
            isLate,
          }).catch((err) => {
            // Don't fail the submission if broadcast fails
            logger.error("Failed to broadcast homework submission", { error: err });
          });
        }
      }

      return { success: true, submissionId: newSubmission.id };
    }
  } catch (error) {
    logger.error("Failed to submit homework:", error);
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
  const authData = await getCurrentStudentId();
  if (!authData) {
    return null;
  }

  const { id: studentId } = authData;

  try {
    const { db } = await import("@/lib/db");
    const { users } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    const [student] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users)
      .where(eq(users.id, studentId))
      .limit(1);

    if (!student) {
      return null;
    }

    return {
      id: student[0].id,
      firstName: student[0].firstName,
      lastName: student[0].lastName,
      name: `${student[0].firstName} ${student[0].lastName || ""}`.trim(),
      email: student[0].email,
      phone: student[0].phone,
      profilePicture: student[0].profilePicture,
      dateOfBirth: student[0].dateOfBirth,
      classGrade: student[0].classGrade,
      section: student[0].section,
      schoolId: student[0].schoolId,
    };
  } catch (error) {
    logger.error("Failed to fetch student profile:", error);
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
  const authData = await getCurrentStudentId();
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
    logger.error("Failed to update student profile:", error);
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
  const authData = await getCurrentStudentId();
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
    const { eq, and, sql } = await import("drizzle-orm");

    const today = new Date().toISOString().split("T")[0];
    const now = new Date();
    const checkInTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    // Check if already checked in today
    const [existing] = await db
      .select()
      .from(attendanceTable)
      .where(and(
        eq(attendanceTable.studentId, studentId),
        eq(attendanceTable.classId, data.classId),
        eq(attendanceTable.date, today)
      ))
      .limit(1);

    if (existing) {
      return { success: false, error: "Already checked in today" };
    }

    // Create attendance record
    await db.insert(attendanceTable).values({
      id: `ATT-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      schoolId,
      classId: data.classId,
      studentId,
      date: today,
      status: "present",
      entryMethod: "app_check_in",
      checkInTime,
      recordedBy: studentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Broadcast attendance update for live dashboard refresh
    const { broadcastAttendanceUpdated } = await import("@/lib/notifications-broadcast");
    const { users } = await import("@/lib/db/schema");
    const [student] = await db
      .select({ firstName: users.firstName, lastName: users.lastName })
      .from(users)
      .where(eq(users.id, studentId))
      .limit(1);

    if (student[0] && schoolId) {
      broadcastAttendanceUpdated(schoolId, {
        studentId,
        studentName: `${student[0].firstName} ${student[0].lastName || ""}`.trim(),
        classId: data.classId,
        date: today,
        status: "present",
        checkInTime,
        recordedBy: studentId,
      }).catch((err) => {
        // Don't fail the check-in if broadcast fails
        logger.error("Failed to broadcast attendance update", { error: err });
      });
    }

    return { success: true, checkInTime };
  } catch (error) {
    logger.error("Failed to check in:", error);
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
  const authData = await getCurrentStudentId();
  if (!authData) {
    return null;
  }

  const { id: studentId } = authData;

  try {
    const { db } = await import("@/lib/db");
    const { studentFees: studentFeesTable, feePayments } = await import("@/lib/db/schema");
    const { eq, desc } = await import("drizzle-orm");

    const [feeData] = await db
      .select()
      .from(studentFeesTable)
      .where(eq(studentFeesTable.studentId, studentId))
      .limit(1);

    if (!feeData) {
      return null;
    }

    // Get recent payments
    const recentPayments = await db
      .select()
      .from(feePayments)
      .where(eq(feePayments.studentFeeId, feeData[0].id))
      .orderBy(desc(feePayments.paidAt));

    return {
      id: feeData[0].id,
      totalAmount: feeData[0].totalAmount,
      amountPaid: feeData[0].amountPaid || 0,
      amountPending: feeData[0].amountPending || 0,
      amountWaived: feeData[0].amountWaived || 0,
      status: feeData[0].status,
      dueDate: feeData[0].dueDate,
      recentPayments: recentPayments.map(p => ({
        id: p.id,
        receiptNumber: p.receiptNumber,
        feeName: "School Fees",
        amount: p.amount,
        method: p.paymentMethod || "other",
        date: p.collectedAt instanceof Date ? p.collectedAt.toISOString() : p.collectedAt,
      })),
    };
  } catch (error) {
    logger.error("Failed to fetch fee status:", error);
    return null;
  }
}

// ============================================================================
// ANNOUNCEMENTS ACTIONS
// ============================================================================

export type StudentAnnouncementData = {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  priority: string | null;
  category: string | null;
  isPinned: boolean;
  authorName: string;
  createdAt: Date;
  attachments: Array<{ name: string; url: string; type: string; size: number }> | null;
  // Additional fields for AnnouncementCard compatibility
  targetAudience: string | null;
  targetGradeLevel: string | null;
  targetClassIds: string[] | null;
  isPublished: boolean | null;
  isArchived: boolean | null;
  publishDate: string | null;
  expiryDate: string | null;
  viewCount: number | null;
  authorId: string;
  authorRole: string | null;
  updatedAt: Date;
  publishedAt: Date | null;
};

/**
 * Fetch announcements relevant to the current student
 */
export async function fetchStudentAnnouncements(): Promise<{
  announcements: StudentAnnouncementData[];
  pinned: StudentAnnouncementData[];
}> {
  const authData = await getCurrentStudentId();
  if (!authData) {
    return { announcements: [], pinned: [] };
  }

  const { id: studentId, schoolId, classGrade } = authData;

  if (!schoolId) {
    return { announcements: [], pinned: [] };
  }

  try {
    const { db } = await import("@/lib/db");
    const { announcements: announcementsTable } = await import("@/lib/db/schema");
    const { eq, and, or, desc, sql } = await import("drizzle-orm");

    const now = new Date().toISOString();

    // Build conditions for student-visible announcements:
    // 1. Published
    // 2. Not expired
    // 3. Targeted to: "all", "students", or this specific user/grade
    const conditions = [
      eq(announcementsTable.schoolId, schoolId),
      eq(announcementsTable.isPublished, true),
      eq(announcementsTable.isArchived, false),
      or(
        sql`${announcementsTable.expiryDate} IS NULL`,
        sql`${announcementsTable.expiryDate} > ${now}`
      ),
      or(
        eq(announcementsTable.targetAudience, "all"),
        eq(announcementsTable.targetAudience, "students"),
        // Could add specific user targeting here
      ),
    ];

    // Filter by grade level if specified
    if (classGrade) {
      conditions.push(
        or(
          sql`${announcementsTable.targetGradeLevel} IS NULL`,
          eq(announcementsTable.targetGradeLevel, String(classGrade))
        )
      );
    }

    const allAnnouncements = await db
      .select()
      .from(announcementsTable)
      .where(and(...conditions))
      .orderBy(desc(announcementsTable.isPinned), desc(announcementsTable.createdAt));

    // Helper function to transform announcement data
    const transformAnnouncement = (a: typeof allAnnouncements[0]): StudentAnnouncementData => {
      // Transform attachments to include size field (default to 0 if not present)
      const attachments = a.attachments
        ? (a.attachments as Array<{ name: string; url: string; type: string; size?: number }>).map(att => ({
            ...att,
            size: att.size ?? 0,
          }))
        : null;

      return {
        id: a.id,
        title: a.title,
        content: a.content,
        excerpt: a.excerpt,
        priority: a.priority,
        category: a.category,
        isPinned: a.isPinned === true,
        authorName: a.authorName,
        createdAt: a.createdAt,
        attachments,
        targetAudience: a.targetAudience,
        targetGradeLevel: a.targetGradeLevel,
        targetClassIds: parseJsonArray<string>(a.targetClassIds) as string[] | null,
        isPublished: a.isPublished,
        isArchived: a.isArchived,
        publishDate: a.publishDate,
        expiryDate: a.expiryDate,
        viewCount: a.viewCount,
        authorId: a.authorId,
        authorRole: a.authorRole,
        updatedAt: a.updatedAt,
        publishedAt: a.publishedAt,
      };
    };

    // Separate pinned and regular
    const pinned = allAnnouncements
      .filter((a) => a.isPinned === true)
      .map(transformAnnouncement);

    const regular = allAnnouncements
      .filter((a) => a.isPinned !== true)
      .map(transformAnnouncement);

    return {
      announcements: regular,
      pinned,
    };
  } catch (error) {
    logger.error("Failed to fetch announcements:", error);
    return { announcements: [], pinned: [] };
  }
}

/**
 * Mark announcement as read
 */
export async function markAnnouncementAsRead(announcementId: string) {
  const authData = await getCurrentStudentId();
  if (!authData) {
    return { success: false, error: "Student not found" };
  }

  const { id: studentId } = authData;

  try {
    const { db } = await import("@/lib/db");
    const { announcementReads } = await import("@/lib/db/schema");
    const { eq, and, sql } = await import("drizzle-orm");

    // Check if already read
    const [existing] = await db
      .select()
      .from(announcementReads)
      .where(and(
        eq(announcementReads.announcementId, announcementId),
        eq(announcementReads.userId, studentId)
      ))
      .limit(1);

    if (!existing[0]) {
      await db.insert(announcementReads).values({
        id: `ar_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        announcementId,
        userId: studentId,
        readAt: new Date(),
      });

      // Increment view count
      const { announcements: announcementsTable } = await import("@/lib/db/schema");
      await db
        .update(announcementsTable)
        .set({
          viewCount: sql`${announcementsTable.viewCount} + 1`,
        })
        .where(eq(announcementsTable.id, announcementId));
    }

    return { success: true };
  } catch (error) {
    logger.error("Failed to mark announcement as read:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to mark as read",
    };
  }
}
