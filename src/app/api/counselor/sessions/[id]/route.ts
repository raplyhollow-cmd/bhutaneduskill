/**
 * Individual Counselor Session API
 *
 * PATCH /api/counselor/sessions/[id] - Update session (status, notes, outcome)
 * DELETE /api/counselor/sessions/[id] - Cancel/delete session
 */

import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { counselingSessions, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

// ============================================================================
// PATCH - Update session
// ============================================================================

export const PATCH = createApiRoute<{ id: string }>(
  async (req, auth, context) => {
    const { user } = auth;
    const { id } = await (context?.params || {});

    // Check if session exists and user has access
    const session = await db
      .select()
      .from(counselingSessions)
      .where(eq(counselingSessions.id, id))
      .limit(1)
      .then(rows => rows[0] || null);

    if (!session) {
      return { error: "Session not found", status: 404 } satisfies ApiErrorResponse;
    }

    // Only the assigned counselor or admin can update
    if (user.type !== 'admin' && session.counselorId !== user.id) {
      return { error: "Forbidden: You can only update your own sessions", status: 403 } satisfies ApiErrorResponse;
    }

    const body = await req.json();
    const { status, notes, outcome, location, scheduledAt, duration } = body;

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (outcome !== undefined) updateData.outcome = outcome;
    if (location !== undefined) updateData.location = location;
    if (scheduledAt !== undefined) updateData.scheduledAt = new Date(scheduledAt).toISOString();
    if (duration !== undefined) updateData.duration = duration;

    // Update session
    const [updatedSession] = await db.update(counselingSessions)
      .set(updateData)
      .where(eq(counselingSessions.id, id))
      .returning();

    logger.info("Counseling session updated", {
      userId: user.id,
      sessionId: id,
      changes: Object.keys(updateData),
    });

    return {
      data: { session: updatedSession },
    } satisfies ApiSuccess<{ session: typeof updatedSession }>;
  },
  ['counselor', 'admin']
);

// ============================================================================
// DELETE - Cancel session
// ============================================================================

export const DELETE = createApiRoute<{ id: string }>(
  async (req, auth, context) => {
    const { user } = auth;
    const { id } = await (context?.params || {});

    // Check if session exists and user has access
    const session = await db
      .select()
      .from(counselingSessions)
      .where(eq(counselingSessions.id, id))
      .limit(1)
      .then(rows => rows[0] || null);

    if (!session) {
      return { error: "Session not found", status: 404 } satisfies ApiErrorResponse;
    }

    // Only the assigned counselor or admin can cancel
    if (user.type !== 'admin' && session.counselorId !== user.id) {
      return { error: "Forbidden: You can only cancel your own sessions", status: 403 } satisfies ApiErrorResponse;
    }

    // Update status to cancelled instead of deleting
    const [cancelledSession] = await db.update(counselingSessions)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(eq(counselingSessions.id, id))
      .returning();

    logger.info("Counseling session cancelled", {
      userId: user.id,
      sessionId: id,
    });

    return {
      data: { session: cancelledSession },
    } satisfies ApiSuccess<{ session: typeof cancelledSession }>;
  },
  ['counselor', 'admin']
);
