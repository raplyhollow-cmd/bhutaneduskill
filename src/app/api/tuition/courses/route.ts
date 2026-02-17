import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { tuitionCourses, tutors, users, tuitionCategories, tuitionEnrollments } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";

const courseSchema = z.object({
  tutorId: z.string(),
  categoryId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
  type: z.enum(["online_recorded", "online_live", "physical"]),
  location: z.object({
    district: z.string(),
    area: z.string(),
    fullAddress: z.string(),
    coordinates: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }),
  }).optional(),
  gradeLevel: z.number().optional(),
  maxStudents: z.number().optional(),
  schedule: z.array(z.object({
    day: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })).optional(),
  lessons: z.array(z.object({
    id: z.string(),
    title: z.string(),
    videoUrl: z.string(),
    duration: z.number(),
    order: z.number(),
    isFree: z.number(),
  })).optional(),
  price: z.number(),
  discountPrice: z.number().optional(),
  discountValidUntil: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  meetingLink: z.string().optional(),
  tags: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  prerequisites: z.array(z.string()).optional(),
});

// GET /api/tuition/courses - List all courses
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin', 'school-admin', 'teacher']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const { searchParams } = new URL(request.url);
    const subject = searchParams.get("subject");
    const type = searchParams.get("type"); // online_recorded, online_live, physical
    const gradeLevel = searchParams.get("gradeLevel");
    const district = searchParams.get("district");
    const status = searchParams.get("status"); // published, draft
    const schoolId = searchParams.get("schoolId");

    // Build conditions for school filtering
    const conditions = [];

    if (schoolId) {
      conditions.push(eq(tuitionCourses.schoolId, schoolId));
    }

    if (status && status !== "all") {
      conditions.push(eq(tuitionCourses.status, status));
    }

    // Get courses with tutor info
    const coursesList = await db.query.tuitionCourses.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(tuitionCourses.createdAt)],
    });

    // Fetch tutor information for each course
    const coursesWithTutors = await Promise.all(
      coursesList.map(async (course) => {
        let tutorName: string | null = null;
        let tutorDisplayId: string | null = null;
        let enrollmentCount = 0;

        // Get tutor info from tutors table
        if (course.tutorId) {
          const tutorRecord = await db.query.tutors.findFirst({
            where: eq(tutors.userId, course.tutorId),
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
          });

          if (tutorRecord) {
            const userArray = tutorRecord.user as unknown as { id: string; firstName: string | null; lastName: string | null; profilePicture: string | null }[] | undefined;
            const user = userArray?.[0];
            tutorName = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || null : null;
            tutorDisplayId = tutorRecord.id;
          }
        }

        // Get enrollment count
        const enrollmentCountResult = await db.query.tuitionEnrollments.findMany({
          where: eq(tuitionEnrollments, course.id),
        });
        enrollmentCount = enrollmentCountResult.length;

        return {
          ...course,
          tutorName,
          tutorDisplayId,
          enrollmentCount,
        };
      })
    );

    // Filter results
    let filtered = coursesWithTutors;

    if (type) {
      filtered = filtered.filter(c => c.type === type);
    }

    if (gradeLevel) {
      filtered = filtered.filter(c => c.gradeLevel === parseInt(gradeLevel));
    }

    if (district && type === "physical") {
      filtered = filtered.filter((c: typeof coursesWithTutors[0]) => {
        // location is a string, need to parse it as JSON to access district
        try {
          const locationData = c.location ? JSON.parse(c.location as string) : {};
          return locationData.district === district;
        } catch {
          return false;
        }
      });
    }

    // Only show published courses to non-authenticated or regular users
    if (!userId || status === "published") {
      filtered = filtered.filter(c => c.status === "published");
    }

    return NextResponse.json({ courses: filtered });
  } catch (error) {
    logger.error("Courses fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}

// POST /api/tuition/courses - Create course
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin', 'school-admin', 'teacher']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

    const body = await request.json();
    const validatedData = courseSchema.parse(body);

    // Verify tutor exists and get the user ID
    const tutor = await db.query.tutors.findFirst({
      where: eq(tutors.id, validatedData.tutorId),
      with: {
        user: true,
      },
    });

    if (!tutor) {
      return NextResponse.json({ error: "Tutor not found" }, { status: 404 });
    }

    // Extract user from the relation array
    const userArray = tutor.user as unknown as { id: string }[] | undefined;
    const tutorUser = userArray?.[0];
    if (!tutorUser) {
      return NextResponse.json({ error: "Tutor user not found" }, { status: 404 });
    }

    // Get school ID from current user
    const currentUserData = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { schoolId: true },
    });

    const courseId = `course_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    const [newCourse] = await db.insert(tuitionCourses).values({
      id: courseId,
      tutorId: tutorUser.id, // Store the user ID, not the tutor record ID
      title: validatedData.title,
      description: validatedData.description || "",
      category: validatedData.categoryId || "subject",
      level: validatedData.type === "online_recorded" ? "class10" : validatedData.type,
      grade: validatedData.gradeLevel || 10,
      gradeLevel: validatedData.gradeLevel || 10,
      duration: 60,
      pricePerSession: validatedData.price || 500,
      price: validatedData.price || 500,
      discountPrice: validatedData.discountPrice,
      currency: "BTN",
      maxStudents: validatedData.maxStudents || 30,
      currentStudents: 0,
      currentEnrollments: 0,
      schedule: validatedData.schedule || [],
      mode: validatedData.type.startsWith("online") ? "online" : "in_person",
      location: validatedData.location ? JSON.stringify(validatedData.location) : null,
      meetingLink: validatedData.meetingLink || null,
      thumbnail: validatedData.thumbnail || "/placeholder.png",
      tags: validatedData.tags || [],
      requirements: validatedData.requirements || [],
      prerequisites: validatedData.prerequisites || [],
      type: validatedData.type,
      status: validatedData.status || "draft",
      schoolId: currentUserData?.schoolId || null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return NextResponse.json({ course: newCourse }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    logger.error("Course creation error:", error);
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
  }
}
