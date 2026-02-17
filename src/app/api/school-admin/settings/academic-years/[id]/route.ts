import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { academicYears } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-utils";

// ============================================================================
// DELETE - Remove an academic year
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

    // Verify the academic year belongs to the user's school
    const academicYear = await db.query.academicYears.findFirst({
      where: and(
        eq(academicYears.id, id),
        eq(academicYears.schoolId, user.schoolId)
      ),
    });

    if (!academicYear) {
      return NextResponse.json({ error: "Academic year not found" }, { status: 404 });
    }

    // Delete the academic year
    await db.delete(academicYears)
      .where(eq(academicYears.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Academic year deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete academic year" },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update an academic year (e.g., set as active)
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

    // Verify the academic year belongs to the user's school
    const academicYear = await db.query.academicYears.findFirst({
      where: and(
        eq(academicYears.id, id),
        eq(academicYears.schoolId, user.schoolId)
      ),
    });

    if (!academicYear) {
      return NextResponse.json({ error: "Academic year not found" }, { status: 404 });
    }

    // If setting as active, deactivate all others
    if (body.isActive === true) {
      await db.update(academicYears)
        .set({ isActive: false })
        .where(eq(academicYears.schoolId, user.schoolId));
    }

    // Update the academic year
    const [updated] = await db.update(academicYears)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(academicYears.id, id))
      .returning();

    return NextResponse.json({ academicYear: updated });
  } catch (error) {
    console.error("Academic year update error:", error);
    return NextResponse.json(
      { error: "Failed to update academic year" },
      { status: 500 }
    );
  }
}
