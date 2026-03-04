/**
 * PREDICTIVE ANALYTICS ENGINE
 *
 * Uses historical and current data to predict future outcomes:
 * - Dropout risk prediction (will student leave school?)
 * - Career success probability (will they succeed in their chosen career?)
 * - National workforce projections (what skills will Bhutan need in 2030?)
 *
 * Predictions are based on:
 * - Academic performance trends
 * - Attendance patterns
 * - Behavioral indicators (journal sentiment, engagement)
 * - Skills development trajectory
 * - Assessment results consistency
 */

import { db } from "@/lib/db";
import { users, homeworkSubmissions, attendance, homework, studentProgressAnalytics, riasecResults as riasecResultsTable, careerMatches, careers, studentSkills } from "@/lib/db/schema";
import { eq, and, gte, desc, sql, count, avg } from "drizzle-orm";
import { logger } from "@/lib/logger";

// ============================================================================
// TYPES
// ============================================================================

export interface DropoutRiskPrediction {
  studentId: string;
  studentName: string;
  currentClass: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  riskScore: number; // 0-100
  probability: number; // 0-1 likelihood of dropping out
  primaryRiskFactors: string[];
  predictedDropoutDate?: Date;
  interventionImpact: {
    ifIntervened: number; // New risk score if intervention works
    potentialImprovement: number; // Percentage points improvement
  };
  recommendedActions: string[];
}

export interface CareerSuccessPrediction {
  studentId: string;
  studentName: string;
  targetCareer: string;
  successProbability: number; // 0-100
  confidence: number; // How confident are we in this prediction?
  predictedTimeToReadiness: number; // Months to career-ready
  successFactors: Array<{
    factor: string;
    impact: "positive" | "negative" | "neutral";
    weight: number; // How much this affects the prediction
  }>;
  barriers: string[];
  strengths: string[];
  recommendations: string[];
}

export interface WorkforceProjection {
  year: number;
  region: string;
  skillDemand: Array<{
    skill: string;
    demandLevel: "critical_shortage" | "shortage" | "balanced" | "surplus";
    currentSupply: number;
    projectedDemand: number;
    gap: number;
  }>;
  careerOutlook: Array<{
    career: string;
    growthRate: number; // Percentage growth
    projectedOpenings: number;
    readinessOfCurrentStudents: number; // Percentage ready
  }>;
  recommendedPrograms: Array<{
    programType: string;
    focus: string;
    targetStudents: number;
    urgency: "high" | "medium" | "low";
  }>;
}

// ============================================================================
// PREDICTIVE ANALYTICS ENGINE CLASS
// ============================================================================

