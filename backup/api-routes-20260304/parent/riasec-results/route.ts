import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { riasecResults, users, parents, parentToStudent } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";

/**
 * GET /api/parent/riasec-results?childId={id}
 *
 * Get RIASEC assessment results for a specific child (parent's child)
 *
 * SECURITY: FERPA COMPLIANCE
 * - Uses parent_to_student join table for verification
 * - Parents can only view RIASEC results for their verified children
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */
export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId } = auth;

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get("childId");

    if (!childId) {
      return { error: "Child ID is required", status: 400 };
    }

    // FERPA COMPLIANCE: Get parent record first
    const [parentRecord] = await db
      .select()
      .from(parents)
      .where(eq(parents.userId, userId))
      .limit(1);

    if (!parentRecord) {
      logger.warn("No parent record found for user", { userId });
      return { error: "Parent record not found", status: 403 };
    }

    // FERPA COMPLIANCE: Verify parent-child relationship via parent_to_student join table
    const [relationship] = await db
      .select()
      .from(parentToStudent)
      .where(
        and(
          eq(parentToStudent.parentId, parentRecord.id),
          eq(parentToStudent.studentId, childId)
        )
      )
      .limit(1);

    if (!relationship) {
      logger.security("ferpa_violation_attempt", {
        parentId: parentRecord.id,
        childId,
        route: "/api/parent/riasec-results",
      });
      return { error: "You are not authorized to view this child's data", status: 403 };
    }

    // Verify the child exists
    const [childCheck] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, childId), eq(users.type, "student")))
      .limit(1);

    if (!childCheck) {
      return { error: "Child not found", status: 404 };
    }

    // Fetch RIASEC results for the child
    const [result] = await db
      .select()
      .from(riasecResults)
      .where(eq(riasecResults.userId, childId))
      .orderBy(desc(riasecResults.completedAt))
      .limit(1);

    if (!result) {
      return {
        result: null,
        message: "No RIASEC results found for this child",
      };
    }

    return { result };
  },
  ["parent"]
);
