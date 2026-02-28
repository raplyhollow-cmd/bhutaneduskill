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

    const currentUserResult = await db
      .select({ schoolId: users.schoolId, type: users.type })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const currentUser = currentUserResult[0];

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");

    let fetchedAnnouncements = await db
      .select({
        id: announcements.id,
        title: announcements.title,
        content: announcements.content,
        targetAudience: announcements.targetAudience,
        classId: announcements.classId,
        schoolId: announcements.schoolId,
        priority: announcements.priority,
        isPinned: announcements.isPinned,
        isPublished: announcements.isPublished,
        createdAt: announcements.createdAt,
        updatedAt: announcements.updatedAt,
        authorId: announcements.authorId,
        authorName: announcements.authorName,
        creatorId: users.id,
        creatorFirstName: users.firstName,
        creatorLastName: users.lastName,
        classIdRef: classes.id,
        className: classes.name,
      })
      .from(announcements)
      .leftJoin(users, eq(announcements.authorId, users.id))
      .leftJoin(classes, eq(announcements.classId, classes.id))
      .where(
        and(
          eq(announcements.schoolId, currentUser?.schoolId || ""),
          sql`${announcements.isPublished} = 1`
        )
      )
      .orderBy(desc(announcements.isPinned), desc(announcements.createdAt));

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

    const currentUserResult = await db
      .select({
        id: users.id,
        type: users.type,
        schoolId: users.schoolId,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const currentUser = currentUserResult[0];

    if (!currentUser || (currentUser.type !== "teacher" && currentUser.type !== "admin")) {
      return forbiddenResponse("Only teachers and admins can create announcements");
    }

    const input: CreateAnnouncementInput = await request.json();
    const { title, content, targetAudience, classId, priority, isPinned, scheduledFor } = input;

    const now = new Date();

    // Create announcement
    const [newAnnouncement] = await db.insert(announcements).values({
      id: `announcement-${Date.now()}`,
      title,
      content,
      excerpt: content.substring(0, 200),
      targetAudience,
      classId: classId || null,
      schoolId: currentUser.schoolId,
      priority: priority === "high" ? "high" : priority === "medium" ? "normal" : "low",
      isPinned: isPinned || false,
      isPublished: isPinned || false,
      targetGradeLevel: "",
      targetClassIds: null,
      targetUserIds: null,
      category: "general",
      publishDate: scheduledFor ? scheduledFor.toISOString() : now.toISOString(),
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      authorId: currentUser.id,
      authorName: `${currentUser.firstName} ${currentUser.lastName || ""}`.trim(),
      authorRole: currentUser.type,
      publishedAt: now,
      viewCount: 0,
      isArchived: false,
      attachments: [],
      createdAt: now,
      updatedAt: now,
    }).returning();

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

    const announcementResult = await db
      .select()
      .from(announcements)
      .where(eq(announcements.id, announcementId))
      .limit(1);
    const announcement = announcementResult[0];

    if (!announcement) {
      return notFoundResponse("Announcement");
    }

    // Check ownership
    const currentUserResult = await db
      .select({ id: users.id, type: users.type })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const currentUser = currentUserResult[0];

    if ((announcement as { authorId?: string })?.authorId !== currentUser.id && currentUser.type !== "admin") {
      return forbiddenResponse("You can only delete your own announcements");
    }

    await db.delete(announcements).where(eq(announcements.id, announcementId));

    // Revalidate cache
    revalidatePath("/dashboard");

    return NextResponse.json({ success: true });
  },
  ['admin', 'school-admin', 'teacher']
);
