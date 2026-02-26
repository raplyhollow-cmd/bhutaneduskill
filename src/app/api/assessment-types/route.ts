/**
 * ASSESSMENT TYPES API
 *
 * GET /api/assessment-types - Get assessment types
 * POST /api/assessment-types - Create assessment type (admin only)
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { assessmentTypes } from "@/lib/db/schema";
import { eq, and, desc, sql, type SQL } from "drizzle-orm";
import type { AssessmentType } from "@/lib/db/schema";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, createdResponse } from "@/lib/api/response-helpers";

// GET /api/assessment-types - Get assessment types
export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId } = auth;

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const targetAudience = searchParams.get("targetAudience");
    const targetGrade = searchParams.get("targetGrade");

    // Build conditions - only show active assessments
    const conditions: SQL[] = [eq(assessmentTypes.isActive, true)];

    if (category) {
      conditions.push(eq(assessmentTypes.category, category));
    }
    if (targetAudience) {
      conditions.push(eq(assessmentTypes.targetAudience, targetAudience));
    }
    if (targetGrade) {
      conditions.push(eq(assessmentTypes.targetGrade, parseInt(targetGrade)));
    }

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    const types: AssessmentType[] = await db
      .select()
      .from(assessmentTypes)
      .where(whereClause)
      .orderBy(desc(assessmentTypes.createdAt));

    return successResponse({ assessmentTypes: types });
  },
  ['admin', 'school-admin', 'teacher']
);

// POST /api/assessment-types - Create assessment type (admin only)
export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId } = auth;

    const body = await request.json();
    const { name, description, targetGrade, targetAudience, category, duration, totalQuestions, passingScore } = body;

    const [newType] = await db
      .insert(assessmentTypes)
      .values({
        id: `at_${Date.now()}`,
        name,
        description,
        targetGrade,
        targetAudience,
        category,
        duration: duration || 60,
        totalQuestions: totalQuestions || 10,
        passingScore: passingScore || 70,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return createdResponse({ assessmentTypeId: newType.id });
  },
  ['admin']
);
