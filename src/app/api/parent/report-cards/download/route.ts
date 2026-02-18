/**
 * PARENT DOWNLOAD REPORT CARD API
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { reportCards, users } from "@/lib/db/schema";
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

    // Verify parent access
    const [student] = await db
      .select({ parentId: users.parentId })
      .from(users)
      .where(eq(users.id, reportCard.studentId))
      .limit(1);

    if (!student || student.parentId !== userId) {
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
