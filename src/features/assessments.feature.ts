/**
 * ASSESSMENTS FEATURE
 *
 * Unified definition for Assessment resource: Schema + API + Components
 */

import { defineFeature } from "@/lib/features/define-feature";

export const AssessmentFeature = defineFeature({
  name: "assessments",
  tableName: "assessments",

  schema: {
    id: { type: "text", required: true },
    title: { type: "text", required: true, label: "Title", sortable: true, searchable: true },
    description: { type: "text", label: "Description" },
    type: { type: "text", required: true, label: "Type", filterable: true }, // mbti, riasec, work_values, skills, etc.
    userId: { type: "text", required: true, label: "Student", reference: { table: "users", displayField: "name" } },
    classId: { type: "text", label: "Class", reference: { table: "classes", displayField: "name" } },
    results: { type: "json", label: "Results" },
    status: { type: "text", label: "Status", filterable: true }, // draft, published, completed
    startedAt: { type: "timestamp", label: "Started" },
    completedAt: { type: "timestamp", label: "Completed", sortable: true },
    isActive: { type: "boolean", label: "Active" },
    createdAt: { type: "timestamp", label: "Created", sortable: true },
    updatedAt: { type: "timestamp" },
  },

  permissions: {
    read: ["student", "teacher", "school-admin", "counselor", "admin"],
    create: ["student", "school-admin", "admin"],
    update: ["school-admin", "admin"],
    delete: ["school-admin", "admin"],
  },

  ui: {
    title: "Assessment",
    titlePlural: "Assessments",
    basePath: "/student/assessment",
    columns: [
      { key: "title", label: "Title", sortable: true, searchable: true },
      { key: "type", label: "Type", filterable: true },
      { key: "status", label: "Status", filterable: true },
      { key: "completedAt", label: "Completed", sortable: true },
    ],
  },

  customHandlers: {
    list: async (params: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { assessments } = await import("@/lib/db/schema");
      const { eq, desc, count } = await import("drizzle-orm");

      const { page = 1, limit = 20, type, status } = params;
      const offset = (page - 1) * limit;
      const { userId, user } = auth;

      const conditions = [eq(assessments.userId, userId)];

      if (type) conditions.push(eq(assessments.type, type));
      if (status) conditions.push(eq(assessments.status, status));

      const [dataResult, countResult] = await Promise.all([
        db
          .select()
          .from(assessments)
          .where(conditions.length === 1 ? conditions[0] : await import("drizzle-orm").then(m => m.and(...conditions)))
          .orderBy(desc(assessments.createdAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: count() })
          .from(assessments)
          .where(conditions.length === 1 ? conditions[0] : await import("drizzle-orm").then(m => m.and(...conditions))),
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
      const { assessments } = await import("@/lib/db/schema");
      const { eq } = await import("drizzle-orm");
      const { successResponse, notFoundResponse } = await import("@/lib/api/response-helpers");

      const result = await db
        .select()
        .from(assessments)
        .where(eq(assessments.id, id))
        .limit(1);

      if (result.length === 0) {
        return notFoundResponse("Assessment");
      }

      return successResponse({ data: result[0] });
    },

    create: async (data: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { assessments } = await import("@/lib/db/schema");
      const { createdResponse } = await import("@/lib/api/response-helpers");
      const { nanoid } = await import("nanoid");

      const { userId } = auth;
      const assessmentId = `asm-${nanoid()}`;

      const result = await db
        .insert(assessments)
        .values({
          id: assessmentId,
          userId: data.userId || userId,
          title: data.title || "Assessment",
          description: data.description || "",
          type: data.type,
          dueDate: data.dueDate || new Date().toISOString().split("T")[0],
          totalPoints: data.totalPoints || 100,
          passingScore: data.passingScore || 60,
          results: data.results || null,
          status: data.status || "published",
          completedAt: data.completedAt || null,
          startedAt: data.startedAt || null,
          classId: data.classId || null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return createdResponse({ data: result[0] });
    },

    update: async (id: string, data: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { assessments } = await import("@/lib/db/schema");
      const { eq } = await import("drizzle-orm");
      const { updatedResponse, notFoundResponse } = await import("@/lib/api/response-helpers");

      const result = await db
        .update(assessments)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(assessments.id, id))
        .returning();

      if (result.length === 0) {
        return notFoundResponse("Assessment");
      }

      return updatedResponse({ data: result[0] });
    },

    delete: async (id: string, auth: any) => {
      const { db } = await import("@/lib/db");
      const { assessments } = await import("@/lib/db/schema");
      const { eq } = await import("drizzle-orm");
      const { successResponse, notFoundResponse } = await import("@/lib/api/response-helpers");

      const result = await db
        .delete(assessments)
        .where(eq(assessments.id, id))
        .returning();

      if (result.length === 0) {
        return notFoundResponse("Assessment");
      }

      return successResponse({ message: "Assessment deleted successfully" });
    },
  },
});
