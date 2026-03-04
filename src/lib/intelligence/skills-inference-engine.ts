/**
 * SKILLS INFERENCE ENGINE
 *
 * Analyzes student data from multiple sources to infer skills:
 * - Homework submissions (academic skills, time management)
 * - Attendance records (reliability, punctuality)
 * - Journal entries (writing, self-reflection, emotional intelligence)
 * - Student portfolios (project-specific skills, achievements)
 * - Assessment results (RIASEC → skill categories)
 *
 * Uses AI (Gemini) for journal analysis and rule-based logic for other sources.
 *
 * Event-triggered: runs when new data is added (homework graded, journal entry, etc.)
 */

import { db } from "@/lib/db";
import {
  users,
  homeworkSubmissions,
  homework,
  attendance,
  studentPortfolios,
  riasecResults,
  mbtiResults,
  studentProgressAnalytics,
  studentSkills,
} from "@/lib/db/schema";
import { eq, desc, avg, count, gte, sql, and, lte } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { nanoid } from "nanoid";

// Re-use existing AI helpers
import { generateEntryFeedback } from "@/lib/ai/journal-helpers";

// ============================================================================
// TYPES
// ============================================================================

export interface InferredSkill {
  id: string;
  name: string;
  category: SkillCategory;
  level: SkillLevel;
  confidence: number; // 0-100
  source: SkillSource;
  evidence: Record<string, unknown>;
  isInferred: true;
  userId: string;
  createdAt: Date;
}

export type SkillCategory =
  | "academic"
  | "soft"
  | "technical"
  | "creative"
  | "service"
  | "vocational"
  | "other";

export type SkillLevel = "beginner" | "intermediate" | "advanced" | "expert";

export type SkillSource =
  | "homework"
  | "attendance"
  | "journal"
  | "portfolio"
  | "assessment"
  | "self_report"
  | "teacher_assigned";

interface SkillAnalysisResult {
  skills: InferredSkill[];
  summary: {
    totalSkills: number;
    byCategory: Record<string, number>;
    averageConfidence: number;
  };
  lastAnalyzed: Date;
}

interface HomeworkSkillData {
  subject: string;
  avgScore: number;
  totalAssignments: number;
  onTimeRate: number;
}

// ============================================================================
// SKILLS INFERENCE ENGINE
// ============================================================================

class SkillsInferenceEngine {
  private static instance: SkillsInferenceEngine;

  private constructor() {}

  static getInstance(): SkillsInferenceEngine {
    if (!SkillsInferenceEngine.instance) {
      SkillsInferenceEngine.instance = new SkillsInferenceEngine();
    }
    return SkillsInferenceEngine.instance;
  }

  /**
   * Main entry point - infer all skills for a student
   */
  async inferSkills(userId: string): Promise<SkillAnalysisResult> {
    const startTime = Date.now();
    logger.info("Skills inference started", { userId });

    try {
      // Run all analyses in parallel for speed
      const [
        homeworkSkills,
        attendanceSkills,
        journalSkills,
        portfolioSkills,
        assessmentSkills,
      ] = await Promise.all([
        this.analyzeHomework(userId),
        this.analyzeAttendance(userId),
        this.analyzeJournals(userId),
        this.analyzePortfolios(userId),
        this.analyzeAssessments(userId),
      ]);

      // Combine all skills
      const allSkills = [
        ...homeworkSkills,
        ...attendanceSkills,
        ...journalSkills,
        ...portfolioSkills,
        ...assessmentSkills,
      ];

      // Remove duplicates (keep highest confidence)
      const uniqueSkills = this.deduplicateSkills(allSkills);

      // Save to database
      await this.saveInferredSkills(userId, uniqueSkills);

      // Update student progress analytics
      await this.updateProgressAnalytics(userId, uniqueSkills);

      const summary = {
        totalSkills: uniqueSkills.length,
        byCategory: this.categorizeSkills(uniqueSkills),
        averageConfidence: Math.round(
          uniqueSkills.reduce((sum, s) => sum + s.confidence, 0) / uniqueSkills.length
        ),
      };

      logger.info("Skills inference completed", {
        userId,
        duration: Date.now() - startTime,
        skillCount: uniqueSkills.length,
      });

      return {
        skills: uniqueSkills,
        summary,
        lastAnalyzed: new Date(),
      };
    } catch (error) {
      logger.error("Skills inference failed", { userId, error });
      throw error;
    }
  }

