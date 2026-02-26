/**
 * PUSH NOTIFICATION SETTINGS API
 *
 * GET /api/push/settings - Get user's push notification settings
 * PUT /api/push/settings - Update user's push notification settings
 *
 * This endpoint allows authenticated users to manage their push notification preferences.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { getPushNotificationSettings, updatePushNotificationSettings } from "@/lib/push/push-sender";
import { logger } from "@/lib/logger";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, notFoundResponse } from "@/lib/api/response-helpers";

// ============================================================================
// GET - Get Push Notification Settings
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId } = auth;

  try {
    const settings = await getPushNotificationSettings(userId);

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error: unknown) {
    logger.apiError(error, {
      route: "/api/push/settings",
      method: "GET",
      userId,
    });
    return errorResponse("Failed to fetch settings", 500);
  }
},
  [] // Any authenticated user can access their settings
);

// ============================================================================
// PUT - Update Push Notification Settings
// ============================================================================

interface UpdateSettingsRequest {
  enabled?: boolean;
  homeworkEnabled?: boolean;
  announcementEnabled?: boolean;
  gradeEnabled?: boolean;
  attendanceEnabled?: boolean;
  reminderEnabled?: boolean;
  alertEnabled?: boolean;
  messageEnabled?: boolean;
  feeEnabled?: boolean;
  timetableEnabled?: boolean;
  examEnabled?: boolean;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  quietHoursOnlyOnMobile?: boolean;
}

export const PUT = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId } = auth;

  try {
    const body: UpdateSettingsRequest = await request.json();

    // Validate quiet hours format if provided
    if (body.quietHoursStart && !/^\d{2}:\d{2}$/.test(body.quietHoursStart)) {
      return NextResponse.json(
        { error: "quietHoursStart must be in HH:MM format" },
        { status: 400 }
      );
    }

    if (body.quietHoursEnd && !/^\d{2}:\d{2}$/.test(body.quietHoursEnd)) {
      return NextResponse.json(
        { error: "quietHoursEnd must be in HH:MM format" },
        { status: 400 }
      );
    }

    const settings = await updatePushNotificationSettings(userId, body);

    logger.info("Push notification settings updated", { userId });

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error: unknown) {
    logger.apiError(error, {
      route: "/api/push/settings",
      method: "PUT",
      userId,
    });
    return errorResponse("Failed to update settings", 500);
  }
},
  [] // Any authenticated user can update their own settings
);
