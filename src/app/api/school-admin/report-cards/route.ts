/**
 * REPORT CARDS API
 * Generate and manage student report cards
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import {
  aggregateReportCardData,
  createReportCardRecord,
  getClassReportCards,
  getStudentReportCards,
} from "@/lib/report-cards/aggregator";
import type { ReportCard } from "@/lib/db/schema";

/**
 * GET /api/school-admin/report-cards
 * Get report cards for a class or student
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(["school_admin", "admin"]);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const studentId = searchParams.get("studentId");
    const term = searchParams.get("term");
    const academicYear = searchParams.get("academicYear");

    if (studentId) {
      // Get student's report cards
      const reportCards = await getStudentReportCards(studentId);
      logger.info("Fetched student report cards", { userId, studentId });
      return NextResponse.json({ success: true, data: reportCards });
    }

    if (classId && term && academicYear) {
      // Get class report cards for a term
      const reportCards = await getClassReportCards(classId, term, academicYear);
      logger.info("Fetched class report cards", { userId, classId, term });
      return NextResponse.json({ success: true, data: reportCards });
    }

    return NextResponse.json({
      error: "Missing required parameters. Provide studentId or (classId, term, academicYear)",
    }, { status: 400 });
  } catch (error) {
    logger.apiError(error, { route: "/api/school-admin/report-cards", method: "GET" });
    return NextResponse.json({
      error: "Failed to fetch report cards",
    }, { status: 500 });
  }
}

/**
 * POST /api/school-admin/report-cards
 * Generate a new report card
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(["school_admin", "admin"]);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const body = await req.json();
    const { studentId, examId } = body;

    if (!studentId || !examId) {
      return NextResponse.json({
        error: "Missing required fields: studentId, examId",
      }, { status: 400 });
    }

    // Aggregate report card data
    const reportCardData = await aggregateReportCardData(studentId, examId);

    // Create database record
    const reportCard = await createReportCardRecord(reportCardData, userId);

    logger.info("Report card created", { userId, studentId, examId, reportCardId: reportCard.id });

    return NextResponse.json({
      success: true,
      data: {
        reportCard,
        reportCardData,
      },
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/school-admin/report-cards", method: "POST" });
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to generate report card",
    }, { status: 500 });
  }
}
