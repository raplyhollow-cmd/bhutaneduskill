/**
 * PUSH NOTIFICATIONS HISTORY API
 *
 * GET /api/push/notifications - Get user's push notification history
 *
 * This endpoint allows authenticated users to view their push notification history.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { pushNotifications } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { logger } from "@/lib/logger";

// ============================================================================
// GET - Get Push Notification History
// ============================================================================

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { userId } = authResult;
  const { searchParams } = new URL(request.url);

  try {
    // Parse query parameters
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const offset = (page - 1) * limit;

    // Filters
    const status = searchParams.get("status"); // "pending", "sent", "delivered", "failed"
    const type = searchParams.get("type");

    // Build where conditions
    const conditions = [eq(pushNotifications.userId, userId)];

    if (status) {
      conditions.push(eq(pushNotifications.status, status as any));
    }

    if (type) {
      conditions.push(eq(pushNotifications.type, type as any));
    }

    const whereClause = and(...conditions);

    // Get total count
    const countResult = await db
      .select({ count: { count: "count(*)" } as any })
      .from(pushNotifications)
      .where(whereClause);

    const total = countResult[0]?.count?.count || 0;

    // Fetch notifications
    const notifications = await db
      .select()
      .from(pushNotifications)
      .where(whereClause)
      .orderBy(desc(pushNotifications.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    logger.apiError(error, {
      route: "/api/push/notifications",
      method: "GET",
      userId,
    });
    return NextResponse.json(
      { error: "Failed to fetch push notifications", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