export class PredictiveEngine {
  /**
   * Predict dropout risk for a specific student
   */
  async predictDropoutRisk(studentId: string): Promise<DropoutRiskPrediction | null> {
    const [student] = await db
      .select({
        id: users.id,
        name: users.name,
        classGrade: users.classGrade,
      })
      .from(users)
      .where(eq(users.id, studentId))
      .limit(1);

    if (!student) return null;

    const riskFactors: string[] = [];
    let riskScore = 0;

    // Factor 1: Attendance trend (30 points max)
    const attendanceRisk = await this.analyzeAttendanceTrend(studentId);
    riskScore += attendanceRisk.score;
    if (attendanceRisk.factors.length > 0) {
      riskFactors.push(...attendanceRisk.factors);
    }

    // Factor 2: Academic performance trend (30 points max)
    const academicRisk = await this.analyzeAcademicTrend(studentId);
    riskScore += academicRisk.score;
    if (academicRisk.factors.length > 0) {
      riskFactors.push(...academicRisk.factors);
    }

    // Factor 3: Engagement trend (20 points max)
    const engagementRisk = await this.analyzeEngagementTrend(studentId);
    riskScore += engagementRisk.score;
    if (engagementRisk.factors.length > 0) {
      riskFactors.push(...engagementRisk.factors);
    }

    // Factor 4: Behavioral/Emotional indicators (20 points max)
    const behavioralRisk = await this.analyzeBehavioralIndicators(studentId);
    riskScore += behavioralRisk.score;
    if (behavioralRisk.factors.length > 0) {
      riskFactors.push(...behavioralRisk.factors);
    }

    // Calculate probability based on risk score
    const probability = Math.min(0.95, riskScore / 100);

    // Determine risk level
    let riskLevel: "low" | "medium" | "high" | "critical";
    if (riskScore >= 75) riskLevel = "critical";
    else if (riskScore >= 50) riskLevel = "high";
    else if (riskScore >= 25) riskLevel = "medium";
    else riskLevel = "low";

    // Predict dropout date if high risk
    let predictedDropoutDate: Date | undefined;
    if (riskScore >= 50) {
      predictedDropoutDate = new Date();
      // Higher risk = sooner dropout
      const monthsUntilDropout = Math.max(1, 12 - (riskScore / 10));
      predictedDropoutDate.setMonth(predictedDropoutDate.getMonth() + monthsUntilDropout);
    }

    // Calculate intervention impact
    const ifIntervened = Math.max(0, riskScore - 30); // Intervention can reduce by ~30 points
    const potentialImprovement = riskScore - ifIntervened;

    // Generate recommendations
    const recommendedActions = this.generateInterventionRecommendations(riskFactors, riskScore);

    return {
      studentId: student.id,
      studentName: student.name,
      currentClass: `Class ${student.classGrade || "Unknown"}`,
      riskLevel,
      riskScore,
      probability,
      primaryRiskFactors: riskFactors.slice(0, 5),
      predictedDropoutDate,
      interventionImpact: {
        ifIntervened,
        potentialImprovement,
      },
      recommendedActions,
    };
  }

