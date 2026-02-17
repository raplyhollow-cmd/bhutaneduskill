import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";
import { homework, homeworkSubmissions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/teacher/homework/[id]/submissions - Get all submissions
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const authResult = await requireAuth(['teacher', 'admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user: currentUser, userId } = authResult;

    // Check homework.read permission (for viewing submissions)
    const permCheck = await requirePermission(userId, "homework.read");
    if (permCheck) return permCheck;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // submitted, graded, all

    // Verify homework ownership
    const homeworkData = await db.query.homework.findFirst({
      where: eq(homework.id, id),
    });

    if (!homeworkData) {
      return NextResponse.json({ error: "Homework not found" }, { status: 404 });
    }

    if ((homeworkData as any).teacherId !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get submissions
    let submissions: any[];
    if (status && status !== "all") {
      submissions = await db.query.homeworkSubmissions.findMany({
        where: eq(homeworkSubmissions.homeworkId, id),
        with: {
          student: true,
        },
        orderBy: [desc(homeworkSubmissions.submittedAt)],
      });
      // Filter by status
      submissions = submissions.filter(s => s.status === status);
    } else {
      submissions = await db.query.homeworkSubmissions.findMany({
        where: eq(homeworkSubmissions.homeworkId, id),
        with: {
          student: true,
        },
        orderBy: [desc(homeworkSubmissions.submittedAt)],
      });
    }

    return NextResponse.json({ submissions });
  } catch (error) {
    logger.error("Submissions fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
  }
}
