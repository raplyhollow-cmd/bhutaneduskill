/**
 * Announcements API
 *
 * GET /api/communication/announcements - Fetch announcements
 * POST /api/communication/announcements - Create new announcement
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { announcements, users, type announcements as AnnouncementsTable } from "@/lib/db/schema";
import { eq, and, desc, or, sql, count } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, badRequestResponse, notFoundResponse } from "@/lib/api/response-helpers";

// Type for announcement insert data
type AnnouncementInsert = typeof AnnouncementsTable.$inferInsert;

// ============================================================================
// GET /api/communication/announcements
// ============================================================================

export const GET = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId, user } = auth;
    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get("schoolId");
    const isPublished = searchParams.get("isPublished") === "true" ? true : searchParams.get("isPublished") === "false" ? false : undefined;
    const isPinned = searchParams.get("isPinned") === "true" ? true : searchParams.get("isPinned") === "false" ? false : undefined;
    const priority = searchParams.get("priority");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get current user info to determine school and role
    const [userInfo] = await db
      .select({ schoolId: users.schoolId, type: users.type })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userInfo) {
      return notFoundResponse("User");
    }

    const effectiveSchoolId = schoolId || userInfo.schoolId;
    if (!effectiveSchoolId) {
      return successResponse({ announcements: [], total: 0 });
    }

    // Build conditions
    const conditions = [
      eq(announcements.schoolId, effectiveSchoolId),
      eq(announcements.isArchived, false),
    ];

    if (isPublished !== undefined) {
      conditions.push(eq(announcements.isPublished, isPublished));
    }

    if (isPinned !== undefined) {
      conditions.push(eq(announcements.isPinned, isPinned));
    }

    if (priority) {
      conditions.push(eq(announcements.priority, priority as "low" | "normal" | "high" | "urgent"));
    }

    // Filter by audience based on user type
    const audienceConditions = [
      eq(announcements.targetAudience, "all"),
    ];
    if (userInfo.type === "student") {
      audienceConditions.push(eq(announcements.targetAudience, "students"));
    } else if (userInfo.type === "teacher") {
      audienceConditions.push(eq(announcements.targetAudience, "teachers"));
    } else if (userInfo.type === "parent") {
      audienceConditions.push(eq(announcements.targetAudience, "parents"));
    } else if (userInfo.type === "counselor") {
      audienceConditions.push(eq(announcements.targetAudience, "counselor"));
    } else if (userInfo.type === "admin") {
      audienceConditions.push(eq(announcements.targetAudience, "staff"));
    }
    const audienceFilter = or(...audienceConditions);
    if (audienceFilter) {
      conditions.push(audienceFilter);
    }

    // Exclude expired announcements
    const now = new Date().toISOString();
    const expiryFilter = or(
      sql`${announcements.expiryDate} IS NULL`,
      sql`${announcements.expiryDate} > ${now}`
    );
    if (expiryFilter) {
      conditions.push(expiryFilter);
    }

    // Get total count
    const [{ value: total }] = await db
      .select({ value: count() })
      .from(announcements)
      .where(and(...conditions));

    // Fetch announcements
    const results = await db
      .select()
      .from(announcements)
      .where(and(...conditions))
      .orderBy(desc(announcements.isPinned), desc(announcements.createdAt))
      .limit(limit)
      .offset(offset);

    return successResponse({
      announcements: results,
      total,
      limit,
      offset,
    });
  },
  ['admin', 'school-admin', 'teacher']
);

// ============================================================================
// POST /api/communication/announcements
// ============================================================================

export const POST = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;
    const body = await req.json();

    // Validate required fields
    if (!body.title || !body.content) {
      return badRequestResponse("Title and content are required");
    }

    // Get user info
    const [userInfo] = await db
      .select({ schoolId: users.schoolId, firstName: users.firstName, lastName: users.lastName, role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userInfo || !userInfo.schoolId) {
      return notFoundResponse("School");
    }

    const authorName = `${userInfo.firstName} ${userInfo.lastName || ""}`.trim();
    const now = new Date();

    const [announcement] = await db
      .insert(announcements)
      .values({
        id: `ann_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        schoolId: userInfo.schoolId,
        classId: null,
        authorId: userId,
        authorName,
        authorRole: userInfo.role || "school-admin",
        title: body.title,
        content: body.content,
        excerpt: body.excerpt || "",
        targetAudience: body.targetAudience || "all",
        targetGradeLevel: body.targetGradeLevel || "",
        targetClassIds: body.targetClassIds || null,
        targetUserIds: body.targetUserIds || null,
        priority: body.priority || "normal",
        category: body.category || "general",
        isPinned: !!body.isPinned,
        isPublished: !!body.isPublished,
        viewCount: 0,
        isArchived: false,
        attachments: body.attachments || [],
        publishDate: body.publishDate ? new Date(body.publishDate).toISOString() : new Date().toISOString(),
        expiryDate: body.expiryDate ? new Date(body.expiryDate).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        publishedAt: body.isPublished ? now : new Date(0),
        createdAt: now,
        updatedAt: now,
      } satisfies AnnouncementInsert)
      .returning();

    logger.info("Announcement created", { userId, announcementId: announcement.id });

    return successResponse({ announcement }, 201);
  },
  ['admin', 'school-admin', 'teacher']
);
