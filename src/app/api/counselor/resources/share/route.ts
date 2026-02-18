/**
 * COUNSELOR RESOURCE SHARE API
 *
 * Allows counselors to share resources with students via notifications
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { counselorResources, users } from "@/lib/db/schema";
import { notifications, notificationDeliveries } from "@/lib/db/notifications-schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";

interface ShareResourceRequest {
  resourceId: string;
  studentIds: string[];
  message?: string;
}

// POST /api/counselor/resources/share - Share a resource with students
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(['admin', 'counselor']);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { userId, user } = authResult;
  const body: ShareResourceRequest = await request.json();

  const { resourceId, studentIds, message } = body;

  try {
    // Validate request
    if (!resourceId) {
      return NextResponse.json({ error: "Resource ID is required" }, { status: 400 });
    }

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ error: "At least one student ID is required" }, { status: 400 });
    }

    // Verify the resource exists
    const resource = await db
      .select()
      .from(counselorResources)
      .where(eq(counselorResources.id, resourceId))
      .limit(1);

    if (resource.length === 0) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    // Verify all students exist
    const students = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.type, "student"));

    const validStudentIds = new Set(students.map((s) => s.id));
    const invalidIds = studentIds.filter((id) => !validStudentIds.has(id));

    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: `Invalid student IDs: ${invalidIds.join(", ")}` },
        { status: 400 }
      );
    }

    const now = new Date();
    const notificationId = `notif_${nanoid()}`;
    const resourceUrl = `/counselor/resources/${resourceId}`;

    // Create notification
    const [notification] = await db
      .insert(notifications)
      .values({
        id: notificationId as string,
        title: "New Resource Shared",
        message: message || `A new resource "${resource[0].title}" has been shared with you.`,
        type: "announcement",
        targetAudience: "specific",
        targetUserIds: JSON.stringify(studentIds),
        priority: "normal",
        status: "sent",
        senderId: userId as string,
        senderName: (user.name as string) || "Counselor",
        senderRole: "counselor",
        actionUrl: resourceUrl,
        actionLabel: "View Resource",
        sentAt: now,
        totalRecipients: studentIds.length,
        deliveredCount: studentIds.length,
        readCount: 0,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Create notification deliveries for each student
    const deliveryValues = studentIds.map((studentId) => ({
      id: `delivery_${nanoid()}`,
      notificationId,
      userId: studentId,
      status: "delivered" as const,
      deliveryMethod: "in_app",
      deliveredAt: now,
      createdAt: now,
      updatedAt: now,
    }));

    await db.insert(notificationDeliveries).values(deliveryValues);

    // Increment the share count for the resource (stored in viewCount for now)
    await db
      .update(counselorResources)
      .set({
        viewCount: (resource[0].viewCount || 0) + studentIds.length,
      })
      .where(eq(counselorResources.id, resourceId));

    logger.info("Counselor resource shared with students", {
      resourceId,
      resourceTitle: resource[0].title,
      studentCount: studentIds.length,
      sharedBy: userId,
    });

    return NextResponse.json({
      success: true,
      notificationId,
      sharedWith: studentIds.length,
      message: `Resource shared with ${studentIds.length} student(s)`,
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/counselor/resources/share", method: "POST" });
    return NextResponse.json({ error: "Failed to share resource" }, { status: 500 });
  }
}
