/**
 * CAREERS API
 *
 * GET /api/careers - Get all careers or user's matched careers
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { CAREERS_DATABASE } from "@/lib/tenant";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";

// ============================================================================
// GET /api/careers - Get all careers or user's matched careers
// ============================================================================

export const GET = createApiRoute(
  async (req: NextRequest) => {
    const auth = getAuth(req);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(req.url);
    const userIdParam = searchParams.get("userId");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    let careers = [...CAREERS_DATABASE];

    // Filter by search term
    if (search) {
      const searchLower = search.toLowerCase();
      careers = careers.filter(
        (c) =>
          c.name.toLowerCase().includes(searchLower) ||
          c.description.toLowerCase().includes(searchLower) ||
          c.skills.some((s) => s.toLowerCase().includes(searchLower))
      );
    }

    // Filter by category (RIASEC)
    if (category) {
      careers = careers.filter((c) => c.riasecCode.includes(category.toUpperCase()));
    }

    return successResponse({
      careers,
      total: careers.length,
    });
  },
  ['student', 'teacher', 'admin', 'counselor']
);
