/**
 * SERVER ACTIONS - ASSSSSMENT MANAGEMENT
 *
 * Server actions for assessment CRUD operations.
 * These are used by the Platform Admin assessments page.
 */

"use server";

import { db } from "@/lib/db";
import { assessmentTypes, assessments, assessmentSubmissions, assessmentResults, assessmentQuestions, users, classes } from "@/lib/db/schema";
import { eq, desc, and, like, sql, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-utils";

// ============================================================================
// ASSESSMENT TYPES ACTIONS
// ============================================================================

/**
 * Get all assessment types from the database
 */
export async function getAssessmentTypes(limit = 500) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const allTypes = await db
      .select()
      .from(assessmentTypes)
      .orderBy(desc(assessmentTypes.createdAt))
      .limit(limit);

    return allTypes.map((type) => ({
      ...type,
      isActive: !!type.isActive,
    }));
  } catch (error) {
    console.error("Failed to fetch assessment types:", error);
    throw new Error("Failed to fetch assessment types");
  }
}

/**
 * Get a single assessment type by ID
 */
export async function getAssessmentTypeById(id: string) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const assessmentType = await db.query.assessmentTypes.findFirst({
      where: eq(assessmentTypes.id, id),
    });

    if (!assessmentType) {
      throw new Error("Assessment type not found");
    }

    return {
      ...assessmentType,
      isActive: !!assessmentType.isActive,
    };
  } catch (error) {
    console.error("Failed to fetch assessment type:", error);
    throw new Error("Failed to fetch assessment type");
  }
}

/**
 * Create a new assessment type
 */
export async function createAssessmentType(data: {
  name: string;
  description: string;
  category?: string;
  targetAudience?: string;
  targetGrade?: number;
  duration?: number;
  totalQuestions?: number;
  passingScore?: number;
}) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const typeId = `at_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const now = new Date();

    // Generate slug from name
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const [newType] = await db
      .insert(assessmentTypes)
      .values({
        id: typeId,
        name: data.name,
        description: data.description,
        category: data.category || "aptitude",
        targetAudience: data.targetAudience || "all",
        targetGrade: data.targetGrade || null,
        duration: data.duration || 30,
        totalQuestions: data.totalQuestions || 10,
        passingScore: data.passingScore || 70,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    revalidatePath("/admin/assessments");

    return newType;
  } catch (error) {
    console.error("Failed to create assessment type:", error);
    throw new Error("Failed to create assessment type");
  }
}

/**
 * Update an existing assessment type
 */
export async function updateAssessmentType(
  id: string,
  data: {
    name?: string;
    description?: string;
    category?: string;
    targetAudience?: string;
    targetGrade?: number;
    duration?: number;
    totalQuestions?: number;
    passingScore?: number;
    isActive?: boolean;
  }
) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.targetAudience !== undefined) updateData.targetAudience = data.targetAudience;
    if (data.targetGrade !== undefined) updateData.targetGrade = data.targetGrade;
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.totalQuestions !== undefined) updateData.totalQuestions = data.totalQuestions;
    if (data.passingScore !== undefined) updateData.passingScore = data.passingScore;
    if (data.isActive !== undefined) updateData.isActive = !!data.isActive;

    const [updatedType] = await db
      .update(assessmentTypes)
      .set(updateData)
      .where(eq(assessmentTypes.id, id))
      .returning();

    if (!updatedType) {
      throw new Error("Assessment type not found");
    }

    revalidatePath("/admin/assessments");

    return {
      ...updatedType,
      isActive: !!updatedType.isActive,
    };
  } catch (error) {
    console.error("Failed to update assessment type:", error);
    throw new Error("Failed to update assessment type");
  }
}

/**
 * Delete an assessment type
 */
export async function deleteAssessmentType(id: string) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const [deletedType] = await db
      .delete(assessmentTypes)
      .where(eq(assessmentTypes.id, id))
      .returning();

    if (!deletedType) {
      throw new Error("Assessment type not found");
    }

    revalidatePath("/admin/assessments");

    return deletedType;
  } catch (error) {
    console.error("Failed to delete assessment type:", error);
    throw new Error("Failed to delete assessment type");
  }
}

// ============================================================================
// ASSESSMENTS ACTIONS
// ============================================================================

/**
 * Get all assessments with optional filters
 */
export async function getAssessments(filters?: {
  classId?: string;
  assessmentTypeId?: string;
  status?: string;
  type?: string;
  limit?: number;
}) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const limit = filters?.limit || 500;
    const conditions = [];

    if (filters?.classId) {
      conditions.push(eq(assessments.classId, filters.classId));
    }
    if (filters?.assessmentTypeId) {
      conditions.push(eq(assessments.assessmentTypeId, filters.assessmentTypeId));
    }
    if (filters?.status) {
      conditions.push(eq(assessments.status, filters.status));
    }
    if (filters?.type) {
      conditions.push(eq(assessments.type, filters.type));
    }

    let allAssessments;
    if (conditions.length > 0) {
      allAssessments = await db
        .select()
        .from(assessments)
        .where(and(...conditions))
        .orderBy(desc(assessments.createdAt))
        .limit(limit);
    } else {
      allAssessments = await db
        .select()
        .from(assessments)
        .orderBy(desc(assessments.createdAt))
        .limit(limit);
    }

    return allAssessments.map((assessment) => ({
      ...assessment,
      isActive: !!assessment.isActive,
    }));
  } catch (error) {
    console.error("Failed to fetch assessments:", error);
    throw new Error("Failed to fetch assessments");
  }
}

/**
 * Get a single assessment by ID
 */
export async function getAssessmentById(id: string) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const assessment = await db.query.assessments.findFirst({
      where: eq(assessments.id, id),
      with: {
        class: true,
        assessmentType: true,
      },
    });

    if (!assessment) {
      throw new Error("Assessment not found");
    }

    return {
      ...assessment,
      isActive: !!assessment.isActive,
    };
  } catch (error) {
    console.error("Failed to fetch assessment:", error);
    throw new Error("Failed to fetch assessment");
  }
}

/**
 * Create a new assessment
 */
export async function createAssessment(data: {
  title: string;
  description: string;
  classId?: string;
  assessmentTypeId?: string;
  dueDate: string;
  totalPoints?: number;
  passingScore?: number;
  type?: string;
  status?: string;
}) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const assessmentId = `assessment_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const now = new Date();

    const [newAssessment] = await db
      .insert(assessments)
      .values({
        id: assessmentId,
        title: data.title,
        description: data.description,
        classId: data.classId || null,
        assessmentTypeId: data.assessmentTypeId || null,
        dueDate: data.dueDate,
        totalPoints: data.totalPoints || 100,
        passingScore: data.passingScore || 70,
        userId,
        type: data.type || "riasec",
        status: data.status || "draft",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    revalidatePath("/admin/assessments");

    return newAssessment;
  } catch (error) {
    console.error("Failed to create assessment:", error);
    throw new Error("Failed to create assessment");
  }
}

