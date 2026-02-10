import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { assessmentSubmissions, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// PATCH /api/assessment-submissions/[id] - Update submission
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, startedAt, completedAt, timeSpent } = body;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [updatedSubmission] = await db
      .update(assessmentSubmissions)
      .set({ status, startedAt, completedAt, timeSpent })
      .where(eq(assessmentSubmissions.id, id))
      .returning();

    return NextResponse.json({ submission: updatedSubmission });
  } catch (error) {
    console.error("Assessment submission update error:", error);
    return NextResponse.json({ error: "Failed to update submission" }, { status: 500 });
  }
}

// GET /api/assessment-submissions/[id] - Get single submission
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const submission = await db.query.assessmentSubmissions.findFirst({
      where: eq(assessmentSubmissions.id, id),
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    return NextResponse.json({ submission });
  } catch (error) {
    console.error("Assessment submission fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch submission" }, { status: 500 });
  }
}

// DELETE /api/assessment-submissions/[id] - Delete submission
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.delete(assessmentSubmissions).where(eq(assessmentSubmissions.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Assessment submission delete error:", error);
    return NextResponse.json({ error: "Failed to delete submission" }, { status: 500 });
  }
}
