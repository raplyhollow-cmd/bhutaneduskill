import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { studentApplications, users, notifications, notificationDeliveries } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";
import { createApiRoute } from "@/lib/api/route-handler";

/**
 * POST /api/school-admin/reject-application
 * Reject a student application
 */
export const POST = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId: adminId } = auth;

    const body = await req.json();
    const { applicationId, reason } = body;

    if (!applicationId) {
      return { error: "Missing applicationId", status: 400 };
    }

    // Verify the application belongs to the admin's school
    const [admin] = await db
      .select({
        schoolId: users.schoolId,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users)
      .where(eq(users.id, adminId))
      .limit(1);

    if (!admin?.schoolId) {
      return { error: "Admin school not found", status: 404 };
    }

    // Get the application
    const [application] = await db
      .select()
      .from(studentApplications)
      .where(and(
        eq(studentApplications.id, applicationId),
        eq(studentApplications.schoolId, admin.schoolId)
      ))
      .limit(1);

    if (!application) {
      return { error: "Application not found", status: 404 };
    }

    if (application.status !== "pending") {
      return { error: `Application already ${application.status}`, status: 400 };
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
      admin.schoolId,
      reason || "Application rejected by school administration"
    );

    logger.info("Student application rejected", {
      applicationId,
      adminId,
      reason,
    });

    return {
      success: true,
      message: "Application rejected successfully",
    };
  },
  ["school-admin"]
);

/**
 * Notify student about application rejection
 */
async function notifyStudentAboutRejection(studentId: string, schoolId: string, reason: string) {
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
      senderRole: "school-admin",
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
