import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/saved-careers - Get user's saved careers
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(['student']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const userProfile = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
    });

    const settings = (userProfile?.settings as any) || {};
    const savedCareers = settings.savedCareers || [];

    return NextResponse.json({ savedCareers });
  } catch (error) {
    logger.error("Error fetching saved careers:", error);
    return NextResponse.json({ savedCareers: [] }, { status: 200 });
  }
}

// POST /api/saved-careers - Save or unsave a career
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(['student']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const body = await req.json();
    const { careerId, action } = body; // action: 'save' or 'unsave'

    const userProfile = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
    });

    if (!userProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const settings = (userProfile?.settings as any) || {};
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
      .where(eq(users.id, userProfile.id));

    return NextResponse.json({ success: true, savedCareers });
  } catch (error) {
    logger.error("Error updating saved careers:", error);
    return NextResponse.json({ error: "Failed to update saved careers" }, { status: 500 });
  }
}