  /**
   * Analyze homework submissions for skills
   * - Academic skills per subject
   * - Time management (on-time submission rate)
   * - Consistency (assignment completion rate)
   */
  private async analyzeHomework(userId: string): Promise<InferredSkill[]> {
    const skills: InferredSkill[] = [];

    try {
      // Get homework data grouped by subject
      const homeworkData = await db
        .select({
          homeworkId: homeworkSubmissions.homeworkId,
          score: homeworkSubmissions.score,
          submittedAt: homeworkSubmissions.submittedAt,
          isLate: homeworkSubmissions.isLate,
        })
        .from(homeworkSubmissions)
        .innerJoin(homework, eq(homeworkSubmissions.homeworkId, homework.id))
        .where(eq(homeworkSubmissions.studentId, userId))
        .orderBy(desc(homeworkSubmissions.submittedAt));

      if (homeworkData.length === 0) {
        return skills;
      }

      // Group by subject (from homework title/content)
      const subjectGroups = new Map<string, HomeworkSkillData>();

      for (const submission of homeworkData) {
        // Extract subject from homework - this is a simplified approach
        // In production, homework table should have a subject field
        const subject = this.extractSubjectFromHomework(submission.homeworkId);

        if (!subjectGroups.has(subject)) {
          subjectGroups.set(subject, {
            subject,
            avgScore: 0,
            totalAssignments: 0,
            onTimeRate: 0,
          });
        }

        const group = subjectGroups.get(subject)!;
        group.totalAssignments++;
        group.avgScore = (group.avgScore * (group.totalAssignments - 1) + submission.score) / group.totalAssignments;

        if (!submission.isLate) {
          const onTimeCount = Math.round(group.onTimeRate * (group.totalAssignments - 1) / 100) + 1;
          group.onTimeRate = (onTimeCount / group.totalAssignments) * 100;
        }
      }

      // Generate skills from homework data
      for (const [subject, data] of subjectGroups) {
        // Academic skill for the subject
        skills.push(this.createSkill({
          name: this.formatSkillName(subject),
          category: this.categorizeSubject(subject),
          level: this.calculateLevel(data.avgScore),
          confidence: Math.min(95, 60 + data.totalAssignments * 2), // More assignments = higher confidence
          source: "homework",
          evidence: {
            avgScore: data.avgScore,
            totalAssignments: data.totalAssignments,
            onTimeRate: data.onTimeRate,
          },
          userId,
        }));
      }

      // Time management skill (based on on-time rate)
      const avgOnTimeRate = Array.from(subjectGroups.values()).reduce(
        (sum, g) => sum + g.onTimeRate, 0
      ) / subjectGroups.size;

      if (avgOnTimeRate >= 80) {
        skills.push(this.createSkill({
          name: "Time Management",
          category: "soft",
          level: avgOnTimeRate >= 90 ? "advanced" : "intermediate",
          confidence: Math.round(avgOnTimeRate),
          source: "homework",
          evidence: { onTimeRate: avgOnTimeRate },
          userId,
        }));
      }

    } catch (error) {
      logger.error("Homework analysis failed", { userId, error });
    }

    return skills;
  }

