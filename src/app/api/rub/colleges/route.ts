/**
 * RUB Colleges API
 * Browse RUB constituent and affiliated colleges
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { rubColleges, rubPrograms } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { eq, and, count } from "drizzle-orm";

/**
 * GET /api/rub/colleges
 * Browse RUB colleges
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(["student", "parent", "counselor", "teacher", "school_admin", "admin"]);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // constituent, affiliated
    const dzongkhag = searchParams.get("dzongkhag");
    const withPrograms = searchParams.get("withPrograms") === "true";

    // Build query conditions
    const conditions: any[] = [eq(rubColleges.isActive, true)];

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

        (college as any).programCount = programCount?.count || 0;
      }
    }

    logger.info("Fetched RUB colleges", {
      count: colleges.length,
      type,
      dzongkhag,
    });

    return NextResponse.json({
      success: true,
      data: {
        colleges,
        dzongkhags: [
          "Thimphu", "Paro", "Punakha", "Wangdue Phodrang", "Tsirang",
          "Samtse", "Chukha", "Samdrup Jongkhar", "Trashigang", "Mongar",
          "Bumthang", "Trongsa", "Zhemgang", "Sarpang", "Pemagatshel",
          "Trashiyangtse", "Lhuentse", "Gasa", "Dagana"
        ],
      },
    });

  } catch (error) {
    logger.apiError(error, { route: "/api/rub/colleges", method: "GET" });
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to fetch colleges",
    }, { status: 500 });
  }
}
