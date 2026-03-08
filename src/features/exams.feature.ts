/**
import { sql } from "drizzle-orm";
 * EXAMS FEATURE DEFINITION
 *
 * Unified definition for exams and assessments.
 */

import { defineFeature } from "@/lib/features/define-feature";

export const ExamFeature = defineFeature({
  name: "exams",
  tableName: "exams",

  schema: {
    id: { type: "text", required: true, primary: true },
    title: {
      type: "text",
      required: true,
      label: "Exam Title",
      sortable: true,
      searchable: true,
    },
    examType: {
      type: "enum",
      options: ["midterm", "final", "quiz", "assignment", "practical"],
      label: "Type",
      filterable: true,
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
    schoolId: {
      type: "reference",
      reference: { table: "schools", onDelete: "cascade" },
    },
    examDate: {
      type: "date",
      required: true,
      label: "Exam Date",
      sortable: true,
      filterable: true,
    },
    startTime: {
      type: "text",
      label: "Start Time",
    },
    duration: {
      type: "integer",
      label: "Duration (min)",
    },
    totalMarks: {
      type: "integer",
      label: "Total Marks",
    },
    passingMarks: {
      type: "integer",
      label: "Passing Marks",
    },
    instructions: {
      type: "text",
      label: "Instructions",
      multiline: true,
    },
    status: {
      type: "enum",
      options: ["scheduled", "ongoing", "completed", "cancelled"],
      label: "Status",
      filterable: true,
    },
    createdBy: {
      type: "reference",
      reference: { table: "users", onDelete: "set null" },
    },
    createdAt: { type: "timestamp", sortable: true },
    updatedAt: { type: "timestamp", sortable: true },
  },

  permissions: {
    read: ["school-admin", "teacher", "student"],
    create: ["school-admin", "teacher"],
    update: ["school-admin", "teacher"],
    delete: ["school-admin", "teacher"],
  },

  ui: {
    title: "Exam",
    titlePlural: "Exams",
    basePath: "/teacher/exams",
    columns: [
      { key: "title", label: "Title", sortable: true, searchable: true },
      { key: "examType", label: "Type", filterable: true },
      { key: "className", label: "Class", filterable: true },
      { key: "subjectName", label: "Subject", filterable: true },
      { key: "examDate", label: "Date", type: "date", sortable: true },
      { key: "totalMarks", label: "Total Marks" },
      { key: "status", label: "Status", filterable: true },
    ],
  },

  customHandlers: {
    list: async (params: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { exams, classes, subjects } = await import("@/lib/db/schema") as any;
      const { eq, and, desc, sql } = await import("drizzle-orm");

      const { page = "1", limit = "20", classId, subjectId, examType, status } = params;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const conditions = [];
      if (auth.user?.schoolId) conditions.push(eq(exams.schoolId, auth.user.schoolId));
      if (classId) conditions.push(eq(exams.classId, classId));
      if (subjectId) conditions.push(eq(exams.subjectId, subjectId));
      if (examType) conditions.push(eq(exams.examType, examType));
      if (status) conditions.push(eq(exams.status, status));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const data = await db
        .select({
          id: exams.id,
          title: exams.title,
          examType: exams.examType,
          classId: exams.classId,
          subjectId: exams.subjectId,
          examDate: exams.examDate,
          startTime: exams.startTime,
          duration: exams.duration,
          totalMarks: exams.totalMarks,
          passingMarks: exams.passingMarks,
          status: exams.status,
          createdAt: exams.createdAt,
          className: classes.name,
          subjectName: subjects.name,
        })
        .from(exams)
        .leftJoin(classes, eq(exams.classId, classes.id))
        .leftJoin(subjects, eq(exams.subjectId, subjects.id))
        .where(whereClause)
        .orderBy(desc(exams.examDate))
        .limit(parseInt(limit))
        .offset(offset);

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(exams)
        .where(whereClause);

      return {
        success: true,
        data: { data, pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / parseInt(limit)) } },
      };
    },
  },

  bulkOperations: {
    scheduleExamSeries: async (classId: string, subjects: Array<{subjectId: string, date: string}>, examType: string, auth: any) => {
      const { db } = await import("@/lib/db");
      const { exams } = await import("@/lib/db/schema") as any;
      const { nanoid } = await import("nanoid");

      const records = subjects.map(s => ({
        id: nanoid(),
        title: `${examType} - ${s.subjectId}`,
        examType,
        classId,
        subjectId: s.subjectId,
        schoolId: auth.user?.schoolId,
        examDate: s.date,
        status: "scheduled",
        createdBy: auth.user?.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await db.insert(exams).values(records);

      return { success: true, message: `Scheduled ${subjects.length} exams` };
    },
  },
});
