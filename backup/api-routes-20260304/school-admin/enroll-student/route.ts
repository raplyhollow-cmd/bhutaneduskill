import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  users,
  studentApplications,
  enrollments,
  classes,
  notifications,
  notificationDeliveries,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";
import { createApiRoute } from "@/lib/api/route-handler";

/**
 * POST /api/school-admin/enroll-student
 * Approve a student application and create enrollment record
 * Now supports: school-admin, platform admin, and class teachers
 */
export const POST = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId: adminId, user } = auth;

    const body = await req.json();
    const { applicationId, studentId, classId } = body;

    if (!applicationId || !studentId || !classId) {
      return { error: "Missing required fields: applicationId, studentId, classId", status: 400 };
    }

    // Get the requesting user's info
    const [requestingUser] = await db.select({
      id: users.id,
      type: users.type,
      schoolId: users.schoolId,
      classGrade: users.classGrade,
      firstName: users.firstName,
      lastName: users.lastName,
    }).from(users).where(eq(users.id, adminId)).limit(1);

    if (!requestingUser?.schoolId && requestingUser.type !== 'admin') {
      return { error: "User school not found", status: 404 };
    }

    const schoolId = requestingUser.schoolId || '';

    // Get the application
    const [application] = await db.select().from(studentApplications).where(
      and(
        eq(studentApplications.id, applicationId),
        eq(studentApplications.schoolId, schoolId)
      )
    ).limit(1);

    if (!application) {
      return { error: "Application not found", status: 404 };
    }

    if (application.status !== "pending") {
      return { error: `Application already ${application.status}`, status: 400 };
    }

    // For teachers: verify they teach this class
    if (requestingUser.type === 'teacher') {
      const [teacherClass] = await db.select().from(classes).where(
        eq(classes.id, classId)
      ).limit(1);

      if (!teacherClass || teacherClass.schoolId !== schoolId) {
        return { error: "Class not found", status: 404 };
      }
      // Verify the teacher teaches this grade
      if (teacherClass.grade !== requestingUser.classGrade) {
        return { error: "You can only enroll students in classes you teach", status: 403 };
      }
    }

    // Verify the class exists and belongs to the school
    const [targetClass] = await db.select().from(classes).where(eq(classes.id, classId)).limit(1);

    if (!targetClass || ("schoolId" in targetClass && targetClass.schoolId !== schoolId)) {
      return { error: "Class not found", status: 404 };
    }

    // Create enrollment record
    const enrollmentId = `enr-${Date.now()}-${nanoid(8)}`;
    const now = new Date();

    await db.insert(enrollments).values({
      id: enrollmentId,
      studentId,
      classId,
      status: "active",
      enrollmentDate: now.toISOString().split("T")[0],
      academicYear: "2025-2026",
      rollNumber: null,
      section: targetClass.section || null,
      createdAt: now,
      updatedAt: now,
    });

    // Update student onboarding status - use 'enrolled' for auth check
    await db
      .update(users)
      .set({
        onboardingStatus: "enrolled",
        onboardingComplete: true,
        approvedBy: adminId,
        approvedAt: now,
        updatedAt: now,
      })
      .where(eq(users.id, studentId));

    // Update application status
    await db
      .update(studentApplications)
      .set({
        status: "approved",
        reviewedAt: now,
        reviewedBy: adminId,
        notes: `Enrolled in ${targetClass.name}`,
        updatedAt: now,
      })
      .where(eq(studentApplications.id, applicationId));

    // Notify student about approval
    await notifyStudentAboutEnrollment(studentId, targetClass.name, schoolId);

    logger.info("Student enrolled successfully", {
      applicationId,
      studentId,
      classId,
      enrollmentId,
      adminId,
    });

    return {
      success: true,
      enrollmentId,
      message: "Student enrolled successfully",
    };
  },
  ["school-admin", "admin", "teacher"]
);

/**
 * Notify student about successful enrollment
 */
async function notifyStudentAboutEnrollment(
  studentId: string,
  className: string,
  schoolId: string
) {
  try {
    const notificationId = `notif-${Date.now()}-${nanoid(8)}`;
    const now = new Date();

    // Create the notification
    await db.insert(notifications).values({
      id: notificationId,
      title: "Congratulations! You've been enrolled",
      message: `You have been enrolled in ${className}. You can now access your classes, homework, and attendance.`,
      type: "welcome",
      category: "enrollment",
      targetAudience: "specific",
      targetUserIds: JSON.stringify([studentId]),
      priority: "high",
      status: "sent",
      senderId: schoolId,
      senderName: "School Administration",
      senderRole: "school-admin",
      actionUrl: "/student/dashboard",
      actionLabel: "Go to Dashboard",
      sentAt: now,
      totalRecipients: 1,
      deliveredCount: 1,
      readCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Create delivery record
    await db.insert(notificationDeliveries).values({
      id: `delivery-${Date.now()}-${nanoid(8)}`,
      notificationId,
      userId: studentId,
      status: "delivered",
      deliveredAt: now,
      deliveryMethod: "in_app",
      createdAt: now,
      updatedAt: now,
    });

    logger.info("Notified student about enrollment", { studentId, className });
  } catch (error) {
    logger.error("Failed to notify student about enrollment", { error });
    // Don't fail the request if notification fails
  }
}
