/**
 * Student BCSE Results API
 * Students can view their BCSE examination results
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { bcseResults, bcseRegistrations, users } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { createApiRoute } from "@/lib/api/route-handler";

/**
 * GET /api/student/bcse-results
 * Get BCSE results for the authenticated student
 */
export const GET = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId, user } = auth;

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
    if (["admin", "school-admin"].includes(user?.type || "") && targetStudentId) {
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

    return {
      success: true,
      data: {
        results,
        student: {
          id: userId,
          name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || undefined,
        },
      },
    };
  },
  ["student", "parent", "admin", "school-admin"]
);
