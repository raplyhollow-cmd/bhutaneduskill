"use server";
import { logger } from "@/lib/logger";
import { parseJsonArray, stringifyJson } from "@/lib/db/json-helpers";

/**
 * SCHOOL ADMIN SERVER ACTIONS
 *
 * Server actions for school-admin portal.
 * These are wrapped versions of the data fetching utilities for use in client components.
 */


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

/**
 * DASHBOARD ACTIONS
 */
export async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    const schoolId = await getCurrentSchoolId();
    logger.debug("fetchDashboardStats: schoolId", { schoolId });
    if (!schoolId) {
      logger.warn("fetchDashboardStats: no schoolId found");
      return {
        totalStudents: 0,
        totalTeachers: 0,
        totalClasses: 0,
        pendingAttendance: 0,
        pendingFees: 0,
        totalRevenue: 0,
      };
    }
    return getDashboardStats(schoolId);
  } catch (error) {
    logger.error("fetchDashboardStats failed", error);
    // Return empty stats on error to prevent page crash
    return {
      totalStudents: 0,
      totalTeachers: 0,
      totalClasses: 0,
      pendingAttendance: 0,
      pendingFees: 0,
      totalRevenue: 0,
    };
  }
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
  const schoolId = await getCurrentSchoolId();
  return getStudents(schoolId, options);
}

export async function fetchStudentById(id: string) {
  const schoolId = await getCurrentSchoolId();
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
  const schoolId = await getCurrentSchoolId();
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
  try {
    const schoolId = await getCurrentSchoolId();
    if (!schoolId) {
      logger.warn("fetchClasses: no schoolId found");
      return { classesList: [], total: 0 };
    }
    return getClasses(schoolId, options);
  } catch (error) {
    logger.error("fetchClasses failed", error);
    return { classesList: [], total: 0 };
  }
}

/**
 * SUBJECTS ACTIONS
 */
export async function fetchSubjects(options: {
  search?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const schoolId = await getCurrentSchoolId();
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
  const schoolId = await getCurrentSchoolId();
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
  const schoolId = await getCurrentSchoolId();

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
      id: `ATT-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
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
    logger.error("Failed to mark attendance:", error);
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
  const schoolId = await getCurrentSchoolId();
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
  const schoolId = await getCurrentSchoolId();
  return getExamResults(schoolId, options);
}

/**
 * FEES ACTIONS
 */
export async function fetchFeeData() {
  const schoolId = await getCurrentSchoolId();
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
  const schoolId = await getCurrentSchoolId();
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
  const schoolId = await getCurrentSchoolId();
  return getTuitionCourses(schoolId, options);
}

/**
 * ANALYTICS ACTIONS
 */
export async function fetchAnalytics(): Promise<AnalyticsData> {
  const schoolId = await getCurrentSchoolId();
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
  const schoolId = await getCurrentSchoolId();

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
      conditions.push(eq(announcementsTable.priority, options.priority as "low" | "normal" | "high" | "urgent"));
    }

    if (options.category) {
      conditions.push(eq(announcementsTable.category, options.category as "general" | "event" | "exam" | "holiday" | "urgent"));
    }

    if (options.search) {
      const searchCondition = or(
        like(announcementsTable.title, `%${options.search}%`),
        like(announcementsTable.content, `%${options.search}%`)
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
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

    // Parse JSON fields (stored as text in DB)
    const parsedResults = results.map((r) => ({
      ...r,
      targetClassIds: parseJsonArray<string>(r.targetClassIds) as string[] | null,
      targetUserIds: parseJsonArray<string>(r.targetUserIds) as string[] | null,
    })) as AnnouncementData[];

    return {
      announcements: parsedResults,
      total: total as number,
    };
  } catch (error) {
    logger.error("Failed to fetch announcements:", error);
    return { announcements: [], total: 0 };
  }
}

/**
 * Get a single announcement by ID
 */
export async function fetchAnnouncementById(id: string): Promise<AnnouncementData | null> {
  const schoolId = await getCurrentSchoolId();

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

    if (!announcement) return null;

    // Parse JSON fields (stored as text in DB)
    return {
      ...announcement,
      targetClassIds: parseJsonArray<string>(announcement.targetClassIds) as string[] | null,
      targetUserIds: parseJsonArray<string>(announcement.targetUserIds) as string[] | null,
    } as AnnouncementData;
  } catch (error) {
    logger.error("Failed to fetch announcement:", error);
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
  const schoolId = await getCurrentSchoolId();

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

    // Stringify JSON arrays for text columns (DB expects text for targetClassIds and targetUserIds)
    const targetClassIdsStr = data.targetClassIds ? stringifyJson(data.targetClassIds) : null;
    const targetUserIdsStr = data.targetUserIds ? stringifyJson(data.targetUserIds) : null;

    // Prepare attachments as array (stored as json in DB)
    const attachmentsArray = data.attachments?.map(att => ({
      id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      name: att.name,
      url: att.url,
      type: att.type,
    })) || null;

    const [announcement] = await db
      .insert(announcementsTable)
      .values({
        id: `ann_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        schoolId,
        authorId: userId,
        authorName,
        authorRole,
        title: data.title,
        content: data.content,
        excerpt: data.excerpt || "",
        targetAudience: data.targetAudience,
        targetGradeLevel: data.targetGradeLevel || "",
        targetClassIds: targetClassIdsStr,
        targetUserIds: targetUserIdsStr,
        priority: data.priority || "normal",
        category: data.category || "general",
        isPublished: !!data.isPublished,
        isPinned: !!data.isPinned,
        isArchived: false,
        attachments: attachmentsArray,
        publishDate: data.publishDate || "",
        expiryDate: data.expiryDate || "",
        viewCount: 0,
        createdAt: now,
        updatedAt: now,
        publishedAt,
      })
      .returning();

    return { success: true, announcement };
  } catch (error) {
    logger.error("Failed to create announcement:", error);
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
  const schoolId = await getCurrentSchoolId();

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
    logger.error("Failed to update announcement:", error);
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
  const schoolId = await getCurrentSchoolId();

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
    logger.error("Failed to delete announcement:", error);
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
  const schoolId = await getCurrentSchoolId();

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
    logger.error("Failed to toggle pin:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to toggle pin",
    };
  }
}