/**
 * Update an existing assessment
 */
export async function updateAssessment(
  id: string,
  data: {
    title?: string;
    description?: string;
    classId?: string;
    assessmentTypeId?: string;
    dueDate?: string;
    totalPoints?: number;
    passingScore?: number;
    type?: string;
    status?: string;
    isActive?: boolean;
  }
) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.title) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.classId !== undefined) updateData.classId = data.classId;
    if (data.assessmentTypeId !== undefined) updateData.assessmentTypeId = data.assessmentTypeId;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
    if (data.totalPoints !== undefined) updateData.totalPoints = data.totalPoints;
    if (data.passingScore !== undefined) updateData.passingScore = data.passingScore;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.isActive !== undefined) updateData.isActive = !!data.isActive;

    const [updatedAssessment] = await db
      .update(assessments)
      .set(updateData)
      .where(eq(assessments.id, id))
      .returning();

    if (!updatedAssessment) {
      throw new Error("Assessment not found");
    }

    revalidatePath("/admin/assessments");

    return {
      ...updatedAssessment,
      isActive: !!updatedAssessment.isActive,
    };
  } catch (error) {
    console.error("Failed to update assessment:", error);
    throw new Error("Failed to update assessment");
  }
}

/**
 * Delete an assessment
 */
export async function deleteAssessment(id: string) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const [deletedAssessment] = await db
      .delete(assessments)
      .where(eq(assessments.id, id))
      .returning();

    if (!deletedAssessment) {
      throw new Error("Assessment not found");
    }

    revalidatePath("/admin/assessments");

    return deletedAssessment;
  } catch (error) {
    console.error("Failed to delete assessment:", error);
    throw new Error("Failed to delete assessment");
  }
}

// ============================================================================
// ASSESSMENT SUBMISSIONS/RESULTS ACTIONS
// ============================================================================

/**
 * Get assessment submissions/results with optional filters
 */
