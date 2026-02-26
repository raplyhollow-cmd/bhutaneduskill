/**
 * PUSH UNSUBSCRIBE API
 *
 * POST /api/push/unsubscribe - Remove a push subscription
 *
 * This endpoint allows authenticated users to remove a device from push notifications.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { logger } from "@/lib/logger";

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

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { userId } = authResult;

  try {
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

      return NextResponse.json({
        success: true,
        data: {
          message: "Unsubscribed from all devices",
        },
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

      return NextResponse.json({
        success: true,
        data: {
          message: "Subscription removed",
        },
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

      return NextResponse.json({
        success: true,
        data: {
          message: "Subscription removed",
        },
      });
    }

    return NextResponse.json(
      { error: "Must provide subscriptionId, endpoint, or all: true" },
      { status: 400 }
    );
  } catch (error: unknown) {
    logger.apiError(error, {
      route: "/api/push/unsubscribe",
      method: "POST",
      userId,
    });
    return NextResponse.json(
      { error: "Failed to unsubscribe", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
