/**
 * COUNSELOR CAREER REVIEW API
 *
 * Features:
 * - AI-suggested career recommendations
 * - Counselor review workflow (approve/conditions/not recommended)
 * - Decision rationale tracking
 * - Student response handling
 * - Parent involvement
 * - Progress tracking
 *
 * Last Updated: March 5, 2026
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { careerRecommendations, careerReviewNotes, users } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface AICareerSuggestion {
  careerId: string;
  careerTitle: string;
  category?: string;
  matchScore: number;
  confidence: "high" | "medium" | "low";
  scores: {
    assessment: number;
    academic: number;
    skills: number;
    interests: number;
  };
  skillsGap: {
    missing: string[];
    have: string[];
    readiness: number;
  };
  rubPrograms?: Array<{
    collegeId: string;
    collegeName: string;
    programName: string;
    admissionProbability: number;
  }>;
  rationale: string;
}

export interface CounselorReview {
  recommendationId: string;
  studentId: string;
  counselorId: string;

  // AI suggestion (what AI recommends)
  aiSuggestion: AICareerSuggestion;

  // Counselor decision
  status: "pending" | "approved" | "approved-with-conditions" | "not-recommended";
  decision?: {
    approved: boolean;
    conditions?: string[];
    rationale: string;
    alternativeCareers?: string[];
    nextSteps?: string[];
  };

  // Student response
  studentResponse?: string;
  studentAccepted?: boolean;
  respondedAt?: Date;

  // Parent involvement
  parentViewed?: boolean;
  parentApproved?: boolean;
  parentFeedback?: string;

  // Timeline
  suggestedAt: Date;
  reviewedAt?: Date;
  studentRespondedAt?: Date;
  parentViewedAt?: Date;

  // Follow-up
  followUpScheduled?: Date;
  followUpCompleted?: boolean;
}

export interface ReviewNote {
  id: string;
  recommendationId: string;
  authorId: string;
  authorRole: "counselor" | "student" | "parent";
  content: string;
  isPrivate: boolean;
  createdAt: Date;
}

// ============================================================================
// STATUS ENUMS
// ============================================================================

export const REVIEW_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  APPROVED_WITH_CONDITIONS: "approved-with-conditions",
  NOT_RECOMMENDED: "not-recommended",
} as const;

export type ReviewStatus = typeof REVIEW_STATUS[keyof typeof REVIEW_STATUS];

// ============================================================================
// AI SUGGESTION GENERATION
// ============================================================================

/**
 * Generate AI career suggestion for a student
 * This would typically call the advanced career matching service
 */
async function generateAISuggestion(
  studentId: string,
  options: {
    targetCareerId?: string;
    includeRUBPrograms?: boolean;
  } = {}
): Promise<AICareerSuggestion> {
  // Get student profile (simplified - would fetch from DB in production)
  const student = await db.query.users.findFirst({
    where: eq(users.id, studentId),
  });

  if (!student) {
    throw new Error("Student not found");
  }

  // Call the advanced career matching service
  // For now, return a mock suggestion
  const suggestion: AICareerSuggestion = {
    careerId: options.targetCareerId || "software_engineer",
    careerTitle: "Software Engineer",
    matchScore: 85,
    confidence: "high",
    scores: {
      assessment: 90,
      academic: 78,
      skills: 85,
      interests: 80,
    },
    skillsGap: {
      have: ["Data Structures", "Algorithms"],
      missing: ["System Design", "Advanced Algorithms"],
      readiness: 75,
    },
    rubPrograms: options.includeRUBPrograms ? [
      {
        collegeId: "rub_cst",
        collegeName: "College of Science and Technology",
        programName: "B.E. in Computer Engineering",
        admissionProbability: 75,
      },
    ] : undefined,
    rationale: "Based on strong math grades, interest in technology, and problem-solving skills demonstrated in class.",
  };

  return suggestion;
}

// ============================================================================
// COUNSELOR REVIEW WORKFLOW
// ============================================================================

/**
 * Submit AI suggestion for counselor review
 */
