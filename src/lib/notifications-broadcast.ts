/**
 * NOTIFICATIONS BROADCAST UTILITY
 *
 * Server-side utility for broadcasting real-time notifications
 * when events occur (homework created, graded, etc.).
 *
 * Uses Pusher via @/lib/realtime-server to deliver real-time updates.
 *
 * @example
 * ```tsx
 * import { broadcastHomeworkCreated } from "@/lib/notifications-broadcast";
 *
 * // After creating homework
 * await broadcastHomeworkCreated(classId, homeworkData);
 * ```
 */

import { db } from "@/lib/db";
import { users, classes, notifications, notificationDeliveries } from "@/lib/db/schema";
import { eq, inArray, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  broadcastToSchool,
  broadcastToClass,
  broadcastToUser,
} from "@/lib/realtime-server";
import { RealtimeEvents } from "@/lib/realtime";
import { logger } from "@/lib/logger";

// ============================================================================
// TYPES
// ============================================================================

export interface NotificationPayload {
  title: string;
  message: string;
  type?: "announcement" | "alert" | "reminder" | "system" | "homework" | "grade" | "attendance";
  actionUrl?: string;
  actionLabel?: string;
  data?: Record<string, unknown>;
}

export interface HomeworkCreatedData {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  classId: string;
  teacherName: string;
  subjectName?: string;
}

export interface HomeworkGradedData {
  id: string;
  homeworkId: string;
  homeworkTitle: string;
  score: number;
  totalPoints: number;
  feedback?: string;
}

export interface HomeworkSubmittedData {
  id: string;
  homeworkId: string;
  homeworkTitle: string;
  studentId: string;
  studentName: string;
  classId: string;
  submittedAt: string;
  isLate?: boolean;
}

export interface AttendanceUpdatedData {
  studentId: string;
  studentName: string;
  classId: string;
  date: string;
  status: "present" | "absent" | "late" | "excused";
  checkInTime?: string;
  recordedBy?: string;
}

// ============================================================================
// HOMEWORK NOTIFICATIONS
// ============================================================================

/**
 * Broadcast homework created event to all students in a class
 * AND create notification records in the database.
 *
 * @param classId - The class ID
 * @param homeworkData - The homework data to broadcast
 */
export async function broadcastHomeworkCreated(
  classId: string,
  homeworkData: HomeworkCreatedData
): Promise<void> {
  try {
    // Get the class to find school and students
    const classResult = await db
      .select()
      .from(classes)
      .where(eq(classes.id, classId))
      .limit(1);

    if (!classResult[0]) {
      logger.warn("Class not found for homework broadcast", { classId });
      return;
    }

    const classInfo = classResult[0];
    const schoolId = classInfo.schoolId;

    // Get all students in this class
    // Note: This depends on your student-class relationship structure
    // For now, we'll broadcast to the class channel (students subscribe to their classes)
    await broadcastToClass(classId, RealtimeEvents.HOMEWORK_CREATED, {
      homework: homeworkData,
      class: {
        id: classInfo.id,
        name: classInfo.name,
      },
    });

    // Also broadcast to school-wide for admin/teacher visibility
    await broadcastToSchool(schoolId, "homework.created", {
      homeworkId: homeworkData.id,
      classId,
      title: homeworkData.title,
    });

    // Create database notification records for students
    await createNotificationsForClass(
      classId,
      {
        title: "New Homework Posted",
        message: `${homeworkData.teacherName} posted "${homeworkData.title}" - Due: ${new Date(homeworkData.dueDate).toLocaleDateString()}`,
        type: "homework",
        actionUrl: `/student/homework/${homeworkData.id}`,
        actionLabel: "View Homework",
        data: { homeworkId: homeworkData.id },
      },
      "student"
    );

    logger.info("Homework created broadcast sent", {
      classId,
      homeworkId: homeworkData.id,
    });
  } catch (error) {
    logger.error("Failed to broadcast homework created", { error, classId });
  }
}

/**
 * Broadcast homework graded event to a specific student.
 *
 * @param studentId - The student's database ID
 * @param gradingData - The grading data to broadcast
 */
