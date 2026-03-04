/**
 * TEACHERS FEATURE
 *
 * Unified definition for Teacher resource: Schema + API + Components
 */

import { defineFeature } from "@/lib/features/define-feature";

export const TeacherFeature = defineFeature({
  name: "teachers",
  tableName: "users",

  schema: {
    id: { type: "text", required: true },
    firstName: { type: "text", required: true, label: "First Name", sortable: true, searchable: true },
    lastName: { type: "text", label: "Last Name", sortable: true, searchable: true },
    name: { type: "text", label: "Full Name", sortable: true, searchable: true },
    email: { type: "email", required: true, label: "Email", sortable: true, searchable: true },
    phone: { type: "text", label: "Phone" },
    employeeId: { type: "text", label: "Employee ID", sortable: true },
    subjects: { type: "json", label: "Subjects" },
    schoolId: { type: "text", label: "School" },
    clerkUserId: { type: "text" },
    type: { type: "text", required: true },
    isActive: { type: "boolean", label: "Active", filterable: true },
    createdAt: { type: "timestamp", label: "Created", sortable: true },
    updatedAt: { type: "timestamp" },
  },

  permissions: {
    read: ["school-admin", "admin"],
    create: ["school-admin", "admin"],
    update: ["school-admin", "admin"],
    delete: ["school-admin", "admin"],
  },

  ui: {
    title: "Teacher",
    titlePlural: "Teachers",
    basePath: "/school-admin/teachers",
    columns: [
      { key: "employeeId", label: "Employee ID", sortable: true },
      { key: "name", label: "Name", sortable: true, searchable: true },
      { key: "email", label: "Email", sortable: true },
      { key: "subjects", label: "Subjects" },
      { key: "isActive", label: "Status", type: "boolean" },
    ],
  },

  customHandlers: {
    list: async (params: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { users } = await import("@/lib/db/schema");
      const { eq, and, desc, count, sql, like, or } = await import("drizzle-orm");

      const { page = 1, limit = 20, search, status } = params;
      const offset = (page - 1) * limit;
      const { user } = auth;

      const conditions = [
        eq(users.type, "teacher"),
        user.schoolId ? eq(users.schoolId, user.schoolId) : undefined,
      ].filter(Boolean);

      if (search) {
        conditions.push(
          or(
            like(users.firstName, `%${search}%`),
            like(users.lastName, `%${search}%`),
            like(users.email, `%${search}%`)
          )
        );
      }

      if (status === "active") {
        conditions.push(eq(users.isActive, true));
      } else if (status === "inactive") {
        conditions.push(eq(users.isActive, false));
      }

      const [dataResult, countResult] = await Promise.all([
        db
          .select()
          .from(users)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .orderBy(desc(users.createdAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: count() })
          .from(users)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions)),
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
      const { users } = await import("@/lib/db/schema");
      const { eq, and } = await import("drizzle-orm");
      const { successResponse, notFoundResponse } = await import("@/lib/api/response-helpers");

      const { user } = auth;
      const conditions = [
        eq(users.id, id),
        eq(users.type, "teacher"),
        user.schoolId ? eq(users.schoolId, user.schoolId) : undefined,
      ].filter(Boolean);

      const result = await db
        .select()
        .from(users)
        .where(conditions.length === 1 ? conditions[0] : and(...conditions))
        .limit(1);

      if (result.length === 0) {
        return notFoundResponse("Teacher");
      }

      return successResponse({ data: result[0] });
    },

    create: async (data: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { users } = await import("@/lib/db/schema");
      const { createdResponse } = await import("@/lib/api/response-helpers");
      const { nanoid } = await import("nanoid");

      const { user } = auth;
      const teacherId = `tch-${nanoid()}`;

      const result = await db
        .insert(users)
        .values({
          id: teacherId,
          firstName: data.firstName,
          lastName: data.lastName,
          name: `${data.firstName} ${data.lastName}`.trim(),
          email: data.email,
          employeeId: data.employeeId || null,
          phone: data.phone || null,
          schoolId: user.schoolId,
          type: "teacher",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return createdResponse({ data: result[0] });
    },

    update: async (id: string, data: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { users } = await import("@/lib/db/schema");
      const { eq } = await import("drizzle-orm");
      const { updatedResponse, notFoundResponse } = await import("@/lib/api/response-helpers");

      const result = await db
        .update(users)
        .set({
          ...data,
          name: data.firstName || data.lastName ? `${data.firstName || ""} ${data.lastName || ""}`.trim() : undefined,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning();

      if (result.length === 0) {
        return notFoundResponse("Teacher");
      }

      return updatedResponse({ data: result[0] });
    },

    delete: async (id: string, auth: any) => {
      const { db } = await import("@/lib/db");
      const { users } = await import("@/lib/db/schema");
      const { eq } = await import("drizzle-orm");
      const { successResponse, notFoundResponse } = await import("@/lib/api/response-helpers");

      const result = await db
        .update(users)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();

      if (result.length === 0) {
        return notFoundResponse("Teacher");
      }

      return successResponse({ message: "Teacher deleted successfully" });
    },
  },
});
