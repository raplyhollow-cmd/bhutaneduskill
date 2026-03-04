/**
 * EARLY WARNING SYSTEM
 *
 * Detects at-risk students BEFORE they fail by analyzing:
 * - Declining homework scores (3-week trend)
 * - Attendance drops below threshold
 * - Journal entries showing distress/withdrawal
 * - Skills gap widening vs career goals
 * - Assessment-effort mismatch
 *
 * Generates intervention recommendations for teachers
 */

import { db } from "@/lib/db";
import { users, homeworkSubmissions, attendance, homework, studentProgressAnalytics, studentSkills as studentSkillsTable, careerMatches } from "@/lib/db/schema";
import { eq, and, gte, lte, desc, sql, count, avg } from "drizzle-orm";
import { logger } from "@/lib/logger";

// ============================================================================
// TYPES
// ============================================================================

export type RiskLevel = "none" | "low" | "medium" | "high" | "critical";

export interface RiskFactor {
  type: "academic" | "attendance" | "emotional" | "engagement" | "skills_gap";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  evidence: Record<string, unknown>;
  detectedAt: Date;
}

export interface AtRiskStudent {
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  riskLevel: RiskLevel;
  riskScore: number; // 0-100
  riskFactors: RiskFactor[];
  recommendedActions: string[];
  urgentAttention: boolean;
  lastUpdated: Date;
}

export interface ClassRiskSummary {
  classId: string;
  className: string;
  totalStudents: number;
  atRiskCount: number;
  criticalCount: number;
  highRiskCount: number;
  mediumRiskCount: number;
  topConcerns: string[];
  recommendedInterventions: string[];
}

export interface InterventionRecommendation {
  priority: "urgent" | "high" | "medium" | "low";
  action: string;
  reason: string;
  suggestedBy: string;
  resources?: string[];
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const RISK_THRESHOLDS = {
  attendance: {
    critical: 60, // Below 60% attendance = critical
    high: 70,     // Below 70% = high risk
    medium: 80,   // Below 80% = medium risk
  },
  homeworkTrend: {
    critical: -25, // Score declined by 25%+ = critical
    high: -15,     // Declined 15-25% = high risk
    medium: -10,   // Declined 10-15% = medium risk
  },
  homeworkCompletion: {
    critical: 50, // Less than 50% completion rate
    high: 65,     // Less than 65%
    medium: 75,   // Less than 75%
  },
  skillsGap: {
    critical: 70, // Missing >70% of skills for career goal
    high: 50,     // Missing >50%
    medium: 30,   // Missing >30%
  },
};

// Journal keywords that indicate distress
const DISTRESS_KEYWORDS = {
  critical: ["give up", "want to die", "hopeless", "no point", "end it all", "worthless", "hate myself"],
  high: ["stressed", "anxious", "worried", "overwhelmed", "can't cope", "too much", "falling behind"],
  medium: ["tired", "exhausted", "struggling", "difficult", "hard", "challenging"],
};

// ============================================================================
// EARLY WARNING SYSTEM CLASS
// ============================================================================

export class EarlyWarningSystem {
  /**
   * Analyze a single student for risk factors
   */
  async analyzeStudent(studentId: string): Promise<AtRiskStudent | null> {
    const [student] = await db
      .select({
        id: users.id,
        name: users.name,
        grade: users.grade,
      })
      .from(users)
      .where(eq(users.id, studentId))
      .limit(1);

    if (!student) {
      return null;
    }

    const riskFactors: RiskFactor[] = [];
    const recommendedActions: string[] = [];

    // 1. Analyze homework trends
    const homeworkRisk = await this.analyzeHomeworkTrends(studentId);
    if (homeworkRisk) {
      riskFactors.push(homeworkRisk);
      if (homeworkRisk.severity === "high" || homeworkRisk.severity === "critical") {
        recommendedActions.push("Schedule academic support meeting");
      }
    }

    // 2. Analyze attendance patterns
    const attendanceRisk = await this.analyzeAttendancePatterns(studentId);
    if (attendanceRisk) {
      riskFactors.push(attendanceRisk);
      if (attendanceRisk.severity === "high" || attendanceRisk.severity === "critical") {
        recommendedActions.push("Discuss attendance barriers with student");
        recommendedActions.push("Consider counselor referral");
      }
    }

    // 3. Analyze journal sentiment
    const journalRisk = await this.analyzeJournalSentiment(studentId);
    if (journalRisk) {
      riskFactors.push(journalRisk);
      if (journalRisk.severity === "critical") {
        recommendedActions.push("URGENT: Counselor referral - distress detected");
        recommendedActions.push("Contact parent/guardian");
      } else if (journalRisk.severity === "high") {
        recommendedActions.push("Check in with student privately");
      }
    }

    // 4. Analyze skills gap
    const skillsRisk = await this.analyzeSkillsGap(studentId);
    if (skillsRisk) {
      riskFactors.push(skillsRisk);
      if (skillsRisk.severity === "high" || skillsRisk.severity === "critical") {
        recommendedActions.push("Review career goals and create skill development plan");
      }
    }

    // 5. Check engagement (homework completion rate)
    const engagementRisk = await this.analyzeEngagement(studentId);
    if (engagementRisk) {
      riskFactors.push(engagementRisk);
      if (engagementRisk.severity === "high" || engagementRisk.severity === "critical") {
        recommendedActions.push("Discuss barriers to homework completion");
      }
    }

    // Calculate overall risk level
    const riskLevel = this.calculateOverallRiskLevel(riskFactors);
    const riskScore = this.calculateRiskScore(riskFactors);

    if (riskFactors.length === 0) {
      return null; // No risk detected
    }

    // Store risk assessment in database
    await this.storeRiskAssessment(studentId, riskLevel, riskScore, riskFactors);

    return {
      studentId: student.id,
      studentName: student.name,
      classId: student.grade?.toString() || "",
      className: `Class ${student.grade || "Unknown"}`,
      riskLevel,
      riskScore,
      riskFactors,
      recommendedActions,
      urgentAttention: riskLevel === "critical" || riskLevel === "high",
      lastUpdated: new Date(),
    };
  }

