/**
 * SINGLE REPORT CARD API
 * Fetch detailed report card by ID
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { reportCards } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, badRequestResponse, notFoundResponse } from "@/lib/api/response-helpers";

/**
 * GET /api/school-admin/report-cards/:id
 * Get a single report card with full details
 */
export const GET = createApiRoute(
  async (req: NextRequest, auth, context: { params: Promise<{ id: string }> }) => {
    const { userId } = auth;

    const { id } = await context.params;

    if (!id) {
      return badRequestResponse("Report card ID is required");
    }

    const [reportCard] = await db
      .select()
      .from(reportCards)
      .where(eq(reportCards.id, id))
      .limit(1);

    if (!reportCard) {
      return notFoundResponse("Report card");
    }

    logger.info("Fetched report card details", { userId, reportCardId: id });

    return successResponse(reportCard);
  },
  ["school-admin", "admin"]
);
