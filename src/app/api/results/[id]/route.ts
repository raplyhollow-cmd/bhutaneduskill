import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { users, examResults } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { canAccessSchool } from "@/lib/db/tenant";
import { logger } from "@/lib/logger";

// GET /api/results/[id] - Get single exam result
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let id: string | undefined;
  try {
    const resolvedParams = await params;
    id = resolvedParams.id;

    const authResult = await requireAuth(['student', 'teacher', 'admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const currentUser = authResult.user;

    const result = await db.query.examResults.findFirst({
      where: eq(examResults.id, id),
    });

    if (!result) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 });
    }

    // Get the user to check school access
    const resultUser = await db.query.users.findFirst({
      where: eq(users.id, result.userId),
    });

    // Check access permissions
    if (result.userId !== currentUser.id) {
      // Counselors, teachers, and admins can view other students' results
      if (!["counselor", "teacher", "admin"].includes(currentUser.type)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Verify school access
      if (resultUser && !canAccessSchool(currentUser, resultUser.schoolId || "")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json({ result });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    logger.error(error, { route: "/api/results/[id]", method: "GET", id });
    return NextResponse.json({ error: "Failed to fetch result" }, { status: 500 });
  }
}

// PUT /api/results/[id] - Update exam result
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let id: string | undefined;
  try {
    const resolvedParams = await params;
    id = resolvedParams.id;

    const authResult = await requireAuth(['teacher', 'admin', 'school-admin', 'counselor']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const currentUser = authResult.user;

    const existingResult = await db.query.examResults.findFirst({
      where: eq(examResults.id, id),
    });

    if (!existingResult) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 });
    }

    // Get the user to check school access
    const resultUser = await db.query.users.findFirst({
      where: eq(users.id, existingResult.userId),
    });

    // Check permissions - only counselor, teacher, and admin can edit
    if (!["counselor", "teacher", "admin"].includes(currentUser.type)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify school access
    if (resultUser && !canAccessSchool(currentUser, resultUser.schoolId || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { examType, examYear, subjects } = body;

    // Recalculate total percentage and division
    const totalPercentage = Math.round(
      subjects.reduce((sum: number, s: { marks: number }) => sum + s.marks, 0) /
        subjects.reduce((sum: number, s: { totalMarks: number }) => sum + s.totalMarks, 0) * 100
    );

    let division = "Third";
    if (totalPercentage >= 60) division = "Second";
    if (totalPercentage >= 75) division = "First";
    if (totalPercentage >= 85) division = "Distinction";

    const [updatedResult] = await db
      .update(examResults)
      .set({
        examType: examType ?? existingResult.examType,
        examYear: examYear ?? existingResult.examYear,
        subjects: subjects ?? existingResult.subjects,
        percentage: totalPercentage,
        totalPercentage: totalPercentage,
        division,
      })
      .where(eq(examResults.id, id))
      .returning();

    return NextResponse.json({ success: true, result: updatedResult });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    logger.error(error, { route: "/api/results/[id]", method: "PUT", id });
    return NextResponse.json({ error: "Failed to update result" }, { status: 500 });
  }
}

// DELETE /api/results/[id] - Delete exam result
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let id: string | undefined;
  try {
    const resolvedParams = await params;
    id = resolvedParams.id;

    const authResult = await requireAuth(['admin', 'counselor']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const currentUser = authResult.user;

    const existingResult = await db.query.examResults.findFirst({
      where: eq(examResults.id, id),
    });

    if (!existingResult) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 });
    }

    // Get the user to check school access
    const resultUser = await db.query.users.findFirst({
      where: eq(users.id, existingResult.userId),
    });

    // Check permissions - only admin and counselor can delete
    if (!["admin", "counselor"].includes(currentUser.type)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify school access
    if (resultUser && !canAccessSchool(currentUser, resultUser.schoolId || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.delete(examResults).where(eq(examResults.id, id));

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    logger.error(error, { route: "/api/results/[id]", method: "DELETE", id });
    return NextResponse.json({ error: "Failed to delete result" }, { status: 500 });
  }
}

// PATCH /api/results/[id]/verify - Verify exam result
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let id: string | undefined;
  try {
    const resolvedParams = await params;
    id = resolvedParams.id;

    const authResult = await requireAuth(['admin', 'counselor']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const currentUser = authResult.user;

    const existingResult = await db.query.examResults.findFirst({
      where: eq(examResults.id, id),
    });

    if (!existingResult) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 });
    }

    // Get the user to check school access
    const resultUser = await db.query.users.findFirst({
      where: eq(users.id, existingResult.userId),
    });

    // Only counselors and admins can verify results
    if (!["counselor", "admin"].includes(currentUser.type)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify school access
    if (resultUser && !canAccessSchool(currentUser, resultUser.schoolId || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [updatedResult] = await db
      .update(examResults)
      .set({
        isVerified: true,
      })
      .where(eq(examResults.id, id))
      .returning();

    return NextResponse.json({ success: true, result: updatedResult });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    logger.error(error, { route: "/api/results/[id]", method: "PATCH", id });
    return NextResponse.json({ error: "Failed to verify result" }, { status: 500 });
  }
}
