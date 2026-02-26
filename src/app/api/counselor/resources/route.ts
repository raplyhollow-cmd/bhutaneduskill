/**
 * COUNSELOR RESOURCES API
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 *
 * Provides access to counseling resources including:
 * - Career guidance materials
 * - College application resources
 * - Scholarship information
 * - Mental health resources
 * - Study skills materials
 */

import { NextRequest, NextResponse } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { db } from "@/lib/db";
import { counselorResources } from "@/lib/db/schema";
import { notifications, notificationDeliveries } from "@/lib/db/notifications-schema";
import { desc, eq, and, like, or, sql, count } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";
import { successResponse, errorResponse, badRequestResponse } from "@/lib/api/response-helpers";

// Type definitions for proper type safety
interface CreateResourceRequest {
  title: string;
  description: string;
  resourceType: string;
  format: string;
  category: string;
  tags: string[];
  accessUrl: string;
  thumbnailUrl: string;
  isFeatured: boolean;
}

interface UpdateResourceRequest extends CreateResourceRequest {
  id: string;
}

interface ShareResourceRequest {
  resourceId: string;
  studentIds: string[];
  message?: string;
}

interface ResourceCategory {
  id: string;
  name: string;
  icon: string;
  count: number;
  color: string;
}

// Category configuration
const CATEGORIES: Record<string, { name: string; icon: string; color: string }> = {
  career: { name: "Career Guidance", icon: "GraduationCap", color: "bg-blue-100 text-blue-700" },
  college: { name: "College Resources", icon: "Briefcase", color: "bg-green-100 text-green-700" },
  scholarship: { name: "Scholarship Info", icon: "Heart", color: "bg-red-100 text-red-700" },
  mental: { name: "Mental Health", icon: "Brain", color: "bg-purple-100 text-purple-700" },
  study: { name: "Study Skills", icon: "BookOpen", color: "bg-yellow-100 text-yellow-700" },
  tools: { name: "Tools & Templates", icon: "FileText", color: "bg-gray-100 text-gray-700" },
  video: { name: "Video Resources", icon: "Video", color: "bg-indigo-100 text-indigo-700" },
  assessment: { name: "Assessment Templates", icon: "TrendingUp", color: "bg-teal-100 text-teal-700" },
  intervention: { name: "Intervention Strategies", icon: "Users", color: "bg-orange-100 text-orange-700" },
};

// GET /api/counselor/resources - Fetch all resources with filtering
export const GET = createApiRoute(
  async (request, auth) => {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category") || "all";
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "all";
    const featured = searchParams.get("featured") === "true";

    try {
      // Build query conditions
      const conditions = [
        eq(counselorResources.isActive, true),
      ];

      // Add search filter
      if (search) {
        conditions.push(
          or(
            like(counselorResources.title, `%${search}%`),
            like(counselorResources.description, `%${search}%`)
          )!
        );
      }

      // Add category filter
      if (category !== "all") {
        conditions.push(eq(counselorResources.category, category));
      }

      // Add type filter
      if (type !== "all") {
        conditions.push(eq(counselorResources.type, type));
      }

      // Add featured filter
      if (featured) {
        conditions.push(eq(counselorResources.isPublic, true));
      }

      // Build where clause
      const whereClause = and(...conditions);

      // Fetch resources
      const resources = await db
        .select({
          id: counselorResources.id,
          title: counselorResources.title,
          description: counselorResources.description,
          type: counselorResources.type,
          category: counselorResources.category,
          url: counselorResources.url,
          content: counselorResources.content,
          tags: counselorResources.tags,
          targetAudience: counselorResources.targetAudience,
          isPublic: counselorResources.isPublic,
          viewCount: counselorResources.viewCount,
          downloadCount: counselorResources.downloadCount,
          createdAt: counselorResources.createdAt,
          updatedAt: counselorResources.updatedAt,
        })
        .from(counselorResources)
        .where(whereClause)
        .orderBy(desc(counselorResources.createdAt))
        .limit(100);

      // Fetch categories with counts
      const categoryCounts = await db
        .select({
          category: counselorResources.category,
          count: count(),
        })
        .from(counselorResources)
        .where(eq(counselorResources.isActive, true))
        .groupBy(counselorResources.category);

      const categories: ResourceCategory[] = Object.keys(CATEGORIES).map((catId) => {
        const catCount = categoryCounts.find((c) => c.category === catId);
        return {
          id: catId,
          name: CATEGORIES[catId].name,
          icon: CATEGORIES[catId].icon,
          count: catCount?.count || 0,
          color: CATEGORIES[catId].color,
        };
      }).filter((cat) => cat.count > 0);

      // Calculate stats
      const totalResources = resources.length;
      const totalDownloads = resources.reduce((sum, r) => sum + (r.downloadCount || 0), 0);
      const featuredCount = resources.filter((r) => r.isPublic).length;

      logger.info("Counselor resources fetched", {
        resourceCount: totalResources,
        categoriesCount: categories.length,
      });

      return NextResponse.json({
        resources: resources.map((r) => ({
          ...r,
          resourceType: r.type,
          format: r.type,
          addedDate: new Date(r.createdAt).toISOString(),
          isFeatured: r.isPublic,
          downloads: r.downloadCount || 0,
          views: r.viewCount || 0,
          url: r.url || "#",
          thumbnail: (r.content as any)?.thumbnailUrl || null,
        })),
        categories,
        stats: {
          totalResources,
          totalDownloads,
          featuredCount,
          categoriesCount: categories.length,
        },
      });
    } catch (error) {
      logger.apiError(error, { route: "/api/counselor/resources", method: "GET" });
      return NextResponse.json(
        {
          error: "Failed to fetch resources",
          resources: [],
          categories: [],
          stats: { totalResources: 0, totalDownloads: 0, featuredCount: 0, categoriesCount: 0 }
        },
        { status: 500 }
      );
    }
  },
  ['student', 'teacher', 'counselor', 'school-admin', 'admin']
);

