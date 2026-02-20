import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
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

/**
 * POST /api/school-admin/enroll-student
 * Approve a student application and create enrollment record
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(["school_admin"]);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId: adminId } = authResult;

    const body = await req.json();
    const { applicationId, studentId, classId } = body;

    if (!applicationId || !studentId || !classId) {
      return NextResponse.json(
        { error: "Missing required fields: applicationId, studentId, classId" },
        { status: 400 }
      );
    }

    // Verify the application belongs to the admin's school
    const admin = await db.query.users.findFirst({
      where: eq(users.id, adminId),
      columns: {
        schoolId: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!admin?.schoolId) {
      return NextResponse.json({ error: "Admin school not found" }, { status: 404 });
    }

    // Get the application
    const application = await db.query.studentApplications.findFirst({
      where: and(
        eq(studentApplications.id, applicationId),
        eq(studentApplications.schoolId, admin.schoolId)
      ),
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (application.status !== "pending") {
      return NextResponse.json(
        { error: `Application already ${application.status}` },
        { status: 400 }
      );
    }

    // Verify the class exists and belongs to the school
    const targetClass = await db.query.classes.findFirst({
      where: eq(classes.id, classId),
    });

    if (!targetClass || targetClass.schoolId !== admin.schoolId) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
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

    // Update student onboarding status
    await db
      .update(users)
      .set({ onboardingStatus: "complete" })
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
    await notifyStudentAboutEnrollment(studentId, targetClass.name, admin.schoolId);

    logger.info("Student enrolled successfully", {
      applicationId,
      studentId,
      classId,
      enrollmentId,
      adminId,
    });

    return NextResponse.json({
      success: true,
      enrollmentId,
      message: "Student enrolled successfully",
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/school-admin/enroll-student", method: "POST" });
    return NextResponse.json({ error: "Failed to enroll student" }, { status: 500 });
  }
}

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
      senderRole: "school_admin",
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
