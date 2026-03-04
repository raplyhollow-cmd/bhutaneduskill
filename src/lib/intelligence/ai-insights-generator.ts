/**
 * AI INSIGHTS GENERATOR
 *
 * Turns raw data into actionable insights for teachers:
 * - Class-level performance trends
 * - Teaching recommendations based on data
 * - Student grouping suggestions
 * - Lesson plan adaptations
 * - Parent meeting preparation
 */

import { db } from "@/lib/db";
import { users, homeworkSubmissions, attendance, homework, classes, subjects, studentProgressAnalytics, studentSkills } from "@/lib/db/schema";
import { eq, and, gte, desc, sql, avg, count } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { earlyWarningSystem, AtRiskStudent } from "./early-warning-system";

// ============================================================================
// TYPES
// ============================================================================

export interface ClassInsight {
  type: "performance" | "engagement" | "recommendation" | "alert" | "opportunity";
  title: string;
  description: string;
  data?: Record<string, unknown>;
  priority: "low" | "medium" | "high" | "urgent";
  actionUrl?: string;
  actionLabel?: string;
}

export interface TeachingRecommendation {
  category: "instruction" | "engagement" | "assessment" | "grouping" | "intervention";
  recommendation: string;
  reason: string;
  evidence: Record<string, unknown>;
  effort: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
}

export interface StudentGrouping {
  groupId: string;
  groupName: string;
  type: "peer_tutoring" | "collaborative" | "ability_based" | "mixed_ability";
  students: Array<{
    id: string;
    name: string;
    role: "strong" | "developing" | "support";
  }>;
  topic: string;
  rationale: string;
}

export interface ClassIntelligenceSummary {
  classId: string;
  className: string;
  totalStudents: number;
  insights: ClassInsight[];
  recommendations: TeachingRecommendation[];
  groupings: StudentGrouping[];
  atRiskStudents: Array<{
    id: string;
    name: string;
    riskLevel: string;
    primaryConcern: string;
  }>;
  summary: {
    averageEngagement: number;
    averagePerformance: number;
    attendanceRate: number;
    overallHealth: "excellent" | "good" | "concerning" | "critical";
  };
}

export interface ParentMeetingPrep {
  student: {
    id: string;
    name: string;
  };
  strengths: string[];
  concerns: string[];
  talkingPoints: string[];
  recommendedActions: string[];
  dataToShow: {
    label: string;
    value: string | number;
    trend?: "improving" | "stable" | "declining";
  }[];
}

// ============================================================================
// AI INSIGHTS GENERATOR CLASS
// ============================================================================

export class AIInsightsGenerator {
  /**
   * Generate comprehensive class intelligence for a teacher
   */
  async generateClassIntelligence(classId: string, teacherId: string): Promise<ClassIntelligenceSummary> {
    const insights: ClassInsight[] = [];
    const recommendations: TeachingRecommendation[] = [];

    // Get class information
    const [classInfo] = await db
      .select({
        id: classes.id,
        name: classes.name,
        grade: classes.grade,
      })
      .from(classes)
      .where(eq(classes.id, classId))
      .limit(1);

    if (!classInfo) {
      throw new Error("Class not found");
    }

    // Get all students in class
    const students = await db
      .select({
        id: users.id,
        name: users.name,
      })
      .from(users)
      .where(eq(users.classGrade, classInfo.grade || 0));

    const totalStudents = students.length;

    // 1. Generate performance insights
    const performanceInsights = await this.analyzeClassPerformance(classId, students.map(s => s.id));
    insights.push(...performanceInsights);

    // 2. Generate engagement insights
    const engagementInsights = await this.analyzeClassEngagement(classId, students.map(s => s.id));
    insights.push(...engagementInsights);

    // 3. Get at-risk students
    const atRiskStudents: Array<{
      id: string;
      name: string;
      riskLevel: string;
      primaryConcern: string;
    }> = [];

    for (const student of students.slice(0, 20)) { // Limit to 20 for performance
      const riskAnalysis = await earlyWarningSystem.analyzeStudent(student.id);
      if (riskAnalysis && riskAnalysis.riskLevel !== "none") {
        atRiskStudents.push({
          id: riskAnalysis.studentId,
          name: riskAnalysis.studentName,
          riskLevel: riskAnalysis.riskLevel,
          primaryConcern: riskAnalysis.riskFactors[0]?.description || "Multiple concerns",
        });
      }
    }

    if (atRiskStudents.length > 0) {
      insights.push({
        type: "alert",
        title: `${atRiskStudents.length} student(s) need attention`,
        description: atRiskStudents.map(s => s.name).join(", "),
        priority: atRiskStudents.some(s => s.riskLevel === "critical") ? "urgent" : "high",
        actionUrl: `/teacher/students?risk=high`,
        actionLabel: "View Details",
      });
    }

    // 4. Generate teaching recommendations
    const teachingRecommendations = await this.generateTeachingRecommendations(
      classId,
      students.map(s => s.id)
    );
    recommendations.push(...teachingRecommendations);

    // 5. Generate student groupings
    const groupings = await this.generateStudentGroupings(classId, students.map(s => s.id));

    // 6. Calculate summary metrics
    const summary = await this.calculateClassSummary(classId, students.map(s => s.id));

    return {
      classId,
      className: classInfo.name,
      totalStudents,
      insights,
      recommendations,
      groupings,
      atRiskStudents,
      summary,
    };
  }

