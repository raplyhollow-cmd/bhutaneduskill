/**
 * PARENT REPORT CARDS API
 * Parents can view their child's report cards
 *
 * SECURITY: FERPA COMPLIANCE
 * - Uses parent_to_student join table for verification
 * - Only allows access to verified children
 */

import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { reportCards, users, parents, parentToStudent } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { createApiRoute } from "@/lib/api/route-handler";

/**
 * GET /api/parent/report-cards
 * Get report cards for parent's children
 */
export const GET = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return { error: "Student ID is required" };
    }

    // FERPA COMPLIANCE: Get parent record first
    const [parentRecord] = await db
      .select()
      .from(parents)
      .where(eq(parents.userId, userId))
      .limit(1);

    if (!parentRecord) {
      logger.warn("No parent record found for user", { userId });
      return { error: "Parent record not found" };
    }

    // FERPA COMPLIANCE: Verify parent-child relationship via parent_to_student join table
    const [relationship] = await db
      .select()
      .from(parentToStudent)
      .where(
        and(
          eq(parentToStudent.parentId, parentRecord.id),
          eq(parentToStudent.studentId, studentId)
        )
      )
      .limit(1);

    if (!relationship) {
      logger.security("ferpa_violation_attempt", {
        parentId: parentRecord.id,
        studentId,
        route: "/api/parent/report-cards",
      });
      return { error: "Student not found or access denied" };
    }

    // Fetch report cards
    const cards = await db
      .select()
      .from(reportCards)
      .where(eq(reportCards.studentId, studentId))
      .orderBy(reportCards.generatedAt);

    // Update viewed status
    await db
      .update(reportCards)
      .set({ parentViewedAt: new Date() })
      .where(
        and(
          eq(reportCards.studentId, studentId),
          eq(reportCards.status, "sent")
        )
      );

    logger.info("Parent fetched report cards", { userId, studentId });

    return { data: cards };
  },
  ["parent"]
);