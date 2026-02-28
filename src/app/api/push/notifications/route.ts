/**
 * PUSH NOTIFICATIONS HISTORY API
 *
 * GET /api/push/notifications - Get user's push notification history
 *
 * This endpoint allows authenticated users to view their push notification history.
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { pushNotifications } from "@/lib/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse } from "@/lib/api/response-helpers";
import type { Pagination } from "@/types";

// ============================================================================
// GET - Get Push Notification History
// ============================================================================

export const GET = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;
    const { searchParams } = new URL(req.url);

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
      // Type assertion needed for enum column
      const validStatuses = ["pending", "sent", "delivered", "failed"] as const;
      if (validStatuses.includes(status as any)) {
        conditions.push(eq(pushNotifications.status, status as any));
      }
    }

    if (type) {
      // Type assertion needed for enum column
      const validTypes = ["fee", "message", "grade", "announcement", "alert", "reminder", "homework", "attendance", "timetable", "exam"] as const;
      if (validTypes.includes(type as any)) {
        conditions.push(eq(pushNotifications.type, type as any));
      }
    }

    const whereClause = and(...conditions);

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(pushNotifications)
      .where(whereClause);

    const total = countResult[0]?.count ?? 0;

    // Fetch notifications
    const notifications = await db
      .select()
      .from(pushNotifications)
      .where(whereClause)
      .orderBy(desc(pushNotifications.createdAt))
      .limit(limit)
      .offset(offset);

    const pagination: Pagination = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };

    return successResponse({
      notifications,
      pagination,
    });
  },
  [] // Any authenticated user can view their push notification history
);
