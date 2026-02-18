import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { announcements, users } from "@/lib/db/schema";
import { eq, and, desc, or, sql, count } from "drizzle-orm";

// ============================================================================
// ANNOUNCEMENTS API
// ============================================================================

/**
 * GET /api/communication/announcements
 *
 * Fetch announcements for the current user
 * Query params:
 * - schoolId: filter by school
 * - isPublished: filter by published status
 * - isPinned: filter by pinned status
 * - priority: filter by priority (low, normal, high, urgent)
 * - limit: max number of results
 * - offset: pagination offset
 */
export async function GET(request: NextRequest) {
  // Auth: admin, school-admin, teacher can read announcements
  const authResult = await requireAuth(['admin', 'school-admin', 'teacher']);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }
  const { userId, user } = authResult;

  try {
    const { searchParams } = new URL(request.url);
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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const effectiveSchoolId = schoolId || userInfo.schoolId;
    if (!effectiveSchoolId) {
      return NextResponse.json({ announcements: [], total: 0 });
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

    return NextResponse.json({
      announcements: results,
      total,
      limit,
      offset,
    });
  } catch (error) {
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch announcements", announcements: [], total: 0 },
      { status: 500 }
    );
  }
}

/**
 * POST /api/communication/announcements
 *
 * Create a new announcement
 *
 * Body:
 * - title: string
 * - content: string
 * - excerpt?: string
 * - targetAudience: "all" | "students" | "teachers" | "parents" | "staff" | "counselor"
 * - targetGradeLevel?: string
 * - targetClassIds?: string[]
 * - targetUserIds?: string[]
 * - priority?: "low" | "normal" | "high" | "urgent"
 * - category?: string
 * - publishDate?: string
 * - expiryDate?: string
 * - isPublished?: boolean
 * - isPinned?: boolean
 * - attachments?: Array<{ name, url, type, size }>
 */
export async function POST(request: NextRequest) {
  // Auth: admin, school-admin, teacher can create announcements
  const authResult = await requireAuth(['admin', 'school-admin', 'teacher']);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }
  const { userId } = authResult;

  try {
    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    // Get user info
    const [userInfo] = await db
      .select({ schoolId: users.schoolId, firstName: users.firstName, lastName: users.lastName, role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userInfo || !userInfo.schoolId) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const authorName = `${userInfo.firstName} ${userInfo.lastName || ""}`.trim();
    const now = new Date();

    const [announcement] = await db
      .insert(announcements)
      .values({
        id: `ann_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        schoolId: userInfo.schoolId,
        tenantId: "", // Will be set by trigger or default
        authorId: userId,
        authorName,
        authorRole: userInfo.role || "school_admin",
        title: body.title,
        content: body.content,
        excerpt: body.excerpt || null,
        targetAudience: body.targetAudience || "all",
        targetGradeLevel: body.targetGradeLevel || null,
        targetClassIds: body.targetClassIds || null,
        targetUserIds: body.targetUserIds || null,
        priority: body.priority || "normal",
        category: body.category || "general",
        isPublished: !!body.isPublished,
        isPinned: !!body.isPinned,
        isArchived: false,
        attachments: body.attachments || null,
        publishDate: body.publishDate || null,
        expiryDate: body.expiryDate || null,
        viewCount: 0,
        createdAt: now,
        updatedAt: now,
        publishedAt: body.isPublished ? now : null,
      } as any)
      .returning();

    return NextResponse.json({ success: true, announcement }, { status: 201 });
  } catch (error) {
    logger.apiError(error, { route: "/", method: "POST" });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create announcement" },
      { status: 500 }
    );
  }
}
