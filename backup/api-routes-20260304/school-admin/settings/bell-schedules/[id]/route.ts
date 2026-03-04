import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { bellSchedules } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { logger } from "@/lib/logger";

interface DeleteResponse {
  success: true;
}

interface BellScheduleResponse {
  bellSchedule: unknown;
}

interface BellScheduleUpdateRequest {
  isActive?: boolean;
  name?: string;
  periods?: Array<{
    periodNumber: number;
    name: string;
    startTime: string;
    endTime: string;
    type: "class" | "break" | "lunch";
  }>;
}

// ============================================================================
// DELETE - Remove a bell schedule
// ============================================================================

export const DELETE = createApiRoute<{ id: string }, DeleteResponse>(
  async (req, { user }, context) => {
    if (!user.schoolId) {
      return { error: "School not found for user", status: 404 };
    }

    const { id } = await context!.params;

    // Verify the bell schedule belongs to the user's school
    const [bellSchedule] = await db
      .select()
      .from(bellSchedules)
      .where(and(
        eq(bellSchedules.id, id),
        eq(bellSchedules.schoolId, user.schoolId)
      ))
      .limit(1);

    if (!bellSchedule) {
      return { error: "Bell schedule not found", status: 404 };
    }

    // Delete the bell schedule
    await db.delete(bellSchedules)
      .where(eq(bellSchedules.id, id));

    return { data: { success: true } };
  },
  ['school-admin', 'admin']
);

// ============================================================================
// PATCH - Update a bell schedule (e.g., set as active)
// ============================================================================

export const PATCH = createApiRoute<{ id: string }, BellScheduleResponse>(
  async (req, { user }, context) => {
    if (!user.schoolId) {
      return { error: "School not found for user", status: 404 };
    }

    const { id } = await context!.params;
    const body: BellScheduleUpdateRequest = await req.json();

    // Verify the bell schedule belongs to the user's school
    const [bellSchedule] = await db
      .select()
      .from(bellSchedules)
      .where(and(
        eq(bellSchedules.id, id),
        eq(bellSchedules.schoolId, user.schoolId)
      ))
      .limit(1);

    if (!bellSchedule) {
      return { error: "Bell schedule not found", status: 404 };
    }

    // If setting as active, deactivate all others
    if (body.isActive === true) {
      await db.update(bellSchedules)
        .set({ isActive: false })
        .where(eq(bellSchedules.schoolId, user.schoolId));
    }

    // Update the bell schedule
    const [updated] = await db.update(bellSchedules)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(bellSchedules.id, id))
      .returning();

    return { data: { bellSchedule: updated } };
  },
  ['school-admin', 'admin']
);
