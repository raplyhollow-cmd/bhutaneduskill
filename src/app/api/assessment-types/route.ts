import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { assessmentTypes, users } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

// GET /api/assessment-types - Get assessment types
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const targetAudience = searchParams.get("targetAudience");
    const targetGrade = searchParams.get("targetGrade");

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

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
    console.error("Assessment types fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch assessment types" }, { status: 500 });
  }
}

// POST /api/assessment-types - Create assessment type (admin only)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { slug, name, description, targetGrade, targetAudience, category, duration, questionCount } = body;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || (currentUser as any).type !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
    console.error("Assessment type creation error:", error);
    return NextResponse.json({ error: "Failed to create assessment type" }, { status: 500 });
  }
}