// ============================================================================
// CLASS MANAGEMENT ACTIONS
// ============================================================================

export interface ClassFormData {
  name: string;
  grade: number;
  section: string;
  roomNumber?: string;
  capacity?: number;
  homeroomTeacherId?: string;
  subjectTeacherIds?: string[];
  academicYear?: string;
}

export interface ClassDetail {
  id: string;
  name: string;
  grade: number;
  section: string;
  roomNumber: string | null;
  capacity: number | null;
  homeroomTeacherId: string | null;
  homeroomTeacherName: string;
  classTeacherId: string | null;
  classTeacherName: string;
  teacherId: string | null;
  academicYear: string | null;
  students: unknown;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get a single class by ID
 */
export async function fetchClassById(id: string): Promise<ClassDetail | null> {
  const schoolId = await getCurrentSchoolId();

  if (!schoolId) {
    return null;
  }

  try {
    const { db } = await import("@/lib/db");
    const { classes: classesTable } = await import("@/lib/db/schema");
    const { eq, and } = await import("drizzle-orm");

    const [classRecord] = await db
      .select()
      .from(classesTable)
      .where(and(eq(classesTable.id, id), eq(classesTable.schoolId, schoolId)))
      .limit(1);

    return (classRecord ? { ...classRecord, students: [] } : null) as ClassDetail | null;
  } catch (error) {
    logger.error("Failed to fetch class:", error);
    return null;
  }
}

/**
 * Get teachers for selection dropdown
 */
export async function fetchTeachersForSelection() {
  const schoolId = await getCurrentSchoolId();

  if (!schoolId) {
    return { teachers: [] };
  }

  try {
    const { db } = await import("@/lib/db");
    const { users: usersTable } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    const teachers = await db
      .select({
        id: usersTable.id,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        email: usersTable.email,
        employeeId: usersTable.employeeId,
      })
      .from(usersTable)
      .where(eq(usersTable.type, "teacher"))
      .orderBy(usersTable.firstName);

    return { teachers };
  } catch (error) {
    logger.error("Failed to fetch teachers:", error);
    return { teachers: [] };
  }
}

/**
 * Create a new class
 */
export async function createClass(data: ClassFormData) {
  const schoolId = await getCurrentSchoolId();

  if (!schoolId) {
    return { success: false, error: "School not found" };
  }

  try {
    const { db } = await import("@/lib/db");
    const { classes: classesTable, users: usersTable, teacherAssignments } = await import("@/lib/db/schema");
    const { nanoid } = await import("nanoid");
    const { eq } = await import("drizzle-orm");

    // Get homeroom teacher name if provided
    let homeroomTeacherName = "Not Assigned";
    if (data.homeroomTeacherId) {
      const [teacher] = await db
        .select({ firstName: usersTable.firstName, lastName: usersTable.lastName })
        .from(usersTable)
        .where(eq(usersTable.id, data.homeroomTeacherId))
        .limit(1);

      if (teacher) {
        homeroomTeacherName = `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim();
      }
    }

    // Generate class ID
    const classId = `class-${nanoid()}`;

    // Get current academic year (September to August pattern)
    const now = new Date();
    const currentYear = now.getFullYear();
    const academicYear = data.academicYear || (
      now.getMonth() >= 8
        ? `${currentYear}-${currentYear + 1}`
        : `${currentYear - 1}-${currentYear}`
    );

    // Insert the class
    const [newClass] = await db
      .insert(classesTable)
      .values({
        id: classId,
        schoolId,
        name: data.name || `Class ${data.grade} - ${data.section}`,
        grade: data.grade,
        section: data.section,
        roomNumber: data.roomNumber || `Room ${data.grade}0${data.section === "A" ? "1" : data.section === "B" ? "2" : "3"}`,
        capacity: data.capacity || 40,
        homeroomTeacherId: data.homeroomTeacherId || null,
        homeroomTeacherName,
        classTeacherId: data.homeroomTeacherId || null,
        classTeacherName: homeroomTeacherName,
        teacherId: data.homeroomTeacherId || null,
        academicYear,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Create teacher assignments if homeroom teacher is specified
    if (data.homeroomTeacherId) {
      await db.insert(teacherAssignments).values({
        id: `ta-${nanoid()}`,
        teacherId: data.homeroomTeacherId,
        classId,
        subjectId: null, // Homeroom teacher doesn't have a specific subject
        academicYear,
        role: "homeroom",
        isPrimary: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Create subject teacher assignments if provided
    if (data.subjectTeacherIds && data.subjectTeacherIds.length > 0) {
      const assignments = data.subjectTeacherIds.map((teacherId) => ({
        id: `ta-${nanoid()}`,
        teacherId,
        classId,
        subjectId: null, // Subject ID would need to be specified separately
        academicYear,
        role: "subject_teacher",
        isPrimary: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await db.insert(teacherAssignments).values(assignments);
    }

    logger.info("Class created successfully", { classId, schoolId });

    return { success: true, class: newClass };
  } catch (error) {
    logger.error("Failed to create class:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create class",
    };
  }
}

/**
 * Update an existing class
 */
export async function updateClass(id: string, data: Partial<ClassFormData>) {
  const schoolId = await getCurrentSchoolId();

  if (!schoolId) {
    return { success: false, error: "School not found" };
  }

  try {
    const { db } = await import("@/lib/db");
    const { classes: classesTable, users: usersTable } = await import("@/lib/db/schema");
    const { eq, and } = await import("drizzle-orm");

    // Check if class exists and belongs to school
    const existing = await db
      .select()
      .from(classesTable)
      .where(and(eq(classesTable.id, id), eq(classesTable.schoolId, schoolId)))
      .limit(1);

    if (!existing.length) {
      return { success: false, error: "Class not found" };
    }

    // Build update object
    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.grade !== undefined) updateData.grade = data.grade;
    if (data.section !== undefined) updateData.section = data.section;
    if (data.roomNumber !== undefined) updateData.roomNumber = data.roomNumber;
    if (data.capacity !== undefined) updateData.capacity = data.capacity;
    if (data.academicYear !== undefined) updateData.academicYear = data.academicYear;

    // Update homeroom teacher if changed
    if (data.homeroomTeacherId !== undefined) {
      let homeroomTeacherName = "Not Assigned";
      if (data.homeroomTeacherId) {
        const [teacher] = await db
          .select({ firstName: usersTable.firstName, lastName: usersTable.lastName })
          .from(usersTable)
          .where(eq(usersTable.id, data.homeroomTeacherId))
          .limit(1);

        if (teacher) {
          homeroomTeacherName = `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim();
        }
      }

      updateData.homeroomTeacherId = data.homeroomTeacherId;
      updateData.homeroomTeacherName = homeroomTeacherName;
      updateData.classTeacherId = data.homeroomTeacherId;
      updateData.classTeacherName = homeroomTeacherName;
      updateData.teacherId = data.homeroomTeacherId;
    }

    const [updated] = await db
      .update(classesTable)
      .set(updateData)
      .where(and(eq(classesTable.id, id), eq(classesTable.schoolId, schoolId)))
      .returning();

    logger.info("Class updated successfully", { classId: id, schoolId });

    return { success: true, class: updated };
  } catch (error) {
    logger.error("Failed to update class:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update class",
    };
  }
}

