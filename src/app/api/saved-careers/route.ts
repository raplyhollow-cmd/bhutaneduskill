/**
 * SAVED CAREERS API
 *
 * GET /api/saved-careers - Get user's saved careers
 * POST /api/saved-careers - Save or unsave a career
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 * FIXED: Removed db.query usage (disabled in neon-http driver)
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, notFoundResponse } from "@/lib/api/response-helpers";
import type { UserSettings } from "@/types";

// ============================================================================
// GET /api/saved-careers - Get user's saved careers
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId } = auth;

    // Using db.select() instead of db.query (neon-http driver)
    const userProfile = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const settings = (userProfile[0]?.settings as UserSettings | null | undefined) || {};
    const savedCareers = settings.savedCareers || [];

    return successResponse({ savedCareers });
  },
  ['student']
);

// ============================================================================
// POST /api/saved-careers - Save or unsave a career
// ============================================================================

export const POST = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId } = auth;
    const body = await request.json();
    const { careerId, action } = body; // action: 'save' or 'unsave'

    // Using db.select() instead of db.query (neon-http driver)
    const userProfile = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userProfile[0]) {
      return notFoundResponse("User");
    }

    const settings = (userProfile[0]?.settings as UserSettings | null | undefined) || {};
    let savedCareers = settings.savedCareers || [];

    if (action === "save") {
      if (!savedCareers.includes(careerId)) {
        savedCareers.push(careerId);
      }
    } else if (action === "unsave") {
      savedCareers = savedCareers.filter((id: string) => id !== careerId);
    }

    await db
      .update(users)
      .set({
        settings: { ...settings, savedCareers },
        updatedAt: new Date(),
      })
      .where(eq(users.id, userProfile[0].id));

    return successResponse({ success: true, savedCareers });
  },
  ['student']
);
