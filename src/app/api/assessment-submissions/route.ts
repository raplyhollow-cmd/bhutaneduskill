import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { assessmentSubmissions, users, assessments } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

// GET /api/assessment-submissions - Get submissions
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assessmentId = searchParams.get("assessmentId");
    const userId_param = searchParams.get("userId");
    const assignedBy = searchParams.get("assignedBy");
    const status = searchParams.get("status");

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only admin, counselor, and teachers can view submissions
    if (!["admin", "counselor", "teacher"].includes(currentUser.type)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const conditions = [];
    if (assessmentId) {
      conditions.push(eq(assessmentSubmissions.assessmentId, assessmentId));
    }
    if (userId_param) {
      conditions.push(eq(assessmentSubmissions.userId, userId_param));
    }
    if (assignedBy) {
      conditions.push(eq(assessmentSubmissions.assignedBy, assignedBy));
    }
    if (status) {
      conditions.push(eq(assessmentSubmissions.status, status));
    }

    // Teachers can only see submissions they assigned
    if (currentUser.type === "teacher") {
      conditions.push(eq(assessmentSubmissions.assignedBy, currentUser.id));
    }

    let submissions: any[];
    if (conditions.length > 0) {
      submissions = await db.query.assessmentSubmissions.findMany({
        where: conditions.length === 1 ? conditions[0] : and(...conditions),
        orderBy: desc(assessmentSubmissions.createdAt),
      });
    } else {
      submissions = await db.query.assessmentSubmissions.findMany({
        orderBy: desc(assessmentSubmissions.createdAt),
      });
    }

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error("Assessment submissions fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
  }
}

// POST /api/assessment-submissions - Create submission
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { assessmentId, userId: targetUserId, assignedBy } = body;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only admin, counselor, and teachers can assign assessments
    if (!["admin", "counselor", "teacher"].includes(currentUser.type)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [submission] = await db
      .insert(assessmentSubmissions)
      .values({
        id: `sub_${Date.now()}`,
        assessmentId,
        userId: targetUserId,
        assignedBy: assignedBy || currentUser.id,
        status: "pending",
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        createdAt: new Date(),
      } as any)
      .returning();

    return NextResponse.json({ submission }, { status: 201 });
  } catch (error) {
    console.error("Assessment submission creation error:", error);
    return NextResponse.json({ error: "Failed to create submission" }, { status: 500 });
  }
}
