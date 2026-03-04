/**
 * Individual Announcement API
 *
 * GET /api/communication/announcements/[id] - Fetch single announcement
 * PATCH /api/communication/announcements/[id] - Update announcement
 * DELETE /api/communication/announcements/[id] - Delete announcement
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { announcements, users, announcementReads } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, badRequestResponse, notFoundResponse, forbiddenResponse } from "@/lib/api/response-helpers";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// ============================================================================
// GET /api/communication/announcements/[id]
// ============================================================================

export const GET = createApiRoute(
  async (req: NextRequest, auth, context: RouteContext) => {
    const { userId } = auth;
    const { id } = await context.params;

    // Get user's school
    const [user] = await db
      .select({ schoolId: users.schoolId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return notFoundResponse("User");
    }

    // Fetch announcement
    const [announcement] = await db
      .select()
      .from(announcements)
      .where(
        and(
          eq(announcements.id, id),
          eq(announcements.schoolId, user.schoolId || "")
        )
      )
      .limit(1);

    if (!announcement) {
      return notFoundResponse("Announcement");
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
        id: `ar_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        announcementId: id,
        userId,
        readAt: new Date(),
      });

      // Increment view count
      await db
        .update(announcements)
        .set({
          viewCount: sql`${announcements.viewCount} + 1`,
        })
        .where(eq(announcements.id, id));
    }

    return successResponse({ announcement });
  },
  ['admin', 'school-admin', 'teacher']
);

// ============================================================================
// PATCH /api/communication/announcements/[id]
// ============================================================================

export const PATCH = createApiRoute(
  async (req: NextRequest, auth, context: RouteContext) => {
    const { userId } = auth;
    const { id } = await context.params;
    const body = await req.json();

    // Get user's school and type
    const [user] = await db
      .select({ schoolId: users.schoolId, type: users.type })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.schoolId) {
      return notFoundResponse("User");
    }

    // Check if user can edit (school admin or author)
    const [existing] = await db
      .select()
      .from(announcements)
      .where(
        and(
          eq(announcements.id, id),
          eq(announcements.schoolId, user.schoolId)
        )
      )
      .limit(1);

    if (!existing) {
      return notFoundResponse("Announcement");
    }

    // Check permissions
    const canEdit = user.type === "school-admin" || user.type === "admin" || existing.authorId === userId;
    if (!canEdit) {
      return forbiddenResponse("You don't have permission to edit this announcement");
    }

    // Build update object
    const updateData: Record<string, unknown> = {
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
      .update(announcements)
      .set(updateData)
      .where(eq(announcements.id, id))
      .returning();

    logger.info("Announcement updated", { userId, announcementId: id });

    return successResponse({ announcement: updated });
  },
  ['admin', 'school-admin', 'teacher']
);

// ============================================================================
// DELETE /api/communication/announcements/[id]
// ============================================================================

export const DELETE = createApiRoute(
  async (req: NextRequest, auth, context: RouteContext) => {
    const { userId } = auth;
    const { id } = await context.params;

    // Get user's school and type
    const [user] = await db
      .select({ schoolId: users.schoolId, type: users.type })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.schoolId) {
      return notFoundResponse("User");
    }

    // Check if announcement exists and user has permission
    const [existing] = await db
      .select()
      .from(announcements)
      .where(
        and(
          eq(announcements.id, id),
          eq(announcements.schoolId, user.schoolId)
        )
      )
      .limit(1);

    if (!existing) {
      return notFoundResponse("Announcement");
    }

    // Check permissions
    const canDelete = user.type === "school-admin" || user.type === "admin" || existing.authorId === userId;
    if (!canDelete) {
      return forbiddenResponse("You don't have permission to delete this announcement");
    }

    // Delete announcement
    await db
      .delete(announcements)
      .where(eq(announcements.id, id));

    logger.info("Announcement deleted", { userId, announcementId: id });

    return successResponse({ success: true });
  },
  ['admin', 'school-admin', 'teacher']
);
