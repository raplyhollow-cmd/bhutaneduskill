import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { assessmentSubmissions, users } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

// GET /api/assessment-submissions - Get submissions
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(['student', 'teacher', 'admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

    const { searchParams } = new URL(request.url);
    const assessmentId = searchParams.get("assessmentId");
    const userId_param = searchParams.get("userId");
    const assignedBy = searchParams.get("assignedBy");
    const status = searchParams.get("status");

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

    // Students can only see their own submissions
    if (user.type === "student") {
      conditions.push(eq(assessmentSubmissions.userId, userId));
    }

    // Teachers can only see submissions they assigned
    if (user.type === "teacher") {
      conditions.push(eq(assessmentSubmissions.assignedBy, userId));
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
    const authResult = await requireAuth(['student', 'teacher', 'admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

    const body = await request.json();
    const { assessmentId, userId: targetUserId, assignedBy } = body;

    // Only teachers and admins can assign assessments to others
    if (user.type === "student") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [submission] = await db
      .insert(assessmentSubmissions)
      .values({
        id: `sub_${Date.now()}`,
        assessmentId,
        userId: targetUserId,
        assignedBy: assignedBy || userId,
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
