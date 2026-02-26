/**
 * PUSH SUBSCRIPTION API
 *
 * POST /api/push/subscribe - Register or update a push subscription
 *
 * This endpoint allows authenticated users to register their device for push notifications.
 * The subscription object comes from the browser's PushSubscription API.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { pushSubscriptions, pushNotificationSettings } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, notFoundResponse } from "@/lib/api/response-helpers";

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

  try {
    const body: PushSubscriptionRequest = await request.json();

    // Validate required fields
    if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
      return NextResponse.json(
        { error: "Missing required fields: endpoint, keys.p256dh, keys.auth" },
        { status: 400 }
      );
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

      return NextResponse.json({
        success: true,
        data: {
          id: existing[0].id,
          message: "Subscription updated successfully",
        },
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

    return NextResponse.json({
      success: true,
      data: {
        id: subscriptionId,
        message: "Subscription created successfully",
      },
    });
  } catch (error: unknown) {
    logger.apiError(error, {
      route: "/api/push/subscribe",
      method: "POST",
      userId,
    });
    return errorResponse("Failed to register push subscription", 500);
  }
},
  [] // Any authenticated user can subscribe to push notifications
);

// ============================================================================
// GET - Get Current User's Subscriptions
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId } = auth;

  try {
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

    return NextResponse.json({
      success: true,
      data: sanitized,
    });
  } catch (error: unknown) {
    logger.apiError(error, {
      route: "/api/push/subscribe",
      method: "GET",
      userId,
    });
    return errorResponse("Failed to fetch subscriptions", 500);
  }
},
  [] // Any authenticated user can view their subscriptions
);
