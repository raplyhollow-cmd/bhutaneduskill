/**
 * COUNSELOR RESOURCES API
 *
 * Provides access to counseling resources including:
 * - Career guidance materials
 * - College application resources
 * - Scholarship information
 * - Mental health resources
 * - Study skills materials
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { digitalResources } from "@/lib/db/library-schema";
import { desc, eq, and, like, or, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

// GET /api/counselor/resources - Fetch all resources with filtering
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category") || "all";
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "all";
    const featured = searchParams.get("featured") === "true";

    // Build query conditions
    const conditions = [];

    // Add search filter
    if (search) {
      conditions.push(
        or(
          like(digitalResources.title, `%${search}%`),
          like(digitalResources.description, `%${search}%`)
        )
      );
    }

    // Add category filter (using tags for categorization)
    if (category !== "all") {
      // Check if category exists in tags array
      conditions.push(sql`${digitalResources.tags} LIKE ${`%${category}%`}`);
    }

    // Add type filter
    if (type !== "all") {
      conditions.push(eq(digitalResources.resourceType, type));
    }

    // Add featured filter
    if (featured) {
      // For now, mark all with certain tags as featured
      conditions.push(sql`${digitalResources.tags} LIKE ${`%featured%`}`);
    }

    // Build where clause
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Fetch resources
    const resources = await db
      .select({
        id: digitalResources.id,
        title: digitalResources.title,
        description: digitalResources.description,
        resourceType: digitalResources.resourceType,
        format: digitalResources.format,
        fileSize: digitalResources.fileSize,
        accessUrl: digitalResources.accessUrl,
        thumbnailUrl: digitalResources.thumbnailUrl,
        subjects: digitalResources.subjects,
        tags: digitalResources.tags,
        totalDownloads: digitalResources.totalDownloads,
        totalViews: digitalResources.totalViews,
        isActive: digitalResources.isActive,
        createdAt: digitalResources.createdAt,
      })
      .from(digitalResources)
      .where(whereClause)
      .orderBy(desc(digitalResources.createdAt))
      .limit(100);

    // Fetch categories (based on unique tags)
    const allResources = await db
      .select({ tags: digitalResources.tags })
      .from(digitalResources)
      .where(sql`${digitalResources.isActive} = 1`);

    // Extract unique categories from tags
    const categoryMap = new Map<string, number>();
    const categoryIcons: Record<string, string> = {
      career: "GraduationCap",
      college: "Briefcase",
      scholarship: "Heart",
      mental: "Brain",
      study: "BookOpen",
      tools: "FileText",
      video: "Video",
    };

    allResources.forEach((resource) => {
      const tags = resource.tags as string[] || [];
      tags.forEach((tag) => {
        if (Object.keys(categoryIcons).includes(tag)) {
          categoryMap.set(tag, (categoryMap.get(tag) || 0) + 1);
        }
      });
    });

    const categories = Array.from(categoryMap.entries()).map(([id, count]) => ({
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      icon: categoryIcons[id] || "BookOpen",
      count,
    }));

    // Calculate stats
    const totalResources = resources.length;
    const totalDownloads = resources.reduce((sum, r) => sum + (r.totalDownloads || 0), 0);
    const featuredCount = resources.filter((r) =>
      (r.tags as string[] || []).includes("featured")
    ).length;

    return NextResponse.json({
      resources: resources.map((r) => ({
        ...r,
        category: (r.tags as string[] || [])[0] || "tools", // Use first tag as category
        type: r.format || "document",
        addedDate: new Date(r.createdAt as number).toISOString(),
        isFeatured: (r.tags as string[] || []).includes("featured"),
        downloads: r.totalDownloads || 0,
        views: r.totalViews || 0,
        fileSize: r.fileSize ? `${Math.round((r.fileSize / 1024)).toString()} KB` : undefined,
        url: r.accessUrl || "#",
        thumbnail: r.thumbnailUrl,
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
    console.error("Error fetching counselor resources:", error);
    return NextResponse.json(
      { error: "Failed to fetch resources", resources: [], categories: [], stats: { totalResources: 0, totalDownloads: 0, featuredCount: 0, categoriesCount: 0 } },
      { status: 500 }
    );
  }
}

// POST /api/counselor/resources - Create new resource
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
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

    // Validate required fields
    if (!title || !description || !resourceType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create new resource
    const newResource = await db
      .insert(digitalResources)
      .values({
        id: nanoid(),
        schoolId: "platform", // Platform-wide resources
        title,
        description,
        resourceType,
        format: format || "pdf",
        accessUrl: accessUrl || "",
        thumbnailUrl,
        subjects: [category],
        tags: isFeatured ? [...tags, "featured"] : tags,
        totalDownloads: 0,
        totalViews: 0,
        isActive: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      resource: newResource,
    });
  } catch (error) {
    console.error("Error creating counselor resource:", error);
    return NextResponse.json({ error: "Failed to create resource" }, { status: 500 });
  }
}

// PATCH /api/counselor/resources - Update resource
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Resource ID required" }, { status: 400 });
    }

    // Update resource
    const updated = await db
      .update(digitalResources)
      .set({
        ...updates,
        updatedAt: Date.now(),
      })
      .where(eq(digitalResources.id, id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      resource: updated[0],
    });
  } catch (error) {
    console.error("Error updating counselor resource:", error);
    return NextResponse.json({ error: "Failed to update resource" }, { status: 500 });
  }
}

// DELETE /api/counselor/resources - Delete resource
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Resource ID required" }, { status: 400 });
    }

    // Delete resource
    await db.delete(digitalResources).where(eq(digitalResources.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting counselor resource:", error);
    return NextResponse.json({ error: "Failed to delete resource" }, { status: 500 });
  }
}
