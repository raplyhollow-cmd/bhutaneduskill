/**
 * SCHOOLS VERIFY CODE API
 *
 * POST /api/schools/verify-code - Verify a school code during setup wizard
 *
 * Requires authentication but open to all authenticated users (setup flow)
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { schools } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { badRequestResponse, notFoundResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";

export const POST = createApiRoute(
  async (request: NextRequest) => {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return badRequestResponse("School code is required");
    }

    const schoolRecords = await db
      .select()
      .from(schools)
      .where(eq(schools.code, code.toUpperCase()))
      .limit(1);

    if (schoolRecords.length === 0) {
      return notFoundResponse("Invalid school code");
    }

    return { school: schoolRecords[0] };
  },
  [] // Open to all authenticated users
);
