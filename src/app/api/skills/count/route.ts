/**
 * SKILLS COUNT API
 *
 * GET /api/skills/count - Get count of skills in progress
 *
 * Returns the number of skills the user has started (level > 0)
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse } from "@/lib/api/response-helpers";
import type { UserSettings } from "@/types";

export const GET = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return { error: "Unauthorized", status: 401 };
    }

    const { userId } = auth;

    const userRecords = await db
      .select({
        id: users.id,
        settings: users.settings,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const userSettings = (userRecords[0]?.settings as UserSettings | null | undefined) || {};
    const userSkills = (userSettings?.skills as Record<string, number> | undefined) || {};

    // Count skills with level > 0
    let skillsInProgress = 0;
    for (const skill of Object.keys(userSkills)) {
      if (userSkills[skill] > 0) {
        skillsInProgress++;
      }
    }

    return successResponse({ count: skillsInProgress });
  },
  ['student']
);