export async function getAssessmentResults(filters?: {
  assessmentId?: string;
  status?: string;
  limit?: number;
}) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const limit = filters?.limit || 500;
    const conditions = [];

    if (filters?.assessmentId) {
      conditions.push(eq(assessmentSubmissions.assessmentId, filters.assessmentId));
    }
    if (filters?.status) {
      conditions.push(eq(assessmentSubmissions.status, filters.status));
    }

    let submissions;
    if (conditions.length > 0) {
      submissions = await db
        .select({
          submission: assessmentSubmissions,
          assessment: assessments,
          user: {
            id: users.id,
            name: users.name,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          },
        })
        .from(assessmentSubmissions)
        .innerJoin(assessments, eq(assessmentSubmissions.assessmentId, assessments.id))
        .innerJoin(users, eq(assessmentSubmissions.userId, users.id))
        .where(and(...conditions))
        .orderBy(desc(assessmentSubmissions.createdAt))
        .limit(limit);
    } else {
      submissions = await db
        .select({
          submission: assessmentSubmissions,
          assessment: assessments,
          user: {
            id: users.id,
            name: users.name,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          },
        })
        .from(assessmentSubmissions)
        .innerJoin(assessments, eq(assessmentSubmissions.assessmentId, assessments.id))
        .innerJoin(users, eq(assessmentSubmissions.userId, users.id))
        .orderBy(desc(assessmentSubmissions.createdAt))
        .limit(limit);
    }

    return submissions.map(({ submission, assessment, user }) => ({
      ...submission,
      assessment,
      user,
    }));
  } catch (error) {
    console.error("Failed to fetch assessment results:", error);
    throw new Error("Failed to fetch assessment results");
  }
}

/**
 * Get submissions for a specific assessment
 */
export async function getAssessmentSubmissions(assessmentId: string) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const submissions = await db
      .select({
        submission: assessmentSubmissions,
        user: {
          id: users.id,
          name: users.name,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(assessmentSubmissions)
      .innerJoin(users, eq(assessmentSubmissions.userId, users.id))
      .where(eq(assessmentSubmissions.assessmentId, assessmentId))
      .orderBy(desc(assessmentSubmissions.submittedAt));

    return submissions.map(({ submission, user }) => ({
      ...submission,
      user,
    }));
  } catch (error) {
    console.error("Failed to fetch assessment submissions:", error);
    throw new Error("Failed to fetch assessment submissions");
  }
}

// ============================================================================
// STATISTICS ACTIONS
// ============================================================================

/**
 * Get overview statistics for assessments
 */
export async function getAssessmentStats() {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    // Get total assessment types
    const [totalTypes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(assessmentTypes);

    // Get active assessment types
    const [activeTypes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(assessmentTypes)
      .where(eq(assessmentTypes.isActive, true));

    // Get total assessments
    const [totalAssessments] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(assessments);

    // Get active assessments
    const [activeAssessments] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(assessments)
      .where(eq(assessments.isActive, true));

    // Get total submissions
    const [totalSubmissions] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(assessmentSubmissions);

    // Get submitted submissions
    const [submittedSubmissions] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(assessmentSubmissions)
      .where(eq(assessmentSubmissions.status, "submitted"));

    // Get graded submissions
    const [gradedSubmissions] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(assessmentSubmissions)
      .where(eq(assessmentSubmissions.status, "graded"));

    // Get pending submissions
    const [pendingSubmissions] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(assessmentSubmissions)
      .where(eq(assessmentSubmissions.status, "pending"));

    // Get by category
    const categories = await db
      .select({
        category: assessmentTypes.category,
        count: sql<number>`count(*)::int`,
      })
      .from(assessmentTypes)
      .groupBy(assessmentTypes.category);

    return {
      assessmentTypes: {
        total: totalTypes.count,
        active: activeTypes.count,
      },
      assessments: {
        total: totalAssessments.count,
        active: activeAssessments.count,
      },
      submissions: {
        total: totalSubmissions.count,
        submitted: submittedSubmissions.count,
        graded: gradedSubmissions.count,
        pending: pendingSubmissions.count,
      },
      byCategory: categories.reduce((acc, cat) => {
        if (cat.category) {
          acc[cat.category] = cat.count;
        }
        return acc;
      }, {} as Record<string, number>),
    };
  } catch (error) {
    console.error("Failed to fetch assessment stats:", error);
    throw new Error("Failed to fetch assessment stats");
  }
}

/**
 * Search assessment types by query
 */
export async function searchAssessmentTypes(query: string, limit = 20) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const allTypes = await db
      .select()
      .from(assessmentTypes)
      .limit(limit * 2);

    const filtered = allTypes.filter(
      (type) =>
        type.name?.toLowerCase().includes(query.toLowerCase()) ||
        type.description?.toLowerCase().includes(query.toLowerCase()) ||
        type.category?.toLowerCase().includes(query.toLowerCase())
    );

    return filtered.slice(0, limit).map((type) => ({
      ...type,
      isActive: !!type.isActive,
    }));
  } catch (error) {
    console.error("Failed to search assessment types:", error);
    throw new Error("Failed to search assessment types");
  }
}

// ============================================================================
// ASSESSMENT QUESTIONS ACTIONS
// ============================================================================

/**
 * Get all questions for an assessment type
 */
