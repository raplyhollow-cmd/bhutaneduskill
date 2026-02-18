/**
 * Individual Counselor Session API
 *
 * PATCH /api/counselor/sessions/[id] - Update session (status, notes, outcome)
 * DELETE /api/counselor/sessions/[id] - Cancel/delete session
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { counselingSessions, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

// ============================================================================
// PATCH - Update session
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(['counselor', 'admin']);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error, status: authResult.status }, { status: authResult.status });
  }

  try {
    const { user } = authResult;
    const { id } = await params;

    // Check if session exists and user has access
    const session = await db.query.counselingSessions.findFirst({
      where: eq(counselingSessions.id, id),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    // Only the assigned counselor or admin can update
    if (user.type !== 'admin' && session.counselorId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: You can only update your own sessions", status: 403 } satisfies ApiErrorResponse,
        { status: 403 }
      );
    }

    const body = await request.json();
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

    return NextResponse.json({
      data: { session: updatedSession },
    } satisfies ApiSuccess<{ session: typeof updatedSession }>);
  } catch (error) {
    logger.apiError(error, { route: "/api/counselor/sessions/[id]", method: "PATCH" });
    return NextResponse.json(
      { error: "Failed to update session", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Cancel session
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(['counselor', 'admin']);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error, status: authResult.status }, { status: authResult.status });
  }

  try {
    const { user } = authResult;
    const { id } = await params;

    // Check if session exists and user has access
    const session = await db.query.counselingSessions.findFirst({
      where: eq(counselingSessions.id, id),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    // Only the assigned counselor or admin can cancel
    if (user.type !== 'admin' && session.counselorId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: You can only cancel your own sessions", status: 403 } satisfies ApiErrorResponse,
        { status: 403 }
      );
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

    return NextResponse.json({
      data: { session: cancelledSession },
    } satisfies ApiSuccess<{ session: typeof cancelledSession }>);
  } catch (error) {
    logger.apiError(error, { route: "/api/counselor/sessions/[id]", method: "DELETE" });
    return NextResponse.json(
      { error: "Failed to cancel session", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