  /**
   * Analyze class performance trends
   */
  private async analyzeClassPerformance(classId: string, studentIds: string[]): Promise<ClassInsight[]> {
    const insights: ClassInsight[] = [];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get recent homework submissions for this class
    const submissions = await db
      .select({
        studentId: homeworkSubmissions.studentId,
        score: homeworkSubmissions.score,
        totalPoints: homework.totalPoints,
        subjectId: homework.subjectId,
        submittedAt: homeworkSubmissions.submittedAt,
      })
      .from(homeworkSubmissions)
      .innerJoin(homework, eq(homeworkSubmissions.homeworkId, homework.id))
      .where(
        and(
          eq(homework.classId, classId),
          gte(homeworkSubmissions.submittedAt, thirtyDaysAgo)
        )
      );

    if (submissions.length === 0) {
      return insights;
    }

    // Calculate class average
    const scores = submissions.map(s =>
      s.totalPoints > 0 ? (s.score / s.totalPoints) * 100 : 0
    );
    const classAverage = scores.reduce((a, b) => a + b, 0) / scores.length;

    // Check for subjects where class struggles
    const subjectPerformance = new Map<string, { scores: number[]; count: number }>();
    for (const submission of submissions) {
      const subjectId = submission.subjectId || "unknown";
      const score = submission.totalPoints > 0 ? (submission.score / submission.totalPoints) * 100 : 0;

      if (!subjectPerformance.has(subjectId)) {
        subjectPerformance.set(subjectId, { scores: [], count: 0 });
      }
      const data = subjectPerformance.get(subjectId)!;
      data.scores.push(score);
      data.count++;
    }

    // Find struggling subjects
    for (const [subjectId, data] of subjectPerformance.entries()) {
      const subjectAvg = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
      if (subjectAvg < 60 && data.count >= 3) {
        insights.push({
          type: "alert",
          title: "Class struggling with subject",
          description: `Average score: ${Math.round(subjectAvg)}% across ${data.count} assignments`,
          data: { subjectId, average: subjectAvg },
          priority: "high",
        });
      }
    }

    // Check overall performance
    if (classAverage < 50) {
      insights.push({
        type: "alert",
        title: "Class performance below expected",
        description: `Class average: ${Math.round(classAverage)}% - consider reviewing teaching approach`,
        priority: "high",
      });
    } else if (classAverage < 65) {
      insights.push({
        type: "recommendation",
        title: "Class performance could improve",
        description: `Class average: ${Math.round(classAverage)}% - some students may need extra support`,
        priority: "medium",
      });
    } else if (classAverage >= 80) {
      insights.push({
        type: "opportunity",
        title: "Class performing excellently",
        description: `Class average: ${Math.round(classAverage)}% - consider enrichment activities`,
        priority: "low",
      });
    }

    return insights;
  }

