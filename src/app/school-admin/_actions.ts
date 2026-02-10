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

// ============================================================================
// ANNOUNCEMENTS ACTIONS
// ============================================================================

export type AnnouncementData = {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  targetAudience: string;
  targetGradeLevel: string | null;
  targetClassIds: string[] | null;
  priority: string;
  category: string | null;
  isPublished: boolean;
  isPinned: boolean;
  isArchived: boolean;
  publishDate: string | null;
  expiryDate: string | null;
  viewCount: number;
  authorId: string;
  authorName: string;
  authorRole: string | null;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
};

/**
 * Fetch announcements for the current school
 */
export async function fetchAnnouncements(options: {
  search?: string;
  isPublished?: boolean;
  isArchived?: boolean;
  priority?: string;
  category?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<{ announcements: AnnouncementData[]; total: number }> {
  const schoolId = await getCachedSchoolId();

  if (!schoolId) {
    return { announcements: [], total: 0 };
  }

  try {
    const { db } = await import("@/lib/db");
    const { announcements: announcementsTable } = await import("@/lib/db/schema");
    const { eq, and, desc, or, like, count, sql } = await import("drizzle-orm");

    // Build conditions
    const conditions = [eq(announcementsTable.schoolId, schoolId)];

    if (options.isPublished !== undefined) {
      conditions.push(eq(announcementsTable.isPublished, !!options.isPublished));
    }

    if (options.isArchived !== undefined) {
      conditions.push(eq(announcementsTable.isArchived, !!options.isArchived));
    } else {
      // By default, exclude archived unless explicitly requested
      conditions.push(eq(announcementsTable.isArchived, false));
    }

    if (options.priority) {
      conditions.push(eq(announcementsTable.priority, options.priority));
    }

    if (options.category) {
      conditions.push(eq(announcementsTable.category, options.category));
    }

    if (options.search) {
      conditions.push(
        or(
          like(announcementsTable.title, `%${options.search}%`),
          like(announcementsTable.content, `%${options.search}%`)
        )
      );
    }

    // Get total count
    const [{ value: total }] = await db
      .select({ value: count() })
      .from(announcementsTable)
      .where(and(...conditions));

    // Fetch announcements
    const results = await db
      .select()
      .from(announcementsTable)
      .where(and(...conditions))
      .orderBy(desc(announcementsTable.isPinned), desc(announcementsTable.createdAt))
      .limit(options.limit || 50)
      .offset(options.offset || 0);

    return {
      announcements: results as AnnouncementData[],
      total: total as number,
    };
  } catch (error) {
    console.error("Failed to fetch announcements:", error);
    return { announcements: [], total: 0 };
  }
}

/**
 * Get a single announcement by ID
 */
export async function fetchAnnouncementById(id: string): Promise<AnnouncementData | null> {
  const schoolId = await getCachedSchoolId();

  if (!schoolId) {
    return null;
  }

  try {
    const { db } = await import("@/lib/db");
    const { announcements: announcementsTable } = await import("@/lib/db/schema");
    const { eq, and } = await import("drizzle-orm");

    const [announcement] = await db
      .select()
      .from(announcementsTable)
      .where(and(eq(announcementsTable.id, id), eq(announcementsTable.schoolId, schoolId)))
      .limit(1);

    return (announcement as AnnouncementData) || null;
  } catch (error) {
    console.error("Failed to fetch announcement:", error);
    return null;
  }
}

/**
 * Create a new announcement
 */
export async function createAnnouncement(data: {
  title: string;
  content: string;
  excerpt?: string;
  targetAudience: "all" | "students" | "teachers" | "parents" | "staff" | "counselor";
  targetGradeLevel?: string;
  targetClassIds?: string[];
  targetUserIds?: string[];
  priority?: "low" | "normal" | "high" | "urgent";
  category?: string;
  publishDate?: string;
  expiryDate?: string;
  isPublished?: boolean;
  isPinned?: boolean;
  attachments?: Array<{ name: string; url: string; type: string; size: number }>;
}) {
  const schoolId = await getCachedSchoolId();

  if (!schoolId) {
    return { success: false, error: "School not found" };
  }

  try {
    const { db } = await import("@/lib/db");
    const { announcements: announcementsTable } = await import("@/lib/db/schema");
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Get user info for author fields
    const { users } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    const [user] = await db
      .select({ firstName: users.firstName, lastName: users.lastName, role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const authorName = user ? `${user.firstName} ${user.lastName || ""}`.trim() : "Admin";
    const authorRole = user?.role || "school_admin";

    const now = new Date();
    const publishedAt = data.isPublished ? now : null;

    const [announcement] = await db
      .insert(announcementsTable)
      .values({
        id: `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        schoolId,
        tenantId: "", // Will be set by trigger or default
        authorId: userId,
        authorName,
        authorRole,
        title: data.title,
        content: data.content,
        excerpt: data.excerpt || null,
        targetAudience: data.targetAudience,
        targetGradeLevel: data.targetGradeLevel || null,
        targetClassIds: data.targetClassIds || null,
        targetUserIds: data.targetUserIds || null,
        priority: data.priority || "normal",
        category: data.category || "general",
        isPublished: !!data.isPublished,
        isPinned: !!data.isPinned,
        isArchived: false,
        attachments: data.attachments || null,
        publishDate: data.publishDate || null,
        expiryDate: data.expiryDate || null,
        viewCount: 0,
        createdAt: now,
        updatedAt: now,
        publishedAt,
      })
      .returning();

    return { success: true, announcement };
  } catch (error) {
    console.error("Failed to create announcement:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create announcement",
    };
  }
}

/**
 * Update an existing announcement
 */
export async function updateAnnouncement(
  id: string,
  data: {
    title?: string;
    content?: string;
    excerpt?: string;
    targetAudience?: "all" | "students" | "teachers" | "parents" | "staff" | "counselor";
    targetGradeLevel?: string;
    targetClassIds?: string[];
    targetUserIds?: string[];
    priority?: "low" | "normal" | "high" | "urgent";
    category?: string;
    publishDate?: string;
    expiryDate?: string;
    isPublished?: boolean;
    isPinned?: boolean;
    isArchived?: boolean;
    attachments?: Array<{ name: string; url: string; type: string; size: number }>;
  }
) {
  const schoolId = await getCachedSchoolId();

  if (!schoolId) {
    return { success: false, error: "School not found" };
  }

  try {
    const { db } = await import("@/lib/db");
    const { announcements: announcementsTable } = await import("@/lib/db/schema");
    const { eq, and } = await import("drizzle-orm");

    // Check if announcement exists and belongs to school
    const existing = await db
      .select()
      .from(announcementsTable)
      .where(and(eq(announcementsTable.id, id), eq(announcementsTable.schoolId, schoolId)))
      .limit(1);

    if (!existing.length) {
      return { success: false, error: "Announcement not found" };
    }

    // Build update object
    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    // If publishing for the first time
    if (data.isPublished && !existing[0].isPublished) {
      updateData.publishedAt = new Date();
    }

    // Add other fields
    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
    if (data.targetAudience !== undefined) updateData.targetAudience = data.targetAudience;
    if (data.targetGradeLevel !== undefined) updateData.targetGradeLevel = data.targetGradeLevel;
    if (data.targetClassIds !== undefined) updateData.targetClassIds = data.targetClassIds;
    if (data.targetUserIds !== undefined) updateData.targetUserIds = data.targetUserIds;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.publishDate !== undefined) updateData.publishDate = data.publishDate;
    if (data.expiryDate !== undefined) updateData.expiryDate = data.expiryDate;
    if (data.isPublished !== undefined) updateData.isPublished = !!data.isPublished;
    if (data.isPinned !== undefined) updateData.isPinned = !!data.isPinned;
    if (data.isArchived !== undefined) updateData.isArchived = !!data.isArchived;
    if (data.attachments !== undefined) updateData.attachments = data.attachments;

    const [updated] = await db
      .update(announcementsTable)
      .set(updateData)
      .where(and(eq(announcementsTable.id, id), eq(announcementsTable.schoolId, schoolId)))
      .returning();

    return { success: true, announcement: updated };
  } catch (error) {
    console.error("Failed to update announcement:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update announcement",
    };
  }
}

/**
 * Delete an announcement
 */
export async function deleteAnnouncement(id: string) {
  const schoolId = await getCachedSchoolId();

  if (!schoolId) {
    return { success: false, error: "School not found" };
  }

  try {
    const { db } = await import("@/lib/db");
    const { announcements: announcementsTable } = await import("@/lib/db/schema");
    const { eq, and } = await import("drizzle-orm");

    await db
      .delete(announcementsTable)
      .where(and(eq(announcementsTable.id, id), eq(announcementsTable.schoolId, schoolId)));

    return { success: true };
  } catch (error) {
    console.error("Failed to delete announcement:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete announcement",
    };
  }
}

/**
 * Toggle announcement pin status
 */
export async function togglePinAnnouncement(id: string) {
  const schoolId = await getCachedSchoolId();

  if (!schoolId) {
    return { success: false, error: "School not found" };
  }

  try {
    const { db } = await import("@/lib/db");
    const { announcements: announcementsTable } = await import("@/lib/db/schema");
    const { eq, and } = await import("drizzle-orm");

    // Get current state
    const [current] = await db
      .select({ isPinned: announcementsTable.isPinned })
      .from(announcementsTable)
      .where(and(eq(announcementsTable.id, id), eq(announcementsTable.schoolId, schoolId)))
      .limit(1);

    if (!current) {
      return { success: false, error: "Announcement not found" };
    }

    // Toggle
    const [updated] = await db
      .update(announcementsTable)
      .set({ isPinned: !current.isPinned, updatedAt: new Date() })
      .where(and(eq(announcementsTable.id, id), eq(announcementsTable.schoolId, schoolId)))
      .returning();

    return { success: true, announcement: updated };
  } catch (error) {
    console.error("Failed to toggle pin:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to toggle pin",
    };
  }
}