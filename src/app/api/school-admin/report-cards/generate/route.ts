/**
 * GENERATE REPORT CARD PDF API
 * Generate PDF for a specific report card
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { reportCards } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { generateReportCardPDF } from "@/lib/report-cards/pdf-generator";
import { aggregateReportCardData } from "@/lib/report-cards/aggregator";

/**
 * POST /api/school-admin/report-cards/generate
 * Generate PDF for a report card
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(["school_admin", "admin"]);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

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
        return NextResponse.json({ error: "Report card not found" }, { status: 404 });
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

      return NextResponse.json({
        success: true,
        data: {
          pdf: `data:application/pdf;base64,${base64}`,
          filename: `ReportCard_${reportCard.studentName}_${reportCard.term}_${reportCard.academicYear}.pdf`,
        },
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

      return NextResponse.json({
        success: true,
        data: {
          pdf: `data:application/pdf;base64,${base64}`,
          filename: `ReportCard_${reportCardData.studentName}_${reportCardData.term}_${reportCardData.academicYear}.pdf`,
        },
      });
    }

    return NextResponse.json({
      error: "Missing required parameters. Provide reportCardId or (studentId, examId)",
    }, { status: 400 });
  } catch (error) {
    logger.apiError(error, { route: "/api/school-admin/report-cards/generate", method: "POST" });
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to generate PDF",
    }, { status: 500 });
  }
}
