/**
 * PARENT DOWNLOAD REPORT CARD API
 *
 * SECURITY: FERPA COMPLIANCE
 * - Uses parent_to_student join table for verification
 * - Only allows download of verified children's report cards
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { reportCards, users, parents, parentToStudent } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { aggregateReportCardData } from "@/lib/report-cards/aggregator";
import { generateReportCardPDF } from "@/lib/report-cards/pdf-generator";

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(["parent"]);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;
    const body = await req.json();
    const { reportCardId } = body;

    if (!reportCardId) {
      return NextResponse.json({
        success: false,
        error: "Report card ID is required",
      }, { status: 400 });
    }

    // Fetch report card
    const [reportCard] = await db
      .select()
      .from(reportCards)
      .where(eq(reportCards.id, reportCardId))
      .limit(1);

    if (!reportCard) {
      return NextResponse.json({
        success: false,
        error: "Report card not found",
      }, { status: 404 });
    }

    // FERPA COMPLIANCE: Get parent record first
    const [parentRecord] = await db
      .select()
      .from(parents)
      .where(eq(parents.userId, userId))
      .limit(1);

    if (!parentRecord) {
      logger.warn("No parent record found for user", { userId });
      return NextResponse.json({
        success: false,
        error: "Parent record not found",
      }, { status: 403 });
    }

    // FERPA COMPLIANCE: Verify parent-child relationship via parent_to_student join table
    const [relationship] = await db
      .select()
      .from(parentToStudent)
      .where(
        and(
          eq(parentToStudent.parentId, parentRecord.id),
          eq(parentToStudent.studentId, reportCard.studentId)
        )
      )
      .limit(1);

    if (!relationship) {
      logger.security("ferpa_violation_attempt", {
        parentId: parentRecord.id,
        studentId: reportCard.studentId,
        reportCardId,
        route: "/api/parent/report-cards/download",
      });
      return NextResponse.json({
        success: false,
        error: "Access denied",
      }, { status: 403 });
    }

    // Generate PDF
    const reportCardData = await aggregateReportCardData(reportCard.studentId, reportCard.examId!);
    const pdf = await generateReportCardPDF(reportCardData, {
      showSignature: true,
      showWatermark: true,
    });

    // Convert to base64
    const arrayBuffer = await pdf.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    logger.info("Parent downloaded report card", { userId, reportCardId });

    return NextResponse.json({
      success: true,
      data: {
        pdf: `data:application/pdf;base64,${base64}`,
        filename: `ReportCard_${reportCard.studentName}_${reportCard.term}_${reportCard.academicYear}.pdf`,
      },
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/parent/report-cards/download", method: "POST" });
    return NextResponse.json({
      success: false,
      error: "Failed to download report card",
    }, { status: 500 });
  }
}
