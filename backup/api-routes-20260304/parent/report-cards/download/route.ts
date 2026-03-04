/**
 * PARENT DOWNLOAD REPORT CARD API
 *
 * SECURITY: FERPA COMPLIANCE
 * - Uses parent_to_student join table for verification
 * - Only allows download of verified children's report cards
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */
import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { reportCards, users, parents, parentToStudent } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { aggregateReportCardData } from "@/lib/report-cards/aggregator";
import { generateReportCardPDF } from "@/lib/report-cards/pdf-generator";
import { createApiRoute } from "@/lib/api/route-handler";

export const POST = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;
    const body = await req.json();
    const { reportCardId } = body;

    if (!reportCardId) {
      return {
        success: false,
        error: "Report card ID is required",
        status: 400,
      };
    }

    // Fetch report card
    const [reportCard] = await db
      .select()
      .from(reportCards)
      .where(eq(reportCards.id, reportCardId))
      .limit(1);

    if (!reportCard) {
      return {
        success: false,
        error: "Report card not found",
        status: 404,
      };
    }

    // FERPA COMPLIANCE: Get parent record first
    const [parentRecord] = await db
      .select()
      .from(parents)
      .where(eq(parents.userId, userId))
      .limit(1);

    if (!parentRecord) {
      logger.warn("No parent record found for user", { userId });
      return {
        success: false,
        error: "Parent record not found",
        status: 403,
      };
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
      return {
        success: false,
        error: "Access denied",
        status: 403,
      };
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

    return {
      success: true,
      data: {
        pdf: `data:application/pdf;base64,${base64}`,
        filename: `ReportCard_${reportCard.studentName}_${reportCard.term}_${reportCard.academicYear}.pdf`,
      },
    };
  },
  ["parent"]
);