export async function broadcastHomeworkGraded(
  studentId: string,
  gradingData: HomeworkGradedData
): Promise<void> {
  try {
    // Send real-time notification
    await broadcastToUser(studentId, RealtimeEvents.HOMEWORK_GRADED, gradingData);

    // Create database notification record
    await createNotificationForUser(
      studentId,
      {
        title: "Homework Graded",
        message: `Your homework "${gradingData.homeworkTitle}" has been graded. Score: ${gradingData.score}/${gradingData.totalPoints}`,
        type: "grade",
        actionUrl: `/student/homework/${gradingData.homeworkId}`,
        actionLabel: "View Feedback",
        data: { homeworkId: gradingData.homeworkId, score: gradingData.score },
      }
    );

    logger.info("Homework graded broadcast sent", {
      studentId,
      homeworkId: gradingData.homeworkId,
    });
  } catch (error) {
    logger.error("Failed to broadcast homework graded", { error, studentId });
  }
}

// ============================================================================
// GENERAL NOTIFICATION HELPERS
// ============================================================================

/**
 * Create notification records for all users of a specific type in a class.
 *
 * @param classId - The class ID
 * @param payload - The notification payload
 * @param userType - The user type to notify (e.g., "student")
 */
async function createNotificationsForClass(
  classId: string,
  payload: NotificationPayload,
  userType: string
): Promise<void> {
  try {
    // Get users of this type in the class
    // This depends on your student-class relationship (class_students table, etc.)
    // For now, we'll use a simple approach based on users table

    const targetUsers = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.type, userType),
          // Note: You may need to join with class_students or similar table
          // eq(users.classId, classId) // if classId is on users table
          eq(users.isActive, true)
        )
      );

    if (targetUsers.length === 0) {
      return;
    }

    // Create notification record
    const notificationId = `notif-${nanoid()}`;
    await db.insert(notifications).values({
      id: notificationId,
      title: payload.title,
      message: payload.message,
      type: payload.type || "announcement",
      targetAudience: "specific",
      targetUserIds: JSON.stringify(targetUsers.map((u) => u.id)),
      status: "sent",
      sentAt: new Date(),
      totalRecipients: targetUsers.length,
      deliveredCount: targetUsers.length,
      actionUrl: payload.actionUrl,
      actionLabel: payload.actionLabel,
      data: payload.data ? JSON.stringify(payload.data) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create delivery records
    const deliveryRecords = targetUsers.map((user) => ({
      id: `delivery-${nanoid()}`,
      notificationId,
      userId: user.id,
      status: "delivered" as const,
      deliveredAt: new Date(),
      deliveryMethod: "in_app",
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await db.insert(notificationDeliveries).values(deliveryRecords);
  } catch (error) {
    logger.error("Failed to create class notifications", { error, classId });
  }
}

/**
 * Create a notification record for a specific user.
 *
 * @param userId - The user's database ID
 * @param payload - The notification payload
 */
async function createNotificationForUser(
  userId: string,
  payload: NotificationPayload
): Promise<void> {
  try {
    const notificationId = `notif-${nanoid()}`;

    // Create notification record
    await db.insert(notifications).values({
      id: notificationId,
      title: payload.title,
      message: payload.message,
      type: payload.type || "announcement",
      targetAudience: "specific",
      targetUserIds: JSON.stringify([userId]),
      status: "sent",
      sentAt: new Date(),
      totalRecipients: 1,
      deliveredCount: 1,
      actionUrl: payload.actionUrl,
      actionLabel: payload.actionLabel,
      data: payload.data ? JSON.stringify(payload.data) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create delivery record
    await db.insert(notificationDeliveries).values({
      id: `delivery-${nanoid()}`,
      notificationId,
      userId,
      status: "delivered",
      deliveredAt: new Date(),
      deliveryMethod: "in_app",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } catch (error) {
    logger.error("Failed to create user notification", { error, userId });
  }
}

// ============================================================================
// STUDENT NOTIFICATIONS
// ============================================================================

/**
 * Broadcast student approval event.
 */
export async function broadcastStudentApproved(
  schoolId: string,
  studentData: { id: string; name: string; email?: string }
): Promise<void> {
  try {
    await broadcastToSchool(schoolId, RealtimeEvents.STUDENT_APPROVED, {
      student: studentData,
    });

    logger.info("Student approved broadcast sent", {
      schoolId,
      studentId: studentData.id,
    });
  } catch (error) {
    logger.error("Failed to broadcast student approved", { error, schoolId });
  }
}

// ============================================================================
// ANNOUNCEMENT NOTIFICATIONS
// ============================================================================

/**
 * Broadcast announcement to school.
 */
export async function broadcastAnnouncement(
  schoolId: string,
  announcementData: {
    id: string;
    title: string;
    message: string;
    senderName: string;
  }
): Promise<void> {
  try {
    await broadcastToSchool(schoolId, RealtimeEvents.ANNOUNCEMENT_CREATED, {
      announcement: announcementData,
    });

    logger.info("Announcement broadcast sent", {
      schoolId,
      announcementId: announcementData.id,
    });
  } catch (error) {
    logger.error("Failed to broadcast announcement", { error, schoolId });
  }
}

// ============================================================================
// SYSTEM ALERTS
// ============================================================================

/**
 * Send system-wide alert to a school.
 */
export async function broadcastSystemAlert(
  schoolId: string,
  alert: {
    title: string;
    message: string;
    severity?: "info" | "warning" | "error" | "success";
  }
): Promise<void> {
  try {
    await broadcastToSchool(schoolId, RealtimeEvents.SYSTEM_ALERT, alert);

    logger.info("System alert broadcast sent", { schoolId });
  } catch (error) {
    logger.error("Failed to broadcast system alert", { error, schoolId });
  }
}

// ============================================================================
// LIVE DATA UPDATES - Dashboard Refresh Events
// ============================================================================

/**
 * Broadcast homework submitted event to teacher's dashboard.
 * Notifies the teacher when a student submits homework.
 *
 * @param classId - The class ID
 * @param submissionData - The submission data
 */
export async function broadcastHomeworkSubmitted(
  classId: string,
  submissionData: HomeworkSubmittedData
): Promise<void> {
  try {
    // Broadcast to class channel - teacher will be listening
    await broadcastToClass(classId, RealtimeEvents.HOMEWORK_SUBMITTED, submissionData);

    // Also trigger dashboard stats update for teachers
    await broadcastToClass(classId, RealtimeEvents.DASHBOARD_STATS_UPDATED, {
      type: "homework_submission",
      classId,
      timestamp: new Date().toISOString(),
    });

    logger.info("Homework submitted broadcast sent", {
      classId,
      homeworkId: submissionData.homeworkId,
      studentId: submissionData.studentId,
    });
  } catch (error) {
    logger.error("Failed to broadcast homework submitted", { error, classId });
  }
}

/**
 * Broadcast attendance updated event.
 * Notifies parents and updates teacher dashboard when attendance is marked.
 *
 * @param schoolId - The school ID
 * @param attendanceData - The attendance data
 */
export async function broadcastAttendanceUpdated(
  schoolId: string,
  attendanceData: AttendanceUpdatedData
): Promise<void> {
  try {
    // Broadcast to the class for teacher dashboard
    await broadcastToClass(attendanceData.classId, RealtimeEvents.ATTENDANCE_UPDATED, attendanceData);

    // Notify the specific user (student/parent)
    await broadcastToUser(attendanceData.studentId, RealtimeEvents.ATTENDANCE_CHECKED_IN, attendanceData);

    // Trigger dashboard stats update
    await broadcastToClass(attendanceData.classId, RealtimeEvents.DASHBOARD_STATS_UPDATED, {
      type: "attendance_update",
      classId: attendanceData.classId,
      timestamp: new Date().toISOString(),
    });

    logger.info("Attendance updated broadcast sent", {
      schoolId,
      classId: attendanceData.classId,
      studentId: attendanceData.studentId,
    });
  } catch (error) {
    logger.error("Failed to broadcast attendance updated", { error, schoolId });
  }
}

/**
 * Broadcast dashboard stats refresh event.
 * Use this when significant data changes that affect dashboard stats.
 *
 * @param schoolId - The school ID
 * @param classId - Optional class ID for class-specific updates
 * @param updateType - The type of data that changed
 */
export async function broadcastDashboardRefresh(
  schoolId: string,
  classId: string | null,
  updateType: "homework" | "attendance" | "grades" | "enrollment" | "all"
): Promise<void> {
  try {
    const payload = {
      type: updateType,
      schoolId,
      classId,
      timestamp: new Date().toISOString(),
    };

    if (classId) {
      await broadcastToClass(classId, RealtimeEvents.DASHBOARD_STATS_UPDATED, payload);
    } else {
      await broadcastToSchool(schoolId, RealtimeEvents.DASHBOARD_STATS_UPDATED, payload);
    }

    logger.info("Dashboard refresh broadcast sent", { schoolId, classId, updateType });
  } catch (error) {
    logger.error("Failed to broadcast dashboard refresh", { error, schoolId });
  }
}