/**
 * Delete a class
 */
export async function deleteClass(id: string) {
  const schoolId = await getCurrentSchoolId();

  if (!schoolId) {
    return { success: false, error: "School not found" };
  }

  try {
    const { db } = await import("@/lib/db");
    const { classes: classesTable, enrollments } = await import("@/lib/db/schema");
    const { eq, and, count } = await import("drizzle-orm");

    // Check if class exists and belongs to school
    const existing = await db
      .select()
      .from(classesTable)
      .where(and(eq(classesTable.id, id), eq(classesTable.schoolId, schoolId)))
      .limit(1);

    if (!existing.length) {
      return { success: false, error: "Class not found" };
    }

    // Check if class has enrolled students
    const enrolledStudents = await db
      .select({ count: count() })
      .from(enrollments)
      .where(and(eq(enrollments.classId, id), eq(enrollments.status, "active")));

    if (enrolledStudents.length > 0 && (enrolledStudents[0]?.count ?? 0) > 0) {
      return {
        success: false,
        error: `Cannot delete class with ${enrolledStudents[0]?.count ?? 0} enrolled students. Please unenroll students first.`,
      };
    }

    // Delete the class
    await db
      .delete(classesTable)
      .where(and(eq(classesTable.id, id), eq(classesTable.schoolId, schoolId)));

    logger.info("Class deleted successfully", { classId: id, schoolId });

    return { success: true };
  } catch (error) {
    logger.error("Failed to delete class:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete class",
    };
  }
}

/**
 * Get subjects for a specific grade
 */
export async function fetchSubjectsByGrade(grade: number) {
  const schoolId = await getCurrentSchoolId();

  if (!schoolId) {
    return { subjects: [] };
  }

  try {
    const { db } = await import("@/lib/db");
    const { subjects: subjectsTable } = await import("@/lib/db/schema");
    const { eq, and } = await import("drizzle-orm");

    const gradeSubjects = await db
      .select()
      .from(subjectsTable)
      .where(and(eq(subjectsTable.schoolId, schoolId), eq(subjectsTable.grade, grade)))
      .orderBy(subjectsTable.name);

    return { subjects: gradeSubjects };
  } catch (error) {
    logger.error("Failed to fetch subjects by grade:", error);
    return { subjects: [] };
  }
}

