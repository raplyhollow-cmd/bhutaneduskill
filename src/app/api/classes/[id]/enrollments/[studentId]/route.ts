/**
 * INDIVIDUAL ENROLLMENT API
 *
 * Routes:
 * PUT    /api/classes/[id]/enrollments/[studentId]    → update enrollment (roll number, status)
 * DELETE /api/classes/[id]/enrollments/[studentId]    → remove student from class
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { enrollments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

interface RouteContext {
  params: Promise<{ id: string; studentId: string }>;
}

// PUT - Update enrollment (roll number, status, etc.)
export async function PUT(request: NextRequest, context: RouteContext) {
  const authResult = await requireAuth(["school-admin", "admin"]);
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const { id: classId, studentId } = await context.params;

  try {
    const body = await request.json();
    const { rollNumber, status } = body;

    // Find the enrollment
    const existing = await db
      .select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.classId, classId),
          eq(enrollments.studentId, studentId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    // Update enrollment
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (rollNumber !== undefined) {
      updateData.rollNumber = rollNumber;
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    const result = await db
      .update(enrollments)
      .set(updateData)
      .where(eq(enrollments.id, existing[0].id))
      .returning();

    return NextResponse.json({
      success: true,
      enrollment: result[0],
    });
  } catch (error: any) {
    console.error("Enrollment PUT error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update enrollment" },
      { status: 500 }
    );
  }
}

// DELETE - Remove student from class
export async function DELETE(request: NextRequest, context: RouteContext) {
  const authResult = await requireAuth(["school-admin", "admin"]);
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const { id: classId, studentId } = await context.params;

  try {
    // Find the enrollment
    const existing = await db
      .select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.classId, classId),
          eq(enrollments.studentId, studentId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    // Delete enrollment
    await db
      .delete(enrollments)
      .where(eq(enrollments.id, existing[0].id));

    return NextResponse.json({
      success: true,
      message: "Student removed from class successfully",
    });
  } catch (error: any) {
    console.error("Enrollment DELETE error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to remove student" },
      { status: 500 }
    );
  }
}
