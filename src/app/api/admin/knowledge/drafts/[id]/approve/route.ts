/**
 * KNOWLEDGE DRAFT APPROVAL API
 *
 * PUT /api/admin/knowledge/drafts/:id/approve - Approve and import knowledge
 * DELETE /api/admin/knowledge/drafts/:id - Reject draft
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { knowledgeDrafts, rubRequirements, nationalScholarships } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

interface ApproveRequest {
  reviewNotes?: string;
}

/**
 * Approve draft and import into main tables
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status },
        { status: authResult.status }
      );
    }

    const { userId } = authResult;
    const body: ApproveRequest = await request.json();

    // Get draft
    const [draft] = await db
      .select()
      .from(knowledgeDrafts)
      .where(eq(knowledgeDrafts.id, id))
      .limit(1);

    if (!draft) {
      return NextResponse.json(
        { error: "Draft not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    if (draft.status !== "pending") {
      return NextResponse.json(
        { error: `Draft already ${draft.status}`, status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    const structuredData = draft.structuredData as any[];
    let importedCount = 0;

    // Import based on source type
    switch (draft.sourceType) {
      case "rub":
      case "college":
        // Import into rub_requirements table
        for (const item of structuredData) {
          await db.insert(rubRequirements).values({
            id: nanoid(),
            collegeId: item.collegeName?.toLowerCase().replace(/\s+/g, "-") || nanoid(),
            programName: item.programName,
            educationLevel: item.educationLevel || "undergraduate",
            requiredSubjects: item.requiredSubjects || [],
            aggregateRequirements: item.aggregateRequirements || {},
            additionalRequirements: item.additionalRequirements,
            duration: item.duration,
            isActive: true,
            sourceDraftId: draft.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          importedCount++;
        }
        break;

      case "scholarship":
        // Import into national_scholarships table
        for (const item of structuredData) {
          await db.insert(nationalScholarships).values({
            id: nanoid(),
            name: item.name,
            provider: item.provider,
            type: item.type,
            educationLevel: item.educationLevel || "undergraduate",
            eligibilityCriteria: item.eligibilityCriteria || {},
            benefits: item.benefits || {},
            applicationDeadline: item.applicationDeadline,
            applicationUrl: item.applicationUrl,
            documentsRequired: item.documentsRequired || [],
            isActive: true,
            sourceDraftId: draft.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          importedCount++;
        }
        break;

      default:
        return NextResponse.json(
          { error: `Unknown source type: ${draft.sourceType}`, status: 400 } satisfies ApiErrorResponse,
          { status: 400 }
        );
    }

    // Update draft status
    await db
      .update(knowledgeDrafts)
      .set({
        status: "approved",
        reviewedBy: userId,
        reviewedAt: new Date(),
        reviewNotes: body.reviewNotes,
        updatedAt: new Date(),
      })
      .where(eq(knowledgeDrafts.id, id));

    logger.info("Knowledge draft approved and imported", {
      draftId: id,
      sourceType: draft.sourceType,
      importedCount,
    });

    return NextResponse.json({
      data: {
        draftId: id,
        importedCount,
        sourceType: draft.sourceType,
      },
    } satisfies ApiSuccess<{ draftId: string; importedCount: number; sourceType: string }>);

  } catch (error) {
    logger.apiError(error, {
      route: `/api/admin/knowledge/drafts/${id}/approve`,
      method: "PUT",
    });

    return NextResponse.json(
      {
        error: "Failed to approve draft",
        status: 500,
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

/**
 * Reject draft
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { userId } = authResult;
    const body = await request.json();
    const { reviewNotes } = body;

    // Get draft
    const [draft] = await db
      .select()
      .from(knowledgeDrafts)
      .where(eq(knowledgeDrafts.id, id))
      .limit(1);


    if (!draft) {
      return NextResponse.json(
        { error: "Draft not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    if (draft.status !== "pending") {
      return NextResponse.json(
        { error: `Draft already ${draft.status}`, status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Update draft status to rejected
    await db
      .update(knowledgeDrafts)
      .set({
        status: "rejected",
        reviewedBy: userId,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes || "Rejected by admin",
        updatedAt: new Date(),
      })
      .where(eq(knowledgeDrafts.id, id));

    logger.info("Knowledge draft rejected", {
      draftId: id,
      sourceType: draft.sourceType,
      reviewNotes,
    });

    return NextResponse.json({
      data: {
        draftId: id,
        status: "rejected",
      },
    } satisfies ApiSuccess<{ draftId: string; status: string }>);

  } catch (error) {
    logger.apiError(error, {
      route: `/api/admin/knowledge/drafts/${id}`,
      method: "DELETE",
    });

    return NextResponse.json(
      {
        error: "Failed to reject draft",
        status: 500,
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
