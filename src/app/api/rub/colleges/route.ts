/**
 * RUB Colleges API
 * Browse RUB constituent and affiliated colleges
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { rubColleges, rubPrograms } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { eq, and, count } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";

// ============================================================================
// TYPES
// ============================================================================

type WhereCondition = SQL | undefined;

interface RubCollegeWithProgramCount {
  id: string;
  name: string;
  type: string;
  dzongkhag: string;
  isActive: boolean;
  programCount?: number;
}

/**
 * GET /api/rub/colleges
 * Browse RUB colleges
 */
export const GET = createApiRoute(
  async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // constituent, affiliated
    const dzongkhag = searchParams.get("dzongkhag");
    const withPrograms = searchParams.get("withPrograms") === "true";

    // Build query conditions
    const conditions: WhereCondition[] = [eq(rubColleges.isActive, true)];

    if (type) {
      conditions.push(eq(rubColleges.type, type));
    }

    if (dzongkhag) {
      conditions.push(eq(rubColleges.dzongkhag, dzongkhag));
    }

    // Fetch colleges
    const colleges = await db
      .select()
      .from(rubColleges)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(rubColleges.name);

    // Count programs per college if requested
    if (withPrograms) {
      for (const college of colleges) {
        const [programCount] = await db
          .select({ count: count() })
          .from(rubPrograms)
          .where(
            and(
              eq(rubPrograms.collegeId, college.id),
              eq(rubPrograms.isActive, true)
            )
          );

        (college as RubCollegeWithProgramCount).programCount = programCount?.count || 0;
      }
    }

    logger.info("Fetched RUB colleges", {
      count: colleges.length,
      type,
      dzongkhag,
    });

    return successResponse({
      colleges,
      dzongkhags: [
        "Thimphu", "Paro", "Punakha", "Wangdue Phodrang", "Tsirang",
        "Samtse", "Chukha", "Samdrup Jongkhar", "Trashigang", "Mongar",
        "Bumthang", "Trongsa", "Zhemgang", "Sarpang", "Pemagatshel",
        "Trashiyangtse", "Lhuentse", "Gasa", "Dagana"
      ],
    });
  },
  ["student", "parent", "counselor", "teacher", "school-admin", "admin"]
);
