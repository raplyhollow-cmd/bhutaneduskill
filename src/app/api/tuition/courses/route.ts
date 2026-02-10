import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { tuitionCourses, tutors, users, tuitionCategories } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
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
    startDate: z.string(),
    endDate: z.string(),
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
});

// GET /api/tuition/courses - List all courses
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    const { searchParams } = new URL(request.url);
    const subject = searchParams.get("subject");
    const type = searchParams.get("type"); // online_recorded, online_live, physical
    const gradeLevel = searchParams.get("gradeLevel");
    const district = searchParams.get("district");
    const status = searchParams.get("status"); // published, draft

    let conditions = [];

    if (status === "published") {
      // Filter by published status
    }

    const courses = await db.query.tuitionCourses.findMany({
      with: {
        tutor: {
          with: {
            user: {
              columns: {
                firstName: true,
                lastName: true,
                profilePicture: true,
              },
            },
          },
        },
        category: true,
      },
      orderBy: [desc(tuitionCourses.createdAt)],
    });

    // Filter results
    let filtered = courses;

    if (type) {
      filtered = filtered.filter(c => c.type === type);
    }

    if (gradeLevel) {
      filtered = filtered.filter(c => c.gradeLevel === parseInt(gradeLevel));
    }

    if (district && type === "physical") {
      filtered = filtered.filter(c => c.location?.district === district);
    }

    // Only show published courses to non-authenticated or regular users
    if (!userId || status === "published") {
      filtered = filtered.filter(c => c.status === "published");
    }

    return NextResponse.json({ courses: filtered });
  } catch (error) {
    console.error("Courses fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}

// POST /api/tuition/courses - Create course
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = courseSchema.parse(body);

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify tutor exists and belongs to user
    const tutor = await db.query.tutors.findFirst({
      where: eq(tutors.id, validatedData.tutorId),
    });

    if (!tutor || tutor.userId !== currentUser.id) {
      return NextResponse.json({ error: "Invalid tutor" }, { status: 400 });
    }

    const [newCourse] = await db.insert(tuitionCourses).values({
      id: `course_${Date.now()}`,
      tutorId: validatedData.tutorId,
      categoryId: validatedData.categoryId,
      title: validatedData.title,
      description: validatedData.description,
      thumbnail: validatedData.thumbnail,
      type: validatedData.type,
      location: validatedData.location,
      gradeLevel: validatedData.gradeLevel,
      maxStudents: validatedData.maxStudents,
      schedule: validatedData.schedule || [],
      lessons: validatedData.lessons || [],
      price: validatedData.price,
      discountPrice: validatedData.discountPrice,
      discountValidUntil: validatedData.discountValidUntil,
      currency: "BTN",
      status: "draft",
      currentEnrollments: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return NextResponse.json({ course: newCourse }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    console.error("Course creation error:", error);
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
  }
}
