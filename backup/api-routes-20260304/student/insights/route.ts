import { NextRequest } from "next/server";
import { intelligenceEngine } from "@/lib/intelligence/engine";
import { createApiRoute } from "@/lib/api/route-handler";
import { logger } from "@/lib/logger";
import { successResponse, badRequestResponse } from "@/lib/api/response-helpers";

/**
 * GET /api/student/insights
 *
 * Get all active insights for the current student
 *
 * Response:
 * {
 *   insights: Insight[],
 *   unreadCount: number
 * }
 */
export const GET = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;

    // Get insights for student
    const insights = await intelligenceEngine.getInsights(userId, 20);

    // Count unread
    const unreadCount = insights.filter((i) => !i.isRead).length;

    logger.info(`Retrieved ${insights.length} insights for student ${userId}`);

    return successResponse({
      insights,
      unreadCount,
      hasInsights: insights.length > 0,
    });
  },
  ["student"]
);

/**
 * PATCH /api/student/insights
 *
 * Mark insights as read or dismissed
 *
 * Body:
 * {
 *   insightId: string,
 *   action: "read" | "dismiss"
 * }
 */
export const PATCH = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;
    const body = await req.json();
    const { insightId, action } = body as { insightId: string; action: "read" | "dismiss" };

    if (!insightId || !action) {
      return badRequestResponse("insightId and action are required");
    }

    if (action === "read") {
      await intelligenceEngine.markAsRead(insightId);
    } else if (action === "dismiss") {
      await intelligenceEngine.dismissInsight(insightId);
    }

    logger.info(`Student ${userId} ${action}d insight ${insightId}`);

    return successResponse({ success: true });
  },
  ["student"]
);
