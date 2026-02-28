import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { db } from "@/lib/db";
import { tutors, users, tutorReviews } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// GET /api/tuition/tutors/[id] - Get tutor profile
export const GET = createApiRoute<{ id: string }>(
  async (request: NextRequest, auth, context) => {
    const { id } = await context!.params!;
    const [tutor] = await db
      .select({
        id: tutors.id,
        userId: tutors.userId,
        bio: tutors.bio,
        subjects: tutors.subjects,
        qualifications: tutors.qualifications,
        experience: tutors.experience,
        gradeLevels: tutors.gradeLevels,
        location: tutors.location,
        district: tutors.district,
        hourlyRate: tutors.hourlyRate,
        hourlyRateOnline: tutors.hourlyRateOnline,
        currency: tutors.currency,
        availability: tutors.availability,
        teachingMode: tutors.teachingMode,
        averageRating: tutors.averageRating,
        totalReviews: tutors.totalReviews,
        totalStudents: tutors.totalStudents,
        isVerified: tutors.isVerified,
        isActive: tutors.isActive,
        createdAt: tutors.createdAt,
        updatedAt: tutors.updatedAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profilePicture: users.profilePicture,
          email: users.email,
          phone: users.phone,
        },
      })
      .from(tutors)
      .leftJoin(users, eq(tutors.userId, users.id))
      .where(eq(tutors.id, id))
      .limit(1);

    if (!tutor) {
      return { error: "Tutor not found", status: 404 };
    }

    // Get recent reviews
    const reviews = await db
      .select({
        id: tutorReviews.id,
        tutorId: tutorReviews.tutorId,
        studentId: tutorReviews.studentId,
        rating: tutorReviews.rating,
        review: tutorReviews.review,
        response: tutorReviews.response,
        isPublic: tutorReviews.isPublic,
        createdAt: tutorReviews.createdAt,
        student: {
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(tutorReviews)
      .leftJoin(users, eq(tutorReviews.studentId, users.id))
      .where(
        and(
          eq(tutorReviews.tutorId, id),
          eq(tutorReviews.isPublic, true)
        )
      )
      .limit(10);

    return { tutor: { ...tutor, reviews } };
  },
  ['admin', 'school-admin']
);

// PUT /api/tuition/tutors/[id] - Update tutor profile
export const PUT = createApiRoute<{ id: string }>(
  async (request: NextRequest, auth, context) => {
    const { user: currentUser } = auth;

    const body = await request.json();
    const { bio, qualifications, experience, subjects, gradeLevels, location, district, hourlyRate, hourlyRateOnline, availability, teachingMode } = body;

    const { id } = await context!.params!;
    // Verify ownership
    const [tutor] = await db
      .select()
      .from(tutors)
      .where(eq(tutors.id, id))
      .limit(1);

    if (!tutor) {
      return { error: "Tutor not found", status: 404 };
    }

    if (tutor.userId !== currentUser.id) {
      return { error: "Forbidden", status: 403 };
    }

    const [updated] = await db.update(tutors)
      .set({
        ...(bio !== undefined && { bio }),
        ...(qualifications !== undefined && { qualifications }),
        ...(experience !== undefined && { experience }),
        ...(subjects !== undefined && { subjects }),
        ...(gradeLevels !== undefined && { gradeLevels }),
        ...(location !== undefined && { location }),
        ...(district !== undefined && { district }),
        ...(hourlyRate !== undefined && { hourlyRate }),
        ...(hourlyRateOnline !== undefined && { hourlyRateOnline }),
        ...(availability !== undefined && { availability }),
        ...(teachingMode !== undefined && { teachingMode }),
      })
      .where(eq(tutors.id, id))
      .returning();

    return { tutor: updated };
  },
  ['admin', 'school-admin']
);