  /**
   * Analyze attendance for soft skills
   * - Punctuality (based on attendance rate)
   * - Reliability (consistency)
   */
  private async analyzeAttendance(userId: string): Promise<InferredSkill[]> {
    const skills: InferredSkill[] = [];

    try {
      // Get attendance data
      const attendanceData = await db
        .select({
          status: attendance.status,
          date: attendance.date,
        })
        .from(attendance)
        .where(eq(attendance.studentId, userId))
        .orderBy(desc(attendance.date))
        .limit(100); // Last 100 days

      if (attendanceData.length === 0) {
        return skills;
      }

      // Calculate attendance rate
      const presentCount = attendanceData.filter(
        (a) => a.status === "present"
      ).length;
      const attendanceRate = (presentCount / attendanceData.length) * 100;

      // Punctuality/Reliability skill
      if (attendanceRate >= 90) {
        skills.push(this.createSkill({
          name: "Punctuality",
          category: "soft",
          level: "advanced",
          confidence: Math.round(attendanceRate),
          source: "attendance",
          evidence: { attendanceRate, totalDays: attendanceData.length },
          userId,
        }));

        skills.push(this.createSkill({
          name: "Reliability",
          category: "soft",
          level: "advanced",
          confidence: Math.round(attendanceRate),
          source: "attendance",
          evidence: { attendanceRate, totalDays: attendanceData.length },
          userId,
        }));
      } else if (attendanceRate >= 75) {
        skills.push(this.createSkill({
          name: "Punctuality",
          category: "soft",
          level: "intermediate",
          confidence: Math.round(attendanceRate),
          source: "attendance",
          evidence: { attendanceRate, totalDays: attendanceData.length },
          userId,
        }));
      }

    } catch (error) {
      logger.error("Attendance analysis failed", { userId, error });
    }

    return skills;
  }

  /**
   * Analyze journal entries using AI
   * - Writing ability
   * - Self-reflection
   * - Communication
   * - Emotional intelligence
   */
  private async analyzeJournals(userId: string): Promise<InferredSkill[]> {
    const skills: InferredSkill[] = [];

    try {
      // Get user's journal entries from settings
      const [user] = await db
        .select({ settings: users.settings })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const settings = (user?.settings as { journalEntries?: unknown[] }) || {};
      const journalEntries = (settings.journalEntries as unknown[]) || [];

      const entryCount = journalEntries.length;
      if (entryCount === 0) {
        return skills;
      }

      // Analyze journal metrics
      const totalWords: number = Array.from(journalEntries).reduce((sum: number, entry: unknown) => {
        const e = entry as { content?: string };
        const wordCount = (e.content?.split(/\s+/).length || 0) as number;
        return (sum as number) + wordCount;
      }, 0) as number;

      const avgWordsPerEntry: number = (totalWords as number) / entryCount;
      const avgEntryLength = avgWordsPerEntry;

      // Writing skill based on journal length and consistency
      if (avgEntryLength >= 100) {
        skills.push(this.createSkill({
          name: "Writing",
          category: "creative",
          level: avgEntryLength >= 200 ? "advanced" : "intermediate",
          confidence: Math.min(85, 50 + entryCount * 5),
          source: "journal",
          evidence: {
            avgWordsPerEntry: Math.round(avgEntryLength),
            totalEntries: entryCount,
          },
          userId,
        }));
      }

      // Self-reflection skill (from consistent journaling)
      if (entryCount >= 5) {
        skills.push(this.createSkill({
          name: "Self-Reflection",
          category: "soft",
          level: "intermediate",
          confidence: Math.min(80, 40 + entryCount * 5),
          source: "journal",
          evidence: { totalEntries: entryCount, consistent: true },
          userId,
        }));
      }

      // AI-based analysis (use existing AI helper)
      try {
        // Get the most recent journal entry for AI analysis
        const latestEntry = journalEntries[entryCount - 1] as {
          title?: string;
          content?: string;
          mood?: string;
        };

        if (latestEntry?.content && latestEntry.content.length > 50) {
          const aiFeedback = await generateEntryFeedback({
            title: latestEntry.title || "Journal",
            content: latestEntry.content,
            mood: latestEntry.mood || "neutral",
          });

          // Parse AI feedback for skill indicators
          // This is simplified - in production, use structured AI response
          if (aiFeedback && aiFeedback.length > 50) {
            // Look for positive indicators
            const feedbackLower = aiFeedback.toLowerCase();

            if (feedbackLower.includes("expressive") || feedbackLower.includes("articulate")) {
              skills.push(this.createSkill({
                name: "Communication",
                category: "soft",
                level: "intermediate",
                confidence: 70,
                source: "journal",
                evidence: { aiFeedback },
                userId,
              }));
            }

            if (feedbackLower.includes("insightful") || feedbackLower.includes("reflective")) {
              skills.push(this.createSkill({
                name: "Critical Thinking",
                category: "academic",
                level: "intermediate",
                confidence: 70,
                source: "journal",
                evidence: { aiFeedback },
                userId,
              }));
            }
          }
        }
      } catch (aiError) {
        logger.warn("AI journal analysis failed, using rule-based", { userId, error: aiError });
      }

    } catch (error) {
      logger.error("Journal analysis failed", { userId, error });
    }

    return skills;
  }