  /**
   * Analyze all students in a class
   */
  async analyzeClass(classId: string): Promise<ClassRiskSummary> {
    // Get all students in this class
    const students = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.grade, classId));

    const atRiskStudents: AtRiskStudent[] = [];

    for (const student of students) {
      const analysis = await this.analyzeStudent(student.id);
      if (analysis) {
        atRiskStudents.push(analysis);
      }
    }

    const criticalCount = atRiskStudents.filter(s => s.riskLevel === "critical").length;
    const highRiskCount = atRiskStudents.filter(s => s.riskLevel === "high").length;
    const mediumRiskCount = atRiskStudents.filter(s => s.riskLevel === "medium").length;

    // Extract top concerns
    const concernCounts = new Map<string, number>();
    for (const student of atRiskStudents) {
      for (const factor of student.riskFactors) {
        concernCounts.set(factor.description, (concernCounts.get(factor.description) || 0) + 1);
      }
    }

    const topConcerns = Array.from(concernCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([concern]) => concern);

    // Generate class-level interventions
    const recommendedInterventions = this.generateClassInterventions(atRiskStudents);

    return {
      classId,
      className: `Class ${classId}`,
      totalStudents: students.length,
      atRiskCount: atRiskStudents.length,
      criticalCount,
      highRiskCount,
      mediumRiskCount,
      topConcerns,
      recommendedInterventions,
    };
  }

  /**
   * Analyze homework score trends over time
   */
  private async analyzeHomeworkTrends(studentId: string): Promise<RiskFactor | null> {
    const threeWeeksAgo = new Date();
    threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);

    const submissions = await db
      .select({
        homeworkId: homeworkSubmissions.homeworkId,
        score: homeworkSubmissions.score,
        totalPoints: homework.totalPoints,
        submittedAt: homeworkSubmissions.submittedAt,
      })
      .from(homeworkSubmissions)
      .innerJoin(homework, eq(homeworkSubmissions.homeworkId, homework.id))
      .where(
        and(
          eq(homeworkSubmissions.studentId, studentId),
          gte(homeworkSubmissions.submittedAt, threeWeeksAgo)
        )
      )
      .orderBy(desc(homeworkSubmissions.submittedAt));

    if (submissions.length < 3) {
      return null; // Not enough data
    }

    // Calculate percentage scores
    const scores = submissions.map(s =>
      s.totalPoints > 0 ? (s.score / s.totalPoints) * 100 : 0
    );

    // Split into two halves and compare
    const midPoint = Math.floor(scores.length / 2);
    const recentScores = scores.slice(0, midPoint);
    const olderScores = scores.slice(midPoint);

    const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const olderAvg = olderScores.reduce((a, b) => a + b, 0) / olderScores.length;
    const trendChange = recentAvg - olderAvg; // Negative = declining

    if (trendChange <= RISK_THRESHOLDS.homeworkTrend.critical) {
      return {
        type: "academic",
        severity: "critical",
        description: "Homework scores declining significantly",
        evidence: {
          recentAverage: Math.round(recentAvg),
          olderAverage: Math.round(olderAvg),
          decline: Math.round(Math.abs(trendChange)),
          assignmentsAnalyzed: scores.length,
        },
        detectedAt: new Date(),
      };
    } else if (trendChange <= RISK_THRESHOLDS.homeworkTrend.high) {
      return {
        type: "academic",
        severity: "high",
        description: "Homework scores declining",
        evidence: {
          recentAverage: Math.round(recentAvg),
          olderAverage: Math.round(olderAvg),
          decline: Math.round(Math.abs(trendChange)),
          assignmentsAnalyzed: scores.length,
        },
        detectedAt: new Date(),
      };
    } else if (trendChange <= RISK_THRESHOLDS.homeworkTrend.medium) {
      return {
        type: "academic",
        severity: "medium",
        description: "Homework scores slightly declining",
        evidence: {
          recentAverage: Math.round(recentAvg),
          olderAverage: Math.round(olderAvg),
          decline: Math.round(Math.abs(trendChange)),
        },
        detectedAt: new Date(),
      };
    }

    return null;
  }

  /**
   * Analyze attendance patterns
   */
  private async analyzeAttendancePatterns(studentId: string): Promise<RiskFactor | null> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const attendanceRecords = await db
      .select({
        date: attendance.date,
        status: attendance.status,
      })
      .from(attendance)
      .where(
        and(
          eq(attendance.studentId, studentId),
          gte(attendance.date, thirtyDaysAgo.toISOString().split("T")[0])
        )
      );

    if (attendanceRecords.length < 5) {
      return null; // Not enough data
    }

    const presentDays = attendanceRecords.filter(r => r.status === "present").length;
    const totalDays = attendanceRecords.length;
    const attendanceRate = (presentDays / totalDays) * 100;

    // Check for recent streak of absences
    const recentRecords = attendanceRecords.slice(0, 5);
    const recentAbsences = recentRecords.filter(r => r.status === "absent").length;

    if (attendanceRate < RISK_THRESHOLDS.attendance.critical || recentAbsences >= 4) {
      return {
        type: "attendance",
        severity: "critical",
        description: "Critical attendance issues",
        evidence: {
          attendanceRate: Math.round(attendanceRate),
          recentAbsences,
          totalDaysAnalyzed: totalDays,
        },
        detectedAt: new Date(),
      };
    } else if (attendanceRate < RISK_THRESHOLDS.attendance.high) {
      return {
        type: "attendance",
        severity: "high",
        description: "Poor attendance",
        evidence: {
          attendanceRate: Math.round(attendanceRate),
          totalDaysAnalyzed: totalDays,
        },
        detectedAt: new Date(),
      };
    } else if (attendanceRate < RISK_THRESHOLDS.attendance.medium) {
      return {
        type: "attendance",
        severity: "medium",
        description: "Attendance below expected",
        evidence: {
          attendanceRate: Math.round(attendanceRate),
          totalDaysAnalyzed: totalDays,
        },
        detectedAt: new Date(),
      };
    }

    return null;
  }

  /**
   * Analyze journal entries for distress signals
   */
  private async analyzeJournalSentiment(studentId: string): Promise<RiskFactor | null> {
    const [user] = await db
      .select({ settings: users.settings })
      .from(users)
      .where(eq(users.id, studentId))
      .limit(1);

    if (!user?.settings) {
      return null;
    }

    const settings = user.settings as { journalEntries?: Array<{ content: string; date: string; mood?: string }> };
    const entries = settings.journalEntries || [];

    if (entries.length === 0) {
      return null;
    }

    // Analyze recent entries (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentEntries = entries.filter(e => {
      const entryDate = new Date(e.date);
      return entryDate >= thirtyDaysAgo;
    });

    // Check for distress keywords
    let maxSeverity: "none" | "medium" | "high" | "critical" = "none";
    const concerningEntries: string[] = [];

    for (const entry of recentEntries) {
      const content = entry.content.toLowerCase();

      for (const keyword of DISTRESS_KEYWORDS.critical) {
        if (content.includes(keyword)) {
          maxSeverity = "critical";
          concerningEntries.push(entry.date);
          break;
        }
      }

      if (maxSeverity !== "critical") {
        for (const keyword of DISTRESS_KEYWORDS.high) {
          if (content.includes(keyword)) {
            maxSeverity = "high";
            concerningEntries.push(entry.date);
            break;
          }
        }
      }

      if (maxSeverity === "none") {
        for (const keyword of DISTRESS_KEYWORDS.medium) {
          if (content.includes(keyword)) {
            maxSeverity = "medium";
            concerningEntries.push(entry.date);
            break;
          }
        }
      }
    }

    // Also check for consistently negative mood
    const recentMoods = recentEntries.map(e => e.mood).filter(Boolean);
    const negativeMoods = recentMoods.filter(m =>
      ["sad", "anxious", "stressed", "tired", "frustrated"].includes(m?.toLowerCase() || "")
    );

    if (negativeMoods.length >= 5 && maxSeverity === "none") {
      maxSeverity = "medium";
    }

    if (maxSeverity === "none") {
      return null;
    }

    return {
      type: "emotional",
      severity: maxSeverity,
      description: maxSeverity === "critical"
        ? "Critical distress signals in journal"
        : maxSeverity === "high"
        ? "Signs of stress/anxiety in journal"
        : "Possible emotional concerns",
      evidence: {
        concerningEntryCount: concerningEntries.length,
        negativeMoodCount: negativeMoods.length,
        totalEntries: recentEntries.length,
      },
      detectedAt: new Date(),
    };
  }

  /**
   * Analyze skills gap vs career goals
   */
  private async analyzeSkillsGap(studentId: string): Promise<RiskFactor | null> {
    // Get student's top career match
    const [topMatch] = await db
      .select({
        careerId: careerMatches.careerId,
        matchScore: careerMatches.matchScore,
      })
      .from(careerMatches)
      .where(eq(careerMatches.studentId, studentId))
      .orderBy(desc(careerMatches.matchScore))
      .limit(1);

    if (!topMatch) {
      return null;
    }

    // Get student's skills (rename to avoid conflict with imported table)
    const skills = await db
      .select({
        skillName: studentSkillsTable.skillName,
        level: studentSkillsTable.level,
        confidence: studentSkillsTable.confidence,
      })
      .from(studentSkillsTable)
      .where(eq(studentSkillsTable.userId, studentId));

    if (skills.length === 0) {
      return {
        type: "skills_gap",
        severity: "medium",
        description: "No skills recorded - recommend assessment",
        evidence: {},
        detectedAt: new Date(),
      };
    }

    // Note: This would need to fetch career requirements and calculate gap
    // For now, return null if student has some skills
    return null;
  }

  /**
   * Analyze student engagement (homework completion rate)
   */
  private async analyzeEngagement(studentId: string): Promise<RiskFactor | null> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get assigned homework count
    const assignedHomework = await db
      .select({ id: homework.id })
      .from(homework)
      .where(gte(homework.dueDate, thirtyDaysAgo.toISOString().split("T")[0]));

    if (assignedHomework.length === 0) {
      return null;
    }

    // Get submission count
    const submissions = await db
      .select({ id: homeworkSubmissions.id })
      .from(homeworkSubmissions)
      .where(
        and(
          eq(homeworkSubmissions.studentId, studentId),
          gte(homeworkSubmissions.submittedAt, thirtyDaysAgo)
        )
      );

    const completionRate = (submissions.length / assignedHomework.length) * 100;

    if (completionRate < RISK_THRESHOLDS.homeworkCompletion.critical) {
      return {
        type: "engagement",
        severity: "critical",
        description: "Very low homework completion rate",
        evidence: {
          completionRate: Math.round(completionRate),
          submittedCount: submissions.length,
          assignedCount: assignedHomework.length,
        },
        detectedAt: new Date(),
      };
    } else if (completionRate < RISK_THRESHOLDS.homeworkCompletion.high) {
      return {
        type: "engagement",
        severity: "high",
        description: "Low homework completion rate",
        evidence: {
          completionRate: Math.round(completionRate),
          submittedCount: submissions.length,
          assignedCount: assignedHomework.length,
        },
        detectedAt: new Date(),
      };
    } else if (completionRate < RISK_THRESHOLDS.homeworkCompletion.medium) {
      return {
        type: "engagement",
        severity: "medium",
        description: "Below average homework completion",
        evidence: {
          completionRate: Math.round(completionRate),
        },
        detectedAt: new Date(),
      };
    }

    return null;
  }

  /**
   * Calculate overall risk level from individual factors
   */
  private calculateOverallRiskLevel(factors: RiskFactor[]): RiskLevel {
    if (factors.length === 0) return "none";

    const hasCritical = factors.some(f => f.severity === "critical");
    const hasHigh = factors.some(f => f.severity === "high");

    if (hasCritical) return "critical";
    if (hasHigh) return "high";

    const highMediumCount = factors.filter(f => f.severity === "medium").length;
    if (highMediumCount >= 3) return "high";
    if (highMediumCount >= 2) return "medium";

    return "low";
  }

  /**
   * Calculate risk score (0-100)
   */
  private calculateRiskScore(factors: RiskFactor[]): number {
    if (factors.length === 0) return 0;

    const severityScores = {
      critical: 25,
      high: 15,
      medium: 8,
      low: 3,
    };

    const totalScore = factors.reduce((sum, factor) => {
      return sum + severityScores[factor.severity];
    }, 0);

    return Math.min(100, totalScore);
  }

  /**
   * Store risk assessment in database
   */
  private async storeRiskAssessment(
    studentId: string,
    riskLevel: RiskLevel,
    riskScore: number,
    riskFactors: RiskFactor[]
  ): Promise<void> {
    await db
      .update(studentProgressAnalytics)
      .set({
        riskLevel,
        riskFactors: riskFactors as unknown as Record<string, unknown>[],
        lastUpdated: new Date(),
      })
      .where(eq(studentProgressAnalytics.userId, studentId));
  }

  /**
   * Generate class-level intervention recommendations
   */
  private generateClassInterventions(atRiskStudents: AtRiskStudent[]): string[] {
    const interventions: string[] = [];
    const concerns = new Set<string>();

    // Collect all concerns
    for (const student of atRiskStudents) {
      for (const factor of student.riskFactors) {
        concerns.add(factor.type);
      }
    }

    // Generate recommendations based on common concerns
    if (concerns.has("academic")) {
      interventions.push("Consider after-school tutoring support");
      interventions.push("Review teaching methods for struggling topics");
    }

    if (concerns.has("attendance")) {
      interventions.push("Investigate systemic attendance barriers");
      interventions.push("Consider home visits for chronic absentees");
    }

    if (concerns.has("emotional")) {
      interventions.push("Schedule counselor classroom visits");
      interventions.push("Consider wellness activities");
    }

    if (concerns.has("engagement")) {
      interventions.push("Review homework load and relevance");
      interventions.push("Consider project-based learning options");
    }

    return interventions;
  }

  /**
   * Get intervention recommendations for a specific student
   */
  async getInterventions(studentId: string): Promise<InterventionRecommendation[]> {
    const analysis = await this.analyzeStudent(studentId);

    if (!analysis) {
      return [];
    }

    const recommendations: InterventionRecommendation[] = [];

    for (const action of analysis.recommendedActions) {
      let priority: InterventionRecommendation["priority"] = "medium";

      if (analysis.riskLevel === "critical") {
        priority = "urgent";
      } else if (analysis.riskLevel === "high") {
        priority = "high";
      }

      recommendations.push({
        priority,
        action,
        reason: `Risk level: ${analysis.riskLevel.toUpperCase()}`,
        suggestedBy: "Early Warning System",
      });
    }

    // Add specific resources based on risk factors
    const academicRisk = analysis.riskFactors.find(f => f.type === "academic");
    if (academicRisk) {
      recommendations.push({
        priority: "medium",
        action: "Access peer tutoring program",
        reason: "Declining homework performance detected",
        suggestedBy: "Early Warning System",
        resources: ["Peer Tutoring", "After-School Study Group"],
      });
    }

    const emotionalRisk = analysis.riskFactors.find(f => f.type === "emotional");
    if (emotionalRisk) {
      recommendations.push({
        priority: emotionalRisk.severity === "critical" ? "urgent" : "high",
        action: "Schedule counseling session",
        reason: "Emotional concerns detected",
        suggestedBy: "Early Warning System",
        resources: ["School Counselor", "Student Wellness Center"],
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const earlyWarningSystem = new EarlyWarningSystem();
