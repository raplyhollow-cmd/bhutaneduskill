import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { learningModules, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const moduleSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  subjectId: z.string().optional(),
  lessons: z.array(z.object({
    id: z.string(),
    title: z.string(),
    content: z.string(),
    videoUrl: z.string().optional(),
    attachments: z.array(z.object({
      name: z.string(),
      url: z.string(),
      type: z.string(),
    })).optional(),
    duration: z.number(),
    order: z.number(),
  })),
  quiz: z.any().optional(),
  isPublished: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  enrollable: z.boolean().optional(),
  maxEnrollments: z.number().optional(),
  estimatedDuration: z.number().optional(),
});

// GET /api/teacher/modules - List all modules created by teacher
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // draft, published

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "teacher") {
      return NextResponse.json({ error: "Forbidden - Teachers only" }, { status: 403 });
    }

    let conditions = [eq(learningModules.teacherId, currentUser.id)];

    if (status === "draft") {
      // Add isPublished check
    } else if (status === "published") {
      // Add isPublished check
    }

    const modules = await db.query.learningModules.findMany({
      where: eq(learningModules.teacherId, currentUser.id),
      with: {
        subject: true,
      },
      orderBy: [desc(learningModules.createdAt)],
    });

    return NextResponse.json({ modules });
  } catch (error) {
    console.error("Modules fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch modules" }, { status: 500 });
  }
}

// POST /api/teacher/modules - Create new learning module
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = moduleSchema.parse(body);

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "teacher") {
      return NextResponse.json({ error: "Forbidden - Teachers only" }, { status: 403 });
    }

    // Calculate estimated duration if not provided
    let estimatedDuration = validatedData.estimatedDuration;
    if (!estimatedDuration && validatedData.lessons) {
      estimatedDuration = validatedData.lessons.reduce((sum, l) => sum + l.duration, 0);
    }

    const [newModule] = await db.insert(learningModules).values({
      id: `mod_${Date.now()}`,
      schoolId: currentUser.schoolId,
      subjectId: validatedData.subjectId,
      teacherId: currentUser.id,
      title: validatedData.title,
      description: validatedData.description,
      lessons: validatedData.lessons || [],
      quiz: validatedData.quiz,
      isPublished: validatedData.isPublished || false,
      isPublic: validatedData.isPublic || false,
      allowPreview: true,
      enrollable: validatedData.enrollable || false,
      maxEnrollments: validatedData.maxEnrollments,
      estimatedDuration,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return NextResponse.json({ module: newModule }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    console.error("Module creation error:", error);
    return NextResponse.json({ error: "Failed to create module" }, { status: 500 });
  }
}
