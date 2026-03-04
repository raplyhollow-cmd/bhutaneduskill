/**
 * SITREP API - Platform Admin Daily Briefing
 *
 * GET /api/admin/sitrep - Get latest or generate new SITREP
 * POST /api/admin/sitrep/regenerate - Force regenerate SITREP
 */

import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { logger } from "@/lib/logger";
import { generateSITREP, getLatestSITREP } from "@/lib/sentinel/sitrep-generator";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

export const GET = createApiRoute(
  async (req: NextRequest) => {
    // Get query params
    const { searchParams } = new URL(req.url);
    const force = searchParams.get("force") === "true";
    const useAI = searchParams.get("ai") === "true";

    logger.info("SITREP requested", { force, useAI });

    // Get or generate SITREP
    let sitrep;

    if (force) {
      sitrep = await generateSITREP(undefined, {
        forceRegenerate: true,
        useAIForSummary: useAI,
      });
    } else {
      // Try to get latest first
      const latest = await getLatestSITREP();
      const today = new Date().toISOString().split("T")[0];

      if (latest && latest.reportDate === today) {
        sitrep = latest;
      } else {
        // Generate new for today
        sitrep = await generateSITREP(undefined, {
          useAIForSummary: useAI,
        });
      }
    }

    return {
      data: sitrep,
    } satisfies ApiSuccess<typeof sitrep>;
  },
  ["admin"]
);

export const POST = createApiRoute(
  async (req: NextRequest) => {
    const body = await req.json();
    const useAI = body.useAI !== false; // Default to true

    logger.info("SITREP regeneration requested", { useAI });

    // Force regenerate SITREP
    const sitrep = await generateSITREP(undefined, {
      forceRegenerate: true,
      useAIForSummary: useAI,
    });

    return {
      data: sitrep,
    } satisfies ApiSuccess<typeof sitrep>;
  },
  ["admin"]
);
