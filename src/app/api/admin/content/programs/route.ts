import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { rubPrograms, colleges, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const programSchema = z.object({
  collegeId: z.string().optional(),
  name: z.string().min(1),
  code: z.string().min(1),
  duration: z.string(),
  seats: z.number().optional(),
  minMarks: z.number().optional(),
  requiredSubjects: z.array(z.string()).optional(),
  eligibilityCriteria: z.string().optional(),
  relatedCareerClusters: z.array(z.string()).optional(),
});

// GET /api/admin/content/programs - List RUB programs
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const collegeId = searchParams.get("collegeId");

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const programs = await db.query.rubPrograms.findMany({
      where: collegeId ? eq(rubPrograms.collegeId, collegeId) : undefined,
      with: {
        college: true,
      },
    });

    return NextResponse.json({ programs });
  } catch (error) {
    console.error("Programs fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch programs" }, { status: 500 });
  }
}

// POST /api/admin/content/programs - Add RUB program
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = programSchema.parse(body);

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [newProgram] = await db.insert(rubPrograms).values({
      id: `prog_${Date.now()}`,
      collegeId: validatedData.collegeId,
      name: validatedData.name,
      code: validatedData.code,
      duration: validatedData.duration,
      seats: validatedData.seats,
      minMarks: validatedData.minMarks,
      requiredSubjects: validatedData.requiredSubjects || [],
      eligibilityCriteria: validatedData.eligibilityCriteria,
      relatedCareerClusters: validatedData.relatedCareerClusters || [],
      isActive: true,
      academicYear: "2024-2025",
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return NextResponse.json({ program: newProgram }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    console.error("Program creation error:", error);
    return NextResponse.json({ error: "Failed to create program" }, { status: 500 });
  }
}
