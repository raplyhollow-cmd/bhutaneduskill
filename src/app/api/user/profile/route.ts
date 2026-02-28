/**
 * USER PROFILE API
 *
 * GET /api/user/profile - Get user profile
 * POST /api/user/profile - Create or update user profile
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";

// Type for user with optional settings field
interface UserWithSettings {
  id: string;
  settings?: Record<string, unknown> | null;
  classGrade?: number | null;
  [key: string]: unknown;
}

// ============================================================================
// GET /api/user/profile - Get user profile
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    // auth is passed by createApiRoute wrapper
    const { user } = auth;

    // User already fetched from DB by requireAuth, just transform and return
    // Note: user only contains selected fields from requireAuth (not full User type)
    const transformedProfile = {
      ...user,
      // Safely access optional fields that may not be selected
      bio: ((user as UserWithSettings).settings)?.bio as string || "",
      grade: (user as UserWithSettings).classGrade ? `Class ${(user as UserWithSettings).classGrade}` : "",
    };

    return successResponse({ profile: transformedProfile, needsSetup: false });
  },
  ["admin", "school-admin", "teacher", "student", "parent", "counselor"] // All authenticated users can access
);

// ============================================================================
// POST /api/user/profile - Create or update user profile
// ============================================================================

export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    // auth is passed by createApiRoute wrapper
    const { user } = auth;
    const body = await request.json();
    logger.info("Updating profile", { userId: user.id });

    const {
      firstName,
      lastName,
      email,
      dateOfBirth,
      grade,
      school,
      interests,
      goals,
      bio,
    } = body;

    // Build update object with only the fields that exist in schema
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // Only update fields that are provided and exist in schema
    if (typeof firstName === "string") updateData.firstName = firstName.trim();
    if (typeof lastName === "string") updateData.lastName = lastName.trim();
    if (typeof email === "string") updateData.email = email.trim();
    if (typeof dateOfBirth === "string") updateData.dateOfBirth = dateOfBirth;
    if (typeof grade === "string" && grade) {
      const gradeNum = parseInt(grade.replace("Class ", "").trim());
      if (!isNaN(gradeNum) && gradeNum > 0) {
        updateData.classGrade = gradeNum;
      }
    }
    if (typeof school === "string") updateData.school = school.trim();
    if (Array.isArray(interests)) updateData.interests = interests;
    if (typeof goals === "string") updateData.goals = goals.trim();
    if (typeof bio === "string") {
      const currentSettings = (user as UserWithSettings).settings || {};
      updateData.settings = { ...currentSettings, bio: bio.trim() };
    }

    logger.debug("User profile update data", { updateData });

    // Perform the update
    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, user.id));

    // Return updated profile
    const updatedUser = { ...user, ...updateData };

    return successResponse({
      success: true,
      profile: updatedUser
    });
  },
  ["admin", "school-admin", "teacher", "student", "parent", "counselor"] // All authenticated users can access
);
