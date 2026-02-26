/**
 * Data Export API
 * Export school data in various formats
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { exportData, importData } from "@/lib/data-export/import";
import type { ExportOptions, ImportOptions } from "@/lib/data-export/import";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";

/**
 * GET /api/school-admin/data-export
 * Export school data
 */
export const GET = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { user } = auth;
    const { userId } = auth;

    const { searchParams } = new URL(request.url);
    const format = (searchParams.get("format") || "csv") as "csv" | "json" | "excel";
    const dataType = (searchParams.get("dataType") || "all") as any;
    const schoolId = searchParams.get("schoolId") || "";
    const academicYear = searchParams.get("academicYear") || undefined;
    const classId = searchParams.get("classId") || undefined;

    const options: ExportOptions = {
      format,
      dataType,
      schoolId,
      academicYear,
      classId,
    };

    const result = await exportData(options);

    if (!result.success) {
      return errorResponse(result.error, 400);
    }

    logger.info("Data exported", {
      userId,
      dataType,
      format,
      recordCount: result.recordCount,
    });

    // Return file content directly - need to return NextResponse for binary data
    return new NextResponse(result.data, {
      status: 200,
      headers: {
        "Content-Type": result.mimeType,
        "Content-Disposition": `attachment; filename="${result.filename}"`,
      },
    }) as any;
  },
  ['school-admin', 'admin']
);

/**
 * POST /api/school-admin/data-export
 * Import school data
 */
export const POST = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { user, userId } = auth;

    const body = await request.json();
    const { format, dataType, schoolId, data, academicYear, skipDuplicates } = body;

    if (!format || !dataType || !schoolId || !data) {
      return errorResponse("Missing required fields: format, dataType, schoolId, data", 400);
    }

    const options: ImportOptions = {
      format,
      dataType,
      schoolId,
      data,
      academicYear,
      skipDuplicates,
    };

    const result = await importData(options);

    logger.info("Data imported", {
      userId,
      dataType,
      format,
      imported: result.imported,
      failed: result.failed,
    });

    return successResponse(result);
  },
  ['school-admin', 'admin']
);