  /**
   * Analyze class engagement patterns
   */
  private async analyzeClassEngagement(classId: string, studentIds: string[]): Promise<ClassInsight[]> {
    const insights: ClassInsight[] = [];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Homework submission rate
    const [assignedHomework] = await db
      .select({ count: count() })
      .from(homework)
      .where(
        and(
          eq(homework.classId, classId),
          gte(homework.dueDate, thirtyDaysAgo.toISOString().split("T")[0])
        )
      );

    const [submittedHomework] = await db
      .select({ count: count() })
      .from(homeworkSubmissions)
      .innerJoin(homework, eq(homeworkSubmissions.homeworkId, homework.id))
      .where(
        and(
          eq(homework.classId, classId),
          gte(homeworkSubmissions.submittedAt, thirtyDaysAgo)
        )
      );

    if (assignedHomework.count > 0) {
      const submissionRate = (submittedHomework.count / (assignedHomework.count * studentIds.length)) * 100;

      if (submissionRate < 60) {
        insights.push({
          type: "alert",
          title: "Low homework submission rate",
          description: `Only ${Math.round(submissionRate)}% of homework is being submitted`,
          priority: "high",
        });
      }
    }

    // Attendance patterns
    const [attendanceRecords] = await db
      .select({
        present: count(sql`CASE WHEN ${attendance.status} = 'present' THEN 1 END`),
        total: count(),
      })
      .from(attendance)
      .where(
        and(
          eq(attendance.classId, classId),
          gte(attendance.date, thirtyDaysAgo.toISOString().split("T")[0])
        )
      );

    if (attendanceRecords.total > 0) {
      const attendanceRate = (attendanceRecords.present / attendanceRecords.total) * 100;

      if (attendanceRate < 80) {
        insights.push({
          type: "alert",
          title: "Class attendance concerning",
          description: `Average attendance: ${Math.round(attendanceRate)}%`,
          priority: "high",
        });
      } else if (attendanceRate >= 95) {
        insights.push({
          type: "opportunity",
          title: "Excellent attendance",
          description: `Average attendance: ${Math.round(attendanceRate)}%`,
          priority: "low",
        });
      }
    }

    return insights;
  }

