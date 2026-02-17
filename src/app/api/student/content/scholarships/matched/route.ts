import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import type { ApiSuccess, ApiErrorResponse } from "@/types";
import { db } from "@/lib/db";
import { scholarships, users, assessments, riasecResults } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// GET /api/student/content/scholarships/matched - Get matched scholarships
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(['student', 'admin']);
  if ('error' in authResult) {
    return NextResponse.json(
      { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
      { status: authResult.status }
    );
  }

  const { userId } = authResult;

  try {
    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    // Get all scholarships
    const allScholarships = await db.query.scholarships.findMany({
      where: eq(scholarships.isActive, true),
    });

    // Get student's RIASEC results if available
    const riasecResult = await db.query.riasecResults.findFirst({
      where: eq(riasecResults.userId, userId),
      orderBy: [riasecResults.createdAt],
    });

    // Match scholarships based on student profile
    const matchedScholarships = allScholarships.filter(scholarship => {
      // Filter by deadline
      if ((scholarship as any).applicationDeadline) {
        const deadline = new Date((scholarship as any).applicationDeadline);
        if (deadline < new Date()) return false;
      }

      // Filter by class requirement
      if ((scholarship as any).requiredClass && (scholarship as any).requiredClass !== "Any") {
        // Assuming classGrade is stored as number (e.g., 12 for Class 12)
        const requiredClassNum = parseInt((scholarship as any).requiredClass.replace(/\D/g, "")) || 0;
        if (currentUser.classGrade && currentUser.classGrade < requiredClassNum) {
          return false;
        }
      }

      // Match by career clusters if student has RIASEC results
      if (riasecResult && Array.isArray((scholarship as any).careerClusters) && (scholarship as any).careerClusters.length > 0) {
        const studentClusters = [riasecResult.hollandCode].flat();
        const hasClusterMatch = (scholarship as any).careerClusters.some(cluster =>
          studentClusters.some(code => cluster.includes(code))
        );
        if (!hasClusterMatch) return false;
      }

      // Match by interests (RIASEC codes)
      if (riasecResult && Array.isArray((scholarship as any).requiredInterests) && (scholarship as any).requiredInterests.length > 0) {
        const studentInterests = [
          ((riasecResult as any).realistic ?? 0) > 0 ? "R" : null,
          ((riasecResult as any).investigative ?? 0) > 0 ? "I" : null,
          ((riasecResult as any).artistic ?? 0) > 0 ? "A" : null,
          ((riasecResult as any).social ?? 0) > 0 ? "S" : null,
          ((riasecResult as any).enterprising ?? 0) > 0 ? "E" : null,
          ((riasecResult as any).conventional ?? 0) > 0 ? "C" : null,
        ].filter(Boolean);

        const hasInterestMatch = (scholarship as any).requiredInterests.some(interest =>
          studentInterests.includes(interest)
        );
        if (!hasInterestMatch) return false;
      }

      return true;
    });

    // Calculate match score and sort
    const scoredScholarships = matchedScholarships.map(scholarship => {
      let score = 50; // Base score

      // Increase score for exact matches
      if (riasecResult && Array.isArray((scholarship as any).careerClusters) && (scholarship as any).careerClusters.length > 0) {
        score += 20;
      }

      if ((scholarship as any).category === "merit") {
        score += 10;
      }

      return {
        ...scholarship,
        matchScore: Math.min(100, score),
      };
    });

    // Sort by match score
    scoredScholarships.sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({ scholarships: scoredScholarships });
  } catch (error) {
    logger.apiError(error, { route: "/api/student/content/scholarships/matched", method: "GET", userId });
    return NextResponse.json(
      { error: "Failed to fetch matched scholarships", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
