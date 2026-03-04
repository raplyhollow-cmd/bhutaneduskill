/**
 * STUDENT ASSESSMENT STATUS API
 *
 * GET /api/student/assessment-status
 *
 * Returns which assessments the student has completed
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { assessments } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse } from "@/lib/api/response-helpers";

export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId } = auth;

    // Get completed assessments for this student
    const completedResults = await db
      .select()
      .from(assessments)
      .where(
        and(
          eq(assessments.userId, userId),
          eq(assessments.type, "mbti")
        )
      )
      .orderBy(desc(assessments.completedAt));

    const completedAssessments: string[] = [];
    for (const result of completedResults) {
      completedAssessments.push(result.type);
    }

    // Check RIASEC
    const riasecResults = await db
      .select()
      .from(assessments)
      .where(
        and(
          eq(assessments.userId, userId),
          eq(assessments.type, "riasec")
        )
      );
    if (riasecResults.length > 0 && riasecResults[0].completedAt) {
      completedAssessments.push("riasec");
    }

    // Check Work Values
    const workValuesResults = await db
      .select()
      .from(assessments)
      .where(
        and(
          eq(assessments.userId, userId),
          eq(assessments.type, "work_values")
        )
      );
    if (workValuesResults.length > 0 && workValuesResults[0].completedAt) {
      completedAssessments.push("work-values");
    }

    // Check Skills (stored differently, check if skills exist)
    const skillsResults = await db
      .select()
      .from(assessments)
      .where(
        and(
          eq(assessments.userId, userId),
          eq(assessments.type, "skills")
        )
      );
    if (skillsResults.length > 0) {
      completedAssessments.push("skills");
    }

    return successResponse({
      completedAssessments,
      totalRequired: 4,
      isComplete: completedAssessments.length >= 4,
    });
  },
  ["student"]
);
