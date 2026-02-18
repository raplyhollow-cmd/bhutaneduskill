/**
 * Scholarships API
 * Browse government and private scholarships
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { rubScholarships } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { eq, and, or, like, sql } from "drizzle-orm";

/**
 * GET /api/scholarships
 * Browse available scholarships
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(["student", "parent", "counselor", "teacher", "school_admin", "admin"]);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // merit, need_based, sports, arts, government, private
    const provider = searchParams.get("provider");
    const level = searchParams.get("level"); // For filtering by program level
    const minPercentage = searchParams.get("minPercentage");
    const search = searchParams.get("search");
    const activeOnly = searchParams.get("activeOnly") !== "false"; // Default true

    // Build query conditions
    const conditions: any[] = [];

    if (activeOnly) {
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
          like(sql`COALESCE(${rubScholarships.description}, '')`, `%${search}%`),
          like(rubScholarships.code, `%${search}%`)
        )
      );
    }

    // Fetch scholarships
    const scholarships = await db
      .select()
      .from(rubScholarships)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(rubScholarships.name)
      .limit(100);

    logger.info("Fetched scholarships", {
      count: scholarships.length,
      type,
      provider,
    });

    return NextResponse.json({
      success: true,
      data: {
        scholarships,
        filters: {
          types: [
            { value: "merit", label: "Merit Based" },
            { value: "need_based", label: "Need Based" },
            { value: "sports", label: "Sports" },
            { value: "arts", label: "Arts & Culture" },
            { value: "government", label: "Government" },
            { value: "private", label: "Private Organization" },
          ],
          providers: [
            { value: "Govt", label: "Royal Government of Bhutan" },
            { value: "RUB", label: "Royal University of Bhutan" },
            { value: "Private", label: "Private Organizations" },
            { value: "International", label: "International" },
          ],
        },
      },
    });

  } catch (error) {
    logger.apiError(error, { route: "/api/scholarships", method: "GET" });
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to fetch scholarships",
    }, { status: 500 });
  }
}
