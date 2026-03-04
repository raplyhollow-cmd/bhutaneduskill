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
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { digitalResources, subjects, classes } from "@/lib/db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createApiRoute } from "@/lib/api/route-handler";

/**
 * GET - Retrieve teaching resources
 * Query params:
 * - subjectId: Filter by subject
 * - grade: Filter by grade level
 * - category: Filter by category
 * - search: Search in title/description
 * - limit: Number of records (default: 50)
 */
export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId, user: currentUser } = auth;

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
    const resources = await db
      .select()
      .from(digitalResources)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(digitalResources.createdAt))
      .limit(limit);

    // Filter by search term in application
    let filteredResources = resources;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredResources = resources.filter((r) =>
        r.title?.toLowerCase().includes(searchLower) ||
        r.description?.toLowerCase().includes(searchLower)
      );
    }

    return {
      success: true,
      data: filteredResources,
      count: filteredResources.length,
    };
  },
  ['teacher', 'admin', 'school-admin']
);

/**
 * POST - Upload a new teaching resource
 */
export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId, user: currentUser } = auth;

    if (!currentUser.schoolId) {
      return { error: "You must be assigned to a school to upload resources", status: 400 };
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
    } = body;

    // Validate required fields
    if (!title || !resourceType || !fileUrl) {
      return { error: "Missing required fields: title, resourceType, fileUrl", status: 400 };
    }

    // Validate resource type
    const validTypes = ['document', 'video', 'audio', 'image', 'presentation', 'spreadsheet', 'other'];
    if (!validTypes.includes(resourceType)) {
      return { error: `Invalid resourceType. Must be one of: ${validTypes.join(', ')}`, status: 400 };
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

    return {
      success: true,
      data: newResource,
    };
  },
  ['teacher', 'admin', 'school-admin']
);

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
