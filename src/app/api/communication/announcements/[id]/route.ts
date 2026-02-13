import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// ============================================================================
// INDIVIDUAL ANNOUNCEMENT API
// ============================================================================

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/communication/announcements/[id]
 *
 * Fetch a single announcement by ID
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;

    const { db } = await import("@/lib/db");
    const { announcements: announcementsTable, users, announcementReads } = await import("@/lib/db/schema");
    const { eq, and } = await import("drizzle-orm");

    // Get user's school
    const [user] = await db
      .select({ schoolId: users.schoolId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch announcement
    const [announcement] = await db
      .select()
      .from(announcementsTable)
      .where(
        and(
          eq(announcementsTable.id, id),
          eq(announcementsTable.schoolId, user.schoolId || "")
        )
      )
      .limit(1);

    if (!announcement) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    // Check if user has read this announcement
    const [readRecord] = await db
      .select()
      .from(announcementReads)
      .where(
        and(
          eq(announcementReads.announcementId, id),
          eq(announcementReads.userId, userId)
        )
      )
      .limit(1);

    // Mark as read if not already
    if (!readRecord && announcement.isPublished) {
      await db.insert(announcementReads).values({
        ...({
          id: `ar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        }),
        announcementId: id,
        userId,
        readAt: new Date(),
      } as any);

      // Increment view count
      await db
        .update(announcementsTable)
        .set({
          viewCount: sql`${announcementsTable.viewCount} + 1`,
        })
        .where(eq(announcementsTable.id, id));
    }

    return NextResponse.json({ announcement });
  } catch (error) {
    console.error("Failed to fetch announcement:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcement" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/communication/announcements/[id]
 *
 * Update an announcement
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();

    const { db } = await import("@/lib/db");
    const { announcements: announcementsTable, users } = await import("@/lib/db/schema");
    const { eq, and } = await import("drizzle-orm");
    const { sql } = await import("drizzle-orm");

    // Get user's school and role
    const [user] = await db
      .select({ schoolId: users.schoolId, role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.schoolId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user can edit (school admin or author)
    const [existing] = await db
      .select()
      .from(announcementsTable)
      .where(
        and(
          eq(announcementsTable.id, id),
          eq(announcementsTable.schoolId, user.schoolId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    // Check permissions
    const canEdit = user.role === "school_admin" || user.role === "admin" || (existing as any).authorId === userId;
    if (!canEdit) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build update object
    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    // If publishing for the first time
    if (body.isPublished && !existing.isPublished) {
      updateData.publishedAt = new Date();
    }

    // Add other fields
    const allowedFields = [
      "title", "content", "excerpt", "targetAudience",
      "targetGradeLevel", "targetClassIds", "targetUserIds",
      "priority", "category", "publishDate", "expiryDate",
      "isPublished", "isPinned", "isArchived", "attachments"
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const [updated] = await db
      .update(announcementsTable)
      .set(updateData)
      .where(eq(announcementsTable.id, id))
      .returning();

    return NextResponse.json({ success: true, announcement: updated });
  } catch (error) {
    console.error("Failed to update announcement:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update announcement" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/communication/announcements/[id]
 *
 * Delete an announcement
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;

    const { db } = await import("@/lib/db");
    const { announcements: announcementsTable, users } = await import("@/lib/db/schema");
    const { eq, and } = await import("drizzle-orm");

    // Get user's school and role
    const [user] = await db
      .select({ schoolId: users.schoolId, role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.schoolId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if announcement exists and user has permission
    const [existing] = await db
      .select()
      .from(announcementsTable)
      .where(
        and(
          eq(announcementsTable.id, id),
          eq(announcementsTable.schoolId, user.schoolId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    // Check permissions
    const canDelete = user.role === "school_admin" || user.role === "admin" || (existing as any).authorId === userId;
    if (!canDelete) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete announcement
    await db
      .delete(announcementsTable)
      .where(eq(announcementsTable.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete announcement:", error);
    return NextResponse.json(
      { error: "Failed to delete announcement" },
      { status: 500 }
    );
  }
}

import { sql } from "drizzle-orm";
