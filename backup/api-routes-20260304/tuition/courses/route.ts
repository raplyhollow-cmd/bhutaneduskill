import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { db } from "@/lib/db";
import { tuitionCourses, tutors, users, tuitionCategories, tuitionEnrollments } from "@/lib/db/schema";
import { eq, desc, and, asc } from "drizzle-orm";
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
export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId } = auth;

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
    const coursesList = await db.select()
      .from(tuitionCourses)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(tuitionCourses.createdAt));

    // Fetch tutor information for each course
    const coursesWithTutors = await Promise.all(
      coursesList.map(async (course) => {
        let tutorName: string | null = null;
        let tutorDisplayId: string | null = null;
        let enrollmentCount = 0;

        // Get tutor info from tutors table
        if (course.tutorId) {
          const [tutorRecord] = await db
            .select({
              id: tutors.id,
              userId: tutors.userId,
              userFirstName: users.firstName,
              userLastName: users.lastName,
              userProfilePicture: users.profilePicture,
            })
            .from(tutors)
            .innerJoin(users, eq(tutors.userId, users.id))
            .where(eq(tutors.userId, course.tutorId))
            .limit(1);

          if (tutorRecord) {
            tutorName = `${tutorRecord.userFirstName || ""} ${tutorRecord.userLastName || ""}`.trim() || null;
            tutorDisplayId = tutorRecord.id;
          }
        }

        // Get enrollment count
        const enrollmentCountResult = await db.select().from(tuitionEnrollments).where(eq(tuitionEnrollments.courseId, course.id));
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

    return { courses: filtered };
  },
  ['admin', 'school-admin', 'teacher']
);

// POST /api/tuition/courses - Create course
export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId, user } = auth;

    const body = await request.json();
    const validatedData = courseSchema.parse(body);

    // Verify tutor exists and get the user ID
    const [tutor] = await db
      .select({
        id: tutors.id,
        userId: tutors.userId,
      })
      .from(tutors)
      .where(eq(tutors.id, validatedData.tutorId))
      .limit(1);

    if (!tutor) {
      return { error: "Tutor not found", status: 404 };
    }

    const tutorUser = { id: tutor.userId };

    // Get school ID from current user
    const currentUserData = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

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
      schoolId: currentUserData[0]?.schoolId || null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return { course: newCourse };
  },
  ['admin', 'school-admin', 'teacher']
);
