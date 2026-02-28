/**
 * SCHOOLS SEARCH API
 *
 * GET /api/schools/search - Search schools by name
 *
 * This endpoint is open (no auth required) because it's used during
 * the setup flow where users need to find their school before they
 * have an account. School names are not sensitive information.
 *
 * Query params:
 * - name: Search query for school name (partial match, case-insensitive)
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { schools } from "@/lib/db/schema";
import { ilike } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { createApiRoute } from "@/lib/api/route-handler";
import { badRequestResponse } from "@/lib/api/response-helpers";

export const GET = createApiRoute(
  async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");

    // Validate input
    if (!name || name.trim().length < 2) {
      return badRequestResponse("Search query must be at least 2 characters");
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
      .where(ilike(schools.name, `%${name.trim()}%`))
      .limit(10);

    logger.info("School search executed", {
      route: "/api/schools/search",
      query: name.trim(),
      resultsCount: results.length,
    });

    return {
      success: true,
      schools: results,
    };
  },
  [] // Open endpoint - no auth required
);
