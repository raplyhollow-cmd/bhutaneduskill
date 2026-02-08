import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { tutors, users, tutorReviews } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface Params {
  params: { id: string };
}

// GET /api/tuition/tutors/[id] - Get tutor profile
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const tutor = await db.query.tutors.findFirst({
      where: eq(tutors.id, params.id),
      with: {
        user: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!tutor) {
      return NextResponse.json({ error: "Tutor not found" }, { status: 404 });
    }

    // Get recent reviews
    const reviews = await db.query.tutorReviews.findMany({
      where: eq(tutorReviews.tutorId, params.id),
      where: eq(tutorReviews.isPublic, true),
      with: {
        student: {
          columns: {
            firstName: true,
            lastName: true,
          },
        },
      },
      limit: 10,
    });

    return NextResponse.json({ tutor: { ...tutor, reviews } });
  } catch (error) {
    console.error("Tutor fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch tutor" }, { status: 500 });
  }
}

// PUT /api/tuition/tutors/[id] - Update tutor profile
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { bio, qualifications, experience, subjects, gradeLevels, location, travelRadius, hourlyRateOnline, hourlyRatePhysical, availableDays, availableSlots, bankAccount } = body;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify ownership
    const tutor = await db.query.tutors.findFirst({
      where: eq(tutors.id, params.id),
    });

    if (!tutor) {
      return NextResponse.json({ error: "Tutor not found" }, { status: 404 });
    }

    if (tutor.userId !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [updated] = await db.update(tutors)
      .set({
        ...(bio !== undefined && { bio }),
        ...(qualifications !== undefined && { qualifications }),
        ...(experience !== undefined && { experience }),
        ...(subjects !== undefined && { subjects }),
        ...(gradeLevels !== undefined && { gradeLevels }),
        ...(location !== undefined && { location }),
        ...(travelRadius !== undefined && { travelRadius }),
        ...(hourlyRateOnline !== undefined && { hourlyRateOnline }),
        ...(hourlyRatePhysical !== undefined && { hourlyRatePhysical }),
        ...(availableDays !== undefined && { availableDays }),
        ...(availableSlots !== undefined && { availableSlots }),
        ...(bankAccount !== undefined && { bankAccount }),
      })
      .where(eq(tutors.id, params.id))
      .returning();

    return NextResponse.json({ tutor: updated });
  } catch (error) {
    console.error("Tutor update error:", error);
    return NextResponse.json({ error: "Failed to update tutor" }, { status: 500 });
  }
}
