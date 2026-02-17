import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { users, fileStorage, examResults } from "@/lib/db/schema";
import { eq, and, or, desc } from "drizzle-orm";

/**
 * GET /api/parent/documents - Get parent's child documents
 *
 * Returns:
 * - All documents for a specific child
 * - Includes report cards, certificates, consent forms, assessments
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(['parent']);
    if ('error' in authResult) {
      return authResult;
    }
    const { userId, user } = authResult;

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get("childId");

    if (!childId) {
      return NextResponse.json({ error: "Child ID is required" }, { status: 400 });
    }

    // Verify the child belongs to this parent
    const child = await db.query.users.findFirst({
      where: and(
        eq(users.id, childId),
        eq(users.parentId, user.id)
      ),
    });

    if (!child) {
      return NextResponse.json({ error: "Child not found or access denied" }, { status: 403 });
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

    return NextResponse.json({
      documents: allDocuments,
      child: {
        id: child.id,
        name: `${child.firstName} ${child.lastName || ""}`.trim(),
        firstName: child.firstName,
        lastName: child.lastName,
      },
    });
  } catch (error) {
    console.error("Parent documents fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents", documents: [] },
      { status: 500 }
    );
  }
}
