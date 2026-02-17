import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth-utils";
import { eq } from "drizzle-orm";

/**
 * GET /api/skills/count - Get count of skills in progress
 *
 * Returns the number of skills the user has started (level > 0)
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(['student']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;

    const userSkills = (user?.settings as any)?.skills || {};

    // Count skills with level > 0
    let skillsInProgress = 0;
    for (const skill in Object.keys(userSkills)) {
      if (userSkills[skill] > 0) {
        skillsInProgress++;
      }
    }

    return NextResponse.json({
      count: skillsInProgress
    });
  } catch (error) {
    logger.error("Error fetching skills count:", error);
    return NextResponse.json({ count: 0 }, { status: 200 });
  }
}
