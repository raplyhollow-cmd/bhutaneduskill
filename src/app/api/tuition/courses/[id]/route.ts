import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
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
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(['admin', 'school-admin', 'teacher']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = await params;

    const course = await db.query.tuitionCourses.findFirst({
      where: eq(tuitionCourses.id, id),
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Get tutor info
    let tutorInfo: { name: string; id: string } | null = null;
    if (course.tutorId) {
      const tutor = await db.query.tutors.findFirst({
        where: eq(tutors.userId, course.tutorId),
        with: {
          user: true,
        },
      });

      if (tutor) {
        const userArray = tutor.user as unknown as { id: string; firstName: string | null; lastName: string | null }[] | undefined;
        const user = userArray?.[0];
        tutorInfo = {
          id: tutor.id,
          name: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Tutor" : "Tutor",
        };
      }
    }

    return NextResponse.json({
      course: {
        ...course,
        tutorName: tutorInfo?.name,
        tutorDisplayId: tutorInfo?.id,
      },
    });
  } catch (error) {
    console.error("Course fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 });
  }
}

// PATCH /api/tuition/courses/[id] - Update course
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(['admin', 'school-admin', 'teacher']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user: currentUser } = authResult;

    const { id } = await params;
    const body = await request.json();

    // Check if course exists
    const existing = await db.query.tuitionCourses.findFirst({
      where: eq(tuitionCourses.id, id),
    });

    if (!existing) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // If updating tutor, verify tutor exists
    if (body.tutorId) {
      const tutor = await db.query.tutors.findFirst({
        where: eq(tutors.id, body.tutorId),
      });

      if (!tutor) {
        return NextResponse.json({ error: "Invalid tutor" }, { status: 400 });
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

    return NextResponse.json({ course: updated });
  } catch (error) {
    console.error("Course update error:", error);
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
  }
}

// DELETE /api/tuition/courses/[id] - Delete course
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(['admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = await params;

    // Check if course exists
    const existing = await db.query.tuitionCourses.findFirst({
      where: eq(tuitionCourses.id, id),
    });

    if (!existing) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Delete course (cascade will delete enrollments)
    await db.delete(tuitionCourses).where(eq(tuitionCourses.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Course deletion error:", error);
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 });
  }
}
