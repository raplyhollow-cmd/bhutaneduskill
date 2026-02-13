import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { colleges, rubPrograms, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const collegeSchema = z.object({
  name: z.string().min(1),
  dataSource: z.string().default("manual"),
  externalId: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
  type: z.string().optional(),
  isBhutanCollege: z.boolean().optional(),
  bhutanCollegeType: z.string().optional(),
  acceptanceRate: z.number().optional(),
  avgSAT: z.number().optional(),
  avgACT: z.number().optional(),
  requiredGPA: z.string().optional(),
  programs: z.array(z.any()).optional(),
});

// GET /api/admin/content/colleges - List colleges
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bhutanOnly = searchParams.get("bhutanOnly") === "true";
    const isActive = searchParams.get("isActive");

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let conditions = [];

    if (bhutanOnly) {
      // Add isBhutanCollege condition
    }

    const allColleges = await db.query.colleges.findMany({
      orderBy: [desc(colleges.createdAt)],
    });

    let filtered = allColleges;
    if (bhutanOnly) {
      filtered = filtered.filter(c => (c as any).isBhutanCollege);
    }

    // Get RUB programs for Bhutan colleges
    if (bhutanOnly) {
      const bhutanCollegeIds = filtered.filter(c => (c as any).bhutanCollegeType === "rub").map(c => c.id);
      const programs = await db.query.rubPrograms.findMany();
      // Attach programs to colleges
      filtered = filtered.map(college => ({
        ...college,
        programsList: programs.filter(p => p.collegeId === (college as any).id),
      }));
    }

    return NextResponse.json({ colleges: filtered });
  } catch (error) {
    console.error("Colleges fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch colleges" }, { status: 500 });
  }
}

// POST /api/admin/content/colleges - Add college
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = collegeSchema.parse(body);

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [newCollege] = await db.insert(colleges).values({
      id: `college_${Date.now()}`,
      name: validatedData.name,
      dataSource: validatedData.dataSource,
      externalId: validatedData.externalId,
      location: validatedData.location,
      website: validatedData.website,
      type: validatedData.type,
      ...({
        isBhutanCollege: validatedData.isBhutanCollege || false,
        bhutanCollegeType: validatedData.bhutanCollegeType,
      }),
      acceptanceRate: validatedData.acceptanceRate,
      avgSAT: validatedData.avgSAT,
      avgACT: validatedData.avgACT,
      requiredGPA: validatedData.requiredGPA,
      programs: validatedData.programs || [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any).returning();

    return NextResponse.json({ college: newCollege }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    console.error("College creation error:", error);
    return NextResponse.json({ error: "Failed to create college" }, { status: 500 });
  }
}
