import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { liveSessions, tutors, users } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";

const sessionSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  subject: z.string().min(1),
  sessionType: z.enum(["one_on_one", "group"]),
  scheduledDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  duration: z.number(),
  platform: z.enum(["zoom", "google_meet", "teams", "in_app"]),
  maxParticipants: z.number().optional(),
  pricePerStudent: z.number().optional(),
});

// GET /api/tuition/sessions - List upcoming sessions
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    const { searchParams } = new URL(request.url);
    const tutorId = searchParams.get("tutorId");
    const upcoming = searchParams.get("upcoming") === "true";

    // Build where condition based on filters
    const whereCondition = upcoming
      ? eq(liveSessions.status, "scheduled")
      : undefined;

    const sessions = await db.query.liveSessions.findMany({
      ...(whereCondition && { where: whereCondition }),
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
      },
      orderBy: [desc(liveSessions.createdAt)],
    });

    let filtered = sessions;
    if (tutorId) {
      filtered = sessions.filter(s => s.tutorId === tutorId);
    }

    return NextResponse.json({ sessions: filtered });
  } catch (error) {
    console.error("Sessions fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}

// POST /api/tuition/sessions - Schedule live session
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = sessionSchema.parse(body);

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get tutor profile
    const tutor = await db.query.tutors.findFirst({
      where: eq(tutors.userId, currentUser.id),
    });

    if (!tutor) {
      return NextResponse.json({ error: "Tutor profile not found" }, { status: 404 });
    }

    // Generate meeting link (placeholder - in production, integrate with Zoom/Google Meet API)
    const meetingLink = `https://meet.google.com/${Math.random().toString(36).substr(2, 10)}`;

    const [session] = await db.insert(liveSessions).values({
      id: `session_${Date.now()}`,
      tutorId: tutor.id,
      title: validatedData.title,
      description: validatedData.description,
      subject: validatedData.subject,
      scheduledStart: validatedData.scheduledDate || validatedData.startTime,
      startTime: validatedData.startTime,
      scheduledEnd: validatedData.endTime,
      platform: validatedData.platform,
      meetingLink,
      maxParticipants: validatedData.maxParticipants,
      currentParticipants: 0,
      status: "scheduled",
      notes: (validatedData as any).notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    console.error("Session creation error:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
