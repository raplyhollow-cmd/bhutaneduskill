import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { users, fileStorage, examResults, parents, parentToStudent } from "@/lib/db/schema";
import { eq, and, or, desc } from "drizzle-orm";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, notFoundResponse } from "@/lib/api/response-helpers";

/**
 * GET /api/parent/documents - Get parent's child documents
 *
 * SECURITY: FERPA COMPLIANCE
 * - Uses parent_to_student join table for verification
 * - Only returns documents for verified children
 *
 * Returns:
 * - All documents for a specific child
 * - Includes report cards, certificates, consent forms, assessments
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */
export const GET = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId } = auth;

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get("childId");

    if (!childId) {
      return badRequestResponse("Child ID is required");
    }

    // FERPA COMPLIANCE: Get parent record first
    const [parentRecord] = await db
      .select()
      .from(parents)
      .where(eq(parents.userId, userId))
      .limit(1);

    if (!parentRecord) {
      logger.warn("No parent record found for user", { userId });
      return errorResponse("Parent record not found", 403);
    }

    // FERPA COMPLIANCE: Verify parent-child relationship via parent_to_student join table
    const [relationship] = await db
      .select()
      .from(parentToStudent)
      .where(
        and(
          eq(parentToStudent.parentId, parentRecord.id),
          eq(parentToStudent.studentId, childId)
        )
      )
      .limit(1);

    if (!relationship) {
      logger.security("ferpa_violation_attempt", {
        parentId: parentRecord.id,
        childId,
        route: "/api/parent/documents",
      });
      return errorResponse("Child not found or access denied", 403);
    }

    // Verify the child exists
    const child = await db.query.users.findFirst({
      where: and(
        eq(users.id, childId),
        eq(users.type, "student")
      ),
    });

    if (!child) {
      return notFoundResponse("Child");
    }

    // Get all files uploaded for this child (consent forms uploaded by parent)
    const childFiles = await db.query.fileStorage.findMany({
      where: eq(fileStorage.userId, childId),
      orderBy: desc(fileStorage.createdAt),
    });

    // Get exam results as report cards
    const examResultsData = await db.query.examResults.findMany({
      where: eq(examResults.userId, childId),
      orderBy: desc(examResults.createdAt),
    });

    // Transform exam results into document format
    const reportCards = examResultsData.map((result) => ({
      id: `report_${result.id}`,
      fileName: result.examName || "Exam Result",
      originalName: `${result.examName || "Exam"} - ${result.examYear}`,
      mimeType: "application/pdf",
      size: 0,
      category: "report_card" as const,
      url: `/results/${result.id}`,
      createdAt: result.createdAt.toISOString(),
      description: `Grade: ${result.grade || "N/A"} - Division: ${result.division || "N/A"}`,
      examData: result,
    }));

    // Transform uploaded files into document format
    const uploadedDocuments = childFiles.map((file) => ({
      id: file.id,
      fileName: file.fileName,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      category: (file.category as any) || "other",
      url: file.url,
      createdAt: file.createdAt.toISOString(),
      description: undefined,
    }));

    // Combine all documents
    const allDocuments = [...reportCards, ...uploadedDocuments];

    return successResponse({
      documents: allDocuments,
      child: {
        id: child.id,
        name: `${child.firstName} ${child.lastName || ""}`.trim(),
        firstName: child.firstName,
        lastName: child.lastName,
      },
    });
  },
  ['parent']
);
