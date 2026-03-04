import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { db } from "@/lib/db";
import { tuitionCourses, users, tutors } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const courseUpdateSchema = z.object({
  tutorId: z.string().optional(),
  categoryId: z.string().optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
  type: z.enum(["online_recorded", "online_live", "physical"]).optional(),
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
  price: z.number().optional(),
  discountPrice: z.number().optional(),
  discountValidUntil: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
});

// GET /api/tuition/courses/[id] - Get single course
export const GET = createApiRoute<{ id: string }>(
  async (request: NextRequest, auth, context) => {
    const { id } = await context!.params!;

    const course = await db.select().from(tuitionCourses).where(eq(tuitionCourses.id, id)).limit(1).then(r => r[0]);

    if (!course) {
      return { error: "Course not found", status: 404 };
    }

    // Get tutor info
    let tutorInfo: { name: string; id: string } | null = null;
    if (course.tutorId) {
      const [tutor] = await db
        .select({
          id: tutors.id,
          userId: tutors.userId,
          userFirstName: users.firstName,
          userLastName: users.lastName,
        })
        .from(tutors)
        .innerJoin(users, eq(tutors.userId, users.id))
        .where(eq(tutors.userId, course.tutorId))
        .limit(1);

      if (tutor) {
        tutorInfo = {
          id: tutor.id,
          name: `${tutor.userFirstName || ""} ${tutor.userLastName || ""}`.trim() || "Tutor",
        };
      }
    }

    return {
      course: {
        ...course,
        tutorName: tutorInfo?.name,
        tutorDisplayId: tutorInfo?.id,
      },
    };
  },
  ['admin', 'school-admin', 'teacher']
);

// PATCH /api/tuition/courses/[id] - Update course
export const PATCH = createApiRoute<{ id: string }>(
  async (request: NextRequest, auth, context) => {
    const { user: currentUser } = auth;

    const { id } = await context!.params!;
    const body = await request.json();

    // Check if course exists
    const existing = await db.select().from(tuitionCourses).where(eq(tuitionCourses.id, id)).limit(1).then(r => r[0]);

    if (!existing) {
      return { error: "Course not found", status: 404 };
    }

    // If updating tutor, verify tutor exists
    if (body.tutorId) {
      const tutor = await db.select().from(tutors).where(eq(tutors.id, body.tutorId)).limit(1).then(r => r[0]);

      if (!tutor) {
        return { error: "Invalid tutor", status: 400 };
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.type !== undefined) {
      updateData.type = body.type;
      updateData.mode = body.type.startsWith("online") ? "online" : "in_person";
    }
    if (body.categoryId !== undefined) updateData.category = body.categoryId;
    if (body.gradeLevel !== undefined) {
      updateData.gradeLevel = body.gradeLevel;
      updateData.grade = body.gradeLevel;
    }
    if (body.price !== undefined) {
      updateData.price = body.price;
      updateData.pricePerSession = body.price;
    }
    if (body.discountPrice !== undefined) updateData.discountPrice = body.discountPrice;
    if (body.maxStudents !== undefined) updateData.maxStudents = body.maxStudents;
    if (body.thumbnail !== undefined) updateData.thumbnail = body.thumbnail;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.schedule !== undefined) updateData.schedule = body.schedule;
    if (body.location !== undefined) updateData.location = JSON.stringify(body.location);
    if (body.tutorId !== undefined) updateData.tutorId = body.tutorId;

    const [updated] = await db
      .update(tuitionCourses)
      .set(updateData)
      .where(eq(tuitionCourses.id, id))
      .returning();

    return { course: updated };
  },
  ['admin', 'school-admin', 'teacher']
);

// DELETE /api/tuition/courses/[id] - Delete course
export const DELETE = createApiRoute<{ id: string }>(
  async (request: NextRequest, auth, context) => {
    const { id } = await context!.params!;

    // Check if course exists
    const existing = await db.select().from(tuitionCourses).where(eq(tuitionCourses.id, id)).limit(1).then(r => r[0]);

    if (!existing) {
      return { error: "Course not found", status: 404 };
    }

    // Delete course (cascade will delete enrollments)
    await db.delete(tuitionCourses).where(eq(tuitionCourses.id, id));

    return { success: true };
  },
  ['admin', 'school-admin']
);
