/**
 * NOTICES API
 * Create and manage school notices and announcements
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { notices, users, schools } from "@/lib/db/schema";
import { eq, and, desc, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { nanoid } from "nanoid";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, notFoundResponse } from "@/lib/api/response-helpers";

/**
 * GET /api/notices
 * Fetch notices for user's school
 */
export const GET = createApiRoute(
  async (req: NextRequest) => {
    const auth = getAuth(req);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId } = auth;

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
      return notFoundResponse("School");
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

    return successResponse({ notices: filteredNotices });
  },
  []
);

/**
 * POST /api/notices
 * Create a new notice (School Admin only)
 */
export const POST = createApiRoute(
  async (req: NextRequest) => {
    const auth = getAuth(req);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId } = auth;

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
      return badRequestResponse("Title and content are required");
    }

    // Get school ID
    const [user] = await db
      .select({ schoolId: users.schoolId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.schoolId) {
      return notFoundResponse("School");
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

    return successResponse(newNotice);
  },
  ['school-admin', 'admin']
);
