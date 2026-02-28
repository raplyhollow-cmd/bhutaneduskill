/**
 * PUSH UNSUBSCRIBE API
 *
 * POST /api/push/unsubscribe - Remove a push subscription
 *
 * This endpoint allows authenticated users to remove a device from push notifications.
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, badRequestResponse } from "@/lib/api/response-helpers";

// ============================================================================
// TYPES
// ============================================================================

interface UnsubscribeRequest {
  endpoint?: string; // Unsubscribe specific endpoint
  all?: boolean; // Unsubscribe all devices
  subscriptionId?: string; // Unsubscribe by subscription ID
}

// ============================================================================
// POST - Unsubscribe from Push Notifications
// ============================================================================

export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId } = auth;

    const body: UnsubscribeRequest = await request.json();

    if (body.all) {
      // Unsubscribe all devices for this user
      await db
        .update(pushSubscriptions)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(pushSubscriptions.userId, userId));

      logger.info("Unsubscribed all devices", { userId });

      return successResponse({
        message: "Unsubscribed from all devices",
      });
    }

    if (body.subscriptionId) {
      // Unsubscribe specific subscription by ID
      await db
        .update(pushSubscriptions)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(pushSubscriptions.id, body.subscriptionId),
            eq(pushSubscriptions.userId, userId)
          )
        );

      logger.info("Unsubscribed by subscription ID", { userId, subscriptionId: body.subscriptionId });

      return successResponse({
        message: "Subscription removed",
      });
    }

    if (body.endpoint) {
      // Unsubscribe specific endpoint
      await db
        .update(pushSubscriptions)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(pushSubscriptions.endpoint, body.endpoint),
            eq(pushSubscriptions.userId, userId)
          )
        );

      logger.info("Unsubscribed by endpoint", { userId });

      return successResponse({
        message: "Subscription removed",
      });
    }

    return badRequestResponse("Must provide subscriptionId, endpoint, or all: true");
  },
  [] // Any authenticated user can unsubscribe
);
