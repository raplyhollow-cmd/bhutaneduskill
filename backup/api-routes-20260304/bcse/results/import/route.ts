/**
 * BCSE RESULT IMPORT API
 *
 * Import BCSE examination results from CSV/Excel
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { logger } from "@/lib/logger";
import {
  importBCSEFromCSV,
  generateCSVTemplate,
  getBCSEImportStats,
  type ImportOptions,
} from "@/lib/bcse/importer";
import { badRequestResponse } from "@/lib/api/response-helpers";

// ============================================================================
// POST /api/bcse/results/import
// ============================================================================

export const POST = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;

    const body = await req.json();
    const { csvContent, schoolId, academicYear, examType, skipExisting = true } = body;

    // Validate required fields
    if (!csvContent) {
      return badRequestResponse("CSV content is required");
    }

    if (!schoolId) {
      return badRequestResponse("School ID is required");
    }

    if (!academicYear) {
      return badRequestResponse("Academic year is required");
    }

    if (!examType || !["BCSE_10", "BCSE_12"].includes(examType)) {
      return badRequestResponse("Exam type must be BCSE_10 or BCSE_12");
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

    return {
      success: result.success,
      data: {
        totalRows: result.totalRows,
        imported: result.imported,
        failed: result.failed,
        errors: result.errors,
      },
    };
  },
  ['school-admin', 'admin']
);

// ============================================================================
// GET /api/bcse/results/import
// ============================================================================

export const GET = createApiRoute(
  async (req: NextRequest, auth) => {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const schoolId = searchParams.get("schoolId");
    const examType = (searchParams.get("examType") || "BCSE_12") as "BCSE_10" | "BCSE_12";

    // Generate CSV template
    if (action === "template") {
      const template = generateCSVTemplate(examType);
      return {
        success: true,
        data: {
          template,
          filename: `bcse_${examType}_template.csv`,
        },
      };
    }

    // Get import statistics
    if (action === "stats" && schoolId) {
      const stats = await getBCSEImportStats(schoolId);
      return {
        success: true,
        data: stats,
      };
    }

    return {
      error: "Invalid action. Use 'template' or 'stats' with schoolId",
      status: 400,
    };
  },
  ['school-admin', 'admin']
);
