/**
 * GENERATE REPORT CARD PDF API
 * Generate PDF for a specific report card
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { reportCards } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { generateReportCardPDF } from "@/lib/report-cards/pdf-generator";
import { aggregateReportCardData } from "@/lib/report-cards/aggregator";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, badRequestResponse, notFoundResponse, errorResponse as apiErrorResponse } from "@/lib/api/response-helpers";

/**
 * POST /api/school-admin/report-cards/generate
 * Generate PDF for a report card
 */
export const POST = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;

    const body = await req.json();
    const { reportCardId, studentId, examId } = body;

    // If reportCardId provided, fetch existing report card
    if (reportCardId) {
      const [reportCard] = await db
        .select()
        .from(reportCards)
        .where(eq(reportCards.id, reportCardId))
        .limit(1);

      if (!reportCard) {
        return notFoundResponse("Report card");
      }

      // Generate PDF from existing report card
      const reportCardData = await aggregateReportCardData(reportCard.studentId, reportCard.examId!);
      const pdf = await generateReportCardPDF(reportCardData, {
        showSignature: true,
        showWatermark: true,
        schoolLogoUrl: reportCardData.schoolLogo,
        studentPhotoUrl: reportCardData.photo,
      });

      // Convert to base64 for response
      const arrayBuffer = await pdf.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");

      logger.info("Report card PDF generated", { userId, reportCardId });

      return successResponse({
        pdf: `data:application/pdf;base64,${base64}`,
        filename: `ReportCard_${reportCard.studentName}_${reportCard.term}_${reportCard.academicYear}.pdf`,
      });
    }

    // If studentId and examId provided, generate new report card PDF
    if (studentId && examId) {
      const reportCardData = await aggregateReportCardData(studentId, examId);
      const pdf = await generateReportCardPDF(reportCardData, {
        showSignature: true,
        showWatermark: true,
        schoolLogoUrl: reportCardData.schoolLogo,
        studentPhotoUrl: reportCardData.photo,
      });

      // Convert to base64 for response
      const arrayBuffer = await pdf.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");

      logger.info("Report card PDF generated", { userId, studentId, examId });

      return successResponse({
        pdf: `data:application/pdf;base64,${base64}`,
        filename: `ReportCard_${reportCardData.studentName}_${reportCardData.term}_${reportCardData.academicYear}.pdf`,
      });
    }

    return badRequestResponse("Missing required parameters. Provide reportCardId or (studentId, examId)");
  },
  ["school-admin", "admin"]
);
