/**
 * COUNSELOR SEND REPORT TO OFFICE API
 *
 * POST /api/counselor/reports/send
 *
 * Send generated reports to the school office/administration
 */

import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { users, counselorAssignments } from "@/lib/db/schema";
import { notifications, notificationDeliveries } from "@/lib/db/notifications-schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

interface SendRequest {
  reportId: string;
  templateId: string;
  templateName: string;
  format: string;
  recipientType: "school-admin" | "ministry" | "admin";
  recipientId?: string;
  message?: string;
  reportData?: Record<string, unknown>;
}

// ============================================================================
// POST /api/counselor/reports/send
// ============================================================================

export const POST = createApiRoute(
  async (req, auth) => {
    const { user: currentUser } = auth;

    const body: SendRequest = await req.json();
    const { reportId, templateId, templateName, format, recipientType, recipientId, message, reportData } = body;

    if (!reportId || !templateId) {
      return { error: "Report ID and Template ID are required", status: 400 };
    }

    // Get counselor's school assignment using proper Drizzle syntax
    const counselorAssignmentsList = await db
      .select({ schoolId: counselorAssignments.schoolId })
      .from(counselorAssignments)
      .where(
        and(
          eq(counselorAssignments.counselorId, currentUser.id),
          eq(counselorAssignments.isActive, true)
        )
      );

    if (counselorAssignmentsList.length === 0) {
      return { error: "Counselor has no school assigned", status: 400 };
    }

    const schoolId = counselorAssignmentsList[0].schoolId;

    // Determine recipients
    const recipients = await getRecipients(recipientType, schoolId, recipientId);

    if (recipients.length === 0) {
      return { error: "No valid recipients found", status: 404 };
    }

    // Create the notification record
    const notificationId = `notif-${nanoid()}`;
    const notificationData = {
      id: notificationId,
      title: `New Report: ${templateName}`,
      message: message || `Counselor ${currentUser.firstName} ${currentUser.lastName || ""} has submitted a ${templateName}.`,
      type: "announcement" as const,
      category: "report",
      targetAudience: "specific" as const,
      targetUserIds: JSON.stringify(recipients.map((r) => r.id)),
      targetSchoolIds: JSON.stringify([schoolId]),
      priority: "normal" as const,
      status: "sent" as const,
      senderId: currentUser.id,
      senderName: `${currentUser.firstName} ${currentUser.lastName || ""}`.trim(),
      senderRole: "counselor",
      sentAt: new Date(),
      actionUrl: `/counselor/reports/${reportId}`,
      actionLabel: "View Report",
      data: JSON.stringify({
        reportId,
        templateId,
        templateName,
        format,
        sentAt: new Date().toISOString(),
        schoolId
      }),
      totalRecipients: recipients.length,
      deliveredCount: recipients.length,
      readCount: 0,
      failedCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.insert(notifications).values(notificationData);

    // Create notification deliveries for each recipient
    const deliveryPromises = recipients.map(async (recipient) => {
      const deliveryId = `delivery-${nanoid()}`;

      await db.insert(notificationDeliveries).values({
        id: deliveryId,
        notificationId,
        userId: recipient.id,
        status: "delivered",
        deliveredAt: new Date(),
        deliveryMethod: "in_app",
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return {
        recipientId: recipient.id,
        recipientName: recipient.name,
        recipientEmail: recipient.email
      };
    });

    const sentTo = await Promise.all(deliveryPromises);

    // Log the send action
    logger.info("Report sent to office", {
      counselorId: currentUser.id,
      reportId,
      templateId,
      recipientType,
      recipientCount: recipients.length,
      sentTo: sentTo.map((s) => s.recipientId)
    });

    return {
      data: {
        reportId,
        notificationId,
        sentAt: new Date().toISOString(),
        sentBy: `${currentUser.firstName} ${currentUser.lastName || ""}`.trim(),
        recipientType,
        recipients: sentTo,
        message: "Report successfully sent to office"
      }
    };
  },
  ["counselor", "admin"]
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getRecipients(
  recipientType: string,
  schoolId: string,
  specificRecipientId?: string
): Promise<Array<{ id: string; name: string; email: string | null }>> {
  if (specificRecipientId) {
    // Send to specific user
    const userResults = await db
      .select()
      .from(users)
      .where(eq(users.id, specificRecipientId))
      .limit(1);

    return userResults.map((u) => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName || ""}`.trim(),
      email: u.email
    }));
  }

  // Get recipients based on type
  switch (recipientType) {
    case "school-admin": {
      // Get all school admins for this school
      const schoolAdmins = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.type, "school-admin"),
            eq(users.schoolId, schoolId)
          )
        );

      return schoolAdmins.map((u) => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName || ""}`.trim(),
        email: u.email
      }));
    }

    case "admin": {
      // Get all platform admins
      const admins = await db
        .select()
        .from(users)
        .where(eq(users.type, "admin"));

      return admins.map((u) => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName || ""}`.trim(),
        email: u.email
      }));
    }

    case "ministry": {
      // Get all ministry users
      const ministryUsers = await db
        .select()
        .from(users)
        .where(eq(users.type, "ministry"));

      return ministryUsers.map((u) => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName || ""}`.trim(),
        email: u.email
      }));
    }

    default:
      return [];
  }
}
