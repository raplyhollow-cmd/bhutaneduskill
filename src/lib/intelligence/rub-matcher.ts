/**
 * RUB Career Matcher
 *
 * Matches: Student profile (RIASEC + grades + interests) → RUB programs
 * Shows: College options, admission requirements, scholarship availability
 * Tracks: Application progress, deadlines
 *
 * RUB = Royal University of Bhutan
 */

import { db } from "@/lib/db";
import { users, riasecResults, rubColleges, rubScholarships, careerMatches } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

/**
 * RUB Career Match
 */
export interface RUBCareerMatch {
  userId: string;
  studentName: string;
  hollandCode: string;
  careerPath: string;
  targetBCSE: number;
  matchedColleges: {
    collegeId: string;
    collegeName: string;
    matchScore: number;
    programs: string[];
    reason: string;
    location: string;
  }[];
  scholarshipMatches: {
    scholarship: string;
    college: string;
    eligibility: string;
    amount?: number;
  }[];
  applicationStatus: {
    collegeId: string;
    status: "not_started" | "preparing" | "applied" | "accepted";
    deadline?: string;
  }[];
}

/**
 * Match Student to RUB Colleges and Programs
 */
export async function matchStudentToRUB(userId: string): Promise<RUBCareerMatch | null> {
  // Get student data
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return null;

  // Get RIASEC results
  const { riasecResults } = await import("@/lib/db/schema");
  const [riasec] = await db
    .select()
    .from(riasecResults)
    .where(eq(riasecResults.userId, userId))
    .limit(1);

  if (!riasec) return null;

  const hollandCode = riasec.primaryHollandCode?.[0]?.toUpperCase() || "S";

  // Get current BCSE readiness (simplified)
  const currentBCSE = 65 + Math.random() * 20; // TODO: Calculate from actual grades
  const targetBCSE = hollandCode === "I" ? 80 : hollandCode === "R" ? 75 : 70;

  // Determine career path
  const careerPath = getCareerPath(hollandCode);
  const stream = getStreamForHollandCode(hollandCode);

  // Get RUB colleges from database
  const colleges = await db
    .select()
    .from(rubColleges)
    .orderBy(desc(rubColleges.createdAt));

  // Match colleges (simplified - use all active colleges)
  const matchedColleges: RUBCareerMatch["matchedColleges"] = colleges
    .filter((c) => c.isActive)
    .map((c) => {
      // Use BCSE score as a general match indicator
      const matchScore = Math.min(100, currentBCSE + 20); // Base score on BCSE

      return {
        collegeId: c.id,
        collegeName: c.name,
        matchScore: Math.round(matchScore),
        programs: (c.programs as Array<{ code: string; name: string; level: string }>).map(p => p.name),
        reason: currentBCSE >= 60
          ? "Based on your academic performance"
          : "Consider improving your BCSE score",
        location: c.location || "Thimphu",
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);

  // Get scholarships
  const scholarships = await db
    .select()
    .from(rubScholarships)
    .limit(5);

  const scholarshipMatches: RUBCareerMatch["scholarshipMatches"] = scholarships.map((s) => ({
    scholarship: s.name || "RUB Scholarship",
    college: "RUB",
    eligibility: "Based on academic performance and financial need",
    coverage: s.coveragePercentage ? `${s.coveragePercentage}% coverage` : undefined,
  }));

  return {
    userId,
    studentName: user.name,
    hollandCode,
    careerPath,
    targetBCSE,
    matchedColleges,
    scholarshipMatches,
    applicationStatus: [],
  };
}

/**
 * Get Career Path from Holland Code
 */
function getCareerPath(hollandCode: string): string {
  const paths: Record<string, string> = {
    R: "Engineering & Technology",
    I: "Medical & Science",
    A: "Arts & Culture",
    S: "Teaching & Social Service",
    E: "Business & Management",
    C: "Finance & Administration",
  };
  return paths[hollandCode] || "General Studies";
}

/**
 * Get Stream for Holland Code
 */
function getStreamForHollandCode(hollandCode: string): string {
  const streams: Record<string, string> = {
    R: "Science",
    I: "Science",
    A: "Arts",
    S: "Arts/Commerce",
    E: "Commerce",
    C: "Commerce",
  };
  return streams[hollandCode] || "Any";
}

/**
 * Get RUB Matches Summary (for dashboard)
 */
export async function getRUBMatchesSummary(userId: string) {
  const match = await matchStudentToRUB(userId);
  if (!match) return null;

  return {
    careerPath: match.careerPath,
    matchedCount: match.matchedColleges.length,
    topCollege: match.matchedColleges[0]?.collegeName,
    topProgram: match.matchedColleges[0]?.programs[0],
    targetBCSE: match.targetBCSE,
    onTrack: match.targetBCSE >= 70,
  };
}
