import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { homework, users, classes, subjects } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { z } from "zod";

// Validation schema for creating homework
const createHomeworkSchema = z.object({
  classId: z.string(),
  subjectId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  instructions: z.string().optional(),
  type: z.enum(["assignment", "quiz", "project", "reading"]),
  questions: z.array(z.object({
    id: z.string(),
    type: z.enum(["multiple_choice", "short_answer", "essay", "fill_blank", "match", "numeric", "math_expression", "graph_plot", "handwriting"]),
    question: z.string(),
    options: z.array(z.string()).optional(),
    correctAnswer: z.union([z.string(), z.array(z.string)]).optional(),
    points: z.number(),
    explanation: z.string().optional(),
    mathMode: z.boolean().optional(),
  })).optional(),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string(),
    type: z.string(),
    size: z.number(),
  })).optional(),
  externalLinks: z.array(z.object({
    title: z.string(),
    url: z.string(),
    provider: z.enum(["google_drive", "onedrive", "dropbox", "other"]),
  })).optional(),
  assignedDate: z.string(),
  dueDate: z.string(),
  lateSubmissionDeadline: z.string().optional(),
  maxPoints: z.number().optional(),
  passingPoints: z.number().optional(),
  timeLimit: z.number().optional(),
  attemptsAllowed: z.number().default(1),
  showAnswersAfter: z.enum(["immediate", "after_due", "manual"]).optional(),
});

// GET /api/teacher/homework - List all homework created by teacher
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // draft, published, closed
    const classId = searchParams.get("classId");

    // Get current user
    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "teacher") {
      return NextResponse.json({ error: "Forbidden - Teachers only" }, { status: 403 });
    }

    // Build conditions
    const conditions = [eq(homework.teacherId, currentUser.id)];

    if (classId) {
      conditions.push(eq(homework.classId, classId));
    }

    if (status === "draft") {
      conditions.push(sql`${homework.isPublished} = 0`);
    } else if (status === "published") {
      conditions.push(sql`${homework.isPublished} = 1`);
    }

    const homeworkList = await db.query.homework.findMany({
      where: and(...conditions),
      with: {
        class: true,
        subject: true,
      },
      orderBy: [desc(homework.createdAt)],
    });

    return NextResponse.json({ homework: homeworkList });
  } catch (error) {
    console.error("Homework fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch homework" }, { status: 500 });
  }
}

// POST /api/teacher/homework - Create new homework
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createHomeworkSchema.parse(body);

    // Get current user
    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "teacher") {
      return NextResponse.json({ error: "Forbidden - Teachers only" }, { status: 403 });
    }

    // Verify the class belongs to this teacher's school
    const classInfo = await db.query.classes.findFirst({
      where: eq(classes.id, validatedData.classId),
    });

    if (!classInfo) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Calculate max points from questions if not provided
    let maxPoints = validatedData.maxPoints;
    if (!maxPoints && validatedData.questions) {
      maxPoints = validatedData.questions.reduce((sum, q) => sum + q.points, 0);
    }

    const [newHomework] = await db.insert(homework).values({
      id: `hw_${Date.now()}`,
      schoolId: currentUser.schoolId,
      classId: validatedData.classId,
      subjectId: validatedData.subjectId,
      teacherId: currentUser.id,
      title: validatedData.title,
      description: validatedData.description,
      instructions: validatedData.instructions,
      type: validatedData.type,
      questions: validatedData.questions || [],
      attachments: validatedData.attachments || [],
      externalLinks: validatedData.externalLinks || [],
      assignedDate: validatedData.assignedDate,
      dueDate: validatedData.dueDate,
      lateSubmissionDeadline: validatedData.lateSubmissionDeadline,
      maxPoints,
      passingPoints: validatedData.passingPoints,
      timeLimit: validatedData.timeLimit,
      attemptsAllowed: validatedData.attemptsAllowed,
      showAnswersAfter: validatedData.showAnswersAfter,
      isPublished: false, // Start as draft
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return NextResponse.json({ homework: newHomework }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    console.error("Homework creation error:", error);
    return NextResponse.json({ error: "Failed to create homework" }, { status: 500 });
  }
}
