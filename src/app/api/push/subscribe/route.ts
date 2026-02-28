/**
 * PUSH SUBSCRIPTION API
 *
 * POST /api/push/subscribe - Register or update a push subscription
 * GET /api/push/subscribe - Get user's current subscriptions
 *
 * This endpoint allows authenticated users to register their device for push notifications.
 * The subscription object comes from the browser's PushSubscription API.
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { pushSubscriptions, pushNotificationSettings } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, badRequestResponse } from "@/lib/api/response-helpers";

// ============================================================================
// TYPES
// ============================================================================

interface PushSubscriptionRequest {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  deviceType?: string;
}

// ============================================================================
// POST - Register/Update Push Subscription
// ============================================================================

export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId } = auth;

    const body: PushSubscriptionRequest = await request.json();

    // Validate required fields
    if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
      return badRequestResponse("Missing required fields: endpoint, keys.p256dh, keys.auth");
    }

    const now = new Date();

    // Check if subscription already exists for this user
    const existing = await db
      .select()
      .from(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, userId),
          eq(pushSubscriptions.endpoint, body.endpoint)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing subscription
      await db
        .update(pushSubscriptions)
        .set({
          keys: body.keys,
          userAgent: body.userAgent,
          deviceType: body.deviceType,
          isActive: true,
          lastUsedAt: now,
          updatedAt: now,
        })
        .where(eq(pushSubscriptions.id, existing[0].id));

      logger.info("Push subscription updated", {
        userId,
        subscriptionId: existing[0].id,
      });

      return successResponse({
        id: existing[0].id,
        message: "Subscription updated successfully",
      });
    }

    // Create new subscription
    const subscriptionId = `push-sub-${nanoid()}`;
    await db.insert(pushSubscriptions).values({
      id: subscriptionId,
      userId,
      endpoint: body.endpoint,
      keys: body.keys,
      userAgent: body.userAgent,
      deviceType: body.deviceType,
      isActive: true,
      lastUsedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    // Ensure user has notification settings (create defaults if not exists)
    const existingSettings = await db
      .select()
      .from(pushNotificationSettings)
      .where(eq(pushNotificationSettings.userId, userId))
      .limit(1);

    if (existingSettings.length === 0) {
      await db.insert(pushNotificationSettings).values({
        id: `push-settings-${nanoid()}`,
        userId,
        enabled: true,
        homeworkEnabled: true,
        announcementEnabled: true,
        gradeEnabled: true,
        attendanceEnabled: true,
        reminderEnabled: true,
        alertEnabled: true,
        messageEnabled: true,
        feeEnabled: true,
        timetableEnabled: true,
        examEnabled: true,
        quietHoursEnabled: false,
        quietHoursOnlyOnMobile: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    logger.info("Push subscription created", {
      userId,
      subscriptionId,
    });

    return successResponse({
      id: subscriptionId,
      message: "Subscription created successfully",
    });
  },
  [] // Any authenticated user can subscribe to push notifications
);

// ============================================================================
// GET - Get Current User's Subscriptions
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId } = auth;

    const subscriptions = await db
      .select({
        id: pushSubscriptions.id,
        endpoint: pushSubscriptions.endpoint,
        deviceType: pushSubscriptions.deviceType,
        isActive: pushSubscriptions.isActive,
        createdAt: pushSubscriptions.createdAt,
        lastUsedAt: pushSubscriptions.lastUsedAt,
      })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId))
      .orderBy(pushSubscriptions.createdAt);

    // Return only non-sensitive info
    const sanitized = subscriptions.map((sub) => ({
      ...sub,
      // Truncate endpoint for display
      endpointDisplay: sub.endpoint.substring(0, 50) + "...",
    }));

    return successResponse(sanitized);
  },
  [] // Any authenticated user can view their subscriptions
);
