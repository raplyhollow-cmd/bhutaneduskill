import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/skills/count - Get count of skills in progress
 *
 * Returns the number of skills the user has started (level > 0)
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's profile
    const userProfile = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    const userSkills = (userProfile?.settings as any)?.skills || {};

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
    console.error("Error fetching skills count:", error);
    return NextResponse.json({ count: 0 }, { status: 200 });
  }
}