  /**
   * Generate teaching recommendations based on data
   */
  private async generateTeachingRecommendations(classId: string, studentIds: string[]): Promise<TeachingRecommendation[]> {
    const recommendations: TeachingRecommendation[] = [];

    // Get class performance data
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
          eq(homework.classId, classId),
          gte(homeworkSubmissions.submittedAt, thirtyDaysAgo)
        )
      );

    if (submissions.length === 0) {
      recommendations.push({
        category: "assessment",
        recommendation: "Start assigning homework to track student progress",
        reason: "No assessment data available yet",
        evidence: {},
        effort: "low",
        impact: "medium",
      });
      return recommendations;
    }

    const scores = submissions.map(s =>
      s.totalPoints > 0 ? (s.score / s.totalPoints) * 100 : 0
    );
    const variance = this.calculateVariance(scores);
    const classAverage = scores.reduce((a, b) => a + b, 0) / scores.length;

    // High variance = mixed abilities
    if (variance > 400) { // High variance
      recommendations.push({
        category: "grouping",
        recommendation: "Use mixed-ability groups for peer learning",
        reason: "Class shows wide range of ability levels",
        evidence: { variance: Math.round(variance) },
        effort: "medium",
        impact: "high",
      });

      recommendations.push({
        category: "instruction",
        recommendation: "Implement differentiated instruction",
        reason: "Students have diverse learning needs",
        evidence: { variance: Math.round(variance) },
        effort: "high",
        impact: "high",
      });
    }

    // Low average = need for teaching approach review
    if (classAverage < 60) {
      recommendations.push({
        category: "instruction",
        recommendation: "Review teaching methods - consider more visual aids",
        reason: "Class average below 60% suggests current methods not effective",
        evidence: { average: Math.round(classAverage) },
        effort: "medium",
        impact: "high",
      });

      recommendations.push({
        category: "engagement",
        recommendation: "Use more hands-on activities and examples",
        reason: "Practical applications improve understanding",
        evidence: { average: Math.round(classAverage) },
        effort: "medium",
        impact: "medium",
      });
    }

    // Check for late submissions
    const [lateSubmissions] = await db
      .select({ count: count() })
      .from(homeworkSubmissions)
      .innerJoin(homework, eq(homeworkSubmissions.homeworkId, homework.id))
      .where(
        and(
          eq(homework.classId, classId),
          eq(homeworkSubmissions.isLate, true),
          gte(homeworkSubmissions.submittedAt, thirtyDaysAgo)
        )
      );

    const [totalSubmissions] = await db
      .select({ count: count() })
      .from(homeworkSubmissions)
      .innerJoin(homework, eq(homeworkSubmissions.homeworkId, homework.id))
      .where(
        and(
          eq(homework.classId, classId),
          gte(homeworkSubmissions.submittedAt, thirtyDaysAgo)
        )
      );

    if (totalSubmissions.count > 0 && (lateSubmissions.count / totalSubmissions.count) > 0.3) {
      recommendations.push({
        category: "engagement",
        recommendation: "Review homework deadlines - students struggling with time management",
        reason: `${Math.round((lateSubmissions.count / totalSubmissions.count) * 100)}% of submissions are late`,
        evidence: { lateRate: Math.round((lateSubmissions.count / totalSubmissions.count) * 100) },
        effort: "low",
        impact: "medium",
      });
    }

    return recommendations;
  }

  /**
   * Generate student groupings for activities
   */
  private async generateStudentGroupings(classId: string, studentIds: string[]): Promise<StudentGrouping[]> {
    const groupings: StudentGrouping[] = [];

    // Get student performance data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const studentPerformance = new Map<string, { scores: number[]; average: number }>();

    for (const studentId of studentIds) {
      const submissions = await db
        .select({
          score: homeworkSubmissions.score,
          totalPoints: homework.totalPoints,
        })
        .from(homeworkSubmissions)
        .innerJoin(homework, eq(homeworkSubmissions.homeworkId, homework.id))
        .where(
          and(
            eq(homework.classId, classId),
            eq(homeworkSubmissions.studentId, studentId),
            gte(homeworkSubmissions.submittedAt, thirtyDaysAgo)
          )
        );

      const scores = submissions.map(s =>
        s.totalPoints > 0 ? (s.score / s.totalPoints) * 100 : 0
      );
      const average = scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 50; // Default if no data

      studentPerformance.set(studentId, { scores, average });
    }

    // Get student names
    const students = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(sql`${users.id} = ANY(${studentIds})`);

    // Create peer tutoring groups (strong with weak)
    const sortedStudents = students
      .map(s => ({
        ...s,
        performance: studentPerformance.get(s.id)?.average || 50,
      }))
      .sort((a, b) => b.performance - a.performance);

    const strongStudents = sortedStudents.slice(0, Math.ceil(sortedStudents.length / 3));
    const weakStudents = sortedStudents.slice(-Math.ceil(sortedStudents.length / 3)).reverse();

    const peerTutoringGroups: StudentGrouping = {
      groupId: `peer-tutoring-${classId}`,
      groupName: "Peer Learning Groups",
      type: "peer_tutoring",
      topic: "General Academic Support",
      rationale: "Pair stronger students with those needing support",
      students: [],
    };

    for (let i = 0; i < Math.min(strongStudents.length, weakStudents.length); i++) {
      peerTutoringGroups.students.push({
        id: strongStudents[i].id,
        name: strongStudents[i].name,
        role: "strong",
      });
      peerTutoringGroups.students.push({
        id: weakStudents[i].id,
        name: weakStudents[i].name,
        role: "developing",
      });
    }

    if (peerTutoringGroups.students.length > 0) {
      groupings.push(peerTutoringGroups);
    }

    return groupings;
  }

  /**
   * Calculate class summary metrics
   */
  private async calculateClassSummary(classId: string, studentIds: string[]): Promise<{
    averageEngagement: number;
    averagePerformance: number;
    attendanceRate: number;
    overallHealth: "excellent" | "good" | "concerning" | "critical";
  }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Homework performance
    const submissions = await db
      .select({
        score: homeworkSubmissions.score,
        totalPoints: homework.totalPoints,
      })
      .from(homeworkSubmissions)
      .innerJoin(homework, eq(homeworkSubmissions.homeworkId, homework.id))
      .where(
        and(
          eq(homework.classId, classId),
          gte(homeworkSubmissions.submittedAt, thirtyDaysAgo)
        )
      );

    const averagePerformance = submissions.length > 0
      ? submissions.reduce((sum, s) =>
          sum + (s.totalPoints > 0 ? (s.score / s.totalPoints) * 100 : 0),
          0
        ) / submissions.length
      : 0;

    // Engagement (homework completion rate)
    const [assignedCount] = await db
      .select({ count: count() })
      .from(homework)
      .where(
        and(
          eq(homework.classId, classId),
          gte(homework.dueDate, thirtyDaysAgo.toISOString().split("T")[0])
        )
      );

    const [submissionCount] = await db
      .select({ count: count() })
      .from(homeworkSubmissions)
      .innerJoin(homework, eq(homeworkSubmissions.homeworkId, homework.id))
      .where(
        and(
          eq(homework.classId, classId),
          gte(homeworkSubmissions.submittedAt, thirtyDaysAgo)
        )
      );

    const averageEngagement = assignedCount.count > 0
      ? (submissionCount.count / (assignedCount.count * studentIds.length)) * 100
      : 0;

    // Attendance
    const [attendanceData] = await db
      .select({
        present: count(sql`CASE WHEN ${attendance.status} = 'present' THEN 1 END`),
        total: count(),
      })
      .from(attendance)
      .where(
        and(
          eq(attendance.classId, classId),
          gte(attendance.date, thirtyDaysAgo.toISOString().split("T")[0])
        )
      );

    const attendanceRate = attendanceData.total > 0
      ? (attendanceData.present / attendanceData.total) * 100
      : 0;

    // Overall health
    const healthScore = (averagePerformance + averageEngagement + attendanceRate) / 3;

    let overallHealth: "excellent" | "good" | "concerning" | "critical";
    if (healthScore >= 80) overallHealth = "excellent";
    else if (healthScore >= 65) overallHealth = "good";
    else if (healthScore >= 50) overallHealth = "concerning";
    else overallHealth = "critical";

    return {
      averageEngagement: Math.round(averageEngagement),
      averagePerformance: Math.round(averagePerformance),
      attendanceRate: Math.round(attendanceRate),
      overallHealth,
    };
  }

  /**
   * Generate parent meeting preparation data for a specific student
   */
  async generateParentMeetingPrep(studentId: string): Promise<ParentMeetingPrep> {
    const [student] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.id, studentId))
      .limit(1);

    if (!student) {
      throw new Error("Student not found");
    }

    const strengths: string[] = [];
    const concerns: string[] = [];
    const talkingPoints: string[] = [];
    const recommendedActions: string[] = [];
    const dataToShow: Array<{
      label: string;
      value: string | number;
      trend?: "improving" | "stable" | "declining";
    }> = [];

    // Get homework performance
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const submissions = await db
      .select({
        score: homeworkSubmissions.score,
        totalPoints: homework.totalPoints,
        submittedAt: homeworkSubmissions.submittedAt,
        isLate: homeworkSubmissions.isLate,
      })
      .from(homeworkSubmissions)
      .where(
        and(
          eq(homeworkSubmissions.studentId, studentId),
          gte(homeworkSubmissions.submittedAt, thirtyDaysAgo)
        )
      )
      .orderBy(desc(homeworkSubmissions.submittedAt));

    if (submissions.length > 0) {
      const scores = submissions.map(s =>
        s.totalPoints > 0 ? (s.score / s.totalPoints) * 100 : 0
      );
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

      dataToShow.push({
        label: "Average Score",
        value: `${Math.round(avgScore)}%`,
        trend: scores[0] > scores[scores.length - 1] ? "improving" : "stable",
      });

      if (avgScore >= 75) {
        strengths.push("Strong academic performance");
        talkingPoints.push("Student is performing well in assessments");
      } else if (avgScore < 50) {
        concerns.push("Academic performance needs improvement");
        talkingPoints.push("Discuss support options for academic improvement");
        recommendedActions.push("Consider after-school tutoring");
      }

      // Check late submissions
      const lateCount = submissions.filter(s => s.isLate).length;
      if (lateCount > submissions.length * 0.3) {
        concerns.push("Frequent late homework submissions");
        talkingPoints.push("Discuss time management strategies");
        recommendedActions.push("Create homework schedule with student");
      }
    }

    // Get attendance
    const [attendanceData] = await db
      .select({
        present: count(sql`CASE WHEN ${attendance.status} = 'present' THEN 1 END`),
        total: count(),
      })
      .from(attendance)
      .where(
        and(
          eq(attendance.studentId, studentId),
          gte(attendance.date, thirtyDaysAgo.toISOString().split("T")[0])
        )
      );

    if (attendanceData.total > 0) {
      const attendanceRate = (attendanceData.present / attendanceData.total) * 100;

      dataToShow.push({
        label: "Attendance Rate",
        value: `${Math.round(attendanceRate)}%`,
        trend: "stable",
      });

      if (attendanceRate >= 90) {
        strengths.push("Excellent attendance record");
      } else if (attendanceRate < 75) {
        concerns.push("Attendance needs improvement");
        talkingPoints.push("Address attendance concerns");
        recommendedActions.push("Discuss barriers to attendance");
      }
    }

    // Get skills
    const skills = await db
      .select({
        skillName: studentSkills.skillName,
        level: studentSkills.level,
      })
      .from(studentSkills)
      .where(eq(studentSkills.userId, studentId))
      .limit(5);

    if (skills.length > 0) {
      const topSkills = skills.slice(0, 3).map(s => s.skillName);
      talkingPoints.push(`Student has demonstrated: ${topSkills.join(", ")}`);
    }

    // Check for risk factors
    const riskAnalysis = await earlyWarningSystem.analyzeStudent(studentId);
    if (riskAnalysis && riskAnalysis.riskLevel !== "none") {
      concerns.push(...riskAnalysis.riskFactors.map(f => f.description));
      recommendedActions.push(...riskAnalysis.recommendedActions);
    }

    return {
      student: {
        id: student.id,
        name: student.name,
      },
      strengths,
      concerns,
      talkingPoints,
      recommendedActions,
      dataToShow,
    };
  }

  /**
   * Calculate variance of an array of numbers
   */
  private calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    return numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const aiInsightsGenerator = new AIInsightsGenerator();
