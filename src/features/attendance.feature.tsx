/**
 * ATTENDANCE FEATURE DEFINITION
 *
 * Unified definition for attendance records across all portals.
 * Uses the existing "attendance" table.
 */

import { defineFeature } from "@/lib/features/define-feature";

export const AttendanceFeature = defineFeature({
  name: "attendance",
  tableName: "attendance",

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
    classId: {
      type: "reference",
      reference: { table: "classes", displayField: "name" },
      required: true,
      label: "Class",
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

    // Attendance details
    date: {
      type: "date",
      required: true,
      label: "Date",
      sortable: true,
      filterable: true,
    },
    checkInTime: {
      type: "text",
      label: "Check-in Time",
      sortable: true,
    },
    status: {
      type: "enum",
      options: ["present", "absent", "late", "excused"],
      required: true,
      label: "Status",
      sortable: true,
      filterable: true,
    },

    // Metadata
    recordedBy: {
      type: "reference",
      reference: { table: "users", displayField: "firstName" },
      label: "Recorded By",
    },
    notes: {
      type: "text",
      label: "Notes",
      searchable: true,
    },
    reason: {
      type: "text",
      label: "Reason",
      searchable: true,
    },
    entryMethod: {
      type: "enum",
      options: ["manual", "biometric", "rfid", "self", "bulk"],
      label: "Entry Method",
      filterable: true,
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
    read: ["school-admin", "teacher", "parent", "counselor", "admin"],
    create: ["school-admin", "teacher", "admin"],
    update: ["school-admin", "teacher", "admin"],
    delete: ["school-admin", "admin"],
  },

  ui: {
    title: "Attendance",
    titlePlural: "Attendance Records",
    basePath: "/school-admin/attendance",

    // Table column definitions
    columns: [
      {
        key: "date",
        label: "Date",
        sortable: true,
        type: "date",
        searchable: true,
      },
      {
        key: "studentName",
        label: "Student",
        sortable: true,
        searchable: true,
        // Will be populated by custom handler
        render: (value: any, row: any) => row.studentName || value,
      },
      {
        key: "className",
        label: "Class",
        sortable: true,
        filterable: true,
        render: (value: any, row: any) => row.className || value,
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        filterable: true,
            absent: { label: "Absent", color: "bg-red-100 text-red-700" },
            late: { label: "Late", color: "bg-amber-100 text-amber-700" },
            excused: { label: "Excused", color: "bg-blue-100 text-blue-700" },
          };
          const config = statusConfig[value as keyof typeof statusConfig] || statusConfig.present;
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
              {config.label}
            </span>
          );
        },
      },
      {
        key: "checkInTime",
        label: "Check-in",
        sortable: true,
      },
      {
        key: "recordedByName",
        label: "Recorded By",
        render: (value: any, row: any) => row.recordedByName || "-",
      },
      {
        key: "notes",
        label: "Notes",
        searchable: true,
      },
    ],
  },

  // Custom handlers for attendance-specific logic
  customHandlers: {
    // List with joins to get student and class names
    list: async (params: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { attendance, users, classes, schools } = await import("@/lib/db/schema");
      const { eq, and, desc, like, or, sql } = await import("drizzle-orm");

      const {
        page = "1",
        limit = "20",
        search,
        studentId,
        classId,
        schoolId,
        status,
        dateFrom,
        dateTo,
        sortBy = "date",
        sortOrder = "desc",
      } = params;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Build conditions
      const conditions = [];

      // School isolation
      if (auth.user?.schoolId) {
        conditions.push(eq(attendance.schoolId, auth.user.schoolId));
      } else if (schoolId) {
        conditions.push(eq(attendance.schoolId, schoolId));
      }

      if (studentId) conditions.push(eq(attendance.studentId, studentId));
      if (classId) conditions.push(eq(attendance.classId, classId));
      if (status) conditions.push(eq(attendance.status, status));
      if (dateFrom) conditions.push(sql`${attendance.date} >= ${dateFrom}`);
      if (dateTo) conditions.push(sql`${attendance.date} <= ${dateTo}`);

      // Search across multiple fields
      if (search) {
        const searchCondition = or(
          like(users.firstName, `%${search}%`),
          like(users.lastName, `%${search}%`),
          like(attendance.notes, `%${search}%`),
          like(attendance.reason, `%${search}%`)
        );
        if (searchCondition) conditions.push(searchCondition);
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Execute query with joins
      const data = await db
        .select({
          id: attendance.id,
          studentId: attendance.studentId,
          classId: attendance.classId,
          schoolId: attendance.schoolId,
          date: attendance.date,
          checkInTime: attendance.checkInTime,
          status: attendance.status,
          notes: attendance.notes,
          reason: attendance.reason,
          entryMethod: attendance.entryMethod,
          recordedBy: attendance.recordedBy,
          createdAt: attendance.createdAt,
          updatedAt: attendance.updatedAt,
          // Joined fields
          studentName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
          className: classes.name,
          schoolName: schools.name,
        })
        .from(attendance)
        .innerJoin(users, eq(attendance.studentId, users.id))
        .innerJoin(classes, eq(attendance.classId, classes.id))
        .innerJoin(schools, eq(attendance.schoolId, schools.id))
        .where(whereClause)
        .orderBy(
          sortOrder === "asc"
            ? sql`${attendance[sortBy]} ASC`
            : sql`${attendance[sortBy]} DESC`
        )
        .limit(parseInt(limit))
        .offset(offset);

      // Get total count for pagination
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(attendance)
        .innerJoin(users, eq(attendance.studentId, users.id))
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
      const { attendance, users, classes, schools } = await import("@/lib/db/schema");
      const { eq, and, sql } = await import("drizzle-orm");

      const [record] = await db
        .select({
          id: attendance.id,
          studentId: attendance.studentId,
          classId: attendance.classId,
          schoolId: attendance.schoolId,
          date: attendance.date,
          checkInTime: attendance.checkInTime,
          status: attendance.status,
          notes: attendance.notes,
          reason: attendance.reason,
          entryMethod: attendance.entryMethod,
          recordedBy: attendance.recordedBy,
          createdAt: attendance.createdAt,
          updatedAt: attendance.updatedAt,
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
          school: {
            id: schools.id,
            name: schools.name,
          },
        })
        .from(attendance)
        .innerJoin(users, eq(attendance.studentId, users.id))
        .innerJoin(classes, eq(attendance.classId, classes.id))
        .innerJoin(schools, eq(attendance.schoolId, schools.id))
        .where(eq(attendance.id, id));

      if (!record) {
        return {
          success: false,
          error: "Attendance record not found",
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

    // Create attendance record
    create: async (data: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { attendance } = await import("@/lib/db/schema");
      const { nanoid } = await import("nanoid");

      const [record] = await db
        .insert(attendance)
        .values({
          id: nanoid(),
          studentId: data.studentId,
          classId: data.classId,
          schoolId: data.schoolId || auth.user?.schoolId,
          date: data.date,
          checkInTime: data.checkInTime || null,
          status: data.status,
          recordedBy: auth.user?.id,
          notes: data.notes || null,
          reason: data.reason || null,
          entryMethod: data.entryMethod || "manual",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return {
        success: true,
        data: record,
      };
    },

    // Update attendance record
    update: async (id: string, data: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { attendance } = await import("@/lib/db/schema");
      const { eq, and } = await import("drizzle-orm");

      const updateData: any = {
        ...data,
        updatedAt: new Date(),
      };

      const [record] = await db
        .update(attendance)
        .set(updateData)
        .where(and(eq(attendance.id, id), auth.user?.schoolId ? eq(attendance.schoolId, auth.user.schoolId) : undefined))
        .returning();

      if (!record) {
        return {
          success: false,
          error: "Attendance record not found or unauthorized",
        };
      }

      return {
        success: true,
        data: record,
      };
    },

    // Delete attendance record (soft delete recommended)
    delete: async (id: string, auth: any) => {
      const { db } = await import("@/lib/db");
      const { attendance } = await import("@/lib/db/schema");
      const { eq, and } = await import("drizzle-orm");

      await db
        .delete(attendance)
        .where(and(eq(attendance.id, id), auth.user?.schoolId ? eq(attendance.schoolId, auth.user.schoolId) : undefined));

      return {
        success: true,
        message: "Attendance record deleted",
      };
    },
  },

  // Bulk operations for attendance marking
  bulkOperations: {
    // Mark attendance for entire class
    markClassAttendance: async (classId: string, date: string, records: Array<{ studentId: string; status: string; notes?: string }>, auth: any) => {
      const { db } = await import("@/lib/db");
      const { attendance } = await import("@/lib/db/schema");
      const { nanoid } = await import("nanoid");

      const values = records.map((record) => ({
        id: nanoid(),
        studentId: record.studentId,
        classId,
        schoolId: auth.user?.schoolId,
        date,
        status: record.status,
        notes: record.notes || null,
        recordedBy: auth.user?.id,
        entryMethod: "bulk",
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const inserted = await db.insert(attendance).values(values).returning();

      return {
        success: true,
        data: inserted,
        message: `Marked attendance for ${records.length} students`,
      };
    },

    // Get attendance summary for a class
    getClassSummary: async (classId: string, dateFrom: string, dateTo: string, auth: any) => {
      const { db } = await import("@/lib/db");
      const { attendance } = await import("@/lib/db/schema");
      const { eq, and, sql, gte, lte } = await import("drizzle-orm");

      const summary = await db
        .select({
          status: attendance.status,
          count: sql<number>`count(*)::int`,
        })
        .from(attendance)
        .where(
          and(
            eq(attendance.classId, classId),
            auth.user?.schoolId ? eq(attendance.schoolId, auth.user.schoolId) : undefined,
            gte(attendance.date, dateFrom),
            lte(attendance.date, dateTo)
          )
        )
        .groupBy(attendance.status);

      const total = summary.reduce((sum, row) => sum + row.count, 0);

      return {
        success: true,
        data: {
          summary,
          total,
          byStatus: summary.reduce((acc: any, row) => {
            acc[row.status] = row.count;
            return acc;
          }, {}),
        },
      };
    },

    // Get student attendance history
    getStudentHistory: async (studentId: string, auth: any, dateFrom?: string, dateTo?: string) => {
      const { db } = await import("@/lib/db");
      const { attendance } = await import("@/lib/db/schema");
      const { eq, and, gte, lte, desc } = await import("drizzle-orm");

      const conditions = [eq(attendance.studentId, studentId)];

      if (auth.user?.schoolId) {
        conditions.push(eq(attendance.schoolId, auth.user.schoolId));
      }
      if (dateFrom) conditions.push(gte(attendance.date, dateFrom));
      if (dateTo) conditions.push(lte(attendance.date, dateTo));

      const records = await db
        .select()
        .from(attendance)
        .where(and(...conditions))
        .orderBy(desc(attendance.date))
        .limit(100);

      // Calculate statistics
      const stats = {
        total: records.length,
        present: records.filter((r) => r.status === "present").length,
        absent: records.filter((r) => r.status === "absent").length,
        late: records.filter((r) => r.status === "late").length,
        excused: records.filter((r) => r.status === "excused").length,
        attendanceRate: records.length > 0
          ? (records.filter((r) => r.status === "present" || r.status === "late").length / records.length) * 100
          : 0,
      };

      return {
        success: true,
        data: {
          records,
          stats,
        },
      };
    },
  },
});
