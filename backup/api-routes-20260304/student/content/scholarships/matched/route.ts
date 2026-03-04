import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { scholarships, users, assessments, riasecResults } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse } from "@/lib/api/response-helpers";

// Types for scholarship matching
interface ScholarshipWithExtras {
  id: string;
  name: string;
  code?: string;
  type?: string;
  provider?: string;
  providerName?: string;
  description?: string;
  eligibilityCriteria?: Record<string, unknown>;
  applicationDeadline?: Date | string;
  requiredClass?: string;
  categories?: string[];
  requiredInterests?: string[];
  category?: string;
  isActive: boolean;
  [key: string]: unknown;
}

interface RIASECResultWithScores {
  id: string;
  userId: string;
  hollandCode?: string;
  realistic?: number;
  investigative?: number;
  artistic?: number;
  social?: number;
  enterprising?: number;
  conventional?: number;
  [key: string]: unknown;
}

/**
 * GET /api/student/content/scholarships/matched - Get matched scholarships
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */
export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId } = auth;

    const [currentUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    // Get all scholarships
    const allScholarships = await db.select().from(scholarships).where(eq(scholarships.isActive, true));

    // Get student's RIASEC results if available
    const [riasecResult] = await db.select().from(riasecResults)
      .where(eq(riasecResults.userId, userId))
      .orderBy(desc(riasecResults.createdAt))
      .limit(1);

    // Match scholarships based on student profile
    const matchedScholarships = allScholarships.filter((scholarship) => {
      const sch = scholarship as ScholarshipWithExtras;

      // Filter by deadline
      if (sch.applicationDeadline) {
        const deadline = new Date(sch.applicationDeadline);
        if (deadline < new Date()) return false;
      }

      // Filter by class requirement
      if (sch.requiredClass && sch.requiredClass !== "Any") {
        // Assuming classGrade is stored as number (e.g., 12 for Class 12)
        const requiredClassNum = parseInt(sch.requiredClass.replace(/\D/g, "")) || 0;
        if (currentUser.classGrade && currentUser.classGrade < requiredClassNum) {
          return false;
        }
      }

      // Match by career clusters if student has RIASEC results
      if (riasecResult && Array.isArray(sch.careerClusters) && sch.careerClusters.length > 0) {
        const studentClusters = [riasecResult.hollandCode].flat();
        const hasClusterMatch = sch.careerClusters.some(cluster =>
          studentClusters.some(code => cluster?.includes(code || ""))
        );
        if (!hasClusterMatch) return false;
      }

      // Match by interests (RIASEC codes)
      const riasec = riasecResult as RIASECResultWithScores | undefined;
      if (riasec && Array.isArray(sch.requiredInterests) && sch.requiredInterests.length > 0) {
        const studentInterests = [
          (riasec.realistic ?? 0) > 0 ? "R" : null,
          (riasec.investigative ?? 0) > 0 ? "I" : null,
          (riasec.artistic ?? 0) > 0 ? "A" : null,
          (riasec.social ?? 0) > 0 ? "S" : null,
          (riasec.enterprising ?? 0) > 0 ? "E" : null,
          (riasec.conventional ?? 0) > 0 ? "C" : null,
        ].filter(Boolean);

        const hasInterestMatch = sch.requiredInterests.some(interest =>
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
      const categories = (scholarship as { categories?: string[] }).categories || [];
      if (riasecResult && categories.length > 0) {
        score += 20;
      }

      if (scholarship.type === "merit") {
        score += 10;
      }

      return {
        ...scholarship,
        matchScore: Math.min(100, score),
      };
    });

    // Sort by match score
    scoredScholarships.sort((a, b) => b.matchScore - a.matchScore);

    return successResponse({ scholarships: scoredScholarships });
  },
  ["student", "admin"]
);
