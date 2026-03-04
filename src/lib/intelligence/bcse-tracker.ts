/**
 * BCSE Readiness Tracker
 *
 * Tracks student's current grades vs BCSE requirements for their target career
 * Provides alerts if they're behind target
 * Connects to teachers for tutoring, counselor for guidance
 *
 * BCSE (Bhutan Council for School Examinations) is critical for:
 * - RUB college admissions
 * - Scholarship eligibility
 * - Career path alignment
 */

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * BCSE Requirements by Career Path
 * Based on RIASEC Holland Codes
 */
const BCSE_REQUIREMENTS: Record<string, {
  careerPath: string;
  requiredSubjects: string[];
  targetScore: number;
  criticalSubjects: string[];
  rubColleges: string[];
  rubPrograms: string[];
}> = {
  // Medical/Science careers
  "I": {
    careerPath: "Medical & Research",
    requiredSubjects: ["English", "Dzongkha", "Mathematics", "Science"],
    targetScore: 80,
    criticalSubjects: ["Science", "Mathematics"],
    rubColleges: ["Jigme Dorji Wangchuck School of Law", "College of Science and Technology"],
    rubPrograms: ["B.E. Biotechnology", "B.Sc. Nursing", "Bachelor of Surgery"],
  },
  "R": {
    careerPath: "Technical & Engineering",
    requiredSubjects: ["English", "Dzongkha", "Mathematics", "Science"],
    targetScore: 75,
    criticalSubjects: ["Mathematics", "Science"],
    rubColleges: ["College of Science and Technology", "Gedu College of Engineering"],
    rubPrograms: ["B.E. Civil Engineering", "B.E. Electrical Engineering", "B.E. Mechanical"],
  },
  // Creative careers
  "A": {
    careerPath: "Creative & Cultural",
    requiredSubjects: ["English", "Dzongkha", "History", "Geography"],
    targetScore: 65,
    criticalSubjects: ["English", "Dzongkha"],
    rubColleges: ["College of Language and Culture Studies", "Royal Thimphu College"],
    rubPrograms: ["B.A. Dzongkha", "B.A. English", "B.A. History", "B.A. Media Studies"],
  },
  // Teaching/Service careers
  "S": {
    careerPath: "Teaching & Service",
    requiredSubjects: ["English", "Dzongkha", "Mathematics", "Science"],
    targetScore: 70,
    criticalSubjects: ["English", "Mathematics"],
    rubColleges: ["Samtse College of Education", "Paro College of Education"],
    rubPrograms: ["B.Ed Primary", "B.Ed Secondary", "B.A. Economics"],
  },
  // Business careers
  "E": {
    careerPath: "Business & Leadership",
    requiredSubjects: ["English", "Dzongkha", "Mathematics", "Economics"],
    targetScore: 70,
    criticalSubjects: ["Mathematics", "English"],
    rubColleges: ["Royal Thimphu College", "Gedu College of Business Studies"],
    rubPrograms: ["BBA", "B.Com", "B.A. Business Administration"],
  },
  // Administrative careers
  "C": {
    careerPath: "Administrative & Finance",
    requiredSubjects: ["English", "Dzongkha", "Mathematics", "Economics"],
    targetScore: 70,
    criticalSubjects: ["Mathematics", "English"],
    rubColleges: ["College of Science and Technology", "Gedu College of Business Studies"],
    rubPrograms: ["B.Com", "BCA", "B.Sc. Information Technology"],
  },
};

/**
 * Student Grade (simplified - in production, would fetch from marks table)
 */
interface StudentGrade {
  subject: string;
  score: number;
  grade: string;
}

/**
 * BCSE Readiness Status
 */
export interface BCSEReadinessStatus {
  userId: string;
  studentName: string;
  currentGrade: number;
  targetCareer: string;
  hollandCode: string;
  targetScore: number;
  currentReadiness: number;
  gap: number;
  onTrack: boolean;
  status: "on_track" | "needs_improvement" | "critical";
  subjectBreakdown: {
    subject: string;
    currentScore: number;
  }[];
  recommendations: string[];
  rubColleges: string[];
  rubPrograms: string[];
}

/**
 * Calculate BCSE Readiness for a Student
 */
export async function calculateBCSEReadiness(userId: string): Promise<BCSEReadinessStatus | null> {
  // Get student data
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return null;

  // Get RIASEC results to determine career path
  const { riasecResults } = await import("@/lib/db/schema");
  const [riasec] = await db
    .select()
    .from(riasecResults)
    .where(eq(riasecResults.userId, userId))
    .limit(1);

  if (!riasec) {
    return null;
  }

  const hollandCode = riasec.primaryHollandCode?.[0]?.toUpperCase() || riasec.hollandCode?.[0]?.toUpperCase() || "S";

  // Get BCSE requirements for this career path
  const requirements = BCSE_REQUIREMENTS[hollandCode] || BCSE_REQUIREMENTS["S"];

  // Simulate current grades (in production, fetch from marks table)
  const subjectBreakdown = requirements.requiredSubjects.map((subject) => ({
    subject,
    currentScore: 60 + Math.random() * 30, // TODO: Fetch from actual marks
  }));

  // Calculate average readiness
  const currentReadiness = subjectBreakdown.reduce((sum, s) => sum + s.currentScore, 0) / subjectBreakdown.length;
  const gap = requirements.targetScore - currentReadiness;
  const onTrack = gap <= 5;

  // Determine status
  let status: "on_track" | "needs_improvement" | "critical";
  if (gap <= 5) {
    status = "on_track";
  } else if (gap <= 15) {
    status = "needs_improvement";
  } else {
    status = "critical";
  }

  // Generate recommendations
  const recommendations: string[] = [];

  if (gap > 0) {
    recommendations.push(`You need ${gap.toFixed(0)}% more to reach your BCSE target`);

    // Identify critical subjects that need focus
    const criticalSubjects = subjectBreakdown
      .filter((s) => s.currentScore < requirements.targetScore)
      .sort((a, b) => a.currentScore - b.currentScore)
      .slice(0, 2);

    criticalSubjects.forEach((s) => {
      recommendations.push(`Focus on ${s.subject} - currently at ${s.currentScore.toFixed(0)}%`);
    });
  }

  if (onTrack) {
    recommendations.push("You're on track! Keep up the good work.");
  }

  return {
    userId,
    studentName: user.name,
    currentGrade: user.grade || 10,
    targetCareer: requirements.careerPath,
    hollandCode,
    targetScore: requirements.targetScore,
    currentReadiness: Math.round(currentReadiness),
    gap: Math.round(gap),
    onTrack,
    status,
    subjectBreakdown,
    recommendations,
    rubColleges: requirements.rubColleges,
    rubPrograms: requirements.rubPrograms,
  };
}

/**
 * Get BCSE Readiness Summary (for dashboard widget)
 */
export async function getBCSEReadinessSummary(userId: string) {
  const status = await calculateBCSEReadiness(userId);
  if (!status) return null;

  return {
    targetScore: status.targetScore,
    currentScore: status.currentReadiness,
    gap: status.gap,
    onTrack: status.onTrack,
    status: status.status,
    targetCareer: status.targetCareer,
    urgent: !status.onTrack,
  };
}
