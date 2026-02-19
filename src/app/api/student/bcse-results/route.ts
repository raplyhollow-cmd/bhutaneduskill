/**
 * Student BCSE Results API
 * Students can view their BCSE examination results
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { bcseResults, bcseRegistrations, users } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/lib/db";

/**
 * GET /api/student/bcse-results
 * Get BCSE results for the authenticated student
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(["student", "parent", "admin", "school_admin"]);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

    const { searchParams } = new URL(req.url);
    const examType = searchParams.get("examType") as "BCSE_10" | "BCSE_12" | null;
    const examYear = searchParams.get("examYear");
    const targetStudentId = searchParams.get("studentId");

    // Determine which student's results to fetch
    let studentId = userId;

    // Parent can view their children's results
    if (user?.type === "parent" && targetStudentId) {
      // Verify the target student is a child of this parent
      const [student] = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.id, targetStudentId),
            eq(users.parentId, userId)
          )
        )
        .limit(1);

      if (student) {
        studentId = targetStudentId;
      }
    }

    // Admin/school_admin can view any student's results
    if (["admin", "school_admin"].includes(user?.type || "") && targetStudentId) {
      studentId = targetStudentId;
    }

    // Build query conditions
    const conditions = [eq(bcseResults.studentId, studentId)];

    if (examType) {
      conditions.push(eq(bcseResults.examType, examType));
    }

    if (examYear) {
      conditions.push(eq(bcseResults.examYear, parseInt(examYear, 10)));
    }

    // Fetch results
    const results = await db
      .select()
      .from(bcseResults)
      .where(and(...conditions))
      .orderBy(desc(bcseResults.examYear), desc(bcseResults.createdAt));

    logger.info("Fetched BCSE results", {
      userId,
      studentId,
      examType,
      count: results.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        results,
        student: {
          id: userId,
          name: user?.name,
        },
      },
    });

  } catch (error) {
    logger.apiError(error, { route: "/api/student/bcse-results", method: "GET" });
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to fetch BCSE results",
    }, { status: 500 });
  }
}
