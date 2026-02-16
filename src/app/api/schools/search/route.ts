import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { schools } from "@/lib/db/schema";
import { like } from "drizzle-orm";
import { logger } from "@/lib/logger";

/**
 * GET /api/schools/search
 * Search schools by name (open endpoint for setup wizard)
 *
 * This endpoint is open (no auth required) because it's used during
 * the setup flow where users need to find their school before they
 * have an account. School names are not sensitive information.
 *
 * Query params:
 * - name: Search query for school name (partial match, case-insensitive)
 *
 * Response:
 * {
 *   "success": true,
 *   "schools": [
 *     {
 *       "id": "school_123",
 *       "name": "Yangchenphug High School",
 *       "code": "YHS-THI-2026",
 *       "city": "Thimphu",
 *       "state": "Thimphu"
 *     }
 *   ]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");

    // Validate input
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: "Search query must be at least 2 characters",
        },
        { status: 400 }
      );
    }

    // Search schools by name (case-insensitive partial match)
    const results = await db
      .select({
        id: schools.id,
        name: schools.name,
        code: schools.code,
        city: schools.city,
        state: schools.state,
      })
      .from(schools)
      .where(like(schools.name, `%${name.trim()}%`))
      .limit(10);

    logger.info("School search executed", {
      route: "/api/schools/search",
      query: name.trim(),
      resultsCount: results.length,
    });

    return NextResponse.json({
      success: true,
      schools: results,
    });
  } catch (error) {
    logger.apiError(error, {
      route: "/api/schools/search",
      method: "GET",
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to search schools. Please try again.",
      },
      { status: 500 }
    );
  }
}