// POST /api/counselor/resources - Create new resource (admin/counselor only)
export const POST = createApiRoute(
  async (request, auth) => {
    const { userId } = auth;
    const body: CreateResourceRequest = await request.json();

    const {
      title,
      description,
      resourceType,
      format,
      category,
      tags = [],
      accessUrl,
      thumbnailUrl,
      isFeatured = false,
    } = body;

    try {
      // Validate required fields
      if (!title || !description || !resourceType || !category) {
        return badRequestResponse("Missing required fields: title, description, resourceType, and category are required");
      }

      // Validate category exists
      if (!CATEGORIES[category]) {
        return badRequestResponse(`Invalid category: ${category}. Must be one of: ${Object.keys(CATEGORIES).join(", ")}`);
      }

      const resourceId = `resource_${Date.now()}_${nanoid(8)}`;
      const now = new Date();

      // Prepare content object with thumbnail URL if provided
      const content: Record<string, unknown> = {};
      if (thumbnailUrl) {
        content.thumbnailUrl = thumbnailUrl;
      }

      // Create new resource
      const [newResource] = await db
        .insert(counselorResources)
        .values({
          id: resourceId,
          schoolId: "platform", // Platform-wide resources
          title,
          description,
          type: resourceType,
          category,
          url: accessUrl || "",
          content: Object.keys(content).length > 0 ? content : null,
          tags: isFeatured ? [...tags, "featured"] : tags,
          targetAudience: "all",
          isPublic: isFeatured,
          isActive: true,
          viewCount: 0,
          downloadCount: 0,
          createdBy: userId,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      logger.info("Counselor resource created", {
        resourceId,
        title,
        category,
        createdBy: userId,
      });

      return NextResponse.json({
        success: true,
        resource: newResource,
      });
    } catch (error) {
      logger.apiError(error, { route: "/api/counselor/resources", method: "POST" });
      return errorResponse("Failed to create resource", 500);
    }
  },
  ['admin', 'counselor']
);

// PATCH /api/counselor/resources - Update resource (admin/counselor only)
export const PATCH = createApiRoute(
  async (request, auth) => {
    const { userId } = auth;
    const body: UpdateResourceRequest = await request.json();
    const { id, ...updates } = body;

    try {
      if (!id) {
        return badRequestResponse("Resource ID required");
      }

      // Validate category if provided
      if (updates.category && !CATEGORIES[updates.category]) {
        return badRequestResponse(`Invalid category: ${updates.category}`);
      }

      // Prepare update data
      const updateData: Record<string, unknown> = {
        ...updates,
        updatedAt: new Date(),
      };

      // Handle content object for thumbnail
      if (updates.thumbnailUrl !== undefined) {
        const existingResource = await db
          .select({ content: counselorResources.content })
          .from(counselorResources)
          .where(eq(counselorResources.id, id))
          .limit(1);

        const existingContent = (existingResource[0]?.content as Record<string, unknown>) || {};
        updateData.content = {
          ...existingContent,
          thumbnailUrl: updates.thumbnailUrl,
        };
        delete updateData.thumbnailUrl;
      }

      // Map isFeatured to isPublic
      if (updates.isFeatured !== undefined) {
        updateData.isPublic = updates.isFeatured;
        delete updateData.isFeatured;

        // Update tags to include/remove featured
        if (updateData.tags) {
          const tags = updateData.tags as string[];
          if (updates.isFeatured && !tags.includes("featured")) {
            (updateData.tags as string[]) = [...tags, "featured"];
          } else if (!updates.isFeatured) {
            (updateData.tags as string[]) = tags.filter((t: string) => t !== "featured");
          }
        }
      }

      // Map resourceType to type
      if (updates.resourceType !== undefined) {
        updateData.type = updates.resourceType;
        delete updateData.resourceType;
      }

      // Map accessUrl to url
      if (updates.accessUrl !== undefined) {
        updateData.url = updates.accessUrl;
        delete updateData.accessUrl;
      }

      // Update resource
      const updated = await db
        .update(counselorResources)
        .set(updateData)
        .where(eq(counselorResources.id, id))
        .returning();

      if (updated.length === 0) {
        return NextResponse.json({ error: "Resource not found" }, { status: 404 });
      }

      logger.info("Counselor resource updated", {
        resourceId: id,
        updatedBy: userId,
      });

      return NextResponse.json({
        success: true,
        resource: updated[0],
      });
    } catch (error) {
      logger.apiError(error, { route: "/api/counselor/resources", method: "PATCH" });
      return errorResponse("Failed to update resource", 500);
    }
  },
  ['admin', 'counselor']
);

// DELETE /api/counselor/resources - Delete resource (admin only)
export const DELETE = createApiRoute(
  async (request, auth) => {
    const { userId } = auth;
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    try {
      if (!id) {
        return badRequestResponse("Resource ID required");
      }

      // Soft delete by setting isActive to false
      await db
        .update(counselorResources)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(counselorResources.id, id));

      logger.info("Counselor resource deleted", {
        resourceId: id,
        deletedBy: userId,
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      logger.apiError(error, { route: "/api/counselor/resources", method: "DELETE" });
      return errorResponse("Failed to delete resource", 500);
    }
  },
  ['admin']
);
