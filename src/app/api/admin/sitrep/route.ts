/**
 * SITREP API - Platform Admin Daily Briefing
 *
 * GET /api/admin/sitrep - Get latest or generate new SITREP
 * POST /api/admin/sitrep/regenerate - Force regenerate SITREP
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { generateSITREP, getLatestSITREP } from "@/lib/sentinel/sitrep-generator";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { userId } = authResult;

    // Get query params
    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";
    const useAI = searchParams.get("ai") === "true";

    logger.info("SITREP requested", { userId, force, useAI });

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

    return NextResponse.json({
      data: sitrep,
    } satisfies ApiSuccess<typeof sitrep>);

  } catch (error) {
    logger.apiError(error, {
      route: "/api/admin/sitrep",
      method: "GET",
    });

    return NextResponse.json(
      {
        error: "Failed to generate SITREP",
        status: 500,
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { userId } = authResult;
    const body = await request.json();
    const useAI = body.useAI !== false; // Default to true

    logger.info("SITREP regeneration requested", { userId, useAI });

    // Force regenerate SITREP
    const sitrep = await generateSITREP(undefined, {
      forceRegenerate: true,
      useAIForSummary: useAI,
    });

    return NextResponse.json({
      data: sitrep,
    } satisfies ApiSuccess<typeof sitrep>);

  } catch (error) {
    logger.apiError(error, {
      route: "/api/admin/sitrep",
      method: "POST",
    });

    return NextResponse.json(
      {
        error: "Failed to regenerate SITREP",
        status: 500,
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
