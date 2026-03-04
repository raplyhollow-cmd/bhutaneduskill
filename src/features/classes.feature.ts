/**
 * CLASSES FEATURE
 *
 * Unified definition for Class resource: Schema + API + Components
 */

import { defineFeature } from "@/lib/features/define-feature";

export const ClassFeature = defineFeature({
  name: "classes",
  tableName: "classes",

  schema: {
    id: { type: "text", required: true },
    name: { type: "text", required: true, label: "Class Name", sortable: true, searchable: true },
    grade: { type: "integer", required: true, label: "Grade", sortable: true, filterable: true },
    section: { type: "text", required: true, label: "Section", sortable: true, filterable: true },
    roomNumber: { type: "text", label: "Room Number" },
    capacity: { type: "integer", label: "Capacity" },
    classTeacherId: { type: "text", label: "Class Teacher", reference: { table: "users", displayField: "name" } },
    classTeacherName: { type: "text", label: "Class Teacher Name" },
    schoolId: { type: "text", label: "School" },
    isActive: { type: "boolean", label: "Active", filterable: true },
    createdAt: { type: "timestamp", label: "Created", sortable: true },
    updatedAt: { type: "timestamp" },
  },

  permissions: {
    read: ["school-admin", "teacher", "admin"],
    create: ["school-admin", "admin"],
    update: ["school-admin", "admin"],
    delete: ["school-admin", "admin"],
  },

  ui: {
    title: "Class",
    titlePlural: "Classes",
    basePath: "/school-admin/classes",
    columns: [
      { key: "name", label: "Name", sortable: true },
      { key: "grade", label: "Grade", sortable: true, filterable: true },
      { key: "section", label: "Section", sortable: true, filterable: true },
      { key: "roomNumber", label: "Room" },
      { key: "classTeacherName", label: "Class Teacher" },
      { key: "capacity", label: "Capacity" },
      { key: "isActive", label: "Status", type: "boolean" },
    ],
  },

  customHandlers: {
    list: async (params: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { classes } = await import("@/lib/db/schema");
      const { eq, and, desc, count, sql } = await import("drizzle-orm");

      const { page = 1, limit = 20, grade, section, search } = params;
      const offset = (page - 1) * limit;
      const { user } = auth;

      const conditions = [
        eq(classes.isActive, true),
        user.schoolId ? eq(classes.schoolId, user.schoolId) : undefined,
      ].filter(Boolean);

      if (grade) {
        conditions.push(eq(classes.grade, parseInt(grade)));
      }

      if (section) {
        conditions.push(eq(classes.section, section));
      }

      if (search) {
        conditions.push(sql`${classes.name} ILIKE ${"%" + search + "%"}`);
      }

      const [dataResult, countResult] = await Promise.all([
        db
          .select()
          .from(classes)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .orderBy(desc(classes.createdAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: count() })
          .from(classes)
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
      const { classes } = await import("@/lib/db/schema");
      const { eq } = await import("drizzle-orm");
      const { successResponse, notFoundResponse } = await import("@/lib/api/response-helpers");

      const result = await db
        .select()
        .from(classes)
        .where(eq(classes.id, id))
        .limit(1);

      if (result.length === 0) {
        return notFoundResponse("Class");
      }

      return successResponse({ data: result[0] });
    },

    create: async (data: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { classes } = await import("@/lib/db/schema");
      const { createdResponse } = await import("@/lib/api/response-helpers");
      const { nanoid } = await import("nanoid");

      const { user } = auth;
      const classId = `cls-${nanoid()}`;

      const result = await db
        .insert(classes)
        .values({
          id: classId,
          name: data.name,
          grade: data.grade,
          section: data.section || "A",
          schoolId: user.schoolId,
          roomNumber: data.roomNumber || "TBD",
          capacity: data.capacity || 40,
          homeroomTeacherName: data.homeroomTeacherName || "Not Assigned",
          classTeacherName: data.classTeacherName || "Not Assigned",
          classTeacherId: data.classTeacherId || null,
          homeroomTeacherId: data.homeroomTeacherId || null,
          teacherId: data.teacherId || null,
          academicYear: data.academicYear || new Date().getFullYear().toString(),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return createdResponse({ data: result[0] });
    },

    update: async (id: string, data: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { classes } = await import("@/lib/db/schema");
      const { eq } = await import("drizzle-orm");
      const { updatedResponse, notFoundResponse } = await import("@/lib/api/response-helpers");

      const result = await db
        .update(classes)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(classes.id, id))
        .returning();

      if (result.length === 0) {
        return notFoundResponse("Class");
      }

      return updatedResponse({ data: result[0] });
    },

    delete: async (id: string, auth: any) => {
      const { db } = await import("@/lib/db");
      const { classes } = await import("@/lib/db/schema");
      const { eq } = await import("drizzle-orm");
      const { successResponse, notFoundResponse } = await import("@/lib/api/response-helpers");

      const result = await db
        .update(classes)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(classes.id, id))
        .returning();

      if (result.length === 0) {
        return notFoundResponse("Class");
      }

      return successResponse({ message: "Class deleted successfully" });
    },
  },
});
