import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { scholarships, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const scholarshipSchema = z.object({
  name: z.string().min(1),
  provider: z.string().min(1),
  dataSource: z.string().default("manual"),
  amount: z.string().optional(),
  amountMin: z.number().optional(),
  amountMax: z.number().optional(),
  eligibilityCriteria: z.array(z.any()).optional(),
  requiredGPA: z.string().optional(),
  requiredClass: z.string().optional(),
  applicationDeadline: z.string().optional(),
  announcementDate: z.string().optional(),
  category: z.string(),
  targetGroups: z.array(z.string()).optional(),
  careerClusters: z.array(z.string()).optional(),
  requiredInterests: z.array(z.string()).optional(),
  applicationUrl: z.string().optional(),
  moreInfoUrl: z.string().optional(),
});

// GET /api/admin/content/scholarships - List scholarships
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const active = searchParams.get("active") === "true";

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const allScholarships = await db.query.scholarships.findMany({
      orderBy: [desc(scholarships.createdAt)],
    });

    let filtered = allScholarships;

    if (category) {
      filtered = filtered.filter(s => (s as any).category === category);
    }

    if (active) {
      const now = new Date();
      filtered = filtered.filter(s => {
        const deadline = (s as any).applicationDeadline;
        if (!deadline) return true;
        return new Date(deadline) > now;
      });
    }

    return NextResponse.json({ scholarships: filtered });
  } catch (error) {
    console.error("Scholarships fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch scholarships" }, { status: 500 });
  }
}

// POST /api/admin/content/scholarships - Add scholarship
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = scholarshipSchema.parse(body);

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [newScholarship] = await db.insert(scholarships).values({
      ...({
        id: `scholar_${Date.now()}`,
        dataSource: validatedData.dataSource,
        category: validatedData.category,
        applicationDeadline: validatedData.applicationDeadline,
      }),
      name: validatedData.name,
      provider: validatedData.provider,
      amount: validatedData.amount,
      amountMin: validatedData.amountMin,
      amountMax: validatedData.amountMax,
      currency: "BTN",
      eligibilityCriteria: validatedData.eligibilityCriteria || {},
      requiredGPA: validatedData.requiredGPA,
      requiredClass: validatedData.requiredClass,
      announcementDate: validatedData.announcementDate,
      targetGroups: validatedData.targetGroups || [],
      careerClusters: validatedData.careerClusters || [],
      requiredInterests: validatedData.requiredInterests || [],
      applicationUrl: validatedData.applicationUrl,
      moreInfoUrl: validatedData.moreInfoUrl,
      isActive: true,
      academicYear: "2024-2025",
      createdAt: new Date(),
    } as any).returning();

    return NextResponse.json({ scholarship: newScholarship }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    console.error("Scholarship creation error:", error);
    return NextResponse.json({ error: "Failed to create scholarship" }, { status: 500 });
  }
}
