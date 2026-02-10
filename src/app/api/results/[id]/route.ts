import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, examResults } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, canAccessSchool } from "@/lib/db/tenant";

// GET /api/results/[id] - Get single exam result
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireAuth();

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
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Result fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch result" }, { status: 500 });
  }
}

// PUT /api/results/[id] - Update exam result
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireAuth();

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
      subjects.reduce((sum: number, s: any) => sum + s.marks, 0) /
        subjects.reduce((sum: number, s: any) => sum + s.totalMarks, 0) * 100
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
        totalPercentage,
        division,
        isVerified: false, // Reset verification on edit
      })
      .where(eq(examResults.id, id))
      .returning();

    return NextResponse.json({ success: true, result: updatedResult });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Result update error:", error);
    return NextResponse.json({ error: "Failed to update result" }, { status: 500 });
  }
}

// DELETE /api/results/[id] - Delete exam result
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireAuth();

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
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Result delete error:", error);
    return NextResponse.json({ error: "Failed to delete result" }, { status: 500 });
  }
}

// PATCH /api/results/[id]/verify - Verify exam result
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireAuth();

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
        verifiedBy: currentUser.id,
      })
      .where(eq(examResults.id, id))
      .returning();

    return NextResponse.json({ success: true, result: updatedResult });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Result verification error:", error);
    return NextResponse.json({ error: "Failed to verify result" }, { status: 500 });
  }
}
