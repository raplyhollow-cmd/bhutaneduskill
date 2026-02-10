import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { scholarships, users, assessments, riasecResults } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// GET /api/student/content/scholarships/matched - Get matched scholarships
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "student") {
      return NextResponse.json({ error: "Forbidden - Students only" }, { status: 403 });
    }

    // Get all scholarships
    const allScholarships = await db.query.scholarships.findMany({
      where: eq(scholarships.isActive, true),
    });

    // Get student's RIASEC results if available
    const riasecResult = await db.query.riasecResults.findFirst({
      where: eq(riasecResults.userId, currentUser.id),
      orderBy: [riasecResults.createdAt],
    });

    // Match scholarships based on student profile
    const matchedScholarships = allScholarships.filter(scholarship => {
      // Filter by deadline
      if (scholarship.applicationDeadline) {
        const deadline = new Date(scholarship.applicationDeadline);
        if (deadline < new Date()) return false;
      }

      // Filter by class requirement
      if (scholarship.requiredClass && scholarship.requiredClass !== "Any") {
        // Assuming classGrade is stored as number (e.g., 12 for Class 12)
        const requiredClassNum = parseInt(scholarship.requiredClass.replace(/\D/g, "")) || 0;
        if (currentUser.classGrade && currentUser.classGrade < requiredClassNum) {
          return false;
        }
      }

      // Match by career clusters if student has RIASEC results
      if (riasecResult && Array.isArray(scholarship.careerClusters) && scholarship.careerClusters.length > 0) {
        const studentClusters = [riasecResult.hollandCode].flat();
        const hasClusterMatch = scholarship.careerClusters.some(cluster =>
          studentClusters.some(code => cluster.includes(code))
        );
        if (!hasClusterMatch) return false;
      }

      // Match by interests (RIASEC codes)
      if (riasecResult && Array.isArray(scholarship.requiredInterests) && scholarship.requiredInterests.length > 0) {
        const studentInterests = [
          (riasecResult.realistic ?? 0) > 0 ? "R" : null,
          (riasecResult.investigative ?? 0) > 0 ? "I" : null,
          (riasecResult.artistic ?? 0) > 0 ? "A" : null,
          (riasecResult.social ?? 0) > 0 ? "S" : null,
          (riasecResult.enterprising ?? 0) > 0 ? "E" : null,
          (riasecResult.conventional ?? 0) > 0 ? "C" : null,
        ].filter(Boolean);

        const hasInterestMatch = scholarship.requiredInterests.some(interest =>
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
      if (riasecResult && Array.isArray(scholarship.careerClusters) && scholarship.careerClusters.length > 0) {
        score += 20;
      }

      if (scholarship.category === "merit") {
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
    console.error("Matched scholarships fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch matched scholarships" }, { status: 500 });
  }
}
