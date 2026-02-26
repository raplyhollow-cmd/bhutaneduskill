/**
 * NOTICE READ RECEIPT API
 *
 * Tracks when a user reads a notice
 */

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { notices, announcementReads } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, notFoundResponse } from "@/lib/api/response-helpers";

/**
 * POST /api/notices/[id]/read
 * Mark a notice as read by the current user
 */
export const POST = createApiRoute(
  async (request: NextRequest, context) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }
    const { userId } = auth;
    const { id } = await context!.params!;

    if (!id) {
      return badRequestResponse("Notice ID is required");
    }

    // Check if notice exists
    const [notice] = await db
      .select()
      .from(notices)
      .where(eq(notices.id, id))
      .limit(1);

    if (!notice) {
      return notFoundResponse("Notice");
    }

    // Check if already read
    const [existingRead] = await db
      .select()
      .from(announcementReads)
      .where(
        and(
          eq(announcementReads.announcementId, id),
          eq(announcementReads.userId, userId)
        )
      )
      .limit(1);

    if (existingRead) {
      // Already read, return success without creating duplicate
      return successResponse({
        read: true,
        readAt: existingRead.readAt,
      });
    }

    // Create read receipt
    const [readReceipt] = await db
      .insert(announcementReads)
      .values({
        id: nanoid(),
        announcementId: id,
        userId: userId,
        readAt: new Date(),
      })
      .returning();

    // Update view count on notice
    await db
      .update(notices)
      .set({
        viewCount: (notice.viewCount || 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(notices.id, id));

    logger.info("Notice read", {
      noticeId: id,
      userId,
      readAt: readReceipt.readAt,
    });

    return successResponse({
      read: true,
      readAt: readReceipt.readAt,
    });
  },
  [] // Any authenticated user can mark notices as read
);