  /**
   * Analyze student portfolios
   * - Project-specific skills
   * - Achievements
   * - Certifications
   */
  private async analyzePortfolios(userId: string): Promise<InferredSkill[]> {
    const skills: InferredSkill[] = [];

    try {
      const portfolios = await db
        .select()
        .from(studentPortfolios)
        .where(
          and(
            eq(studentPortfolios.studentId, userId),
            eq(studentPortfolios.status, "published")
          )
        )
        .orderBy(desc(studentPortfolios.date));

      for (const portfolio of portfolios) {
        // Extract skills based on portfolio category and tags
        const portfolioSkills = this.extractSkillsFromPortfolio(portfolio);
        skills.push(...portfolioSkills);
      }

    } catch (error) {
      logger.error("Portfolio analysis failed", { userId, error });
    }

    return skills;
  }

  /**
   * Analyze assessment results (RIASEC, MBTI)
   * - Map personality types to skill categories
   */
  private async analyzeAssessments(userId: string): Promise<InferredSkill[]> {
    const skills: InferredSkill[] = [];

    try {
      // Get RIASEC results
      const [riasecResult] = await db
        .select()
        .from(riasecResults)
        .where(eq(riasecResults.userId, userId))
        .orderBy(desc(riasecResults.completedAt))
        .limit(1);

      if (riasecResult?.scores) {
        const scores = riasecResult.scores as Record<string, number>;

        // Map RIASEC to skills
        const skillMappings: Record<string, { name: string; category: SkillCategory }[]> = {
          realistic: [
            { name: "Carpentry", category: "vocational" },
            { name: "Painting", category: "creative" },
            { name: "Auto Mechanics", category: "technical" },
            { name: "Practical Problem Solving", category: "soft" },
          ],
          investigative: [
            { name: "Research", category: "academic" },
            { name: "Data Analysis", category: "technical" },
            { name: "Scientific Thinking", category: "academic" },
          ],
          artistic: [
            { name: "Design", category: "creative" },
            { name: "Writing", category: "creative" },
            { name: "Visual Arts", category: "creative" },
          ],
          social: [
            { name: "Teaching", category: "service" },
            { name: "Teamwork", category: "soft" },
            { name: "Communication", category: "soft" },
          ],
          enterprising: [
            { name: "Leadership", category: "soft" },
            { name: "Sales", category: "service" },
            { name: "Entrepreneurship", category: "soft" },
          ],
          conventional: [
            { name: "Data Entry", category: "technical" },
            { name: "Organization", category: "soft" },
            { name: "Accounting", category: "academic" },
          ],
        };

        // Find top 2 RIASEC traits
        const sortedTraits = Object.entries(scores)
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .slice(0, 2);

        for (const [trait, score] of sortedTraits) {
          const skillList = skillMappings[trait] || [];
          const traitScore = score as number;

          // Add top 2 skills for each dominant trait
          for (const skill of skillList.slice(0, 2)) {
            // Check if skill already exists
            if (!skills.some(s => s.name === skill.name)) {
              skills.push(this.createSkill({
                name: skill.name,
                category: skill.category,
                level: traitScore >= 70 ? "intermediate" : "beginner",
                confidence: Math.round(traitScore),
                source: "assessment",
                evidence: { riasecTrait: trait, traitScore },
                userId,
              }));
            }
          }
        }
      }

    } catch (error) {
      logger.error("Assessment analysis failed", { userId, error });
    }

    return skills;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private createSkill(params: {
    name: string;
    category: SkillCategory;
    level: SkillLevel;
    confidence: number;
    source: SkillSource;
    evidence: Record<string, unknown>;
    userId: string;
  }): InferredSkill {
    return {
      id: `skill_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      name: params.name,
      category: params.category,
      level: params.level,
      confidence: params.confidence,
      source: params.source,
      evidence: params.evidence,
      isInferred: true,
      userId: params.userId,
      createdAt: new Date(),
    };
  }

  private calculateLevel(score: number): SkillLevel {
    if (score >= 90) return "expert";
    if (score >= 75) return "advanced";
    if (score >= 60) return "intermediate";
    return "beginner";
  }

  private formatSkillName(subject: string): string {
    // Format subject as a skill name
    const subjectMap: Record<string, string> = {
      math: "Mathematics",
      mathematics: "Mathematics",
      english: "English Language",
      dzongkha: "Dzongkha Language",
      science: "Science",
      physics: "Physics",
      chemistry: "Chemistry",
      biology: "Biology",
      computer: "Information Technology",
      ict: "Information Technology",
      history: "History",
      geography: "Geography",
      economics: "Economics",
      business: "Business Studies",
      accounting: "Accounting",
      art: "Art",
      music: "Music",
      physical: "Physical Education",
      sports: "Sports",
    };

    const lowerSubject = subject.toLowerCase();
    return subjectMap[lowerSubject] || subject.charAt(0).toUpperCase() + subject.slice(1);
  }

  private categorizeSubject(subject: string): SkillCategory {
    const lowerSubject = subject.toLowerCase();

    if (["math", "physics", "chemistry", "biology", "science", "economics", "accounting"].includes(lowerSubject)) {
      return "academic";
    }
    if (["computer", "ict", "programming"].includes(lowerSubject)) {
      return "technical";
    }
    if (["art", "music", "design"].includes(lowerSubject)) {
      return "creative";
    }
    if (["physical", "sports"].includes(lowerSubject)) {
      return "other";
    }

    return "academic";
  }

  private extractSubjectFromHomework(homeworkId: string): string {
    // Simplified subject extraction
    // In production, homework table should have a subject field
    const parts = homeworkId.split(/[_-]/);
    // Look for common subject abbreviations
    for (const part of parts) {
      const lower = part.toLowerCase();
      if (["math", "eng", "sci", "ict", "art", "music"].includes(lower)) {
        return part;
      }
    }
    return "general";
  }

  private extractSkillsFromPortfolio(portfolio: typeof studentPortfolios.$inferSelect): InferredSkill[] {
    const skills: InferredSkill[] = [];
    const { type, category, tags, title } = portfolio;

    // Extract tags
    const portfolioTags = (tags as unknown[]) || [];

    // Type-based skills
    const typeSkills: Record<string, string[]> = {
      sports: ["Athletics", "Teamwork", "Discipline"],
      arts: ["Art", "Creativity", "Design"],
      leadership: ["Leadership", "Communication", "Organization"],
      academic: ["Research", "Academic Writing", "Presentation"],
      community: ["Volunteering", "Community Service", "Teamwork"],
      other: [],
    };

    const skillList = typeSkills[type] || [];

    for (const skillName of skillList) {
      skills.push(this.createSkill({
        name: skillName,
        category: this.categorizeSkill(skillName),
        level: "intermediate",
        confidence: 85,
        source: "portfolio",
        evidence: { portfolioId: portfolio.id, title, type },
        userId: portfolio.studentId,
      }));
    }

    // Tag-based skills
    for (const tag of portfolioTags) {
      const tagStr = String(tag);
      if (tagStr.length > 2 && tagStr.length < 30 && /^[a-zA-Z\s]+$/.test(tagStr)) {
        skills.push(this.createSkill({
          name: tagStr.charAt(0).toUpperCase() + tagStr.slice(1),
          category: this.categorizeSkill(tagStr),
          level: "intermediate",
          confidence: 75,
          source: "portfolio",
          evidence: { portfolioId: portfolio.id, title, tag: tagStr },
          userId: portfolio.studentId,
        }));
      }
    }

    return skills;
  }

  private categorizeSkill(skillName: string): SkillCategory {
    const lower = skillName.toLowerCase();

    if (["mathematics", "physics", "chemistry", "biology", "research", "writing", "accounting"].some(s => lower.includes(s))) {
      return "academic";
    }
    if (["programming", "computer", "data", "technical", "ict"].some(s => lower.includes(s))) {
      return "technical";
    }
    if (["art", "design", "music", "creative", "photography", "video"].some(s => lower.includes(s))) {
      return "creative";
    }
    if (["teaching", "customer service", "caregiving", "volunteering"].some(s => lower.includes(s))) {
      return "service";
    }
    if (["carpentry", "painting", "plumbing", "welding", "mechanic"].some(s => lower.includes(s))) {
      return "vocational";
    }
    if (["leadership", "communication", "teamwork", "punctuality", "reliability", "time management"].some(s => lower.includes(s))) {
      return "soft";
    }

    return "other";
  }

  private deduplicateSkills(skills: InferredSkill[]): InferredSkill[] {
    const skillMap = new Map<string, InferredSkill>();

    for (const skill of skills) {
      const key = `${skill.name.toLowerCase()}_${skill.category}`;
      const existing = skillMap.get(key);

      if (!existing || skill.confidence > existing.confidence) {
        skillMap.set(key, skill);
      }
    }

    return Array.from(skillMap.values());
  }

  private categorizeSkills(skills: InferredSkill[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const skill of skills) {
      counts[skill.category] = (counts[skill.category] || 0) + 1;
    }
    return counts;
  }

  /**
   * Save inferred skills to database
   */
  private async saveInferredSkills(userId: string, skills: InferredSkill[]): Promise<void> {
    try {
      // Delete old inferred skills for this user
      await db
        .delete(studentSkills)
        .where(
          and(
            eq(studentSkills.userId, userId),
            eq(studentSkills.isInferred, true)
          )
        );

      // Insert new skills
      if (skills.length > 0) {
        await db.insert(studentSkills).values(
          skills.map(skill => ({
            id: skill.id,
            userId: skill.userId,
            skillName: skill.name,
            category: skill.category,
            level: skill.level,
            source: skill.source,
            evidence: skill.evidence,
            confidence: skill.confidence,
            isInferred: true,
            status: "approved", // Inferred skills are auto-approved
            createdAt: skill.createdAt,
            updatedAt: new Date(),
          }))
        );
      }

      logger.info("Saved inferred skills", { userId, count: skills.length });
    } catch (error) {
      logger.error("Failed to save inferred skills", { userId, error });
      throw error;
    }
  }

  /**
   * Update student progress analytics with skills data
   */
  private async updateProgressAnalytics(userId: string, skills: InferredSkill[]): Promise<void> {
    try {
      const [existing] = await db
        .select()
        .from(studentProgressAnalytics)
        .where(eq(studentProgressAnalytics.userId, userId))
        .limit(1);

      const skillsData = skills.map(s => ({
        name: s.name,
        category: s.category,
        level: s.level,
        confidence: s.confidence,
      }));

      if (existing) {
        await db
          .update(studentProgressAnalytics)
          .set({
            skillsIdentified: skillsData,
            skillsLastUpdated: new Date(),
            lastUpdated: new Date(),
          })
          .where(eq(studentProgressAnalytics.userId, userId));
      } else {
        await db.insert(studentProgressAnalytics).values({
          id: nanoid(),
          userId,
          skillsIdentified: skillsData,
          skillsLastUpdated: new Date(),
          lastUpdated: new Date(),
          createdAt: new Date(),
        });
      }
    } catch (error) {
      logger.error("Failed to update progress analytics", { userId, error });
    }
  }

  /**
   * Get skills for a student (inferred + self-reported)
   */
  async getStudentSkills(userId: string): Promise<InferredSkill[]> {
    const skills = await db
      .select()
      .from(studentSkills)
      .where(
        and(
          eq(studentSkills.userId, userId),
          eq(studentSkills.status, "approved")
        )
      )
      .orderBy(desc(studentSkills.confidence));

    return skills.map(s => ({
      id: s.id,
      name: s.skillName,
      category: s.category as SkillCategory,
      level: s.level as SkillLevel,
      confidence: s.confidence,
      source: s.source as SkillSource,
      evidence: (s.evidence as Record<string, unknown>) || {},
      isInferred: true as const, // All skills retrieved from DB are treated as inferred for this context
      userId: s.userId,
      createdAt: s.createdAt,
    }));
  }

  /**
   * Add self-reported skill (student initiated)
   */
  async addSelfReportedSkill(
    userId: string,
    skillData: {
      name: string;
      category: SkillCategory;
      level: SkillLevel;
      evidence?: Record<string, unknown>;
    }
  ): Promise<void> {
    await db.insert(studentSkills).values({
      id: nanoid(),
      userId,
      skillName: skillData.name,
      category: skillData.category,
      level: skillData.level,
      source: "self_report",
      evidence: skillData.evidence || {},
      confidence: 50, // Self-reported skills start at 50% confidence
      isInferred: false,
      status: "pending", // Needs teacher validation
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    logger.info("Self-reported skill added", { userId, skill: skillData.name });
  }

  /**
   * Validate a student's self-reported skill (teacher action)
   */
  async validateSkill(
    skillId: string,
    teacherId: string,
    approved: boolean
  ): Promise<void> {
    await db
      .update(studentSkills)
      .set({
        status: approved ? "approved" : "rejected",
        validatedBy: teacherId,
        validatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(studentSkills.id, skillId));

    logger.info("Skill validated", { skillId, teacherId, approved });
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const skillsInferenceEngine = SkillsInferenceEngine.getInstance();

/**
 * Trigger skill inference for a student
 */
export async function inferSkillsForStudent(userId: string): Promise<SkillAnalysisResult> {
  return await skillsInferenceEngine.inferSkills(userId);
}

/**
 * Get a student's skills
 */
export async function getStudentSkills(userId: string): Promise<InferredSkill[]> {
  return await skillsInferenceEngine.getStudentSkills(userId);
}

/**
 * Add a self-reported skill
 */
export async function addSelfReportedSkill(
  userId: string,
  skillData: {
    name: string;
    category: SkillCategory;
    level: SkillLevel;
    evidence?: Record<string, unknown>;
  }
): Promise<void> {
  return await skillsInferenceEngine.addSelfReportedSkill(userId, skillData);
}

/**
 * Validate a student's self-reported skill
 */
export async function validateSkill(
  skillId: string,
  teacherId: string,
  approved: boolean
): Promise<void> {
  return await skillsInferenceEngine.validateSkill(skillId, teacherId, approved);
}
