/**
 * LESSONS FEATURE DEFINITION
 *
 * Unified definition for lesson plans and schedules.
 */

import { defineFeature } from "@/lib/features/define-feature";

export const LessonFeature = defineFeature({
  name: "lessons",
  tableName: "lessons",

  schema: {
    id: { type: "text", required: true, primary: true },
    title: {
      type: "text",
      required: true,
      label: "Title",
      sortable: true,
      searchable: true,
    },
    description: {
      type: "text",
      label: "Description",
      multiline: true,
      searchable: true,
    },
    classId: {
      type: "reference",
      reference: { table: "classes", onDelete: "no action" },
      required: true,
      label: "Class",
      filterable: true,
    },
    subjectId: {
      type: "reference",
      reference: { table: "subjects", onDelete: "no action" },
      required: true,
      label: "Subject",
      filterable: true,
    },
    teacherId: {
      type: "reference",
      reference: { table: "users", onDelete: "set null" },
      label: "Teacher",
      filterable: true,
    },
    schoolId: {
      type: "reference",
      reference: { table: "schools", onDelete: "cascade" },
    },
    lessonDate: {
      type: "date",
      required: true,
      label: "Lesson Date",
      sortable: true,
      filterable: true,
    },
    startTime: {
      type: "text",
      label: "Start Time",
    },
    endTime: {
      type: "text",
      label: "End Time",
    },
    roomNumber: {
      type: "text",
      label: "Room",
      filterable: true,
    },
    status: {
      type: "enum",
      options: ["scheduled", "completed", "cancelled"],
      label: "Status",
      filterable: true,
    },
    topics: {
      type: "json",
      label: "Topics Covered",
    },
    resources: {
      type: "json",
      label: "Resources",
    },
    notes: {
      type: "text",
      label: "Notes",
      multiline: true,
    },
    createdAt: { type: "timestamp", sortable: true },
    updatedAt: { type: "timestamp", sortable: true },
  },

  permissions: {
    read: ["school-admin", "teacher", "student"],
    create: ["school-admin", "teacher"],
    update: ["school-admin", "teacher"],
    delete: ["school-admin"],
  },

  ui: {
    title: "Lesson",
    titlePlural: "Lessons",
    basePath: "/teacher/lessons",
    columns: [
      { key: "title", label: "Title", sortable: true, searchable: true },
      { key: "className", label: "Class", filterable: true },
      { key: "subjectName", label: "Subject", filterable: true },
      { key: "lessonDate", label: "Date", type: "date", sortable: true },
      { key: "startTime", label: "Start" },
      { key: "roomNumber", label: "Room" },
      { key: "status", label: "Status", filterable: true },
    ],
  },

  customHandlers: {
    list: async (params: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { lessons, classes, subjects, users } = await import("@/lib/db/schema");
      const { eq, and, desc, sql } = await import("drizzle-orm");

      const { page = "1", limit = "20", classId, subjectId, status, dateFrom, dateTo } = params;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const conditions = [];
      if (auth.user?.schoolId) conditions.push(eq(lessons.schoolId, auth.user.schoolId));
      if (classId) conditions.push(eq(lessons.classId, classId));
      if (subjectId) conditions.push(eq(lessons.subjectId, subjectId));
      if (status) conditions.push(eq(lessons.status, status));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const data = await db
        .select({
          id: lessons.id,
          title: lessons.title,
          description: lessons.description,
          classId: lessons.classId,
          subjectId: lessons.subjectId,
          teacherId: lessons.teacherId,
          lessonDate: lessons.lessonDate,
          startTime: lessons.startTime,
          endTime: lessons.endTime,
          roomNumber: lessons.roomNumber,
          status: lessons.status,
          topics: lessons.topics,
          createdAt: lessons.createdAt,
          className: classes.name,
          subjectName: subjects.name,
          teacherName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
        })
        .from(lessons)
        .leftJoin(classes, eq(lessons.classId, classes.id))
        .leftJoin(subjects, eq(lessons.subjectId, subjects.id))
        .leftJoin(users, eq(lessons.teacherId, users.id))
        .where(whereClause)
        .orderBy(desc(lessons.lessonDate))
        .limit(parseInt(limit))
        .offset(offset);

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(lessons)
        .where(whereClause);

      return {
        success: true,
        data: { data, pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / parseInt(limit)) } },
      };
    },
  },

  bulkOperations: {
    getWeeklySchedule: async (teacherId: string, weekStart: string, auth: any) => {
      const { db } = await import("@/lib/db");
      const { lessons } = await import("@/lib/db/schema");
      const { eq, and, gte, lte } = await import("drizzle-orm");

      const schedule = await db
        .select()
        .from(lessons)
        .where(
          and(
            eq(lessons.teacherId, teacherId),
            gte(lessons.lessonDate, weekStart),
            lte(lessons.lessonDate, new Date(Date.parse(weekStart) + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          )
        )
        .orderBy(lessons.lessonDate, lessons.startTime);

      return { success: true, data: schedule };
    },
  },
});
