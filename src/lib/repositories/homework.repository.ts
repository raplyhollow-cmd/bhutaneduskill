/**
 * Homework Repository
 * Standardized data access layer for homework operations
 */

import { db } from "@/lib/db";
import {
  homework,
  homeworkSubmissions,
  classes,
  classSubjects,
  subjects,
  users,
  type Homework,
  type HomeworkSubmission,
} from "@/lib/db/schema";
import { eq, and, desc, sql, inArray, isNull } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { nanoid } from "nanoid";

// ============================================================================
// TYPES
// ============================================================================

export type CreateHomeworkInput = Omit<Homework, "id" | "createdAt" | "updatedAt">;
export type UpdateHomeworkInput = Partial<Omit<Homework, "id" | "createdAt" | "updatedAt">>;
export type CreateSubmissionInput = Omit<HomeworkSubmission, "id" | "createdAt" | "updatedAt">;

export type HomeworkFilter = {
  classId?: string;
  subjectId?: string;
  isPublished?: boolean;
  isActive?: boolean;
  dueBefore?: Date;
  dueAfter?: Date;
};

// ============================================================================
// REPOSITORY
// ============================================================================

export const HomeworkRepository = {
  /**
   * Find homework by ID
   */
  async findById(id: string): Promise<Homework | null> {
    try {
      const [hw] = await db
        .select()
        .from(homework)
        .where(eq(homework.id, id))
        .limit(1);

      return hw || null;
    } catch (error) {
      logger.error(error, { context: "HomeworkRepository.findById", id });
      return null;
    }
  },

  /**
   * Find homework for a student
   * Returns homework from all classes the student is enrolled in
   */
  async findByStudentId(studentId: string): Promise<Homework[]> {
    try {
      // First, get the student's classes
      const student = await db
        .select({
          classGrade: users.classGrade,
          section: users.section,
          schoolId: users.schoolId,
        })
        .from(users)
        .where(eq(users.id, studentId))
        .limit(1)
        .then(rows => rows[0] || null);

      if (!student) {
        return [];
      }

      // Get classes for this student's grade/section
      const studentClasses = await db
        .select()
        .from(classes)
        .where(
          and(
            eq(classes.schoolId, student.schoolId!),
            eq(classes.grade, student.classGrade!),
            student.section ? eq(classes.section, student.section) : undefined
          )
        );

      if (studentClasses.length === 0) {
        return [];
      }

      const classIds = studentClasses.map((c) => c.id);

      // Get homework for these classes
      const results = await db
        .select()
        .from(homework)
        .where(
          and(
            inArray(homework.classId, classIds),
            eq(homework.isPublished, true),
            eq(homework.isActive, true)
          )
        )
        .orderBy(desc(homework.dueDate));

      return results;
    } catch (error) {
      logger.error(error, { context: "HomeworkRepository.findByStudentId", studentId });
      return [];
    }
  },

  /**
   * Find homework created by a teacher
   * Returns homework for all classes taught by the teacher
   */
  async findByTeacherId(teacherId: string): Promise<Homework[]> {
    try {
      // Get class subjects where this teacher is assigned
      const teacherClasses = await db
        .select({
          classId: classSubjects.classId,
          subjectId: classSubjects.subjectId,
        })
        .from(classSubjects)
        .where(eq(classSubjects.teacherId, teacherId));

      if (teacherClasses.length === 0) {
        return [];
      }

      // Build conditions for each class-subject combination
      const conditions = teacherClasses.map((tc) =>
        and(
          eq(homework.classId, tc.classId),
          tc.subjectId ? eq(homework.subjectId, tc.subjectId) : undefined
        )
      );

      // Use OR to combine all conditions
      const results = await db
        .select()
        .from(homework)
        .where(
          and(
            sql`${conditions.map((c) => sql`(${c})`).join(" OR ")}`,
            eq(homework.isActive, true)
          )
        )
        .orderBy(desc(homework.createdAt));

      return results;
    } catch (error) {
      logger.error(error, { context: "HomeworkRepository.findByTeacherId", teacherId });
      return [];
    }
  },

  /**
   * Find homework by class ID
   */
  async findByClassId(classId: string): Promise<Homework[]> {
    try {
      const results = await db
        .select()
        .from(homework)
        .where(
          and(
            eq(homework.classId, classId),
            eq(homework.isPublished, true),
            eq(homework.isActive, true)
          )
        )
        .orderBy(desc(homework.dueDate));

      return results;
    } catch (error) {
      logger.error(error, { context: "HomeworkRepository.findByClassId", classId });
      return [];
    }
  },

  /**
   * Find all homework with filters
   */
  async findAll(filters: HomeworkFilter = {}): Promise<Homework[]> {
    try {
      const conditions: Array<ReturnType<typeof eq | typeof and>> = [];

      if (filters.classId) {
        conditions.push(eq(homework.classId, filters.classId));
      }

      if (filters.subjectId) {
        conditions.push(eq(homework.subjectId, filters.subjectId));
      }

      if (filters.isPublished !== undefined) {
        conditions.push(eq(homework.isPublished, filters.isPublished));
      }

      if (filters.isActive !== undefined) {
        conditions.push(eq(homework.isActive, filters.isActive));
      }

      if (filters.dueBefore) {
        conditions.push(sql`${homework.dueDate} <= ${filters.dueBefore.toISOString()}`);
      }

      if (filters.dueAfter) {
        conditions.push(sql`${homework.dueDate} >= ${filters.dueAfter.toISOString()}`);
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const results = await db
        .select()
        .from(homework)
        .where(whereClause)
        .orderBy(desc(homework.createdAt));

      return results;
    } catch (error) {
      logger.error(error, { context: "HomeworkRepository.findAll", filters });
      return [];
    }
  },

  /**
   * Get all submissions for a homework
   */
  async getSubmissions(homeworkId: string): Promise<HomeworkSubmission[]> {
    try {
      const results = await db
        .select()
        .from(homeworkSubmissions)
        .where(eq(homeworkSubmissions.homeworkId, homeworkId))
        .orderBy(desc(homeworkSubmissions.submittedAt));

      return results;
    } catch (error) {
      logger.error(error, { context: "HomeworkRepository.getSubmissions", homeworkId });
      return [];
    }
  },

  /**
   * Get a student's submission for a homework
   */
  async getSubmission(homeworkId: string, studentId: string): Promise<HomeworkSubmission | null> {
    try {
      const [submission] = await db
        .select()
        .from(homeworkSubmissions)
        .where(
          and(
            eq(homeworkSubmissions.homeworkId, homeworkId),
            eq(homeworkSubmissions.studentId, studentId)
          )
        )
        .limit(1);

      return submission || null;
    } catch (error) {
      logger.error(error, { context: "HomeworkRepository.getSubmission", homeworkId, studentId });
      return null;
    }
  },

  /**
   * Get pending submissions for a teacher
   * Returns submissions that are submitted but not yet graded
   */
  async getPendingSubmissions(teacherId: string): Promise<(HomeworkSubmission & { homework: Homework })[]> {
    try {
      // Get homework assigned by this teacher
      const teacherHomework = await this.findByTeacherId(teacherId);

      if (teacherHomework.length === 0) {
        return [];
      }

      const homeworkIds = teacherHomework.map((hw) => hw.id);

      // Get submitted but not graded submissions
      const results = await db
        .select({
          id: homeworkSubmissions.id,
          homeworkId: homeworkSubmissions.homeworkId,
          studentId: homeworkSubmissions.studentId,
          submittedAt: homeworkSubmissions.submittedAt,
          content: homeworkSubmissions.content,
          gradedAt: homeworkSubmissions.gradedAt,
          score: homeworkSubmissions.score,
          feedback: homeworkSubmissions.feedback,
          status: homeworkSubmissions.status,
          isLate: homeworkSubmissions.isLate,
          createdAt: homeworkSubmissions.createdAt,
          updatedAt: homeworkSubmissions.updatedAt,
        })
        .from(homeworkSubmissions)
        .where(
          and(
            inArray(homeworkSubmissions.homeworkId, homeworkIds),
            eq(homeworkSubmissions.status, "submitted")
          )
        )
        .orderBy(desc(homeworkSubmissions.submittedAt));

      // Attach homework details
      const submissionsWithHomework = await Promise.all(
        results.map(async (submission) => {
          const hwDetails = await this.findById(submission.homeworkId);
          return {
            ...submission,
            homework: hwDetails!,
          };
        })
      );

      return submissionsWithHomework;
    } catch (error) {
      logger.error(error, { context: "HomeworkRepository.getPendingSubmissions", teacherId });
      return [];
    }
  },

  /**
   * Create new homework
   */
  async create(data: CreateHomeworkInput): Promise<Homework | null> {
    try {
      const id = `homework-${nanoid()}`;
      const now = new Date();

      const [newHomework] = await db
        .insert(homework)
        .values({
          ...data,
          id,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return newHomework;
    } catch (error) {
      logger.error(error, { context: "HomeworkRepository.create" });
      return null;
    }
  },

  /**
   * Update existing homework
   */
  async update(id: string, data: UpdateHomeworkInput): Promise<Homework | null> {
    try {
      const [updatedHomework] = await db
        .update(homework)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(homework.id, id))
        .returning();

      return updatedHomework || null;
    } catch (error) {
      logger.error(error, { context: "HomeworkRepository.update", id });
      return null;
    }
  },

  /**
   * Delete homework
   */
  async delete(id: string): Promise<boolean> {
    try {
      const [result] = await db
        .delete(homework)
        .where(eq(homework.id, id))
        .returning();

      return !!result;
    } catch (error) {
      logger.error(error, { context: "HomeworkRepository.delete", id });
      return false;
    }
  },

  /**
   * Submit homework
   */
  async submitHomework(data: CreateSubmissionInput): Promise<HomeworkSubmission | null> {
    try {
      const id = `submission-${nanoid()}`;
      const now = new Date();

      // Check if homework exists and get due date
      const hw = await this.findById(data.homeworkId);
      if (!hw) {
        return null;
      }

      const isLate = new Date() > new Date(hw.dueDate);

      const [newSubmission] = await db
        .insert(homeworkSubmissions)
        .values({
          ...data,
          id,
          submittedAt: now,
          gradedAt: now, // Default to submission time if not graded
          isLate,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return newSubmission;
    } catch (error) {
      logger.error(error, { context: "HomeworkRepository.submitHomework" });
      return null;
    }
  },

  /**
   * Grade a homework submission
   */
  async gradeSubmission(
    submissionId: string,
    score: number,
    feedback: string
  ): Promise<HomeworkSubmission | null> {
    try {
      const [updatedSubmission] = await db
        .update(homeworkSubmissions)
        .set({
          score,
          feedback,
          status: "graded",
          gradedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(homeworkSubmissions.id, submissionId))
        .returning();

      return updatedSubmission || null;
    } catch (error) {
      logger.error(error, { context: "HomeworkRepository.gradeSubmission", submissionId });
      return null;
    }
  },

  /**
   * Get overdue homework for a student
   */
  async getOverdueForStudent(studentId: string): Promise<Homework[]> {
    try {
      const allHomework = await this.findByStudentId(studentId);
      const now = new Date();

      // Filter homework that is past due date
      const overdue = allHomework.filter((hw) => new Date(hw.dueDate) < now);

      return overdue;
    } catch (error) {
      logger.error(error, { context: "HomeworkRepository.getOverdueForStudent", studentId });
      return [];
    }
  },

  /**
   * Get upcoming homework for a student (due within 7 days)
   */
  async getUpcomingForStudent(studentId: string): Promise<Homework[]> {
    try {
      const allHomework = await this.findByStudentId(studentId);
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Filter homework due within the next week
      const upcoming = allHomework.filter((hw) => {
        const dueDate = new Date(hw.dueDate);
        return dueDate >= now && dueDate <= weekFromNow;
      });

      return upcoming;
    } catch (error) {
      logger.error(error, { context: "HomeworkRepository.getUpcomingForStudent", studentId });
      return [];
    }
  },

  /**
   * Get homework submission statistics for a student
   */
  async getStudentSubmissionStats(studentId: string): Promise<{
    totalAssigned: number;
    submitted: number;
    graded: number;
    pending: number;
    overdue: number;
    averageScore: number;
  }> {
    try {
      const allHomework = await this.findByStudentId(studentId);
      const submissions = await db
        .select()
        .from(homeworkSubmissions)
        .where(eq(homeworkSubmissions.studentId, studentId));

      const now = new Date();
      const overdue = allHomework.filter((hw) => new Date(hw.dueDate) < now).length;

      const graded = submissions.filter((s) => s.status === "graded").length;
      const pending = submissions.filter((s) => s.status === "submitted").length;

      const totalScore = submissions.reduce((sum, s) => sum + (s.score || 0), 0);
      const averageScore = graded > 0 ? Math.round(totalScore / graded) : 0;

      return {
        totalAssigned: allHomework.length,
        submitted: submissions.length,
        graded,
        pending,
        overdue,
        averageScore,
      };
    } catch (error) {
      logger.error(error, { context: "HomeworkRepository.getStudentSubmissionStats", studentId });
      return {
        totalAssigned: 0,
        submitted: 0,
        graded: 0,
        pending: 0,
        overdue: 0,
        averageScore: 0,
      };
    }
  },
};

export default HomeworkRepository;
