/**
 * Student Settings API
 * Handles profile and notification preferences for students
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, userNotificationSettings, type NewUserNotificationSettings, type UserNotificationSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { createApiRoute, type AuthContext, type AuthenticatedRequest } from "@/lib/api/route-handler";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";

/**
 * GET /api/student/settings - Fetch student settings
 */
export const GET = createApiRoute(
  async (req: NextRequest, auth: AuthContext) => {
    const { user } = auth;

    // Fetch user profile
    const userProfile = await db.select().from(users).where(eq(users.id, user.id)).limit(1);

    if (!userProfile.length) {
      return errorResponse("User not found", 404);
    }

    const currentUser = userProfile[0];

    // Fetch notification settings
    const notificationSettingsResult = await db.select().from(userNotificationSettings).where(eq(userNotificationSettings.userId, user.id)).limit(1);
    let notificationSettings = notificationSettingsResult[0];

    // Create default notification settings if they don't exist
    if (!notificationSettings) {
      const insertData: NewUserNotificationSettings = {
        id: `notif-settings-${user.id}`,
        userId: user.id,
        emailEnabled: true,
        emailAnnouncements: true,
        emailAlerts: true,
        emailReminders: true,
        inAppEnabled: true,
        inAppAnnouncements: true,
        inAppAlerts: true,
        inAppReminders: true,
        quietHoursStart: "22:00",
        quietHoursEnd: "07:00",
      };
      const [newSettings] = await db.insert(userNotificationSettings).values(insertData).returning();

      notificationSettings = newSettings;
    }

    // Extract bio from settings JSON
    const bio = (currentUser.settings as { bio?: string })?.bio || "";

    logger.info("Student settings fetched", { userId: user.id, route: "/api/student/settings" });

    return successResponse({
      profile: {
        ...currentUser,
        bio,
      },
      notifications: notificationSettings,
    });
  }
);

/**
 * PATCH /api/student/settings - Update student settings
 */
export const PATCH = createApiRoute(
  async (req: NextRequest, auth: AuthContext) => {
    const { user } = auth;
    const body = await req.json();

    logger.info("Updating student settings", { userId: user.id, route: "/api/student/settings" });

    // Get current user to merge with settings
    const currentUserResult = await db.select().from(users).where(eq(users.id, user.id)).limit(1);

    if (!currentUserResult.length) {
      return errorResponse("User not found", 404);
    }

    const currentUser = currentUserResult[0];

    // Separate profile and notification updates
    interface ProfileUpdateData {
      firstName?: string;
      lastName?: string;
      name?: string;
      phone?: string | null;
      dateOfBirth?: string | null;
      gender?: string | null;
      address?: string | null;
      city?: string | null;
      state?: string | null;
      postalCode?: string | null;
      country?: string;
      interests?: string[];
      goals?: string | null;
      profileImage?: string | null;
      settings?: Record<string, unknown>;
      updatedAt: Date;
    }

    interface NotificationUpdateData {
      emailEnabled?: boolean;
      emailAnnouncements?: boolean;
      emailAlerts?: boolean;
      emailReminders?: boolean;
      inAppEnabled?: boolean;
      inAppAnnouncements?: boolean;
      inAppAlerts?: boolean;
      inAppReminders?: boolean;
      quietHoursStart?: string;
      quietHoursEnd?: string;
      updatedAt?: Date;
    }

    const profileData: ProfileUpdateData = { updatedAt: new Date() };
    const notificationData: NotificationUpdateData = {};
    let bioValue: string | undefined;

    // Profile fields
    const profileFields = [
      'firstName', 'lastName', 'phone', 'dateOfBirth', 'gender',
      'address', 'city', 'state', 'postalCode', 'country', 'interests', 'goals', 'profileImage'
    ];

    // Notification fields
    const notificationFields = [
      'emailEnabled', 'emailAnnouncements', 'emailAlerts', 'emailReminders',
      'inAppEnabled', 'inAppAnnouncements', 'inAppAlerts', 'inAppReminders',
      'quietHoursStart', 'quietHoursEnd'
    ];

    // Categorize fields
    for (const [key, value] of Object.entries(body)) {
      if (key === 'bio') {
        // Bio is stored in settings JSON
        bioValue = value as string;
      } else if (profileFields.includes(key)) {
        profileData[key] = value;
      } else if (notificationFields.includes(key)) {
        notificationData[key] = value;
      }
    }

    // Handle name updates
    if (typeof profileData.firstName === 'string' || typeof profileData.lastName === 'string') {
      const firstName = profileData.firstName ?? currentUser.firstName;
      const lastName = profileData.lastName ?? currentUser.lastName;
      profileData.name = `${firstName} ${lastName}`.trim();
    }

    // Handle settings update (including bio)
    const currentSettings = (currentUser.settings as Record<string, unknown>) || {};
    if (bioValue !== undefined) {
      profileData.settings = {
        ...currentSettings,
        bio: bioValue,
      };
    }

    // Update profile if there are profile changes
    let updatedProfile = currentUser;
    if (Object.keys(profileData).length > 1) { // More than just updatedAt
      const [updated] = await db.update(users)
        .set(profileData)
        .where(eq(users.id, user.id))
        .returning();

      updatedProfile = updated;
    }

    // Update notification settings if there are notification changes
    let updatedNotifications: UserNotificationSettings | null = null;
    if (Object.keys(notificationData).length > 0) {
      // Check if notification settings exist
      const existingResult = await db.select().from(userNotificationSettings).where(eq(userNotificationSettings.userId, user.id)).limit(1);
      const existing = existingResult[0];

      if (existing) {
        const [updated] = await db.update(userNotificationSettings)
          .set({ ...notificationData, updatedAt: new Date() })
          .where(eq(userNotificationSettings.userId, user.id))
          .returning();
        updatedNotifications = updated;
      } else {
        // Create new notification settings
        const insertData: NewUserNotificationSettings = {
          id: `notif-settings-${user.id}`,
          userId: user.id,
          emailEnabled: notificationData.emailEnabled ?? true,
          emailAnnouncements: notificationData.emailAnnouncements ?? true,
          emailAlerts: notificationData.emailAlerts ?? true,
          emailReminders: notificationData.emailReminders ?? true,
          inAppEnabled: notificationData.inAppEnabled ?? true,
          inAppAnnouncements: notificationData.inAppAnnouncements ?? true,
          inAppAlerts: notificationData.inAppAlerts ?? true,
          inAppReminders: notificationData.inAppReminders ?? true,
          quietHoursStart: notificationData.quietHoursStart ?? "22:00",
          quietHoursEnd: notificationData.quietHoursEnd ?? "07:00",
        };
        const [created] = await db.insert(userNotificationSettings).values(insertData).returning();
        updatedNotifications = created;
      }
    }

    logger.info("Student settings updated successfully", { userId: user.id });

    return successResponse({
      profile: updatedProfile,
      notifications: updatedNotifications,
    });
  },
  ['student']
);