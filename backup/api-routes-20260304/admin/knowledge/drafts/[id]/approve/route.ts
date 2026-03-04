/**
 * KNOWLEDGE DRAFT APPROVAL API
 *
 * PUT /api/admin/knowledge/drafts/:id/approve - Approve and import knowledge
 * DELETE /api/admin/knowledge/drafts/:id - Reject draft
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { knowledgeDrafts, rubRequirements, nationalScholarships } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { ApiSuccess, ApiErrorResponse } from "@/types";
import { createApiRoute } from "@/lib/api/route-handler";
import type { NewRubRequirement, NewNationalScholarship } from "@/lib/db/schema";

interface ApproveRequest {
  reviewNotes?: string;
}

// Type for structured data items in knowledge drafts
type StructuredDataItem = Record<string, unknown>;

// Type for rub requirement items - matching schema expectations
interface RubRequirementItem {
  collegeId?: string;
  collegeName?: string;
  programName: string;
  educationLevel?: string;
  requiredSubjects?: Array<{
    subject: string;
    minimumGrade: string;
    minimumPercentage: number;
  }>;
  aggregateRequirements?: {
    minimumPercentage?: number;
    subjectsToConsider?: string[];
    englishRequired?: boolean;
    dzongkhaRequired?: boolean;
  };
  additionalRequirements?: string;
  duration?: number | string;
}

// Type for scholarship items
interface ScholarshipItem {
  name: string;
  provider?: string;
  type?: string;
  educationLevel?: string;
  eligibilityCriteria?: Record<string, unknown>;
  benefits?: Record<string, unknown>;
  applicationDeadline?: string;
  applicationUrl?: string;
  documentsRequired?: string[];
}

/**
 * Approve draft and import into main tables
 */
export const PUT = createApiRoute<{ id: string }>(
  async (request: NextRequest, auth, { params }) => {
    const { id } = await params;
    const { userId } = auth;
    const body: ApproveRequest = await request.json();

    // Get draft
    const [draft] = await db
      .select()
      .from(knowledgeDrafts)
      .where(eq(knowledgeDrafts.id, id))
      .limit(1);

    if (!draft) {
      return { error: "Draft not found", status: 404 };
    }

    if (draft.status !== "pending") {
      return { error: `Draft already ${draft.status}`, status: 400 };
    }

    const structuredData = (draft.structuredData || []) as StructuredDataItem[];
    let importedCount = 0;

    // Import based on source type
    switch (draft.sourceType) {
      case "rub":
      case "college":
        // Import into rub_requirements table
        for (const item of structuredData) {
          // Generate a college ID from college name if not provided
          const collegeId = item.collegeId as string | undefined ||
            (item.collegeName as string | undefined)?.toLowerCase().replace(/\s+/g, "-") ||
            nanoid();

          // Ensure duration is a string
          const durationValue = (item.duration as number | string | undefined)?.toString() || "4 years";

          const requirementData: NewRubRequirement = {
            id: nanoid(),
            collegeId,
            programName: item.programName as string,
            educationLevel: (item.educationLevel as string) || "undergraduate",
            requiredSubjects: (item.requiredSubjects as Array<{
              subject: string;
              minimumGrade: string;
              minimumPercentage: number;
            }> | undefined) || [],
            aggregateRequirements: (item.aggregateRequirements as {
              minimumPercentage?: number;
              subjectsToConsider?: string[];
              englishRequired?: boolean;
              dzongkhaRequired?: boolean;
            } | undefined) || {},
            additionalRequirements: item.additionalRequirements as string | undefined,
            duration: durationValue,
            isActive: true,
            sourceDraftId: draft.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await db.insert(rubRequirements).values(requirementData);
          importedCount++;
        }
        break;

      case "scholarship":
        // Import into national_scholarships table
        for (const item of structuredData) {
          // Normalize benefits to match schema requirements
          const rawBenefits = item.benefits as Record<string, unknown> | undefined;
          const normalizedBenefits = {
            covers: Array.isArray(rawBenefits?.covers)
              ? rawBenefits.covers as string[]
              : (Array.isArray(rawBenefits) ? rawBenefits as string[] : ["tuition"]),
            amount: typeof rawBenefits?.amount === "number" ? rawBenefits.amount : undefined,
            currency: typeof rawBenefits?.currency === "string" ? rawBenefits.currency : undefined,
            notes: typeof rawBenefits?.notes === "string" ? rawBenefits.notes : undefined,
          };

          const scholarshipData: NewNationalScholarship = {
            id: nanoid(),
            name: item.name as string,
            provider: (item.provider as string) || "",
            type: (item.type as string) || "merit",
            educationLevel: (item.educationLevel as string) || "undergraduate",
            eligibilityCriteria: (item.eligibilityCriteria as Record<string, unknown>) || {},
            benefits: normalizedBenefits,
            applicationDeadline: item.applicationDeadline as string | undefined,
            applicationUrl: item.applicationUrl as string | undefined,
            documentsRequired: (item.documentsRequired as string[] | undefined) || [],
            isActive: true,
            sourceDraftId: draft.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await db.insert(nationalScholarships).values(scholarshipData);
          importedCount++;
        }
        break;

      default:
        return { error: `Unknown source type: ${draft.sourceType}`, status: 400 };
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

    return {
      data: {
        draftId: id,
        importedCount,
        sourceType: draft.sourceType,
      },
    };
  },
  ["admin"]
);

/**
 * Reject draft
 */
export const DELETE = createApiRoute<{ id: string }>(
  async (request: NextRequest, auth, { params }) => {
    const { id } = await params;
    const { userId } = auth;
    const body = await request.json();
    const { reviewNotes } = body;

    // Get draft
    const [draft] = await db
      .select()
      .from(knowledgeDrafts)
      .where(eq(knowledgeDrafts.id, id))
      .limit(1);

    if (!draft) {
      return { error: "Draft not found", status: 404 };
    }

    if (draft.status !== "pending") {
      return { error: `Draft already ${draft.status}`, status: 400 };
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

    return {
      data: {
        draftId: id,
        status: "rejected",
      },
    };
  },
  ["admin"]
);
