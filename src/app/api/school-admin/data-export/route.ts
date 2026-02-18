/**
 * Data Export API
 * Export school data in various formats
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { exportData, importData } from "@/lib/data-export/import";
import type { ExportOptions, ImportOptions } from "@/lib/data-export/import";

/**
 * GET /api/school-admin/data-export
 * Export school data
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(["school_admin", "admin"]);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const { searchParams } = new URL(req.url);
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
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 400 });
    }

    logger.info("Data exported", {
      userId,
      dataType,
      format,
      recordCount: result.recordCount,
    });

    // Return file content directly
    return new NextResponse(result.data, {
      status: 200,
      headers: {
        "Content-Type": result.mimeType,
        "Content-Disposition": `attachment; filename="${result.filename}"`,
      },
    });

  } catch (error) {
    logger.apiError(error, { route: "/api/school-admin/data-export", method: "GET" });
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to export data",
    }, { status: 500 });
  }
}

/**
 * POST /api/school-admin/data-export
 * Import school data
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(["school_admin", "admin"]);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const body = await req.json();
    const { format, dataType, schoolId, data, academicYear, skipDuplicates } = body;

    if (!format || !dataType || !schoolId || !data) {
      return NextResponse.json({
        error: "Missing required fields: format, dataType, schoolId, data",
      }, { status: 400 });
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

    return NextResponse.json({
      success: result.success,
      data: result,
    });

  } catch (error) {
    logger.apiError(error, { route: "/api/school-admin/data-export", method: "POST" });
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to import data",
    }, { status: 500 });
  }
}
