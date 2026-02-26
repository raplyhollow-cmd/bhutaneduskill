/**
 * RUB Scholarships API
 * Browse and search RUB scholarships
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { rubScholarships } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { eq, and, or, like, sql, gt } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse } from "@/lib/api/response-helpers";

// ============================================================================
// TYPES
// ============================================================================

type WhereCondition = SQL | undefined;

/**
 * GET /api/rub/scholarships
 * Browse RUB scholarships
 */
export const GET = createApiRoute(
  async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // merit, need_based, sports, arts, government, private
    const provider = searchParams.get("provider"); // RUB, Govt, Private
    const active = searchParams.get("active") === "true";
    const search = searchParams.get("search");

    // Build query conditions
    const conditions: WhereCondition[] = [];

    // Only show active scholarships by default
    if (active || !searchParams.has("active")) {
      conditions.push(eq(rubScholarships.isActive, true));
    }

    if (type) {
      conditions.push(eq(rubScholarships.type, type));
    }

    if (provider) {
      conditions.push(eq(rubScholarships.provider, provider));
    }

    if (search) {
      conditions.push(
        or(
          like(rubScholarships.name, `%${search}%`),
          like(rubScholarships.code, `%${search}%`),
          like(sql`COALESCE(${rubScholarships.description}, '')`, `%${search}%`),
          like(sql`COALESCE(${rubScholarships.providerName}, '')`, `%${search}%`)
        )
      );
    }

    // Fetch scholarships
    const scholarships = await db
      .select({
        id: rubScholarships.id,
        name: rubScholarships.name,
        code: rubScholarships.code,
        type: rubScholarships.type,
        provider: rubScholarships.provider,
        providerName: rubScholarships.providerName,
        coversTuition: rubScholarships.coversTuition,
        coversHostel: rubScholarships.coversHostel,
        coversBooks: rubScholarships.coversBooks,
        coversLiving: rubScholarships.coversLiving,
        coveragePercentage: rubScholarships.coveragePercentage,
        minPercentage: rubScholarships.minPercentage,
        annualIncomeLimit: rubScholarships.annualIncomeLimit,
        categories: rubScholarships.categories,
        duration: rubScholarships.duration,
        applicationOpenDate: rubScholarships.applicationOpenDate,
        applicationCloseDate: rubScholarships.applicationCloseDate,
        requiredDocuments: rubScholarships.requiredDocuments,
        description: rubScholarships.description,
        termsAndConditions: rubScholarships.termsAndConditions,
        academicYear: rubScholarships.academicYear,
        isActive: rubScholarships.isActive,
        createdAt: rubScholarships.createdAt,
        updatedAt: rubScholarships.updatedAt,
      })
      .from(rubScholarships)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(rubScholarships.name)
      .limit(100);

    logger.info("Fetched RUB scholarships", {
      count: scholarships.length,
      type,
      provider,
    });

    return successResponse({
      scholarships,
      filters: {
        types: ["merit", "need_based", "sports", "arts", "government", "private"],
        providers: ["RUB", "Govt", "Private Organization"],
      },
    });
  },
  ["student", "parent", "counselor", "teacher", "school-admin", "admin"]
);