export async function getAssessmentQuestions(assessmentTypeId: string) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const questions = await db
      .select()
      .from(assessmentQuestions)
      .where(eq(assessmentQuestions.assessmentTypeId, assessmentTypeId))
      .orderBy(asc(assessmentQuestions.order));

    return questions.map((q) => ({
      ...q,
      isActive: !!q.isActive,
    }));
  } catch (error) {
    console.error("Failed to fetch assessment questions:", error);
    throw new Error("Failed to fetch assessment questions");
  }
}

/**
 * Get a single question by ID
 */
export async function getQuestionById(questionId: string) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const [question] = await db
      .select()
      .from(assessmentQuestions)
      .where(eq(assessmentQuestions.id, questionId))
      .limit(1);

    if (!question) {
      throw new Error("Question not found");
    }

    return {
      ...question,
      isActive: !!question.isActive,
    };
  } catch (error) {
    console.error("Failed to fetch question:", error);
    throw new Error("Failed to fetch question");
  }
}

/**
 * Create a new question for an assessment type
 */
export async function createAssessmentQuestion(data: {
  assessmentTypeId: string;
  questionText: string;
  questionData?: any;
  options?: string[];
  correctAnswer?: string;
  points?: number;
  order?: number;
}) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const questionId = `q_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const now = new Date();

    // Get the next order number if not provided
    let order = data.order;
    if (order === undefined) {
      const [maxOrder] = await db
        .select({ max: sql<number>`MAX(order)` })
        .from(assessmentQuestions)
        .where(eq(assessmentQuestions.assessmentTypeId, data.assessmentTypeId));
      order = (maxOrder?.max ?? 0) + 1;
    }

    const [newQuestion] = await db
      .insert(assessmentQuestions)
      .values({
        id: questionId,
        assessmentTypeId: data.assessmentTypeId,
        questionText: data.questionText,
        questionData: data.questionData || null,
        options: data.options || null,
        correctAnswer: data.correctAnswer || "",
        points: data.points || 1,
        order: order,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    revalidatePath("/admin/assessments");

    return newQuestion;
  } catch (error) {
    console.error("Failed to create question:", error);
    throw new Error("Failed to create question");
  }
}

/**
 * Update an existing question
 */
export async function updateAssessmentQuestion(
  questionId: string,
  data: {
    questionText?: string;
    questionData?: any;
    options?: string[];
    correctAnswer?: string;
    points?: number;
    order?: number;
    isActive?: boolean;
  }
) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.questionText !== undefined) updateData.questionText = data.questionText;
    if (data.questionData !== undefined) updateData.questionData = data.questionData;
    if (data.options !== undefined) updateData.options = data.options;
    if (data.correctAnswer !== undefined) updateData.correctAnswer = data.correctAnswer;
    if (data.points !== undefined) updateData.points = data.points;
    if (data.order !== undefined) updateData.order = data.order;
    if (data.isActive !== undefined) updateData.isActive = !!data.isActive;

    const [updatedQuestion] = await db
      .update(assessmentQuestions)
      .set(updateData)
      .where(eq(assessmentQuestions.id, questionId))
      .returning();

    if (!updatedQuestion) {
      throw new Error("Question not found");
    }

    revalidatePath("/admin/assessments");

    return {
      ...updatedQuestion,
      isActive: !!updatedQuestion.isActive,
    };
  } catch (error) {
    console.error("Failed to update question:", error);
    throw new Error("Failed to update question");
  }
}

/**
 * Delete a question
 */
export async function deleteAssessmentQuestion(questionId: string) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const [deletedQuestion] = await db
      .delete(assessmentQuestions)
      .where(eq(assessmentQuestions.id, questionId))
      .returning();

    if (!deletedQuestion) {
      throw new Error("Question not found");
    }

    revalidatePath("/admin/assessments");

    return deletedQuestion;
  } catch (error) {
    console.error("Failed to delete question:", error);
    throw new Error("Failed to delete question");
  }
}

/**
 * Bulk create questions for an assessment type
 */
export async function bulkCreateQuestions(
  assessmentTypeId: string,
  questions: Array<{
    questionText: string;
    questionData?: any;
    options?: string[];
    correctAnswer?: string;
    points?: number;
  }>
) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const now = new Date();
    const createdQuestions = [];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const questionId = `q_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 9)}`;

      const [newQuestion] = await db
        .insert(assessmentQuestions)
        .values({
          id: questionId,
          assessmentTypeId,
          questionText: q.questionText,
          questionData: q.questionData || null,
          options: q.options || null,
          correctAnswer: q.correctAnswer || "",
          points: q.points || 1,
          order: i + 1,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      createdQuestions.push(newQuestion);
    }

    revalidatePath("/admin/assessments");

    return createdQuestions;
  } catch (error) {
    console.error("Failed to bulk create questions:", error);
    throw new Error("Failed to bulk create questions");
  }
}
