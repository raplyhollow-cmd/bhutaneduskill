/**
 * BCSE Result Import API
 * Import BCSE examination results from CSV/Excel
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import {
  importBCSEFromCSV,
  generateCSVTemplate,
  getBCSEImportStats,
  type ImportOptions,
} from "@/lib/bcse/importer";

/**
 * POST /api/bcse/results/import
 * Import BCSE results from CSV
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(["school_admin", "admin"]);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const body = await req.json();
    const { csvContent, schoolId, academicYear, examType, skipExisting = true } = body;

    // Validate required fields
    if (!csvContent) {
      return NextResponse.json({
        error: "CSV content is required",
      }, { status: 400 });
    }

    if (!schoolId) {
      return NextResponse.json({
        error: "School ID is required",
      }, { status: 400 });
    }

    if (!academicYear) {
      return NextResponse.json({
        error: "Academic year is required",
      }, { status: 400 });
    }

    if (!examType || !["BCSE_10", "BCSE_12"].includes(examType)) {
      return NextResponse.json({
        error: "Exam type must be BCSE_10 or BCSE_12",
      }, { status: 400 });
    }

    // Import results
    const options: ImportOptions = {
      schoolId,
      academicYear,
      examType,
      skipExisting,
    };

    const result = await importBCSEFromCSV(csvContent, options);

    logger.info("BCSE results imported", {
      userId,
      schoolId,
      examType,
      imported: result.imported,
      failed: result.failed,
    });

    return NextResponse.json({
      success: result.success,
      data: {
        totalRows: result.totalRows,
        imported: result.imported,
        failed: result.failed,
        errors: result.errors,
      },
    });

  } catch (error) {
    logger.apiError(error, { route: "/api/bcse/results/import", method: "POST" });
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to import BCSE results",
    }, { status: 500 });
  }
}

/**
 * GET /api/bcse/results/import
 * Get import statistics or CSV template
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(["school_admin", "admin"]);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const schoolId = searchParams.get("schoolId");
    const examType = (searchParams.get("examType") || "BCSE_12") as "BCSE_10" | "BCSE_12";

    // Generate CSV template
    if (action === "template") {
      const template = generateCSVTemplate(examType);
      return NextResponse.json({
        success: true,
        data: {
          template,
          filename: `bcse_${examType}_template.csv`,
        },
      });
    }

    // Get import statistics
    if (action === "stats" && schoolId) {
      const stats = await getBCSEImportStats(schoolId);
      return NextResponse.json({
        success: true,
        data: stats,
      });
    }

    return NextResponse.json({
      error: "Invalid action. Use 'template' or 'stats' with schoolId",
    }, { status: 400 });

  } catch (error) {
    logger.apiError(error, { route: "/api/bcse/results/import", method: "GET" });
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to process request",
    }, { status: 500 });
  }
}
