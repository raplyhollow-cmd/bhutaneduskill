import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subjects, users } from "@/lib/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-utils";

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
    const authResult = await requireAuth(['admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

    const { searchParams } = new URL(request.url);
    const grade = searchParams.get("grade");
    const isActive = searchParams.get("isActive");

    let conditions = [];
    if (user.schoolId) {
      conditions.push(eq(subjects.schoolId, user.schoolId));
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
    const authResult = await requireAuth(['admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

    const body = await request.json();
    const validatedData = subjectSchema.parse(body);

    // Check for duplicate code
    const existing = await db.query.subjects.findFirst({
      where: eq(subjects.code, validatedData.code),
    });

    if (existing) {
      return NextResponse.json({ error: "Subject code already exists" }, { status: 400 });
    }

    const [newSubject] = await db.insert(subjects).values({
      id: `subj_${Date.now()}`,
      schoolId: user.schoolId,
      code: validatedData.code,
      name: validatedData.name,
      nameDzongkha: (validatedData as any).nameDzongkha,
      type: (validatedData as any).type || "core",
      grade: validatedData.grade,
      description: validatedData.description || "",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return NextResponse.json({ subject: newSubject }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    console.error("Subject creation error:", error);
    return NextResponse.json({ error: "Failed to create subject" }, { status: 500 });
  }
}
