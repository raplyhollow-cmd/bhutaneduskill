/**
 * TEST NOTIFICATION API
 *
 * DEVELOPMENT ONLY endpoint for testing the notification system.
 * DISABLED IN PRODUCTION for security.
 *
 * POST /api/test/notifications
 *
 * SECURITY: This endpoint is only accessible in development mode by admins.
 * In production, it returns a 404 response.
 *
 * @example
 * ```bash
 * curl -X POST http://localhost:3000/api/test/notifications
 * ```
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { sendNotification } from "@/lib/notifications/send";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  // SECURITY: Disable in production
  const isDevelopment = process.env.NODE_ENV === "development";
  if (!isDevelopment) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404 }
    );
  }

  try {
    const authResult = await requireAuth(['admin']);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { userId, user } = authResult;
    const { searchParams } = new URL(req.url);

    // Get test type from query params
    const type = searchParams.get("type") || "announcement";
    const priority = searchParams.get("priority") || "normal";

    // Generate test message based on type
    const testMessages: Record<string, { title: string; message: string; actionUrl?: string }> = {
      homework: {
        title: "Homework Due Soon",
        message: "Your Mathematics homework is due tomorrow at 5:00 PM.",
        actionUrl: "/student/homework",
      },
      assessment: {
        title: "New Assessment Posted",
        message: "A new Science assessment has been posted. Due date: March 5, 2026.",
        actionUrl: "/student/assessment",
      },
      grade: {
        title: "Grade Posted",
        message: "Your grade for the Mathematics midterm is now available.",
        actionUrl: "/student/results",
      },
      attendance: {
        title: "Attendance Recorded",
        message: "Your attendance for today has been marked as present.",
        actionUrl: "/student/attendance",
      },
      fee: {
        title: "Fee Payment Reminder",
        message: "Your fee payment of Nu. 1,500 is due within 7 days.",
        actionUrl: "/student/fees",
      },
      announcement: {
        title: "Test Announcement",
        message: `This is a test notification sent at ${new Date().toLocaleTimeString()}.`,
      },
      alert: {
        title: "Urgent Alert",
        message: "This is a test urgent notification. Please acknowledge receipt.",
      },
    };

    const testConfig = testMessages[type] || testMessages.announcement;

    // Send notification
    const result = await sendNotification({
      userId,
      title: testConfig.title,
      message: testConfig.message,
      type: type as "announcement" | "alert" | "reminder" | "system" | "welcome" | "homework" | "grade" | "attendance",
      priority: priority as "low" | "normal" | "high" | "urgent",
      actionUrl: testConfig.actionUrl,
      senderId: "system",
      senderName: "Test System",
      senderRole: "system",
    });

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to send notification", details: result.error },
        { status: 500 }
      );
    }

    logger.info("Test notification sent", {
      userId,
      notificationId: result.notificationId,
      type,
      priority,
    });

    return NextResponse.json({
      success: true,
      message: "Test notification sent successfully",
      data: {
        notificationId: result.notificationId,
        type,
        priority,
        title: testConfig.title,
        message: testConfig.message,
        sentAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.apiError(error, {
      route: "/api/test/notifications",
      method: "POST",
    });
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/test/notifications
 *
 * Returns available test notification types
 * DISABLED IN PRODUCTION
 */
export async function GET() {
  const isDevelopment = process.env.NODE_ENV === "development";
  if (!isDevelopment) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    message: "Test notification API (Development Only)",
    usage: "POST /api/test/notifications?type=homework&priority=high",
    availableTypes: [
      { type: "announcement", description: "General announcement" },
      { type: "homework", description: "Homework reminder" },
      { type: "assessment", description: "Assessment posted" },
      { type: "grade", description: "Grade posted" },
      { type: "attendance", description: "Attendance recorded" },
      { type: "fee", description: "Fee payment reminder" },
      { type: "alert", description: "Urgent alert" },
    ],
    availablePriorities: ["low", "normal", "high", "urgent"],
    warning: "This endpoint is disabled in production",
  });
}
