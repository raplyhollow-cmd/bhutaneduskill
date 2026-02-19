/**
 * Assessment Repository
 * Standardized data access layer for assessment operations
 */

import { db } from "@/lib/db";
import {
  assessments,
  assessmentResults,
  assessmentSubmissions,
  type Assessment,
  type AssessmentResult,
} from "@/lib/db/schema";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { nanoid } from "nanoid";

// ============================================================================
// TYPES
// ============================================================================

export type CreateAssessmentInput = Omit<Assessment, "id" | "createdAt" | "updatedAt">;
export type UpdateAssessmentInput = Partial<Omit<Assessment, "id" | "createdAt" | "updatedAt">>;
export type CreateAssessmentResultInput = Omit<AssessmentResult, "id" | "createdAt" | "updatedAt">;

export type AssessmentFilter = {
  userId?: string;
  classId?: string;
  type?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
};

// ============================================================================
// REPOSITORY
// ============================================================================

export const AssessmentRepository = {
  /**
   * Find assessment by ID
   */
  async findById(id: string): Promise<Assessment | null> {
    try {
      const [assessment] = await db
        .select()
        .from(assessments)
        .where(eq(assessments.id, id))
        .limit(1);

      return assessment || null;
    } catch (error) {
      logger.error(error, { context: "AssessmentRepository.findById", id });
      return null;
    }
  },

  /**
   * Find all assessments for a specific student
   */
  async findByStudentId(studentId: string): Promise<Assessment[]> {
    try {
      const results = await db
        .select()
        .from(assessments)
        .where(eq(assessments.userId, studentId))
        .orderBy(desc(assessments.createdAt));

      return results;
    } catch (error) {
      logger.error(error, { context: "AssessmentRepository.findByStudentId", studentId });
      return [];
    }
  },

  /**
   * Find assessments for a student by type
   */
  async findByStudentAndType(studentId: string, type: string): Promise<Assessment[]> {
    try {
      const results = await db
        .select()
        .from(assessments)
        .where(and(eq(assessments.userId, studentId), eq(assessments.type, type)))
        .orderBy(desc(assessments.createdAt));

      return results;
    } catch (error) {
      logger.error(error, { context: "AssessmentRepository.findByStudentAndType", studentId, type });
      return [];
    }
  },

  /**
   * Find assessments by class
   */
  async findByClassId(classId: string): Promise<Assessment[]> {
    try {
      const results = await db
        .select()
        .from(assessments)
        .where(eq(assessments.classId, classId))
        .orderBy(desc(assessments.createdAt));

      return results;
    } catch (error) {
      logger.error(error, { context: "AssessmentRepository.findByClassId", classId });
      return [];
    }
  },

  /**
   * Find assessments with filters
   */
  async findAll(filters: AssessmentFilter = {}): Promise<Assessment[]> {
    try {
      const conditions: Array<ReturnType<typeof eq | typeof and>> = [];

      if (filters.userId) {
        conditions.push(eq(assessments.userId, filters.userId));
      }

      if (filters.classId) {
        conditions.push(eq(assessments.classId, filters.classId));
      }

      if (filters.type) {
        conditions.push(eq(assessments.type, filters.type));
      }

      if (filters.status) {
        conditions.push(eq(assessments.status, filters.status));
      }

      if (filters.startDate) {
        conditions.push(gte(assessments.createdAt, filters.startDate));
      }

      if (filters.endDate) {
        conditions.push(lte(assessments.createdAt, filters.endDate));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const results = await db
        .select()
        .from(assessments)
        .where(whereClause)
        .orderBy(desc(assessments.createdAt));

      return results;
    } catch (error) {
      logger.error(error, { context: "AssessmentRepository.findAll", filters });
      return [];
    }
  },

  /**
   * Get assessment results for a student
   */
  async findResultsByStudentId(studentId: string): Promise<AssessmentResult[]> {
    try {
      const results = await db
        .select()
        .from(assessmentResults)
        .where(eq(assessmentResults.studentId, studentId))
        .orderBy(desc(assessmentResults.completedAt));

      return results;
    } catch (error) {
      logger.error(error, { context: "AssessmentRepository.findResultsByStudentId", studentId });
      return [];
    }
  },

  /**
   * Get latest assessment result for a student by type
   */
  async getLatestResult(studentId: string, type: string): Promise<AssessmentResult | null> {
    try {
      // First find the latest assessment of this type for the student
      const [latestAssessment] = await db
        .select()
        .from(assessments)
        .where(and(eq(assessments.userId, studentId), eq(assessments.type, type)))
        .orderBy(desc(assessments.completedAt))
        .limit(1);

      if (!latestAssessment?.id) {
        return null;
      }

      // Then get the result for this assessment
      const [result] = await db
        .select()
        .from(assessmentResults)
        .where(
          and(
            eq(assessmentResults.assessmentId, latestAssessment.id),
            eq(assessmentResults.studentId, studentId)
          )
        )
        .limit(1);

      return result || null;
    } catch (error) {
      logger.error(error, { context: "AssessmentRepository.getLatestResult", studentId, type });
      return null;
    }
  },

  /**
   * Save an assessment result
   */
  async saveResult(data: CreateAssessmentResultInput): Promise<AssessmentResult | null> {
    try {
      const id = `result-${nanoid()}`;
      const now = new Date();

      const [newResult] = await db
        .insert(assessmentResults)
        .values({
          ...data,
          id,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return newResult;
    } catch (error) {
      logger.error(error, { context: "AssessmentRepository.saveResult" });
      return null;
    }
  },

  /**
   * Create a new assessment
   */
  async create(data: CreateAssessmentInput): Promise<Assessment | null> {
    try {
      const id = `assessment-${nanoid()}`;
      const now = new Date();

      const [newAssessment] = await db
        .insert(assessments)
        .values({
          ...data,
          id,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return newAssessment;
    } catch (error) {
      logger.error(error, { context: "AssessmentRepository.create" });
      return null;
    }
  },

  /**
   * Update an existing assessment
   */
  async update(id: string, data: UpdateAssessmentInput): Promise<Assessment | null> {
    try {
      const [updatedAssessment] = await db
        .update(assessments)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(assessments.id, id))
        .returning();

      return updatedAssessment || null;
    } catch (error) {
      logger.error(error, { context: "AssessmentRepository.update", id });
      return null;
    }
  },

  /**
   * Delete an assessment
   */
  async delete(id: string): Promise<boolean> {
    try {
      const [result] = await db
        .delete(assessments)
        .where(eq(assessments.id, id))
        .returning();

      return !!result;
    } catch (error) {
      logger.error(error, { context: "AssessmentRepository.delete", id });
      return false;
    }
  },

  /**
   * Mark assessment as completed
   */
  async markCompleted(id: string): Promise<Assessment | null> {
    try {
      const [updatedAssessment] = await db
        .update(assessments)
        .set({
          status: "completed",
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(assessments.id, id))
        .returning();

      return updatedAssessment || null;
    } catch (error) {
      logger.error(error, { context: "AssessmentRepository.markCompleted", id });
      return null;
    }
  },

  /**
   * Start an assessment
   */
  async startAssessment(id: string): Promise<Assessment | null> {
    try {
      const [updatedAssessment] = await db
        .update(assessments)
        .set({
          status: "in_progress",
          startedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(assessments.id, id))
        .returning();

      return updatedAssessment || null;
    } catch (error) {
      logger.error(error, { context: "AssessmentRepository.startAssessment", id });
      return null;
    }
  },

  /**
   * Get assessment statistics for a student
   */
  async getStudentStats(studentId: string): Promise<{
    total: number;
    completed: number;
    inProgress: number;
    byType: Record<string, number>;
  }> {
    try {
      const studentAssessments = await this.findByStudentId(studentId);

      const stats = {
        total: studentAssessments.length,
        completed: 0,
        inProgress: 0,
        byType: {} as Record<string, number>,
      };

      for (const assessment of studentAssessments) {
        if (assessment.status === "completed") {
          stats.completed++;
        } else if (assessment.status === "in_progress") {
          stats.inProgress++;
        }

        if (assessment.type) {
          stats.byType[assessment.type] = (stats.byType[assessment.type] || 0) + 1;
        }
      }

      return stats;
    } catch (error) {
      logger.error(error, { context: "AssessmentRepository.getStudentStats", studentId });
      return { total: 0, completed: 0, inProgress: 0, byType: {} };
    }
  },

  /**
   * Get submissions for an assessment
   */
  async getSubmissions(assessmentId: string): Promise<typeof assessmentSubmissions.$inferSelect[]> {
    try {
      const results = await db
        .select()
        .from(assessmentSubmissions)
        .where(eq(assessmentSubmissions.assessmentId, assessmentId))
        .orderBy(desc(assessmentSubmissions.submittedAt));

      return results;
    } catch (error) {
      logger.error(error, { context: "AssessmentRepository.getSubmissions", assessmentId });
      return [];
    }
  },

  /**
   * Get submission by user for an assessment
   */
  async getSubmission(assessmentId: string, userId: string): Promise<typeof assessmentSubmissions.$inferSelect | null> {
    try {
      const [submission] = await db
        .select()
        .from(assessmentSubmissions)
        .where(
          and(
            eq(assessmentSubmissions.assessmentId, assessmentId),
            eq(assessmentSubmissions.userId, userId)
          )
        )
        .limit(1);

      return submission || null;
    } catch (error) {
      logger.error(error, { context: "AssessmentRepository.getSubmission", assessmentId, userId });
      return null;
    }
  },
};

export default AssessmentRepository;
