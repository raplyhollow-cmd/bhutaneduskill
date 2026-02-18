/**
 * NOTICES API
 * Create and manage school notices and announcements
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { notices, users, schools } from "@/lib/db/schema";
import { eq, and, desc, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { nanoid } from "nanoid";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

/**
 * GET /api/notices
 * Fetch notices for user's school
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get("schoolId");
    const userType = searchParams.get("userType");
    const grade = searchParams.get("grade");

    // Get user's school if not provided
    let targetSchoolId = schoolId;
    if (!targetSchoolId) {
      const [user] = await db
        .select({ schoolId: users.schoolId, type: users.type })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user) {
        targetSchoolId = user.schoolId!;
      }
    }

    if (!targetSchoolId) {
      return NextResponse.json({
        error: "School not found",
      }, { status: 404 });
    }

    // Build query for published notices
    const now = new Date();
    const conditions = [
      eq(notices.schoolId, targetSchoolId),
      eq(notices.isPublished, true),
      or(
        eq(notices.expiryDate, null),
        // @ts-ignore - Drizzle ORM handles null comparison
        eq(notices.expiryDate, undefined)
      )
    ];

    // Fetch notices
    const noticesList = await db
      .select({
        id: notices.id,
        title: notices.title,
        content: notices.content,
        category: notices.category,
        priority: notices.priority,
        targetAudience: notices.targetAudience,
        isPinned: notices.isPinned,
        createdAt: notices.createdAt,
        expiryDate: notices.expiryDate,
      })
      .from(notices)
      .where(and(...conditions))
      .orderBy(desc(notices.isPinned), desc(notices.createdAt));

    // Filter by audience
    const filteredNotices = noticesList.filter((notice) => {
      if (notice.targetAudience === "all") return true;
      if (notice.targetAudience === "students" && userType === "student") return true;
      if (notice.targetAudience === "teachers" && userType === "teacher") return true;
      if (notice.targetAudience === "parents" && userType === "parent") return true;
      return false;
    });

    logger.info("Fetched notices", { userId, count: filteredNotices.length });

    return NextResponse.json({
      data: { notices: filteredNotices },
    } satisfies ApiSuccess<any>);
  } catch (error) {
    logger.apiError(error, { route: "/api/notices", method: "GET" });
    return NextResponse.json({
      error: "Failed to fetch notices",
    }, { status: 500 });
  }
}

/**
 * POST /api/notices
 * Create a new notice (School Admin only)
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(["school_admin", "admin"]);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const body = await req.json();
    const {
      title,
      content,
      category = "general",
      priority = "normal",
      targetAudience = "all",
      targetGrade,
      targetSection,
      isPinned = false,
    } = body;

    if (!title || !content) {
      return NextResponse.json({
        error: "Title and content are required",
      }, { status: 400 });
    }

    // Get school ID
    const [user] = await db
      .select({ schoolId: users.schoolId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.schoolId) {
      return NextResponse.json({
        error: "School not found",
      }, { status: 404 });
    }

    // Create notice
    const [newNotice] = await db
      .insert(notices)
      .values({
        id: nanoid(),
        schoolId: user.schoolId,
        createdBy: userId,
        title,
        content,
        category,
        priority,
        targetAudience,
        targetGrade,
        targetSection,
        isPinned,
        isPublished: true,
        publishAt: new Date(),
        viewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    logger.info("Notice created", { userId, noticeId: newNotice.id });

    return NextResponse.json({
      data: newNotice,
    } satisfies ApiSuccess<any>);
  } catch (error) {
    logger.apiError(error, { route: "/api/notices", method: "POST" });
    return NextResponse.json({
      error: "Failed to create notice",
    }, { status: 500 });
  }
}
