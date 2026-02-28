/**
 * REPORT CARDS API
 * Generate and manage student report cards
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse } from "@/lib/api/response-helpers";
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
export const GET = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const studentId = searchParams.get("studentId");
    const term = searchParams.get("term");
    const academicYear = searchParams.get("academicYear");

    if (studentId) {
      // Get student's report cards
      const reportCards = await getStudentReportCards(studentId);
      logger.info("Fetched student report cards", { userId, studentId });
      return successResponse(reportCards);
    }

    if (classId && term && academicYear) {
      // Get class report cards for a term
      const reportCards = await getClassReportCards(classId, term, academicYear);
      logger.info("Fetched class report cards", { userId, classId, term });
      return successResponse(reportCards);
    }

    return badRequestResponse("Missing required parameters. Provide studentId or (classId, term, academicYear)");
  },
  ["school-admin", "admin"]
);

/**
 * POST /api/school-admin/report-cards
 * Generate a new report card
 */
export const POST = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;

    const body = await req.json();
    const { studentId, examId } = body;

    if (!studentId || !examId) {
      return badRequestResponse("Missing required fields: studentId, examId");
    }

    // Aggregate report card data
    const reportCardData = await aggregateReportCardData(studentId, examId);

    // Create database record
    const reportCard = await createReportCardRecord(reportCardData, userId);

    logger.info("Report card created", { userId, studentId, examId, reportCardId: reportCard.id });

    return successResponse({
      reportCard,
      reportCardData,
    });
  },
  ["school-admin", "admin"]
);
