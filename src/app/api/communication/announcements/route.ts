import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

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
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");
    const isPublished = searchParams.get("isPublished") === "true" ? true : searchParams.get("isPublished") === "false" ? false : undefined;
    const isPinned = searchParams.get("isPinned") === "true" ? true : searchParams.get("isPinned") === "false" ? false : undefined;
    const priority = searchParams.get("priority");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const { db } = await import("@/lib/db");
    const { announcements: announcementsTable, users } = await import("@/lib/db/schema");
    const { eq, and, desc, or, sql, count } = await import("drizzle-orm");

    // Get current user info to determine school and role
    const [user] = await db
      .select({ schoolId: users.schoolId, type: users.type })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const effectiveSchoolId = schoolId || user.schoolId;
    if (!effectiveSchoolId) {
      return NextResponse.json({ announcements: [], total: 0 });
    }

    // Build conditions
    const conditions = [
      eq(announcementsTable.schoolId, effectiveSchoolId),
      eq(announcementsTable.isArchived, false),
    ];

    if (isPublished !== undefined) {
      conditions.push(eq(announcementsTable.isPublished, isPublished));
    }

    if (isPinned !== undefined) {
      conditions.push(eq(announcementsTable.isPinned, isPinned));
    }

    if (priority) {
      conditions.push(eq(announcementsTable.priority, priority as "low" | "normal" | "high" | "urgent"));
    }

    // Filter by audience based on user type
    const audienceConditions = [
      eq(announcementsTable.targetAudience, "all"),
    ];
    if (user.type === "student") {
      audienceConditions.push(eq(announcementsTable.targetAudience, "students"));
    } else if (user.type === "teacher") {
      audienceConditions.push(eq(announcementsTable.targetAudience, "teachers"));
    } else if (user.type === "parent") {
      audienceConditions.push(eq(announcementsTable.targetAudience, "parents"));
    } else if (user.type === "counselor") {
      audienceConditions.push(eq(announcementsTable.targetAudience, "counselor"));
    } else if (user.type === "admin") {
      audienceConditions.push(eq(announcementsTable.targetAudience, "staff"));
    }
    const audienceFilter = or(...audienceConditions);
    if (audienceFilter) {
      conditions.push(audienceFilter);
    }

    // Exclude expired announcements
    const now = new Date().toISOString();
    const expiryFilter = or(
      sql`${announcementsTable.expiryDate} IS NULL`,
      sql`${announcementsTable.expiryDate} > ${now}`
    );
    if (expiryFilter) {
      conditions.push(expiryFilter);
    }

    // Get total count
    const [{ value: total }] = await db
      .select({ value: count() })
      .from(announcementsTable)
      .where(and(...conditions));

    // Fetch announcements
    const results = await db
      .select()
      .from(announcementsTable)
      .where(and(...conditions))
      .orderBy(desc(announcementsTable.isPinned), desc(announcementsTable.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      announcements: results,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Failed to fetch announcements:", error);
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
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const { db } = await import("@/lib/db");
    const { announcements: announcementsTable, users } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    // Get user info
    const [user] = await db
      .select({ schoolId: users.schoolId, firstName: users.firstName, lastName: users.lastName, role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.schoolId) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const authorName = `${user.firstName} ${user.lastName || ""}`.trim();
    const now = new Date();

    const [announcement] = await db
      .insert(announcementsTable)
      .values({
        id: `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        schoolId: user.schoolId,
        tenantId: "", // Will be set by trigger or default
        authorId: userId,
        authorName,
        authorRole: user.role || "school_admin",
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
      })
      .returning();

    return NextResponse.json({ success: true, announcement }, { status: 201 });
  } catch (error) {
    console.error("Failed to create announcement:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create announcement" },
      { status: 500 }
    );
  }
}
