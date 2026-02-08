import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { subjects, users } from "@/lib/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { z } from "zod";

const subjectSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  nameDzongkha: z.string().optional(),
  grade: z.number().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
});

// GET /api/school-admin/subjects - List subjects
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const grade = searchParams.get("grade");
    const isActive = searchParams.get("isActive");

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || !["admin", "teacher"].includes(currentUser.type)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let conditions = [];
    if (currentUser.type === "teacher") {
      conditions.push(eq(subjects.schoolId, currentUser.schoolId));
    }

    if (isActive === "true") {
      conditions.push(sql`${subjects.isActive} = 1`);
    } else if (isActive === "false") {
      conditions.push(sql`${subjects.isActive} = 0`);
    }

    if (grade) {
      conditions.push(eq(subjects.grade, parseInt(grade)));
    }

    const allSubjects = await db.query.subjects.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [subjects.name],
    });

    return NextResponse.json({ subjects: allSubjects });
  } catch (error) {
    console.error("Subjects fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch subjects" }, { status: 500 });
  }
}

// POST /api/school-admin/subjects - Create subject
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = subjectSchema.parse(body);

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || !["admin", "teacher"].includes(currentUser.type)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check for duplicate code
    const existing = await db.query.subjects.findFirst({
      where: eq(subjects.code, validatedData.code),
    });

    if (existing) {
      return NextResponse.json({ error: "Subject code already exists" }, { status: 400 });
    }

    const [newSubject] = await db.insert(subjects).values({
      id: `subj_${Date.now()}`,
      schoolId: currentUser.schoolId,
      code: validatedData.code,
      name: validatedData.name,
      nameDzongkha: validatedData.nameDzongkha,
      grade: validatedData.grade,
      description: validatedData.description,
      icon: validatedData.icon,
      color: validatedData.color,
      isActive: true,
      createdAt: new Date(),
    }).returning();

    return NextResponse.json({ subject: newSubject }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    console.error("Subject creation error:", error);
    return NextResponse.json({ error: "Failed to create subject" }, { status: 500 });
  }
}
