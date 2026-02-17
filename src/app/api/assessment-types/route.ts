import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { assessmentTypes } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

// GET /api/assessment-types - Get assessment types
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin', 'school-admin', 'teacher']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const targetAudience = searchParams.get("targetAudience");
    const targetGrade = searchParams.get("targetGrade");

    // Build conditions - only show active assessments
    const conditions = [eq(assessmentTypes.isActive, true)];

    if (category) {
      conditions.push(eq(assessmentTypes.category, category));
    }
    if (targetAudience) {
      conditions.push(eq(assessmentTypes.targetAudience, targetAudience));
    }
    if (targetGrade) {
      conditions.push(eq(assessmentTypes.targetGrade, parseInt(targetGrade)));
    }

    let types: any[];
    if (conditions.length > 1) {
      types = await db.query.assessmentTypes.findMany({
        where: and(...conditions),
        orderBy: desc(assessmentTypes.createdAt),
      });
    } else {
      types = await db.query.assessmentTypes.findMany({
        where: eq(assessmentTypes.isActive, true),
        orderBy: desc(assessmentTypes.createdAt),
      });
    }

    return NextResponse.json({ assessmentTypes: types });
  } catch (error) {
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json({ error: "Failed to fetch assessment types" }, { status: 500 });
  }
}

// POST /api/assessment-types - Create assessment type (admin only)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const body = await request.json();
    const { slug, name, description, targetGrade, targetAudience, category, duration, questionCount } = body;

    const [newType] = await db
      .insert(assessmentTypes)
      .values({
        id: `at_${Date.now()}`,
        slug,
        name,
        description,
        targetGrade,
        targetAudience,
        category,
        duration,
        questionCount,
        isActive: true,
        createdAt: new Date(),
      } as any)
      .returning();

    return NextResponse.json({ assessmentTypeId: newType }, { status: 201 });
  } catch (error) {
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json({ error: "Failed to create assessment type" }, { status: 500 });
  }
}