  /**
   * Predict career success for a student
   */
  async predictCareerSuccess(studentId: string): Promise<CareerSuccessPrediction | null> {
    const [student] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.id, studentId))
      .limit(1);

    if (!student) return null;

    // Get target career
    const [topMatch] = await db
      .select({
        careerId: careerMatches.careerId,
        matchScore: careerMatches.matchScore,
      })
      .from(careerMatches)
      .where(eq(careerMatches.studentId, studentId))
      .orderBy(desc(careerMatches.matchScore))
      .limit(1);

    if (!topMatch) return null;

    const [career] = await db
      .select({ title: careers.title, skills: careers.skills })
      .from(careers)
      .where(eq(careers.id, topMatch.careerId))
      .limit(1);

    if (!career) return null;

    const careerSkills = (career.skills as string[]) || [];

    // Get student's skills
    const studentSkillsList = await db
      .select({ skillName: studentSkills.skillName, level: studentSkills.level, confidence: studentSkills.confidence })
      .from(studentSkills)
      .where(eq(studentSkills.userId, studentId));

    // Calculate skills match
    const studentSkillNames = studentSkillsList.map(s => s.skillName.toLowerCase());
    const matchingSkills = careerSkills.filter(s =>
      studentSkillNames.some(ss => ss.includes(s.toLowerCase()))
    );
    const skillsMatchPercentage = (matchingSkills.length / careerSkills.length) * 100;

    // Get assessment consistency (how stable are their interests?)
    const assessmentStability = await this.analyzeAssessmentStability(studentId);

    // Calculate success factors
    const successFactors: Array<{
      factor: string;
      impact: "positive" | "negative" | "neutral";
      weight: number;
    }> = [];

    // Skills match
    successFactors.push({
      factor: "Skills Match",
      impact: skillsMatchPercentage >= 50 ? "positive" : "negative",
      weight: skillsMatchPercentage >= 50 ? 30 : -20,
    });

    // Assessment match
    successFactors.push({
      factor: "Career Interest Match",
      impact: topMatch.matchScore >= 70 ? "positive" : "neutral",
      weight: topMatch.matchScore >= 70 ? 25 : 10,
    });

    // Assessment stability
    successFactors.push({
      factor: "Interest Stability",
      impact: assessmentStability >= 70 ? "positive" : "neutral",
      weight: assessmentStability >= 70 ? 15 : 5,
    });

    // Calculate base probability
    let baseProbability = 50; // Start at 50%
    baseProbability += skillsMatchPercentage * 0.3; // Skills matter most
    baseProbability += (topMatch.matchScore - 50) * 0.2; // Interest alignment
    baseProbability += (assessmentStability - 50) * 0.1; // Consistency

    // Get recent performance trend
    const performanceTrend = await this.analyzePerformanceTrend(studentId);
    successFactors.push({
      factor: "Academic Trend",
      impact: performanceTrend >= 0 ? "positive" : "negative",
      weight: performanceTrend >= 0 ? 15 : -10,
    });
    baseProbability += performanceTrend * 0.15;

    // Clamp between 10% and 95%
    const successProbability = Math.max(10, Math.min(95, baseProbability));

    // Calculate confidence based on data quality
    const dataPoints = [
      studentSkillsList.length > 0,
      topMatch.matchScore > 0,
      performanceTrend !== 0,
    ].filter(Boolean).length;
    const confidence = Math.min(95, 40 + (dataPoints * 15));

    // Estimate time to readiness
    const readinessGap = 100 - skillsMatchPercentage;
    const predictedTimeToReadiness = Math.ceil(readinessGap / 8); // ~8% gain per month

    // Identify barriers and strengths
    const barriers: string[] = [];
    const strengths: string[] = [];

    if (skillsMatchPercentage < 50) {
      barriers.push("Significant skills gap - need focused development");
    }
    if (performanceTrend < -10) {
      barriers.push("Declining academic performance");
    }
    if (assessmentStability < 50) {
      barriers.push("Uncertain career interests - may explore other options");
    }

    if (skillsMatchPercentage >= 70) {
      strengths.push("Strong foundation of relevant skills");
    }
    if (topMatch.matchScore >= 80) {
      strengths.push("Very high career interest alignment");
    }
    if (performanceTrend > 10) {
      strengths.push("Strong upward academic trajectory");
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (skillsMatchPercentage < 70) {
      recommendations.push("Focus on developing missing core skills");
    }
    if (performanceTrend < 0) {
      recommendations.push("Address academic performance to build foundation");
    }
    recommendations.push("Gain practical experience through projects or internships");
    recommendations.push("Connect with professionals in this field for mentorship");

    return {
      studentId: student.id,
      studentName: student.name,
      targetCareer: career.title,
      successProbability: Math.round(successProbability),
      confidence,
      predictedTimeToReadiness,
      successFactors,
      barriers,
      strengths,
      recommendations,
    };
  }

  /**
   * Generate national workforce projections
   */
  async generateWorkforceProjection(region?: string): Promise<WorkforceProjection> {
    const currentYear = new Date().getFullYear();
    const projectionYear = currentYear + 5; // 5-year projection

    // Get current skills distribution
    const [skillsData] = await db
      .select({
        totalSkills: count(studentSkills.id),
        uniqueStudents: count(sql`DISTINCT ${studentSkills.userId}`),
      })
      .from(studentSkills);

    // Get career interest distribution
    const careerInterests = await db
      .select({
        careerId: careerMatches.careerId,
        studentCount: count(sql`DISTINCT ${careerMatches.studentId}`),
      })
      .from(careerMatches)
      .groupBy(careerMatches.careerId)
      .orderBy(desc(count(sql`DISTINCT ${careerMatches.studentId}`)))
      .limit(20);

    // Get career details for projections
    const careerProjections = await Promise.all(
      careerInterests.map(async (interest) => {
        const [career] = await db
          .select({ title: careers.title, skills: careers.skills })
          .from(careers)
          .where(eq(careers.id, interest.careerId))
          .limit(1);

        if (!career) return null;

        // Calculate student readiness for this career
        const careerSkills = (career.skills as string[]) || [];
        const relevantSkills = await db
          .select({ userId: studentSkills.userId })
          .from(studentSkills)
          .where(sql`${studentSkills.skillName} = ANY(${careerSkills})`);

        const readyStudents = new Set(relevantSkills.map(s => s.userId)).size;

        // Project growth based on Bhutan's development plans
        // (This is simplified - real data would come from Ministry projections)
        let growthRate = 5; // Base 5% growth
        const title = career.title.toLowerCase();

        // High growth sectors in Bhutan
        if (title.includes("comput") || title.includes("it") || title.includes("digital")) {
          growthRate = 25;
        } else if (title.includes("construct") || title.includes("engineer")) {
          growthRate = 15;
        } else if (title.includes("health") || title.includes("nurse") || title.includes("doctor")) {
          growthRate = 20;
        } else if (title.includes("teach") || title.includes("education")) {
          growthRate = 10;
        } else if (title.includes("tour") || title.includes("hotel") || title.includes("guide")) {
          growthRate = 18;
        }

        const projectedOpenings = Math.round(interest.studentCount * (1 + growthRate / 100));
        const readinessPercentage = interest.studentCount > 0
          ? Math.round((readyStudents / interest.studentCount) * 100)
          : 0;

        return {
          career: career.title,
          growthRate,
          projectedOpenings,
          readinessOfCurrentStudents: readinessPercentage,
        };
      })
    );

    // Skill demand analysis
    const skillDemand: Array<{
      skill: string;
      demandLevel: "critical_shortage" | "shortage" | "balanced" | "surplus";
      currentSupply: number;
      projectedDemand: number;
      gap: number;
    }> = [];

    // Analyze high-demand skills
    const highDemandSkills = [
      "Communication", "Mathematics", "Computer Literacy",
      "Teamwork", "Problem Solving", "English",
      "Digital Literacy", "Customer Service"
    ];

    for (const skill of highDemandSkills) {
      const [skillData] = await db
        .select({ studentCount: count(sql`DISTINCT ${studentSkills.userId}`) })
        .from(studentSkills)
        .where(sql`${studentSkills.skillName} ILIKE ${"%" + skill + "%"}`);

      const currentSupply = skillData?.studentCount || 0;
      const projectedDemand = Math.round(currentSupply * 1.3); // 30% increase in demand
      const gap = projectedDemand - currentSupply;

      let demandLevel: "critical_shortage" | "shortage" | "balanced" | "surplus";
      if (gap > currentSupply * 0.5) demandLevel = "critical_shortage";
      else if (gap > 0) demandLevel = "shortage";
      else if (gap === 0) demandLevel = "balanced";
      else demandLevel = "surplus";

      skillDemand.push({
        skill,
        demandLevel,
        currentSupply,
        projectedDemand,
        gap,
      });
    }

    // Generate program recommendations
    const recommendedPrograms: Array<{
      programType: string;
      focus: string;
      targetStudents: number;
      urgency: "high" | "medium" | "low";
    }> = [];

    const criticalShortages = skillDemand.filter(s => s.demandLevel === "critical_shortage");
    if (criticalShortages.length > 0) {
      recommendedPrograms.push({
        programType: "Skill Development",
        focus: criticalShortages.map(s => s.skill).join(", "),
        targetStudents: criticalShortages.reduce((sum, s) => sum + s.gap, 0),
        urgency: "high",
      });
    }

    // Check career readiness
    const lowReadinessCareers = careerProjections
      .filter(c => c && c.readinessOfCurrentStudents < 50)
      .slice(0, 3);

    for (const career of lowReadinessCareers) {
      if (career) {
        recommendedPrograms.push({
          programType: "Career Preparation",
          focus: `Skills for ${career.career}`,
          targetStudents: Math.round(career.projectedOpenings * 0.5),
          urgency: "medium",
        });
      }
    }

    return {
      year: projectionYear,
      region: region || "National",
      skillDemand,
      careerOutlook: careerProjections.filter((c): c is NonNullable<typeof c> => c !== null),
      recommendedPrograms,
    };
  }

  // ============================================================================
  // PRIVATE ANALYSIS METHODS
  // ============================================================================

  private async analyzeAttendanceTrend(studentId: string): Promise<{
    score: number;
    factors: string[];
  }> {
    const factors: string[] = [];
    let score = 0;

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const recentAttendance = await db
      .select({ date: attendance.date, status: attendance.status })
      .from(attendance)
      .where(
        and(
          eq(attendance.studentId, studentId),
          gte(attendance.date, sixtyDaysAgo.toISOString().split("T")[0])
        )
      )
      .orderBy(desc(attendance.date))
      .limit(30);

    if (recentAttendance.length === 0) return { score: 0, factors };

    const presentDays = recentAttendance.filter(r => r.status === "present").length;
    const attendanceRate = (presentDays / recentAttendance.length) * 100;

    // Check recent trend (last 10 vs previous 20)
    const recent10 = recentAttendance.slice(0, 10);
    const previous20 = recentAttendance.slice(10, 30);

    const recentRate = (recent10.filter(r => r.status === "present").length / recent10.length) * 100;
    const previousRate = (previous20.filter(r => r.status === "present").length / previous20.length) * 100;
    const trend = recentRate - previousRate;

    // Score based on attendance rate and trend
    if (attendanceRate < 60) {
      score += 30;
      factors.push("Critical attendance - below 60%");
    } else if (attendanceRate < 75) {
      score += 20;
      factors.push("Poor attendance - below 75%");
    } else if (attendanceRate < 85) {
      score += 10;
    }

    // Trend impact
    if (trend < -20) {
      score += 15;
      factors.push("Attendance declining rapidly");
    } else if (trend < -10) {
      score += 10;
      factors.push("Attendance declining");
    }

    return { score, factors };
  }

  private async analyzeAcademicTrend(studentId: string): Promise<{
    score: number;
    factors: string[];
  }> {
    const factors: string[] = [];
    let score = 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const submissions = await db
      .select({
        score: homeworkSubmissions.score,
        totalPoints: homework.totalPoints,
        submittedAt: homeworkSubmissions.submittedAt,
      })
      .from(homeworkSubmissions)
      .innerJoin(homework, eq(homeworkSubmissions.homeworkId, homework.id))
      .where(
        and(
          eq(homeworkSubmissions.studentId, studentId),
          gte(homeworkSubmissions.submittedAt, thirtyDaysAgo)
        )
      )
      .orderBy(desc(homeworkSubmissions.submittedAt));

    if (submissions.length < 3) return { score: 0, factors };

    // Calculate scores and trend
    const scores = submissions.map(s =>
      s.totalPoints > 0 ? (s.score / s.totalPoints) * 100 : 0
    );

    const midPoint = Math.floor(scores.length / 2);
    const recentAvg = scores.slice(0, midPoint).reduce((a, b) => a + b, 0) / midPoint;
    const olderAvg = scores.slice(midPoint).reduce((a, b) => a + b, 0) / (scores.length - midPoint);
    const trend = recentAvg - olderAvg;

    if (recentAvg < 40) {
      score += 25;
      factors.push("Critical academic performance - below 40%");
    } else if (recentAvg < 55) {
      score += 15;
      factors.push("Poor academic performance - below 55%");
    } else if (recentAvg < 70) {
      score += 5;
    }

    if (trend < -20) {
      score += 20;
      factors.push("Grades declining rapidly");
    } else if (trend < -10) {
      score += 10;
      factors.push("Grades declining");
    }

    return { score, factors };
  }

  private async analyzeEngagementTrend(studentId: string): Promise<{
    score: number;
    factors: string[];
  }> {
    const factors: string[] = [];
    let score = 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [assignedHomework] = await db
      .select({ count: count() })
      .from(homework)
      .where(gte(homework.dueDate, thirtyDaysAgo.toISOString().split("T")[0]));

    const [submittedHomework] = await db
      .select({ count: count() })
      .from(homeworkSubmissions)
      .where(
        and(
          eq(homeworkSubmissions.studentId, studentId),
          gte(homeworkSubmissions.submittedAt, thirtyDaysAgo)
        )
      );

    if (assignedHomework.count > 0) {
      const completionRate = (submittedHomework.count / assignedHomework.count) * 100;

      if (completionRate < 40) {
        score += 20;
        factors.push("Very low homework completion - less than 40%");
      } else if (completionRate < 60) {
        score += 10;
        factors.push("Low homework completion - less than 60%");
      }
    }

    return { score, factors };
  }

  private async analyzeBehavioralIndicators(studentId: string): Promise<{
    score: number;
    factors: string[];
  }> {
    const factors: string[] = [];
    let score = 0;

    const [user] = await db
      .select({ settings: users.settings })
      .from(users)
      .where(eq(users.id, studentId))
      .limit(1);

    if (!user?.settings) return { score: 0, factors };

    const settings = user.settings as { journalEntries?: Array<{ content: string; mood?: string; date?: string }> };
    const entries = settings.journalEntries || [];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentEntries = entries.filter(e => {
      if (!e.date) return false;
      const entryDate = new Date(e.date);
      return entryDate >= thirtyDaysAgo;
    });

    // Check for distress keywords
    const distressKeywords = ["hopeless", "give up", "want to leave", "quit", "pointless"];
    for (const entry of recentEntries) {
      const content = entry.content.toLowerCase();
      for (const keyword of distressKeywords) {
        if (content.includes(keyword)) {
          score += 15;
          factors.push("Concerning journal entries detected");
          break;
        }
      }
    }

    // Check mood trend
    const moods = recentEntries.map(e => e.mood).filter(Boolean);
    const negativeMoods = moods.filter(m =>
      ["sad", "anxious", "stressed", "frustrated"].includes(m?.toLowerCase() || "")
    );

    if (negativeMoods.length > 5) {
      score += 10;
      factors.push("Persistent negative mood indicators");
    }

    return { score: Math.min(20, score), factors };
  }

  private async analyzeAssessmentStability(studentId: string): Promise<number> {
    // Check if student has taken multiple assessments with consistent results
    const results = await db
      .select({ createdAt: riasecResultsTable.createdAt })
      .from(riasecResultsTable)
      .where(eq(riasecResultsTable.userId, studentId))
      .orderBy(desc(riasecResultsTable.createdAt));

    // If multiple results over time, check consistency
    if (results.length > 1) {
      // For simplicity, return high stability if multiple assessments exist
      return 75;
    }

    return 60; // Default moderate stability
  }

  private async analyzePerformanceTrend(studentId: string): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const submissions = await db
      .select({
        score: homeworkSubmissions.score,
        totalPoints: homework.totalPoints,
      })
      .from(homeworkSubmissions)
      .innerJoin(homework, eq(homeworkSubmissions.homeworkId, homework.id))
      .where(
        and(
          eq(homeworkSubmissions.studentId, studentId),
          gte(homeworkSubmissions.submittedAt, thirtyDaysAgo)
        )
      );

    if (submissions.length < 2) return 0;

    const scores = submissions.map(s =>
      s.totalPoints > 0 ? (s.score / s.totalPoints) * 100 : 0
    );

    const midPoint = Math.floor(scores.length / 2);
    const recentAvg = scores.slice(0, midPoint).reduce((a, b) => a + b, 0) / midPoint;
    const olderAvg = scores.slice(midPoint).reduce((a, b) => a + b, 0) / (scores.length - midPoint);

    return recentAvg - olderAvg;
  }

  private generateInterventionRecommendations(riskFactors: string[], riskScore: number): string[] {
    const recommendations: string[] = [];

    if (riskFactors.some(f => f.includes("attendance"))) {
      recommendations.push("Schedule attendance check-in meeting");
      recommendations.push("Identify and address barriers to attendance");
    }

    if (riskFactors.some(f => f.includes("academic") || f.includes("grade"))) {
      recommendations.push("Arrange academic support/tutoring");
      recommendations.push("Consider reduced workload temporarily");
    }

    if (riskFactors.some(f => f.includes("journal") || f.includes("mood"))) {
      recommendations.push("Refer to school counselor");
      recommendations.push("Schedule private check-in meeting");
    }

    if (riskScore >= 50) {
      recommendations.push("Involve parent/guardian in support plan");
      recommendations.push("Create weekly progress check-ins");
    }

    recommendations.push("Connect student with peer mentor");

    return recommendations;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const predictiveEngine = new PredictiveEngine();
