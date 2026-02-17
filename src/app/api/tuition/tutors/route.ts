import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { tutors, users, tuitionCategories } from "@/lib/db/schema";
import { eq, desc, like, or } from "drizzle-orm";
import { z } from "zod";

const tutorSchema = z.object({
  teacherId: z.string().optional(), // For school-admin adding a teacher as tutor
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
    const authResult = await requireAuth(['admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
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
            return subjects.some((s: unknown) => {
              if (typeof s === 'object' && s !== null && 'subjectName' in s) {
                return (s as { subjectName: string }).subjectName === subject;
              }
              if (typeof s === 'object' && s !== null && 'proficiency' in s) {
                return (s as { proficiency: string }).proficiency === subject;
              }
              return false;
            });
          } catch {
            return false;
          }
        }
        if (Array.isArray(t.subjects)) {
          return t.subjects.some((s: unknown) => {
            if (typeof s === 'object' && s !== null && 'subjectName' in s) {
              return (s as { subjectName: string }).subjectName === subject;
            }
            return false;
          });
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

    // Transform tutors for the frontend
    const transformedTutors = filtered.map((t) => {
      const subjectNames: string[] = [];
      if (Array.isArray(t.subjects)) {
        t.subjects.forEach((s: unknown) => {
          if (typeof s === 'object' && s !== null && 'subjectName' in s) {
            subjectNames.push((s as { subjectName: string }).subjectName);
          }
        });
      }

      // Extract user from relation array
      const userArray = t.user as unknown as { id: string; firstName: string | null; lastName: string | null; profilePicture: string | null }[] | undefined;
      const user = userArray?.[0];

      return {
        id: t.id,
        userId: t.userId,
        name: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown" : "Unknown",
        bio: t.bio,
        subjects: subjectNames,
        gradeLevels: t.gradeLevels as number[],
        hourlyRate: t.hourlyRate,
        hourlyRateOnline: t.hourlyRateOnline,
        averageRating: t.averageRating ? t.averageRating / 100 : 0,
        totalStudents: t.totalStudents,
        isActive: t.isActive,
        teachingMode: t.teachingMode,
      };
    });

    return NextResponse.json({ tutors: transformedTutors });
  } catch (error) {
    logger.error("Tutors fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch tutors" }, { status: 500 });
  }
}

// POST /api/tuition/tutors - Register as tutor or add teacher as tutor
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

    const body = await request.json();
    const validatedData = tutorSchema.parse(body);

    // Determine which user to create tutor profile for
    const targetUserId = validatedData.teacherId || userId;

    // Check if already a tutor
    const existing = await db.query.tutors.findFirst({
      where: eq(tutors.userId, targetUserId),
    });

    if (existing) {
      return NextResponse.json({ error: "Already registered as a tutor" }, { status: 400 });
    }

    // Get user info for the target
    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, targetUserId),
      columns: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build availability array from form data
    const availabilityArray = (validatedData.availableDays || []).map((day: string) => ({
      day,
      slots: (validatedData.availableSlots || [])
        .filter((s: any) => s.day === day)
        .map((s: any) => ({
          start: s.startTime,
          end: s.endTime,
        })),
    })).filter((a: any) => a.slots.length > 0);

    // Determine teaching mode based on rates
    const hasOnlineRate = validatedData.hourlyRateOnline && validatedData.hourlyRateOnline > 0;
    const hasPhysicalRate = validatedData.hourlyRatePhysical && validatedData.hourlyRatePhysical > 0;
    let teachingMode = "online";
    if (hasOnlineRate && hasPhysicalRate) {
      teachingMode = "both";
    } else if (hasPhysicalRate && !hasOnlineRate) {
      teachingMode = "in_person";
    }

    const tutorId = `tutor_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    const [newTutor] = await db.insert(tutors).values({
      id: tutorId,
      userId: targetUserId,
      bio: validatedData.bio || "",
      subjects: (validatedData.subjects || []).map((s: any) => ({
        subjectId: s.id || s,
        subjectName: s.name || s,
        proficiency: s.proficiency || "intermediate",
      })),
      qualifications: validatedData.qualifications || [],
      experience: validatedData.experience || 0,
      hourlyRate: validatedData.hourlyRatePhysical || validatedData.hourlyRateOnline || 500,
      hourlyRateOnline: validatedData.hourlyRateOnline,
      currency: "BTN",
      availability: availabilityArray,
      teachingMode,
      location: (validatedData.location as any)?.city || null,
      district: (validatedData.location as any)?.district || null,
      department: "",
      gradeLevels: validatedData.gradeLevels || [],
      averageRating: 0,
      totalReviews: 0,
      totalStudents: 0,
      isVerified: false,
      verificationDocument: (validatedData.bankAccount as any)?.accountNumber || "",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return NextResponse.json({ tutor: newTutor }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    logger.error("Tutor registration error:", error);
    return NextResponse.json({ error: "Failed to register tutor" }, { status: 500 });
  }
}
