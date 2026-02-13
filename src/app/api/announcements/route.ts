/**
 * ANNOUNCEMENTS API ROUTE
 *
 * Handles CRUD operations for announcements
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { announcements as announcements, users, classes } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface CreateAnnouncementInput {
  title: string;
  content: string;
  targetAudience: "all" | "students" | "parents" | "teachers";
  classId?: string;
  priority: "low" | "medium" | "high";
  isPinned?: boolean;
  scheduledFor?: Date;
}

// GET /api/announcements - Fetch announcements
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
      columns: { schoolId: true, type: true },
    });

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");

    let fetchedAnnouncements = await db.query.announcements.findMany({
      where: and(
        eq(announcements.schoolId, currentUser?.schoolId || ""),
        sql`${announcements.isPublished} = 1`
      ),
      with: {
        createdBy: {
          columns: { id: true, firstName: true, lastName: true },
        },
        class: {
          columns: { id: true, name: true },
        },
      },
      orderBy: [desc(announcements.isPinned), desc(announcements.createdAt)],
    });

    // Filter by class if specified
    if (classId) {
      fetchedAnnouncements = fetchedAnnouncements.filter((a) => a.classId === classId);
    }

    return NextResponse.json({ announcements: fetchedAnnouncements });
  } catch (error) {
    console.error("Announcements fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch announcements" }, { status: 500 });
  }
}

// POST /api/announcements - Create announcement
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
      columns: { id: true, type: true, schoolId: true },
    });

    if (!currentUser || ((currentUser as any).type !== "teacher" && (currentUser as any).type !== "admin")) {
      return NextResponse.json({ error: "Forbidden - Only teachers and admins can create announcements" }, { status: 403 });
    }

    const input: CreateAnnouncementInput = await request.json();
    const { title, content, targetAudience, classId, priority, isPinned, scheduledFor } = input;

    // Create announcement
    const [newAnnouncement] = await db.insert(announcements).values({
      ...({
        title,
        authorId: currentUser.id,
        authorName: `${(currentUser as any).firstName} ${(currentUser as any).lastName || ""}`.trim(),
      }),
      content,
      targetAudience,
      classId: classId || null,
      schoolId: currentUser.schoolId,
      priority: priority === "high" ? 3 : priority === "medium" ? 2 : 1,
      isPinned: isPinned ? 1 : 0,
      isPublished: isPinned ? 1 : 0,
      createdAt: Math.floor(Date.now() / 1000),
      updatedAt: Math.floor(Date.now() / 1000),
    } as any).returning();

    // Revalidate cache
    revalidatePath("/dashboard");

    return NextResponse.json({ success: true, announcement: newAnnouncement });
  } catch (error) {
    console.error("Announcement creation error:", error);
    return NextResponse.json({ error: "Failed to create announcement" }, { status: 500 });
  }
}

// DELETE /api/announcements/[id] - Delete announcement (handled separately in [id]/route.ts)
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const announcementId = searchParams.get("id");

    if (!announcementId) {
      return NextResponse.json({ error: "Announcement ID required" }, { status: 400 });
    }

    const announcement = await db.query.announcements.findFirst({
      where: eq(announcements.id, announcementId),
    });

    if (!announcement) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    // Check ownership
    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
      columns: { id: true, type: true },
    });

    if ((announcement as any).authorId !== currentUser.id && (currentUser as any).type !== "admin") {
      return NextResponse.json({ error: "You can only delete your own announcements" }, { status: 403 });
    }

    await db.delete(announcements).where(eq(announcements.id, announcementId));

    // Revalidate cache
    revalidatePath("/dashboard");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Announcement delete error:", error);
    return NextResponse.json({ error: "Failed to delete announcement" }, { status: 500 });
  }
}