// ============================================================================
// INVENTORY ACTIONS
// ============================================================================

export interface InventoryItemData {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  barcode: string | null;
  categoryId: string;
  categoryName: string | null;
  itemType: string;
  quantity: number;
  minimumStock: number | null;
  unit: string;
  location: string | null;
  condition: string;
  status: string;
  assignedTo: string | null;
  purchasePrice: number | null;
  currentValue: number | null;
  isLowStock: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryStats {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
  categories: number;
  vendors: number;
  pendingOrders: number;
  recentTransactions: number;
}

/**
 * Fetch inventory statistics for dashboard
 */
export async function fetchInventoryStats(): Promise<InventoryStats> {
  const schoolId = await getCurrentSchoolId();

  if (!schoolId) {
    return {
      totalItems: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      totalValue: 0,
      categories: 0,
      vendors: 0,
      pendingOrders: 0,
      recentTransactions: 0,
    };
  }

  try {
    const { db } = await import("@/lib/db");
    const {
      inventoryItems: itemsTable,
      inventoryCategories: categoriesTable,
      inventoryVendors: vendorsTable,
      purchaseOrders: ordersTable,
      inventoryTransactions: transactionsTable,
    } = await import("@/lib/db/schema");
    const { eq, sql, count, desc, gte, and } = await import("drizzle-orm");

    // Get total items and low stock count
    const [itemStats] = await db
      .select({
        total: count(),
        lowStock: count(sql`CASE WHEN quantity <= COALESCE(minimum_stock, 10) THEN 1 END`),
        outOfStock: count(sql`CASE WHEN quantity = 0 THEN 1 END`),
        totalValue: sql<number>`COALESCE(SUM(current_value), 0)`,
      })
      .from(itemsTable)
      .where(eq(itemsTable.schoolId, schoolId));

    // Get categories count
    const [categoryCount] = await db
      .select({ value: count() })
      .from(categoriesTable)
      .where(eq(categoriesTable.schoolId, schoolId));

    // Get vendors count
    const [vendorCount] = await db
      .select({ value: count() })
      .from(vendorsTable)
      .where(eq(vendorsTable.schoolId, schoolId));

    // Get pending orders count
    const [pendingOrders] = await db
      .select({ value: count() })
      .from(ordersTable)
      .where(and(eq(ordersTable.schoolId, schoolId), eq(ordersTable.status, "pending")));

    // Get recent transactions (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [recentTransactions] = await db
      .select({ value: count() })
      .from(transactionsTable)
      .where(
        and(
          eq(transactionsTable.schoolId, schoolId),
          gte(transactionsTable.createdAt, sevenDaysAgo)
        )
      );

    return {
      totalItems: itemStats.total || 0,
      lowStockItems: itemStats.lowStock || 0,
      outOfStockItems: itemStats.outOfStock || 0,
      totalValue: Number(itemStats.totalValue) || 0,
      categories: categoryCount.value || 0,
      vendors: vendorCount.value || 0,
      pendingOrders: pendingOrders.value || 0,
      recentTransactions: recentTransactions.value || 0,
    };
  } catch (error) {
    logger.error("Failed to fetch inventory stats:", error);
    return {
      totalItems: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      totalValue: 0,
      categories: 0,
      vendors: 0,
      pendingOrders: 0,
      recentTransactions: 0,
    };
  }
}

/**
 * Fetch inventory items with filters
 */
export async function fetchInventoryItems(options: {
  search?: string;
  categoryId?: string;
  itemType?: string;
  status?: string;
  condition?: string;
  lowStock?: boolean;
  location?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<{ items: InventoryItemData[]; total: number }> {
  const schoolId = await getCurrentSchoolId();

  if (!schoolId) {
    return { items: [], total: 0 };
  }

  try {
    const { db } = await import("@/lib/db");
    const {
      inventoryItems: itemsTable,
      inventoryCategories: categoriesTable,
    } = await import("@/lib/db/schema");
    const { eq, and, desc, like, sql, or, count } = await import("drizzle-orm");

    // Build conditions
    type SqlCondition = ReturnType<typeof sql> | ReturnType<typeof eq>;
    const conditions: SqlCondition[] = [eq(itemsTable.schoolId, schoolId)];

    if (options.search) {
      const searchConditions = [
        like(itemsTable.name, `%${options.search}%`),
      ];
      // SKU and description can be null, so use isNotNull from drizzle if needed
      searchConditions.push(
        sql`${itemsTable.sku} LIKE ${`%${options.search}%`}`
      );
      searchConditions.push(
        sql`${itemsTable.description} LIKE ${`%${options.search}%`}`
      );
      conditions.push(or(...searchConditions));
    }

    if (options.categoryId) {
      conditions.push(eq(itemsTable.categoryId, options.categoryId));
    }

    if (options.itemType) {
      conditions.push(eq(itemsTable.itemType, options.itemType));
    }

    if (options.status) {
      conditions.push(eq(itemsTable.status, options.status));
    }

    if (options.condition) {
      conditions.push(eq(itemsTable.condition, options.condition));
    }

    if (options.location) {
      conditions.push(
        sql`${itemsTable.location} LIKE ${`%${options.location}%`}`
      );
    }

    if (options.lowStock) {
      conditions.push(
        sql`${itemsTable.quantity} <= COALESCE(${itemsTable.minimumStock}, 10)`
      );
    }

    // Get total count
    const [{ value: total }] = await db
      .select({ value: count() })
      .from(itemsTable)
      .where(conditions.length > 1 ? and(...conditions) : conditions[0]);

    // Fetch items
    const limit = options.limit || 20;
    const offset = options.offset || 0;

    const items = await db
      .select({
        id: itemsTable.id,
        name: itemsTable.name,
        description: itemsTable.description,
        sku: itemsTable.sku,
        barcode: itemsTable.barcode,
        categoryId: itemsTable.categoryId,
        categoryName: categoriesTable.name,
        itemType: itemsTable.itemType,
        quantity: itemsTable.quantity,
        minimumStock: itemsTable.minimumStock,
        unit: itemsTable.unit,
        location: itemsTable.location,
        condition: itemsTable.condition,
        status: itemsTable.status,
        assignedTo: itemsTable.assignedTo,
        purchasePrice: itemsTable.purchasePrice,
        currentValue: itemsTable.currentValue,
        createdAt: itemsTable.createdAt,
        updatedAt: itemsTable.updatedAt,
      })
      .from(itemsTable)
      .leftJoin(categoriesTable, eq(itemsTable.categoryId, categoriesTable.id))
      .where(conditions.length > 1 ? and(...conditions) : conditions[0])
      .orderBy(desc(itemsTable.createdAt))
      .limit(limit)
      .offset(offset);

    // Add low stock flag
    const itemsWithLowStock = items.map((item) => ({
      ...item,
      isLowStock: item.quantity <= (item.minimumStock || 10),
    }));

    return {
      items: itemsWithLowStock,
      total: total || 0,
    };
  } catch (error) {
    logger.error("Failed to fetch inventory items:", error);
    return { items: [], total: 0 };
  }
}

/**
 * Fetch low stock alerts
 */
export async function fetchLowStockAlerts() {
  const schoolId = await getCurrentSchoolId();

  if (!schoolId) {
    return { alerts: [] };
  }

  try {
    const { db } = await import("@/lib/db");
    const { inventoryAlerts: alertsTable } = await import("@/lib/db/schema");
    const { eq, and, desc } = await import("drizzle-orm");

    const alerts = await db
      .select()
      .from(alertsTable)
      .where(
        and(
          eq(alertsTable.schoolId, schoolId),
          eq(alertsTable.alertType, "low_stock"),
          eq(alertsTable.status, "active")
        )
      )
      .orderBy(desc(alertsTable.severity), desc(alertsTable.createdAt))
      .limit(10);

    return { alerts };
  } catch (error) {
    logger.error("Failed to fetch low stock alerts:", error);
    return { alerts: [] };
  }
}

/**
 * Fetch recent transactions
 */
export async function fetchRecentTransactions(limit: number = 10) {
  const schoolId = await getCurrentSchoolId();

  if (!schoolId) {
    return { transactions: [] };
  }

  try {
    const { db } = await import("@/lib/db");
    const {
      inventoryTransactions: transactionsTable,
      inventoryItems: itemsTable,
    } = await import("@/lib/db/schema");
    const { eq, desc } = await import("drizzle-orm");

    const transactions = await db
      .select({
        id: transactionsTable.id,
        itemId: transactionsTable.itemId,
        itemName: itemsTable.name,
        transactionType: transactionsTable.transactionType,
        transactionDate: transactionsTable.transactionDate,
        quantity: transactionsTable.quantity,
        balanceAfter: transactionsTable.balanceAfter,
        performedBy: transactionsTable.performedBy,
        reason: transactionsTable.reason,
        createdAt: transactionsTable.createdAt,
      })
      .from(transactionsTable)
      .leftJoin(itemsTable, eq(transactionsTable.itemId, itemsTable.id))
      .where(eq(transactionsTable.schoolId, schoolId))
      .orderBy(desc(transactionsTable.createdAt))
      .limit(limit);

    return { transactions };
  } catch (error) {
    logger.error("Failed to fetch recent transactions:", error);
    return { transactions: [] };
  }
}

/**
 * Fetch inventory categories
 */
export async function fetchInventoryCategories() {
  const schoolId = await getCurrentSchoolId();

  if (!schoolId) {
    return { categories: [] };
  }

  try {
    const { db } = await import("@/lib/db");
    const { inventoryCategories: categoriesTable } = await import("@/lib/db/schema");
    const { eq, sql, or } = await import("drizzle-orm");

    const categories = await db
      .select()
      .from(categoriesTable)
      .where(
        or(
          eq(categoriesTable.schoolId, schoolId),
          sql`${categoriesTable.schoolId} = ''`
        )
      )
      .orderBy(sql`COALESCE(display_order, 0)`, categoriesTable.name);

    return { categories };
  } catch (error) {
    logger.error("Failed to fetch inventory categories:", error);
    return { categories: [] };
  }
}

/**
 * Create new inventory item
 */
export async function createInventoryItem(data: {
  name: string;
  description?: string;
  categoryId: string;
  itemType: string;
  quantity?: number;
  unit?: string;
  location?: string;
  minimumStock?: number;
  purchasePrice?: number;
}) {
  const schoolId = await getCurrentSchoolId();

  if (!schoolId) {
    return { success: false, error: "School not found" };
  }

  try {
    const { db } = await import("@/lib/db");
    const {
      inventoryItems: itemsTable,
      inventoryCategories: categoriesTable,
      inventoryTransactions: transactionsTable,
    } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    // Check if category exists
    const [category] = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, data.categoryId))
      .limit(1);

    if (!category) {
      return { success: false, error: "Category not found" };
    }

    // Generate SKU
    const sku = `${category.code || "INV"}-${Date.now().toString().slice(-6)}`;
    const itemId = `item-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const now = new Date();

    const [newItem] = await db
      .insert(itemsTable)
      .values({
        id: itemId,
        schoolId,
        name: data.name,
        description: data.description || null,
        sku,
        barcode: null,
        qrCode: null,
        categoryId: data.categoryId,
        itemType: data.itemType,
        isFixedAsset: false,
        assetTag: null,
        serialNumber: null,
        purchaseDate: null,
        purchasePrice: data.purchasePrice || null,
        currentValue: data.purchasePrice || null,
        depreciation: null,
        manufacturer: null,
        model: null,
        year: null,
        specifications: null,
        location: data.location || null,
        buildingId: null,
        roomId: null,
        shelf: null,
        rack: null,
        bin: null,
        quantity: data.quantity || 0,
        minimumStock: data.minimumStock ?? category.alertThreshold ?? 10,
        maximumStock: null,
        reorderLevel: null,
        reorderQuantity: null,
        unit: data.unit || "pieces",
        condition: "new",
        status: "available",
        assignedTo: null,
        assignedDate: null,
        assignedUntil: null,
        lastMaintenanceDate: null,
        nextMaintenanceDate: null,
        warrantyExpiry: null,
        notes: null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Create initial transaction if quantity > 0
    if (data.quantity && data.quantity > 0) {
      await db.insert(transactionsTable).values({
        id: `txn-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        schoolId,
        itemId,
        transactionType: "purchase",
        transactionDate: now.toISOString().split("T")[0],
        quantity: data.quantity,
        balanceAfter: data.quantity,
        unitPrice: data.purchasePrice || null,
        totalValue: data.purchasePrice ? data.quantity * data.purchasePrice : null,
        referenceNumber: null,
        referenceType: "initial_stock",
        sourceLocation: null,
        destinationLocation: data.location || null,
        performedBy: null,
        authorizedBy: null,
        reason: "Initial stock entry",
        documentUrls: null,
        createdAt: now,
      });
    }

    logger.info("Inventory item created", { itemId, schoolId });

    return { success: true, item: newItem };
  } catch (error) {
    logger.error("Failed to create inventory item:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create inventory item",
    };
  }
}