export async function submitForReview(input: {
  studentId: string;
  counselorId: string;
  aiSuggestion: AICareerSuggestion;
}): Promise<string> {
  const recommendationId = `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  await db.insert(careerRecommendations).values({
    studentId: input.studentId,
    counselorId: input.counselorId,
    careerId: input.aiSuggestion.careerId,
    careerTitle: input.aiSuggestion.careerTitle,
    category: input.aiSuggestion.category || "General",
    matchScore: input.aiSuggestion.matchScore,
    confidence: input.aiSuggestion.confidence,
    assessmentScore: input.aiSuggestion.scores?.assessment || 0,
    academicScore: input.aiSuggestion.scores?.academic || 0,
    skillsScore: input.aiSuggestion.scores?.skills || 0,
    interestsScore: input.aiSuggestion.scores?.interests || 0,
    skillsGap: input.aiSuggestion.skillsGap,
    rubPrograms: input.aiSuggestion.rubPrograms,
    rationale: input.aiSuggestion.rationale,
    status: "pending",
    suggestedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any);

  return recommendationId;

}

export async function getPendingReviews(counselorId: string): Promise<CounselorReview[]> {
  const recommendations = await db.query.careerRecommendations.findMany({
    where: and(
      eq(careerRecommendations.counselorId, counselorId),
      eq(careerRecommendations.status, "pending")
    ),
    orderBy: [desc(careerRecommendations.suggestedAt)],
    with: {
      student: true,
    },
  });

  return recommendations.map((r) => formatRecommendation(r));
}

/**
 * Get reviews for a specific student
 */
export async function getStudentReviews(studentId: string): Promise<CounselorReview[]> {
  const recommendations = await db.query.careerRecommendations.findMany({
    where: eq(careerRecommendations.studentId, studentId),
    orderBy: [desc(careerRecommendations.suggestedAt)],
    with: {
      counselor: true,
      notes: true,
    },
  });

  return recommendations.map((r) => formatRecommendation(r));
}

/**
 * Submit counselor review decision
 */
export async function submitCounselorDecision(input: {
  recommendationId: string;
  counselorId: string;
  status: ReviewStatus;
  decision: {
    rationale: string;
    conditions?: string[];
    alternativeCareers?: string[];
    nextSteps?: string[];
  };
}): Promise<void> {
  await db
    .update(careerRecommendations)
    .set({
      status: input.status,
      counselorDecision: input.decision as any,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(careerRecommendations.id, input.recommendationId));

  // If conditions attached, create follow-up reminder
  if (input.status === "approved-with-conditions" && input.decision.conditions?.length) {
    // In production, schedule follow-up based on condition urgency
  }
}

/**
 * Student responds to counselor recommendation
 */
export async function submitStudentResponse(input: {
  recommendationId: string;
  studentId: string;
  response: {
    accepted: boolean;
    questions: string[];
    feedback: string;
  };
}): Promise<void> {
  await db
    .update(careerRecommendations)
    .set({
      studentResponse: input.response as any,
      respondedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(careerRecommendations.id, input.recommendationId));
}

/**
 * Parent views/approves recommendation
 */
export async function parentInteraction(input: {
  recommendationId: string;
  action: "view" | "approve" | "feedback";
  feedback?: string;
}): Promise<void> {
  const updateData: any = {
    updatedAt: new Date(),
  };

  if (input.action === "view") {
    updateData.parentViewed = true;
    updateData.parentViewedAt = new Date();
  } else if (input.action === "approve") {
    updateData.parentApproved = true;
  } else if (input.action === "feedback") {
    updateData.parentFeedback = input.feedback;
  }

  await db
    .update(careerRecommendations)
    .set(updateData)
    .where(eq(careerRecommendations.id, input.recommendationId));
}

/**
 * Add a note to a recommendation
 */
export async function addNote(input: {
  recommendationId: string;
  authorId: string;
  authorRole: "counselor" | "student" | "parent";
  content: string;
  isPrivate: boolean;
}): Promise<string> {
  const noteId = `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  await db.insert(careerReviewNotes).values({
    recommendationId: input.recommendationId,
    authorId: input.authorId,
    authorRole: input.authorRole,
    content: input.content,
    noteType: "feedback",
    isPrivate: input.isPrivate,
    createdAt: new Date(),
  });

  return noteId;
}

/**
 * Get review notes
 */
export async function getNotes(recommendationId: string, userId: string): Promise<ReviewNote[]> {
  const notes = await db.query.careerReviewNotes.findMany({
    where: eq(careerReviewNotes.recommendationId, recommendationId),
    orderBy: [desc(careerReviewNotes.createdAt)],
  });

  // Filter private notes based on author
  return notes
    .filter((n) => !n.isPrivate || n.authorId === userId)
    .map((n) => ({
      id: n.id,
      recommendationId: n.recommendationId,
      authorId: n.authorId,
      authorRole: n.authorRole as "counselor" | "student" | "parent",
      content: n.content,
      isPrivate: n.isPrivate,
      createdAt: n.createdAt,
    }));
}

