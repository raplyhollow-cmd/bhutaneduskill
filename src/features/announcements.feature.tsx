/**
 * ANNOUNCEMENTS FEATURE
 *
 * Unified definition for Announcement resource: Schema + API + Components
 *
 * Permissions:
 * - Read: All authenticated users
 * - Create/Update/Delete: School-admin only
 */
import { defineFeature } from "@/lib/features/define-feature";

export const AnnouncementFeature = defineFeature({
  name: "announcements",
  tableName: "announcements",

  schema: {
    id: { type: "text", required: true, primary: true },
    title: {
      type: "text",
      required: true,
      label: "Title",
      sortable: true,
      searchable: true,
    },
    content: {
      type: "text",
      required: true,
      label: "Content",
      multiline: true,
      rows: 5,
      searchable: true,
    },
    category: {
      type: "enum",
      options: ["general", "exam", "holiday", "event"],
      required: true,
      label: "Category",
      sortable: true,
      filterable: true,
    },
    priority: {
      type: "enum",
      options: ["low", "medium", "high"],
      required: true,
      label: "Priority",
      sortable: true,
      filterable: true,
    },
    targetAudience: {
      type: "enum",
      options: ["all", "students", "teachers", "parents"],
      required: true,
      label: "Target Audience",
      sortable: true,
      filterable: true,
    },
    schoolId: {
      type: "reference",
      reference: { table: "schools", displayField: "name" },
      required: true,
      label: "School",
      sortable: true,
      filterable: true,
    },
    createdBy: {
      type: "reference",
      reference: { table: "users", displayField: "firstName" },
      required: true,
      label: "Created By",
      sortable: true,
    },
    publishDate: {
      type: "date",
      required: true,
      label: "Publish Date",
      sortable: true,
      filterable: true,
    },
    expiryDate: {
      type: "date",
      label: "Expiry Date",
      sortable: true,
      filterable: true,
    },
    isActive: {
      type: "boolean",
      required: true,
      label: "Active",
      sortable: true,
      filterable: true,
    },
    createdAt: {
      type: "timestamp",
      label: "Created",
      sortable: true,
    },
    updatedAt: {
      type: "timestamp",
      label: "Updated",
      sortable: true,
    },
  },

  permissions: {
    read: ["school-admin", "teacher", "student", "parent", "counselor", "admin", "ministry"],
    create: ["school-admin", "admin"],
    update: ["school-admin", "admin"],
    delete: ["school-admin", "admin"],
  },

  ui: {
    title: "Announcement",
    titlePlural: "Announcements",
    basePath: "/school-admin/announcements",
    columns: [
      { key: "title", label: "Title", sortable: true, searchable: true },
      { key: "category", label: "Category", sortable: true, filterable: true },
      { key: "priority", label: "Priority", sortable: true, filterable: true },
      { key: "publishDate", label: "Publish Date", sortable: true, type: "date" },
      { key: "isActive", label: "Active", sortable: true, type: "boolean" },
    ],
  },

  customHandlers: {
    list: async (params: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { announcements, users, schools } = await import("@/lib/db/schema");
      const { eq, and, desc, count, or, gte, lte, isNull } = await import("drizzle-orm");

      const { page = 1, limit = 20, search, category, priority, targetAudience, isActive } = params;
      const offset = (page - 1) * limit;
      const { user } = auth;

      const conditions = [];

      // School scoping
      if (user.schoolId) {
        conditions.push(eq(announcements.schoolId, user.schoolId));
      }

      // Target audience filtering - show announcements targeting the user's role
      const userRoles = user.roles || [user.role];
      const audienceConditions = [
        eq(announcements.targetAudience, "all"),
      ];
      if (userRoles.includes("student")) {
        audienceConditions.push(eq(announcements.targetAudience, "students"));
      }
      if (userRoles.includes("teacher")) {
        audienceConditions.push(eq(announcements.targetAudience, "teachers"));
      }
      if (userRoles.includes("parent")) {
        audienceConditions.push(eq(announcements.targetAudience, "parents"));
      }
      conditions.push(or(...audienceConditions));

      // Active announcements only (unless admin)
      if (!userRoles.includes("admin") && isActive !== undefined) {
        const now = new Date();
        conditions.push(
          and(
            eq(announcements.isActive, true),
            or(
              gte(announcements.expiryDate, now),
              isNull(announcements.expiryDate)
            )
          )
        );
      }

      // Category filter
      if (category) {
        conditions.push(eq(announcements.category, category));
      }

      // Priority filter
      if (priority) {
        conditions.push(eq(announcements.priority, priority));
      }

      // Status filter
      if (isActive !== undefined) {
        conditions.push(eq(announcements.isActive, isActive === "true" || isActive === true));
      }

      // Search in title and content
      let searchCondition;
      if (search) {
        const searchTerm = `%${search}%`;
        searchCondition = or(
          sql`${announcements.title} ILIKE ${searchTerm}`,
          sql`${announcements.content} ILIKE ${searchTerm}`
        );
      }

      const whereClause = conditions.length > 0
        ? (searchCondition ? and(...conditions, searchCondition) : and(...conditions))
        : searchCondition;

      const [dataResult, countResult] = await Promise.all([
        db
          .select({
            id: announcements.id,
            title: announcements.title,
            content: announcements.content,
            category: announcements.category,
            priority: announcements.priority,
            targetAudience: announcements.targetAudience,
            schoolId: announcements.schoolId,
            createdBy: announcements.createdBy,
            publishDate: announcements.publishDate,
            expiryDate: announcements.expiryDate,
            isActive: announcements.isActive,
            createdAt: announcements.createdAt,
            updatedAt: announcements.updatedAt,
            createdByFirstName: users.firstName,
            createdByLastName: users.lastName,
            schoolName: schools.name,
          })
          .from(announcements)
          .leftJoin(users, eq(announcements.createdBy, users.id))
          .leftJoin(schools, eq(announcements.schoolId, schools.id))
          .where(whereClause)
          .orderBy(desc(announcements.publishDate), desc(announcements.createdAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: count() })
          .from(announcements)
          .where(whereClause),
      ]);

      const { successResponse } = await import("@/lib/api/response-helpers");

      return successResponse({
        data: dataResult,
        pagination: {
          total: countResult[0]?.count || 0,
          page,
          limit,
          totalPages: Math.ceil((countResult[0]?.count || 0) / limit),
        },
      });
    },

    get: async (id: string, auth: any) => {
      const { db } = await import("@/lib/db");
      const { announcements, users, schools } = await import("@/lib/db/schema");
      const { eq } = await import("drizzle-orm");
      const { successResponse, notFoundResponse, forbiddenResponse } = await import("@/lib/api/response-helpers");

      const result = await db
        .select({
          id: announcements.id,
          title: announcements.title,
          content: announcements.content,
          category: announcements.category,
          priority: announcements.priority,
          targetAudience: announcements.targetAudience,
          schoolId: announcements.schoolId,
          createdBy: announcements.createdBy,
          publishDate: announcements.publishDate,
          expiryDate: announcements.expiryDate,
          isActive: announcements.isActive,
          createdAt: announcements.createdAt,
          updatedAt: announcements.updatedAt,
          createdByFirstName: users.firstName,
          createdByLastName: users.lastName,
          createdByEmail: users.email,
          schoolName: schools.name,
        })
        .from(announcements)
        .leftJoin(users, eq(announcements.createdBy, users.id))
        .leftJoin(schools, eq(announcements.schoolId, schools.id))
        .where(eq(announcements.id, id))
        .limit(1);

      if (result.length === 0) {
        return notFoundResponse("Announcement");
      }

      const announcement = result[0];

      // Check school access
      if (auth.user.schoolId && announcement.schoolId !== auth.user.schoolId) {
        return forbiddenResponse("You do not have access to this announcement");
      }

      return successResponse({ data: announcement });
    },

    create: async (data: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { announcements } = await import("@/lib/db/schema");
      const { createdResponse } = await import("@/lib/api/response-helpers");
      const { nanoid } = await import("nanoid");

      const { user } = auth;
      const announcementId = `ann-${nanoid()}`;

      const result = await db
        .insert(announcements)
        .values({
          id: announcementId,
          title: data.title,
          content: data.content,
          category: data.category,
          priority: data.priority || "medium",
          targetAudience: data.targetAudience || "all",
          schoolId: user.schoolId,
          createdBy: user.id,
          publishDate: data.publishDate ? new Date(data.publishDate) : new Date(),
          expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
          isActive: data.isActive !== undefined ? data.isActive : true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return createdResponse({ data: result[0] });
    },

    update: async (id: string, data: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { announcements } = await import("@/lib/db/schema");
      const { eq, and } = await import("drizzle-orm");
      const { updatedResponse, notFoundResponse, forbiddenResponse } = await import("@/lib/api/response-helpers");

      // Check ownership
      const existing = await db
        .select()
        .from(announcements)
        .where(eq(announcements.id, id))
        .limit(1);

      if (existing.length === 0) {
        return notFoundResponse("Announcement");
      }

      if (auth.user.schoolId && existing[0].schoolId !== auth.user.schoolId) {
        return forbiddenResponse("You do not have permission to update this announcement");
      }

      const updateData: any = {
        ...data,
        updatedAt: new Date(),
      };

      // Handle date conversions
      if (data.publishDate !== undefined) {
        updateData.publishDate = data.publishDate ? new Date(data.publishDate) : null;
      }
      if (data.expiryDate !== undefined) {
        updateData.expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
      }

      const result = await db
        .update(announcements)
        .set(updateData)
        .where(eq(announcements.id, id))
        .returning();

      return updatedResponse({ data: result[0] });
    },

    delete: async (id: string, auth: any) => {
      const { db } = await import("@/lib/db");
      const { announcements } = await import("@/lib/db/schema");
      const { eq } = await import("drizzle-orm");
      const { successResponse, notFoundResponse, forbiddenResponse } = await import("@/lib/api/response-helpers");

      // Check ownership
      const existing = await db
        .select()
        .from(announcements)
        .where(eq(announcements.id, id))
        .limit(1);

      if (existing.length === 0) {
        return notFoundResponse("Announcement");
      }

      if (auth.user.schoolId && existing[0].schoolId !== auth.user.schoolId) {
        return forbiddenResponse("You do not have permission to delete this announcement");
      }

      await db
        .delete(announcements)
        .where(eq(announcements.id, id));

      return successResponse({ data: { id, deleted: true } });
    },
  },
});