/**
 * Update inventory item
 */
export async function updateInventoryItem(
  id: string,
  data: {
    name?: string;
    description?: string;
    location?: string;
    quantity?: number;
    minimumStock?: number;
    unit?: string;
    condition?: string;
    status?: string;
    notes?: string;
  }
) {
  const schoolId = await getCurrentSchoolId();

  if (!schoolId) {
    return { success: false, error: "School not found" };
  }

  try {
    const { db } = await import("@/lib/db");
    const { inventoryItems: itemsTable } = await import("@/lib/db/schema");
    const { eq, and } = await import("drizzle-orm");

    // Check if item exists
    const [existing] = await db
      .select()
      .from(itemsTable)
      .where(and(eq(itemsTable.id, id), eq(itemsTable.schoolId, schoolId)))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Item not found" };
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.quantity !== undefined) updateData.quantity = data.quantity;
    if (data.minimumStock !== undefined) updateData.minimumStock = data.minimumStock;
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.condition !== undefined) updateData.condition = data.condition;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const [updated] = await db
      .update(itemsTable)
      .set(updateData)
      .where(and(eq(itemsTable.id, id), eq(itemsTable.schoolId, schoolId)))
      .returning();

    logger.info("Inventory item updated", { itemId: id, schoolId });

    return { success: true, item: updated };
  } catch (error) {
    logger.error("Failed to update inventory item:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update inventory item",
    };
  }
}

