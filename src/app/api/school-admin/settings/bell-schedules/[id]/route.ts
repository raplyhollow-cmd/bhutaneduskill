import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bellSchedules } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-utils";

// ============================================================================
// DELETE - Remove a bell schedule
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(['school-admin', 'admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user } = authResult;

    if (!user.schoolId) {
      return NextResponse.json({ error: "School not found for user" }, { status: 404 });
    }

    const { id } = await params;

    // Verify the bell schedule belongs to the user's school
    const bellSchedule = await db.query.bellSchedules.findFirst({
      where: and(
        eq(bellSchedules.id, id),
        eq(bellSchedules.schoolId, user.schoolId)
      ),
    });

    if (!bellSchedule) {
      return NextResponse.json({ error: "Bell schedule not found" }, { status: 404 });
    }

    // Delete the bell schedule
    await db.delete(bellSchedules)
      .where(eq(bellSchedules.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Bell schedule deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete bell schedule" },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update a bell schedule (e.g., set as active)
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(['school-admin', 'admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user } = authResult;

    if (!user.schoolId) {
      return NextResponse.json({ error: "School not found for user" }, { status: 404 });
    }

    const { id } = await params;
    const body = await request.json();

    // Verify the bell schedule belongs to the user's school
    const bellSchedule = await db.query.bellSchedules.findFirst({
      where: and(
        eq(bellSchedules.id, id),
        eq(bellSchedules.schoolId, user.schoolId)
      ),
    });

    if (!bellSchedule) {
      return NextResponse.json({ error: "Bell schedule not found" }, { status: 404 });
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

    return NextResponse.json({ bellSchedule: updated });
  } catch (error) {
    console.error("Bell schedule update error:", error);
    return NextResponse.json(
      { error: "Failed to update bell schedule" },
      { status: 500 }
    );
  }
}
