import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { studentApplications, users, notifications, notificationDeliveries } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";

/**
 * POST /api/school-admin/reject-application
 * Reject a student application
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(["school_admin"]);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId: adminId } = authResult;

    const body = await req.json();
    const { applicationId, reason } = body;

    if (!applicationId) {
      return NextResponse.json({ error: "Missing applicationId" }, { status: 400 });
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

    const now = new Date();

    // Update application status
    await db
      .update(studentApplications)
      .set({
        status: "rejected",
        reviewedAt: now,
        reviewedBy: adminId,
        rejectionReason: reason || "Application rejected by school administration",
        updatedAt: now,
      })
      .where(eq(studentApplications.id, applicationId));

    // Notify student about rejection
    await notifyStudentAboutRejection(
      application.studentId,
      reason || "Application rejected by school administration"
    );

    logger.info("Student application rejected", {
      applicationId,
      studentId: application.studentId,
      adminId,
      reason,
    });

    return NextResponse.json({
      success: true,
      message: "Application rejected",
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/school-admin/reject-application", method: "POST" });
    return NextResponse.json({ error: "Failed to reject application" }, { status: 500 });
  }
}

/**
 * Notify student about application rejection
 */
async function notifyStudentAboutRejection(studentId: string, reason: string) {
  try {
    const notificationId = `notif-${Date.now()}-${nanoid(8)}`;
    const now = new Date();

    // Create the notification
    await db.insert(notifications).values({
      id: notificationId,
      title: "Application Update",
      message: `Your enrollment application was not approved. ${reason}`,
      type: "alert",
      category: "enrollment",
      targetAudience: "specific",
      targetUserIds: JSON.stringify([studentId]),
      priority: "normal",
      status: "sent",
      senderId: "system",
      senderName: "School Administration",
      senderRole: "school_admin",
      actionUrl: "/student/dashboard",
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

    logger.info("Notified student about application rejection", { studentId });
  } catch (error) {
    logger.error("Failed to notify student about rejection", { error });
    // Don't fail the request if notification fails
  }
}
