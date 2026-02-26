/**
 * ANNOUNCEMENTS API ROUTE
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 *
 * Handles CRUD operations for announcements
 */

import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { db } from "@/lib/db";
import { announcements, users, classes } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { successResponse, errorResponse, badRequestResponse, forbiddenResponse, notFoundResponse } from "@/lib/api/response-helpers";

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
export const GET = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId } = auth;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
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
  },
  ['admin', 'school-admin', 'teacher']
);

// POST /api/announcements - Create announcement
export const POST = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId, user } = auth;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true, type: true, schoolId: true, firstName: true, lastName: true },
    });

    if (!currentUser || (currentUser.type !== "teacher" && currentUser.type !== "admin")) {
      return forbiddenResponse("Only teachers and admins can create announcements");
    }

    const input: CreateAnnouncementInput = await request.json();
    const { title, content, targetAudience, classId, priority, isPinned, scheduledFor } = input;

    // Create announcement
    const [newAnnouncement] = await db.insert(announcements).values({
      ...({
        title,
        authorId: currentUser.id,
        authorName: `${currentUser.firstName} ${currentUser.lastName || ""}`.trim(),
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
  },
  ['admin', 'school-admin', 'teacher']
);

// DELETE /api/announcements/[id] - Delete announcement (handled separately in [id]/route.ts)
export const DELETE = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId, user } = auth;

    const { searchParams } = new URL(request.url);
    const announcementId = searchParams.get("id");

    if (!announcementId) {
      return badRequestResponse("Announcement ID required");
    }

    const announcement = await db.query.announcements.findFirst({
      where: eq(announcements.id, announcementId),
    });

    if (!announcement) {
      return notFoundResponse("Announcement");
    }

    // Check ownership
    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true, type: true },
    });

    if ((announcement as any).authorId !== currentUser.id && currentUser.type !== "admin") {
      return forbiddenResponse("You can only delete your own announcements");
    }

    await db.delete(announcements).where(eq(announcements.id, announcementId));

    // Revalidate cache
    revalidatePath("/dashboard");

    return NextResponse.json({ success: true });
  },
  ['admin', 'school-admin', 'teacher']
);
