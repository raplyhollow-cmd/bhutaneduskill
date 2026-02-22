/**
 * TEACHER RESOURCE MANAGEMENT API
 *
 * Extends existing digitalResources table for teacher-to-teacher sharing
 *
 * POST /api/teacher/resources - Upload a new resource
 * GET /api/teacher/resources - Get resources for teacher's school
 * PATCH /api/teacher/resources/:id - Update resource
 * DELETE /api/teacher/resources/:id - Delete resource
 */

import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { digitalResources, subjects, classes } from "@/lib/db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";

/**
 * GET - Retrieve teaching resources
 * Query params:
 * - subjectId: Filter by subject
 * - grade: Filter by grade level
 * - category: Filter by category
 * - search: Search in title/description
 * - limit: Number of records (default: 50)
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(['teacher', 'admin', 'school-admin']);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { userId, user: currentUser } = authResult;

  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');
    const grade = searchParams.get('grade');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build conditions
    const conditions = [];

    // Teachers can only see resources from their school
    if (currentUser.schoolId) {
      conditions.push(eq(digitalResources.schoolId, currentUser.schoolId));
    }

    // Filter by access level (teachers can see teacher and public resources)
    conditions.push(inArray(digitalResources.accessLevel, ['teacher', 'public', 'student']));

    if (subjectId) {
      // Would need subject filtering - placeholder for now
      // conditions.push(eq(digitalResources.subjectId, subjectId));
    }

    if (category) {
      // conditions.push(eq(digitalResources.category, category));
    }

    // Fetch resources
    const resources = await db.query.digitalResources.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(digitalResources.createdAt)],
      limit,
    });

    // Filter by search term in application
    let filteredResources = resources;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredResources = resources.filter((r) =>
        r.title?.toLowerCase().includes(searchLower) ||
        r.description?.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({
      success: true,
      data: filteredResources,
      count: filteredResources.length,
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/teacher/resources", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 500 }
    );
  }
}

/**
 * POST - Upload a new teaching resource
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(['teacher']);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { userId, user: currentUser } = authResult;

  try {
    if (!currentUser.schoolId) {
      return NextResponse.json(
        { error: "You must be assigned to a school to upload resources" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      resourceType,
      format,
      fileUrl,
      fileSize,
      category,
      tags,
      chapterId,
      subjectId,
      grade,
    } = body;

    // Validate required fields
    if (!title || !resourceType || !fileUrl) {
      return NextResponse.json(
        { error: "Missing required fields: title, resourceType, fileUrl" },
        { status: 400 }
      );
    }

    // Validate resource type
    const validTypes = ['document', 'video', 'audio', 'image', 'presentation', 'spreadsheet', 'other'];
    if (!validTypes.includes(resourceType)) {
      return NextResponse.json(
        { error: `Invalid resourceType. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const resourceId = `resource-${nanoid()}`;
    const now = new Date();

    // Create resource
    const [newResource] = await db.insert(digitalResources).values({
      id: resourceId,
      schoolId: currentUser.schoolId,
      title,
      description: description || null,
      resourceType,
      format: format || getResourceFormatFromUrl(fileUrl),
      fileUrl,
      fileSize: fileSize || null,
      duration: null,
      pages: null,
      author: `${currentUser.firstName} ${currentUser.lastName || ''}`.trim(),
      publisher: null,
      publicationYear: null,
      isbn: null,
      category: category || null,
      tags: tags || [],
      language: 'en',
      coverImage: null,
      accessLevel: 'teacher',
      downloadAllowed: true,
      uploadedBy: userId,
      createdAt: now,
      updatedAt: now,
    }).returning();

    logger.info("Teaching resource uploaded", {
      resourceId,
      teacherId: userId,
      schoolId: currentUser.schoolId,
      resourceType,
    });

    return NextResponse.json({
      success: true,
      data: newResource,
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/teacher/resources", method: "POST" });
    return NextResponse.json(
      { error: "Failed to upload resource" },
      { status: 500 }
    );
  }
}

// Helper function to determine format from URL
function getResourceFormatFromUrl(url: string): string {
  const extension = url.split('.').pop()?.toLowerCase();
  const formatMap: Record<string, string> = {
    'pdf': 'pdf',
    'doc': 'doc',
    'docx': 'docx',
    'ppt': 'ppt',
    'pptx': 'pptx',
    'xls': 'xls',
    'xlsx': 'xlsx',
    'mp4': 'mp4',
    'mp3': 'mp3',
    'jpg': 'jpg',
    'jpeg': 'jpg',
    'png': 'png',
    'gif': 'gif',
  };
  return formatMap[extension || ''] || 'unknown';
}
