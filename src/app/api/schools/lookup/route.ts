/**
 * SCHOOLS LOOKUP API
 *
 * GET /api/schools/lookup - Lookup schools by code or name
 *
 * NOTE: This endpoint is open (no auth required) because it's used during
 * the setup flow where users need to verify their school code before they
 * have an account or permissions. School codes are not sensitive information.
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { schools } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { badRequestResponse, notFoundResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";

export const GET = createApiRoute(
  async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const name = searchParams.get("name");

    logger.debug("[SCHOOL LOOKUP] code:", code, "name:", name);

    if (!code && !name) {
      return badRequestResponse("Missing code or name parameter");
    }

    if (code) {
      // Lookup by code
      const results = await db
        .select()
        .from(schools)
        .where(eq(schools.code, code.toUpperCase()))
        .limit(1);

      logger.debug("[SCHOOL LOOKUP] results:", results);

      const school = results[0];

      if (!school) {
        return notFoundResponse("School");
      }

      return { school };
    }

    if (name) {
      // Search by name - using sql template for proper escaping
      const results = await db.execute(
        sql`SELECT * FROM schools WHERE name LIKE ${'%' + name + '%'} LIMIT 10`
      );

      return { schools: results.rows };
    }

    return badRequestResponse("Invalid request");
  },
  [] // Open endpoint - no auth required
);