/**
 * Delete inventory item
 */
export async function deleteInventoryItem(id: string) {
  const schoolId = await getCurrentSchoolId();

  if (!schoolId) {
    return { success: false, error: "School not found" };
  }

  try {
    const { db } = await import("@/lib/db");
    const { inventoryItems: itemsTable } = await import("@/lib/db/schema");
    const { eq, and } = await import("drizzle-orm");

    // Check if item exists
    const [existing] = await db
      .select()
      .from(itemsTable)
      .where(and(eq(itemsTable.id, id), eq(itemsTable.schoolId, schoolId)))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Item not found" };
    }

    // Check if item is assigned
    if (existing.assignedTo) {
      return {
        success: false,
        error: "Cannot delete item that is currently assigned. Please return it first.",
      };
    }

    await db
      .delete(itemsTable)
      .where(and(eq(itemsTable.id, id), eq(itemsTable.schoolId, schoolId)));

    logger.info("Inventory item deleted", { itemId: id, schoolId });

    return { success: true };
  } catch (error) {
    logger.error("Failed to delete inventory item:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete inventory item",
    };
  }
}

/**
 * Create inventory transaction (issue/return)
 */
export async function createInventoryTransaction(data: {
  itemId: string;
  transactionType: string;
  quantity: number;
  reason?: string;
  destinationLocation?: string;
  issuedTo?: string;
  issuedToName?: string;
}) {
  const schoolId = await getCurrentSchoolId();

  if (!schoolId) {
    return { success: false, error: "School not found" };
  }

  try {
    const { db } = await import("@/lib/db");
    const {
      inventoryItems: itemsTable,
      inventoryTransactions: transactionsTable,
      inventoryAlerts: alertsTable,
      inventoryCategories: categoriesTable,
    } = await import("@/lib/db/schema");
    const { eq, and } = await import("drizzle-orm");

    // Get current item
    const [item] = await db
      .select()
      .from(itemsTable)
      .where(and(eq(itemsTable.id, data.itemId), eq(itemsTable.schoolId, schoolId)))
      .limit(1);

    if (!item) {
      return { success: false, error: "Item not found" };
    }

    // Calculate quantity change
    const outgoingTypes = ["issue", "sale", "damage", "loss", "disposal"];
    const quantityChange = outgoingTypes.includes(data.transactionType)
      ? -Math.abs(data.quantity)
      : Math.abs(data.quantity);

    const newQuantity = item.quantity + quantityChange;

    // Check sufficient stock for outgoing
    if (newQuantity < 0) {
      return {
        success: false,
        error: `Insufficient stock. Current: ${item.quantity}, Requested: ${Math.abs(
          data.quantity
        )}`,
      };
    }

    const now = new Date();

    // Create transaction
    const transactionId = `txn-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    await db.insert(transactionsTable).values({
      id: transactionId,
      schoolId,
      itemId: data.itemId,
      transactionType: data.transactionType,
      transactionDate: now.toISOString().split("T")[0],
      quantity: quantityChange,
      balanceAfter: newQuantity,
      unitPrice: null,
      totalValue: null,
      referenceNumber: null,
      referenceType: null,
      sourceLocation: item.location,
      destinationLocation: data.destinationLocation || data.issuedToName || null,
      performedBy: null,
      authorizedBy: null,
      reason: data.reason || null,
      documentUrls: null,
      createdAt: now,
    });

    // Update item quantity and assignment
    const updateData: Record<string, unknown> = {
      quantity: newQuantity,
      updatedAt: now,
    };

    if (data.transactionType === "issue" && data.issuedTo) {
      updateData.assignedTo = data.issuedTo;
      updateData.assignedDate = now.toISOString().split("T")[0];
      updateData.status = "in_use";
    } else if (data.transactionType === "return") {
      updateData.assignedTo = null;
      updateData.assignedDate = null;
      updateData.assignedUntil = null;
      updateData.status = "available";
    }

    await db
      .update(itemsTable)
      .set(updateData)
      .where(eq(itemsTable.id, data.itemId));

    // Check for low stock alert
    const [category] = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, item.categoryId))
      .limit(1);

    const minimumStock = item.minimumStock ?? category?.alertThreshold ?? 10;
    const isLowStock = newQuantity <= minimumStock;

    if (isLowStock) {
      // Check if alert already exists
      const [existingAlert] = await db
        .select()
        .from(alertsTable)
        .where(
          and(
            eq(alertsTable.itemId, data.itemId),
            eq(alertsTable.alertType, "low_stock"),
            eq(alertsTable.status, "active")
          )
        )
        .limit(1);

      if (!existingAlert) {
        await db.insert(alertsTable).values({
          id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          schoolId,
          alertType: "low_stock",
          severity: newQuantity <= minimumStock / 2 ? "critical" : "warning",
          itemId: data.itemId,
          itemName: item.name,
          title: `Low Stock: ${item.name}`,
          message: `Item "${item.name}" is running low on stock. Current: ${newQuantity}, Minimum: ${minimumStock}`,
          status: "active",
          notificationSent: false,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    logger.info("Inventory transaction created", {
      transactionId,
      transactionType: data.transactionType,
      quantityChange,
    });

    return {
      success: true,
      newQuantity,
      lowStockAlert: isLowStock,
    };
  } catch (error) {
    logger.error("Failed to create inventory transaction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create transaction",
    };
  }
}

/**
 * ============================================
 * SUBJECTS CRUD ACTIONS
 * ============================================
 */

export interface SubjectFormData {
  name: string;
  code: string;
  type: "core" | "elective" | "optional";
  grade?: number;
  description?: string;
  departmentId?: string;
}

/**
 * Create a new subject
 */
export async function createSubject(data: SubjectFormData) {
  const schoolId = await getCurrentSchoolId();

  if (!schoolId) {
    return { success: false, error: "School not found" };
  }

  try {
    const { db } = await import("@/lib/db");
    const { subjects } = await import("@/lib/db/schema");
    const { nanoid } = await import("nanoid");

    // Check if subject code already exists for this school
    const { eq, and } = await import("drizzle-orm");
    const [existing] = await db
      .select()
      .from(subjects)
      .where(and(eq(subjects.schoolId, schoolId), eq(subjects.code, data.code)))
      .limit(1);

    if (existing) {
      return { success: false, error: "Subject code already exists" };
    }

    const subjectId = `subject-${nanoid()}`;

    const [newSubject] = await db
      .insert(subjects)
      .values({
        id: subjectId,
        schoolId,
        name: data.name,
        code: data.code,
        type: data.type,
        description: data.description || null,
        grade: data.grade || null,
        departmentId: data.departmentId || null,
        isActive: true,
        subjectType: null,
        applicableGrades: data.grade ? stringifyJson([data.grade]) : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    logger.info("Subject created successfully", { subjectId, schoolId, name: data.name });

    return { success: true, subject: newSubject };
  } catch (error) {
    logger.error("Failed to create subject:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create subject",
    };
  }
}

/**
 * Update an existing subject
 */
export async function updateSubject(id: string, data: Partial<SubjectFormData>) {
  const schoolId = await getCurrentSchoolId();

  if (!schoolId) {
    return { success: false, error: "School not found" };
  }

  try {
    const { db } = await import("@/lib/db");
    const { subjects } = await import("@/lib/db/schema");
    const { eq, and } = await import("drizzle-orm");

    // Verify subject belongs to this school
    const [existing] = await db
      .select()
      .from(subjects)
      .where(and(eq(subjects.id, id), eq(subjects.schoolId, schoolId)))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Subject not found" };
    }

    // Check if new code conflicts with another subject
    if (data.code && data.code !== existing.code) {
      const [conflict] = await db
        .select()
        .from(subjects)
        .where(
          and(
            eq(subjects.schoolId, schoolId),
            eq(subjects.code, data.code)
          )
        )
        .limit(1);

      if (conflict) {
        return { success: false, error: "Subject code already exists" };
      }
    }

    // Build update values
    const updateValues: {
      updatedAt: Date;
      name?: string;
      code?: string;
      type?: string;
      description?: string | null;
      grade?: number;
      applicableGrades?: string | null;
      departmentId?: string;
    } = {
      updatedAt: new Date(),
    };

    if (data.name) updateValues.name = data.name;
    if (data.code) updateValues.code = data.code;
    if (data.type) updateValues.type = data.type;
    if (data.description !== undefined) updateValues.description = data.description;
    if (data.grade !== undefined) {
      updateValues.grade = data.grade;
      updateValues.applicableGrades = data.grade ? stringifyJson([data.grade]) : null;
    }
    if (data.departmentId !== undefined) updateValues.departmentId = data.departmentId;

    const [updated] = await db
      .update(subjects)
      .set(updateValues)
      .where(eq(subjects.id, id))
      .returning();

    logger.info("Subject updated successfully", { subjectId: id, schoolId });

    return { success: true, subject: updated };
  } catch (error) {
    logger.error("Failed to update subject:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update subject",
    };
  }
}

/**
 * Delete a subject (soft delete - sets isActive to false)
 */
export async function deleteSubject(id: string) {
  const schoolId = await getCurrentSchoolId();

  if (!schoolId) {
    return { success: false, error: "School not found" };
  }

  try {
    const { db } = await import("@/lib/db");
    const { subjects, teacherAssignments } = await import("@/lib/db/schema");
    const { eq, and } = await import("drizzle-orm");

    // Verify subject belongs to this school
    const [existing] = await db
      .select()
      .from(subjects)
      .where(and(eq(subjects.id, id), eq(subjects.schoolId, schoolId)))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Subject not found" };
    }

    // Check if subject is assigned to any teacher
    const [assignment] = await db
      .select()
      .from(teacherAssignments)
      .where(eq(teacherAssignments.subjectId, id))
      .limit(1);

    if (assignment) {
      return {
        success: false,
        error: "Cannot delete subject that is assigned to teachers. Remove assignments first.",
      };
    }

    // Soft delete
    await db
      .update(subjects)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(subjects.id, id));

    logger.info("Subject deleted successfully", { subjectId: id, schoolId });

    return { success: true };
  } catch (error) {
    logger.error("Failed to delete subject:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete subject",
    };
  }
}

/**
 * Get a single subject by ID
 */
export async function fetchSubjectById(id: string) {
  const schoolId = await getCurrentSchoolId();

  if (!schoolId) {
    return null;
  }

  try {
    const { db } = await import("@/lib/db");
    const { subjects } = await import("@/lib/db/schema");
    const { eq, and } = await import("drizzle-orm");

    const [subject] = await db
      .select()
      .from(subjects)
      .where(and(eq(subjects.id, id), eq(subjects.schoolId, schoolId)))
      .limit(1);

    return subject || null;
  } catch (error) {
    logger.error("Failed to fetch subject:", error);
    return null;
  }
}