// ============================================================================
// HELPERS
// ============================================================================

function formatRecommendation(r: any): CounselorReview {
  return {
    recommendationId: r.id,
    studentId: r.studentId,
    counselorId: r.counselorId,
    aiSuggestion: {
      careerId: r.careerId,
      careerTitle: r.careerTitle,
      matchScore: r.matchScore,
      confidence: r.confidence,
      scores: r.scores,
      skillsGap: r.skillsGap,
      rubPrograms: r.rubPrograms,
      rationale: r.aiRationale,
    },
    status: r.status,
    decision: r.counselorDecision,
    studentResponse: r.studentResponse,
    parentViewed: r.parentViewed,
    parentApproved: r.parentApproved,
    parentFeedback: r.parentFeedback,
    suggestedAt: r.suggestedAt,
    reviewedAt: r.reviewedAt,
    studentRespondedAt: r.studentRespondedAt,
    parentViewedAt: r.parentViewedAt,
    followUpScheduled: r.followUpScheduled,
    followUpCompleted: r.followUpCompleted,
  };
}

/**
 * Get summary statistics for counselor
 */
export async function getCounselorStats(counselorId: string): Promise<{
  pending: number;
  approved: number;
  approvedWithConditions: number;
  notRecommended: number;
  awaitingStudentResponse: number;
  studentAccepted: number;
  studentRejected: number;
}> {
  const recommendations = await db.query.careerRecommendations.findMany({
    where: eq(careerRecommendations.counselorId, counselorId),
  });

  return {
    pending: recommendations.filter((r) => r.status === "pending").length,
    approved: recommendations.filter((r) => r.status === "approved").length,
    approvedWithConditions: recommendations.filter((r) => r.status === "approved-with-conditions").length,
    notRecommended: recommendations.filter((r) => r.status === "not-recommended").length,
    awaitingStudentResponse: recommendations.filter((r) =>
      r.status !== "pending" && !r.studentResponse
    ).length,
    studentAccepted: recommendations.filter((r) =>
      r.studentAccepted === true
    ).length,
    studentRejected: recommendations.filter((r) =>
      r.studentAccepted === false
    ).length,
  };
}

// ============================================================================
// API HANDLERS
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const studentId = searchParams.get("studentId") || undefined;

    let result;

    switch (action) {
      case "pending": {
        result = await getPendingReviews(userId);
        break;
      }

      case "student": {
        if (!studentId) {
          return NextResponse.json({ error: "studentId required" }, { status: 400 });
        }
        result = await getStudentReviews(studentId);
        break;
      }

      case "stats": {
        result = await getCounselorStats(userId);
        break;
      }

      case "notes": {
        const recommendationId = searchParams.get("recommendationId");
        if (!recommendationId) {
          return NextResponse.json({ error: "recommendationId required" }, { status: 400 });
        }
        result = await getNotes(recommendationId, userId);
        break;
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Career Review GET error:", error);
    return NextResponse.json(
      { error: "Failed to get reviews", message: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, ...params } = body;

    let result;

    switch (action) {
      case "submit-for-review": {
        result = await submitForReview({
          studentId: params.studentId,
          counselorId: userId,
          aiSuggestion: params.aiSuggestion,
        });
        break;
      }

      case "generate-suggestion": {
        result = await generateAISuggestion(params.studentId, params.options);
        break;
      }

      case "submit-decision": {
        await submitCounselorDecision({
          recommendationId: params.recommendationId,
          counselorId: userId,
          status: params.status,
          decision: params.decision,
        });
        result = { success: true };
        break;
      }

      case "student-response": {
        await submitStudentResponse({
          recommendationId: params.recommendationId,
          studentId: userId,
          response: params.response,
        });
        result = { success: true };
        break;
      }

      case "parent-interaction": {
        await parentInteraction(params);
        result = { success: true };
        break;
      }

      case "add-note": {
        result = await addNote({
          recommendationId: params.recommendationId,
          authorId: userId,
          authorRole: params.authorRole,
          content: params.content,
          isPrivate: params.isPrivate || false,
        });
        break;
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      action,
      result,
    });
  } catch (error) {
    console.error("Career Review POST error:", error);
    return NextResponse.json(
      { error: "Failed to process request", message: String(error) },
      { status: 500 }
    );
  }
}
