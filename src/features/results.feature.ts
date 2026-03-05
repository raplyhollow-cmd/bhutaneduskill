/**
 * RESULTS FEATURE DEFINITION
 *
 * Unified definition for exam results across all portals.
 * Uses the "results" table for storing student exam performance.
 */
import { defineFeature } from "@/lib/features/define-feature";

export const ResultFeature = defineFeature({
  name: "results",
  tableName: "results",

  schema: {
    // Primary fields
    id: { type: "text", required: true },
    studentId: {
      type: "reference",
      reference: { table: "users", displayField: "firstName" },
      required: true,
      label: "Student",
      sortable: true,
      filterable: true,
    },
    examId: {
      type: "reference",
      reference: { table: "exams", displayField: "title" },
      required: true,
      label: "Exam",
      sortable: true,
      filterable: true,
    },
    classId: {
      type: "reference",
      reference: { table: "classes", displayField: "name" },
      label: "Class",
      sortable: true,
      filterable: true,
    },
    subjectId: {
      type: "reference",
      reference: { table: "subjects", displayField: "name" },
      label: "Subject",
      sortable: true,
      filterable: true,
    },
    schoolId: {
      type: "reference",
      reference: { table: "schools", displayField: "name" },
      label: "School",
      sortable: true,
      filterable: true,
    },

    // Result details
    marksObtained: {
      type: "integer",
      required: true,
      label: "Marks Obtained",
      sortable: true,
    },
    totalMarks: {
      type: "integer",
      required: true,
      label: "Total Marks",
      sortable: true,
    },
    percentage: {
      type: "float",
      label: "Percentage",
      sortable: true,
    },
    grade: {
      type: "text",
      label: "Grade",
      sortable: true,
      filterable: true,
    },
    remarks: {
      type: "text",
      label: "Remarks",
      searchable: true,
      multiline: true,
    },
    status: {
      type: "enum",
      options: ["pass", "fail", "pending"],
      required: true,
      label: "Status",
      sortable: true,
      filterable: true,
    },

    // Metadata
    assessedBy: {
      type: "reference",
      reference: { table: "users", displayField: "firstName" },
      label: "Assessed By",
    },

    // Timestamps
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
    read: ["school-admin", "teacher", "student", "parent"],
    create: ["school-admin", "teacher"],
    update: ["school-admin", "teacher"],
    delete: ["school-admin"],
  },

  ui: {
    title: "Result",
    titlePlural: "Results",
    basePath: "/school-admin/results",

    // Table column definitions
    columns: [
      {
        key: "studentName",
        label: "Student",
        sortable: true,
        searchable: true,
        render: (value: any, row: any) => row.studentName || value,
      },
      {
        key: "examTitle",
        label: "Exam",
        sortable: true,
        filterable: true,
        render: (value: any, row: any) => row.examTitle || value,
      },
      {
        key: "marksObtained",
        label: "Marks Obtained",
        sortable: true,
        type: "number",
      },
      {
        key: "totalMarks",
        label: "Total Marks",
        sortable: true,
        type: "number",
      },
      {
        key: "percentage",
        label: "Percentage",
        sortable: true,
        type: "number",
        render: (value: number) => `${value?.toFixed(1) || 0}%`,
      },
      {
        key: "grade",
        label: "Grade",
        sortable: true,
        filterable: true,
        render: (value: string) => {
          if (!value) return "-";
          const gradeColors: Record<string, string> = {
            A: "bg-green-100 text-green-700",
            B: "bg-blue-100 text-blue-700",
            C: "bg-yellow-100 text-yellow-700",
            D: "bg-orange-100 text-orange-700",
            F: "bg-red-100 text-red-700",
          };
          const color = gradeColors[value] || "bg-gray-100 text-gray-700";
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
              {value}
            </span>
          );
        },
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        filterable: true,
        render: (value: string) => {
          const statusConfig = {
            pass: { label: "Pass", color: "bg-green-100 text-green-700" },
            fail: { label: "Fail", color: "bg-red-100 text-red-700" },
            pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700" },
          };
          const config = statusConfig[value as keyof typeof statusConfig] || statusConfig.pending;
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
              {config.label}
            </span>
          );
        },
      },
    ],
  },

  // Custom handlers for results-specific logic
  customHandlers: {
    // List with joins to get student name, exam title
    list: async (params: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { results, users, classes, subjects, schools } = await import("@/lib/db/schema");
      // Assuming exams table exists, otherwise use a placeholder
      const exams = await import("@/lib/db/schema").then(m => (m as any).exams || null);
      const { eq, and, desc, like, or, sql } = await import("drizzle-orm");

      const {
        page = "1",
        limit = "20",
        search,
        studentId,
        examId,
        classId,
        subjectId,
        schoolId,
        status,
        grade,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = params;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Build conditions
      const conditions = [];

      // School isolation
      if (auth.user?.schoolId) {
        conditions.push(eq(results.schoolId, auth.user.schoolId));
      } else if (schoolId) {
        conditions.push(eq(results.schoolId, schoolId));
      }

      if (studentId) conditions.push(eq(results.studentId, studentId));
      if (examId) conditions.push(eq(results.examId, examId));
      if (classId) conditions.push(eq(results.classId, classId));
      if (subjectId) conditions.push(eq(results.subjectId, subjectId));
      if (status) conditions.push(eq(results.status, status));
      if (grade) conditions.push(eq(results.grade, grade));

      // Search across multiple fields
      if (search) {
        const searchCondition = or(
          like(users.firstName, `%${search}%`),
          like(users.lastName, `%${search}%`),
          like(results.remarks, `%${search}%`)
        );
        if (searchCondition) conditions.push(searchCondition);
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Execute query with joins
      const data = await db
        .select({
          id: results.id,
          studentId: results.studentId,
          examId: results.examId,
          classId: results.classId,
          subjectId: results.subjectId,
          schoolId: results.schoolId,
          marksObtained: results.marksObtained,
          totalMarks: results.totalMarks,
          percentage: results.percentage,
          grade: results.grade,
          remarks: results.remarks,
          status: results.status,
          assessedBy: results.assessedBy,
          createdAt: results.createdAt,
          updatedAt: results.updatedAt,
          // Joined fields
          studentName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
          className: classes.name,
          subjectName: subjects.name,
          schoolName: schools.name,
        })
        .from(results)
        .innerJoin(users, eq(results.studentId, users.id))
        .leftJoin(classes, eq(results.classId, classes.id))
        .leftJoin(subjects, eq(results.subjectId, subjects.id))
        .innerJoin(schools, eq(results.schoolId, schools.id))
        .where(whereClause)
        .orderBy(
          sortOrder === "asc"
            ? sql`${results[sortBy]} ASC`
            : sql`${results[sortBy]} DESC`
        )
        .limit(parseInt(limit))
        .offset(offset);

      // Get total count for pagination
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(results)
        .innerJoin(users, eq(results.studentId, users.id))
        .where(whereClause);

      return {
        success: true,
        data: {
          data,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / parseInt(limit)),
          },
        },
      };
    },

    // Get single record with relations
    get: async (id: string, auth: any) => {
      const { db } = await import("@/lib/db");
      const { results, users, classes, subjects, schools } = await import("@/lib/db/schema");
      const { eq, and } = await import("drizzle-orm");

      const [record] = await db
        .select({
          id: results.id,
          studentId: results.studentId,
          examId: results.examId,
          classId: results.classId,
          subjectId: results.subjectId,
          schoolId: results.schoolId,
          marksObtained: results.marksObtained,
          totalMarks: results.totalMarks,
          percentage: results.percentage,
          grade: results.grade,
          remarks: results.remarks,
          status: results.status,
          assessedBy: results.assessedBy,
          createdAt: results.createdAt,
          updatedAt: results.updatedAt,
          // Joined fields
          student: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            rollNumber: users.rollNumber,
          },
          class: {
            id: classes.id,
            name: classes.name,
            grade: classes.grade,
            section: classes.section,
          },
          subject: {
            id: subjects.id,
            name: subjects.name,
            code: subjects.code,
          },
          school: {
            id: schools.id,
            name: schools.name,
          },
        })
        .from(results)
        .innerJoin(users, eq(results.studentId, users.id))
        .leftJoin(classes, eq(results.classId, classes.id))
        .leftJoin(subjects, eq(results.subjectId, subjects.id))
        .innerJoin(schools, eq(results.schoolId, schools.id))
        .where(eq(results.id, id));

      if (!record) {
        return {
          success: false,
          error: "Result not found",
        };
      }

      // School isolation check
      if (auth.user?.schoolId && record.schoolId !== auth.user.schoolId) {
        return {
          success: false,
          error: "Unauthorized",
        };
      }

      return {
        success: true,
        data: record,
      };
    },

    // Create result record
    create: async (data: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { results } = await import("@/lib/db/schema");
      const { nanoid } = await import("nanoid");

      // Calculate percentage and grade automatically if not provided
      const percentage = data.percentage ?? (data.totalMarks > 0
        ? (data.marksObtained / data.totalMarks) * 100
        : 0);

      const grade = data.grade ?? calculateGrade(percentage);

      const [record] = await db
        .insert(results)
        .values({
          id: nanoid(),
          studentId: data.studentId,
          examId: data.examId,
          classId: data.classId,
          subjectId: data.subjectId,
          schoolId: data.schoolId || auth.user?.schoolId,
          marksObtained: data.marksObtained,
          totalMarks: data.totalMarks,
          percentage,
          grade,
          remarks: data.remarks || null,
          status: data.status ?? (percentage >= 40 ? "pass" : "fail"),
          assessedBy: auth.user?.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return {
        success: true,
        data: record,
      };
    },

    // Update result record
    update: async (id: string, data: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { results } = await import("@/lib/db/schema");
      const { eq, and } = await import("drizzle-orm");

      // Recalculate percentage and grade if marks changed
      const updateData: any = { ...data, updatedAt: new Date() };

      if (data.marksObtained !== undefined || data.totalMarks !== undefined) {
        const marks = data.marksObtained ?? 0;
        const total = data.totalMarks ?? 100;
        updateData.percentage = data.percentage ?? (total > 0 ? (marks / total) * 100 : 0);
        updateData.grade = data.grade ?? calculateGrade(updateData.percentage);
        updateData.status = data.status ?? (updateData.percentage >= 40 ? "pass" : "fail");
      }

      const [record] = await db
        .update(results)
        .set(updateData)
        .where(
          and(
            eq(results.id, id),
            auth.user?.schoolId ? eq(results.schoolId, auth.user.schoolId) : undefined
          )
        )
        .returning();

      if (!record) {
        return {
          success: false,
          error: "Result not found or unauthorized",
        };
      }

      return {
        success: true,
        data: record,
      };
    },

    // Delete result record
    delete: async (id: string, auth: any) => {
      const { db } = await import("@/lib/db");
      const { results } = await import("@/lib/db/schema");
      const { eq, and } = await import("drizzle-orm");

      await db
        .delete(results)
        .where(
          and(
            eq(results.id, id),
            auth.user?.schoolId ? eq(results.schoolId, auth.user.schoolId) : undefined
          )
        );

      return {
        success: true,
        message: "Result deleted",
      };
    },
  },

  // Bulk operations for results
  bulkOperations: {
    // Calculate class statistics for an exam
    calculateClassStatistics: async (examId: string, classId: string, auth: any) => {
      const { db } = await import("@/lib/db");
      const { results } = await import("@/lib/db/schema");
      const { eq, and, sql, avg, min, max } = await import("drizzle-orm");

      const stats = await db
        .select({
          average: sql<number>`ROUND(AVG(${results.percentage})::numeric, 2)`,
          highest: sql<number>`MAX(${results.percentage})`,
          lowest: sql<number>`MIN(${results.percentage})`,
          count: sql<number>`COUNT(*)::int`,
          passCount: sql<number>`COUNT(*) FILTER (WHERE ${results.status} = 'pass')::int`,
          failCount: sql<number>`COUNT(*) FILTER (WHERE ${results.status} = 'fail')::int`,
        })
        .from(results)
        .where(
          and(
            eq(results.examId, examId),
            eq(results.classId, classId),
            auth.user?.schoolId ? eq(results.schoolId, auth.user.schoolId) : undefined
          )
        );

      return {
        success: true,
        data: stats[0] || { average: 0, highest: 0, lowest: 0, count: 0, passCount: 0, failCount: 0 },
      };
    },

    // Calculate subject statistics for an exam
    calculateSubjectStatistics: async (examId: string, subjectId: string, auth: any) => {
      const { db } = await import("@/lib/db");
      const { results } = await import("@/lib/db/schema");
      const { eq, and, sql } = await import("drizzle-orm");

      const stats = await db
        .select({
          average: sql<number>`ROUND(AVG(${results.percentage})::numeric, 2)`,
          highest: sql<number>`MAX(${results.percentage})`,
          lowest: sql<number>`MIN(${results.percentage})`,
          count: sql<number>`COUNT(*)::int`,
          passCount: sql<number>`COUNT(*) FILTER (WHERE ${results.status} = 'pass')::int`,
          failCount: sql<number>`COUNT(*) FILTER (WHERE ${results.status} = 'fail')::int`,
          gradeDistribution: sql<string>`
            jsonb_object_agg(
              COALESCE(${results.grade}, 'N/A'),
              COUNT(*)
            )
          `,
        })
        .from(results)
        .where(
          and(
            eq(results.examId, examId),
            eq(results.subjectId, subjectId),
            auth.user?.schoolId ? eq(results.schoolId, auth.user.schoolId) : undefined
          )
        );

      return {
        success: true,
        data: stats[0] || {
          average: 0,
          highest: 0,
          lowest: 0,
          count: 0,
          passCount: 0,
          failCount: 0,
          gradeDistribution: {},
        },
      };
    },

    // Batch import results for an exam
    importResults: async (
      examId: string,
      resultsData: Array<{
        studentId: string;
        classId: string;
        subjectId?: string;
        marksObtained: number;
        totalMarks: number;
        remarks?: string;
      }>,
      auth: any
    ) => {
      const { db } = await import("@/lib/db");
      const { results } = await import("@/lib/db/schema");
      const { nanoid } = await import("nanoid");

      const values = resultsData.map((result) => {
        const percentage = result.totalMarks > 0
          ? (result.marksObtained / result.totalMarks) * 100
          : 0;
        const grade = calculateGrade(percentage);

        return {
          id: nanoid(),
          studentId: result.studentId,
          examId,
          classId: result.classId,
          subjectId: result.subjectId || null,
          schoolId: auth.user?.schoolId,
          marksObtained: result.marksObtained,
          totalMarks: result.totalMarks,
          percentage,
          grade,
          remarks: result.remarks || null,
          status: percentage >= 40 ? "pass" : "fail",
          assessedBy: auth.user?.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      });

      const inserted = await db.insert(results).values(values).returning();

      return {
        success: true,
        data: inserted,
        message: `Imported ${resultsData.length} results`,
      };
    },
  },
});

/**
 * Helper function to calculate grade from percentage
 */
function calculateGrade(percentage: number): string {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  if (percentage >= 40) return "E";
  return "F";
}
