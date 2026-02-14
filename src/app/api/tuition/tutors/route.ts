import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { tutors, users, tuitionCategories } from "@/lib/db/schema";
import { eq, desc, like, or } from "drizzle-orm";
import { z } from "zod";

const tutorSchema = z.object({
  bio: z.string().optional(),
  qualifications: z.array(z.object({
    degree: z.string(),
    institution: z.string(),
    year: z.number(),
  })).optional(),
  experience: z.number().optional(),
  subjects: z.array(z.string()),
  gradeLevels: z.array(z.number()),
  location: z.object({
    district: z.string(),
    city: z.string(),
    area: z.string(),
    coordinates: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }),
  }).optional(),
  travelRadius: z.number().optional(),
  hourlyRateOnline: z.number().optional(),
  hourlyRatePhysical: z.number().optional(),
  availableDays: z.array(z.string()).optional(),
  availableSlots: z.array(z.object({
    day: z.string(),
    startTime: z.string(),
    endTime: z.string(),
  })).optional(),
  bankAccount: z.object({
    bankName: z.string(),
    accountNumber: z.string(),
    accountHolder: z.string(),
    branch: z.string().optional(),
  }).optional(),
});

// GET /api/tuition/tutors - List all tutors
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subject = searchParams.get("subject");
    const district = searchParams.get("district");
    const gradeLevel = searchParams.get("gradeLevel");
    const onlineOnly = searchParams.get("onlineOnly") === "true";
    const search = searchParams.get("search");

    const allTutors = await db.query.tutors.findMany({
      where: eq(tutors.isActive, true),
      with: {
        user: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
      },
      orderBy: [desc(tutors.createdAt)],
    });

    // Filter results
    let filtered = allTutors;

    if (subject) {
      filtered = filtered.filter(t => {
        if (typeof t.subjects === 'string') {
          try {
            const subjects = JSON.parse(t.subjects as string);
            return subjects.some((s: any) => s.subjectName === subject || s.proficiency === subject);
          } catch {
            return false;
          }
        }
        return false;
      });
    }

    if (gradeLevel) {
      filtered = filtered.filter(t => {
        if (typeof t.gradeLevels === 'string') {
          try {
            const grades = JSON.parse(t.gradeLevels as string);
            return grades.includes(parseInt(gradeLevel));
          } catch {
            return false;
          }
        }
        return (t.gradeLevels as any)?.includes?.(parseInt(gradeLevel));
      });
    }

    if (district) {
      filtered = filtered.filter(t => {
        if (typeof t.location === 'string') {
          try {
            const loc = JSON.parse(t.location as string);
            return loc.district === district;
          } catch {
            return false;
          }
        }
        return false;
      });
    }

    if (onlineOnly) {
      filtered = filtered.filter(t => t.hourlyRateOnline && t.hourlyRateOnline > 0);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((t: any) =>
        (t.user?.firstName?.toLowerCase() || "").includes(searchLower) ||
        (t.user?.lastName?.toLowerCase() || "").includes(searchLower) ||
        t.subjects?.some((s: string) => s.toLowerCase().includes(searchLower)) ||
        (t.bio?.toLowerCase() || "").includes(searchLower)
      );
    }

    return NextResponse.json({ tutors: filtered });
  } catch (error) {
    console.error("Tutors fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch tutors" }, { status: 500 });
  }
}

// POST /api/tuition/tutors - Register as tutor
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = tutorSchema.parse(body);

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if already a tutor
    const existing = await db.query.tutors.findFirst({
      where: eq(tutors.userId, currentUser.id),
    });

    if (existing) {
      return NextResponse.json({ error: "Already registered as a tutor" }, { status: 400 });
    }

    const [newTutor] = await db.insert(tutors).values({
      id: `tutor_${Date.now()}`,
      userId: currentUser.id,
      bio: validatedData.bio,
      subjects: (validatedData.subjects || []).map((s: any) => ({
        subjectId: s.id || s,
        subjectName: s.name || s,
        proficiency: s.proficiency || "intermediate",
      })),
      qualifications: validatedData.qualifications || [],
      experience: validatedData.experience || 0,
      hourlyRate: validatedData.hourlyRateOnline || 500,
      hourlyRateOnline: validatedData.hourlyRateOnline || 500,
      currency: "BTN",
      availability: validatedData.availableSlots ? JSON.stringify({
        days: (validatedData as any).availableDays || [],
        slots: validatedData.availableSlots || [],
      }) : "[]",
      teachingMode: validatedData.teaching_mode || "online",
      location: validatedData.location ? JSON.stringify(validatedData.location) : null,
      district: (validatedData.location as any)?.district || "",
      department: (validatedData as any).department || "",
      gradeLevels: validatedData.gradeLevels || [],
      averageRating: 0,
      totalReviews: 0,
      totalStudents: 0,
      isVerified: false,
      verificationDocument: (validatedData as any).bankAccount || "",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return NextResponse.json({ tutor: newTutor }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    console.error("Tutor registration error:", error);
    return NextResponse.json({ error: "Failed to register tutor" }, { status: 500 });
  }
}
