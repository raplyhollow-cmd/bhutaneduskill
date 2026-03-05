/**
 * TEACHING RESOURCES FEATURE DEFINITION
 */

import { defineFeature } from "@/lib/features/define-feature";

export const TeachingResourceFeature = defineFeature({
  name: "teaching-resources",
  tableName: "teaching_resources",

  schema: {
    id: { type: "text", required: true, primary: true },
    title: { type: "text", required: true, label: "Title", sortable: true, searchable: true },
    description: { type: "text", multiline: true, searchable: true },
    resourceType: { type: "enum", options: ["lesson_plan", "worksheet", "presentation", "video", "document", "other"], label: "Type", filterable: true },
    subjectId: { type: "reference", reference: { table: "subjects", onDelete: "set null" }, label: "Subject" },
    classId: { type: "reference", reference: { table: "classes", onDelete: "set null" }, label: "Class" },
    teacherId: { type: "reference", reference: { table: "users", onDelete: "set null" }, label: "Teacher" },
    schoolId: { type: "reference", reference: { table: "schools", onDelete: "cascade" } },
    fileUrl: { type: "text", label: "File URL" },
    fileSize: { type: "integer", label: "Size (bytes)" },
    tags: { type: "json", label: "Tags" },
    isShared: { type: "boolean", defaultValue: false, label: "Shared" },
    downloadCount: { type: "integer", defaultValue: 0 },
    isActive: { type: "boolean", defaultValue: true },
    createdAt: { type: "timestamp", sortable: true },
    updatedAt: { type: "timestamp", sortable: true },
  },

  permissions: {
    read: ["school-admin", "teacher"],
    create: ["school-admin", "teacher"],
    update: ["school-admin", "teacher"],
    delete: ["school-admin", "teacher"],
  },

  ui: {
    title: "Teaching Resource",
    titlePlural: "Teaching Resources",
    basePath: "/teacher/resources",
    columns: [
      { key: "title", label: "Title", sortable: true, searchable: true },
      { key: "resourceType", label: "Type", filterable: true },
      { key: "subjectName", label: "Subject" },
      { key: "teacherName", label: "Teacher" },
      { key: "downloadCount", label: "Downloads", sortable: true },
      { key: "isShared", label: "Shared", type: "boolean" },
    ],
  },

  customHandlers: {
    list: async (params: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { teachingResources, subjects, users } = await import("@/lib/db/schema");
      const { eq, and, desc, sql } = await import("drizzle-orm");

      const { page = "1", limit = "20", resourceType, subjectId, teacherId } = params;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const conditions = [];
      if (auth.user?.schoolId) conditions.push(eq(teachingResources.schoolId, auth.user.schoolId));
      if (resourceType) conditions.push(eq(teachingResources.resourceType, resourceType));
      if (subjectId) conditions.push(eq(teachingResources.subjectId, subjectId));
      if (teacherId) conditions.push(eq(teachingResources.teacherId, teacherId));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const data = await db
        .select({
          id: teachingResources.id,
          title: teachingResources.title,
          resourceType: teachingResources.resourceType,
          fileUrl: teachingResources.fileUrl,
          isShared: teachingResources.isShared,
          downloadCount: teachingResources.downloadCount,
          createdAt: teachingResources.createdAt,
          subjectName: subjects.name,
          teacherName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
        })
        .from(teachingResources)
        .leftJoin(subjects, eq(teachingResources.subjectId, subjects.id))
        .leftJoin(users, eq(teachingResources.teacherId, users.id))
        .where(whereClause)
        .orderBy(desc(teachingResources.createdAt))
        .limit(parseInt(limit))
        .offset(offset);

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(teachingResources)
        .where(whereClause);

      return {
        success: true,
        data: { data, pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / parseInt(limit)) } },
      };
    },
  },
});
