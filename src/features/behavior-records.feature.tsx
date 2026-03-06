/**
 * BEHAVIOR RECORDS FEATURE DEFINITION
 *
 * Unified definition for behavior records across all portals.
 * Tracks student behavior incidents, both positive and negative.
 */

import { defineFeature } from "@/lib/features/define-feature";

export const BehaviorRecordFeature = defineFeature({
  name: "behavior-records",
  tableName: "behaviorRecords",

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
    schoolId: {
      type: "reference",
      reference: { table: "schools", displayField: "name" },
      label: "School",
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

    // Incident details
    incidentDate: {
      type: "date",
      required: true,
      label: "Incident Date",
      sortable: true,
      filterable: true,
    },
    incidentType: {
      type: "enum",
      options: ["positive", "negative", "neutral"],
      required: true,
      label: "Incident Type",
      sortable: true,
      filterable: true,
    },
    severity: {
      type: "enum",
      options: ["low", "medium", "high"],
      required: true,
      label: "Severity",
      sortable: true,
      filterable: true,
    },
    description: {
      type: "text",
      label: "Description",
      multiline: true,
      rows: 4,
      searchable: true,
    },
    actionTaken: {
      type: "text",
      label: "Action Taken",
      multiline: true,
      rows: 3,
    },

    // Verification
    reportedBy: {
      type: "reference",
      reference: { table: "users", displayField: "firstName" },
      label: "Reported By",
    },
    verifiedBy: {
      type: "reference",
      reference: { table: "users", displayField: "firstName" },
      label: "Verified By",
    },
    status: {
      type: "enum",
      options: ["reported", "verified", "resolved"],
      required: true,
      label: "Status",
      sortable: true,
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
    read: ["school-admin", "teacher", "counselor", "parent", "admin"],
    create: ["school-admin", "teacher", "counselor", "admin"],
    update: ["school-admin", "teacher", "counselor", "admin"],
    delete: ["school-admin", "admin"],
  },

  ui: {
    title: "Behavior Record",
    titlePlural: "Behavior Records",
    basePath: "/school-admin/behavior-records",

    // Table column definitions
    columns: [
      {
        key: "studentName",
        label: "Student",
        sortable: true,
        searchable: true,
        // Will be populated by custom handler
        render: (value: any, row: any) => row.studentName || value,
      },
      {
        key: "incidentDate",
        label: "Incident Date",
        sortable: true,
        type: "date",
      },
      {
        key: "incidentType",
        label: "Type",
        sortable: true,
        filterable: true,
        render: (value: string) => {
          const typeConfig = {
            negative: { label: "Negative", color: "bg-red-100 text-red-700" },
            neutral: { label: "Neutral", color: "bg-gray-100 text-gray-700" },
            positive: { label: "Positive", color: "bg-green-100 text-green-700" },
          };
          const config = typeConfig[value as keyof typeof typeConfig] || typeConfig.neutral;
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
              {config.label}
            </span>
          );
        },
      },
      {
        key: "severity",
        label: "Severity",
        sortable: true,
        filterable: true,
        render: (value: string) => {
          const severityConfig = {
            low: { label: "Low", color: "bg-green-100 text-green-700" },
            medium: { label: "Medium", color: "bg-amber-100 text-amber-700" },
            high: { label: "High", color: "bg-red-100 text-red-700" },
          };
          const config = severityConfig[value as keyof typeof severityConfig] || severityConfig.low;
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
              {config.label}
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
            reported: { label: "Reported", color: "bg-yellow-100 text-yellow-700" },
            verified: { label: "Verified", color: "bg-blue-100 text-blue-700" },
            resolved: { label: "Resolved", color: "bg-green-100 text-green-700" },
          };
          const config = statusConfig[value as keyof typeof statusConfig] || statusConfig.reported;
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
              {config.label}
            </span>
          );
        },
      },
      {
        key: "description",
        label: "Description",
        searchable: true,
      },
      {
        key: "reportedByName",
        label: "Reported By",
        render: (value: any, row: any) => row.reportedByName || "-",
      },
    ],
  },

  // Custom handlers for behavior records with student name join
  customHandlers: {
    // List with joins to get student name
    list: async (params: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { behaviorRecords, users, classes, schools } = await import("@/lib/db/schema");
      const { eq, and, desc, like, or, sql } = await import("drizzle-orm");

      const {
        page = "1",
        limit = "20",
        search,
        studentId,
        classId,
        schoolId,
        incidentType,
        severity,
        status,
        dateFrom,
        dateTo,
        sortBy = "incidentDate",
        sortOrder = "desc",
      } = params;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Build conditions
      const conditions = [];

      // School isolation
      if (auth.user?.schoolId) {
        conditions.push(eq(behaviorRecords.schoolId, auth.user.schoolId));
      } else if (schoolId) {
        conditions.push(eq(behaviorRecords.schoolId, schoolId));
      }

      if (studentId) conditions.push(eq(behaviorRecords.studentId, studentId));
      if (classId) conditions.push(eq(behaviorRecords.classId, classId));
      if (incidentType) conditions.push(eq(behaviorRecords.incidentType, incidentType));
      if (severity) conditions.push(eq(behaviorRecords.severity, severity));
      if (status) conditions.push(eq(behaviorRecords.status, status));
      if (dateFrom) conditions.push(sql`${behaviorRecords.incidentDate} >= ${dateFrom}`);
      if (dateTo) conditions.push(sql`${behaviorRecords.incidentDate} <= ${dateTo}`);

      // Search across multiple fields
      if (search) {
        const searchCondition = or(
          like(users.firstName, `%${search}%`),
          like(users.lastName, `%${search}%`),
          like(behaviorRecords.description, `%${search}%`),
          like(behaviorRecords.actionTaken, `%${search}%`)
        );
        if (searchCondition) conditions.push(searchCondition);
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Execute query with joins
      const data = await db
        .select({
          id: behaviorRecords.id,
          studentId: behaviorRecords.studentId,
          classId: behaviorRecords.classId,
          schoolId: behaviorRecords.schoolId,
          incidentDate: behaviorRecords.incidentDate,
          incidentType: behaviorRecords.incidentType,
          severity: behaviorRecords.severity,
          description: behaviorRecords.description,
          actionTaken: behaviorRecords.actionTaken,
          reportedBy: behaviorRecords.reportedBy,
          verifiedBy: behaviorRecords.verifiedBy,
          status: behaviorRecords.status,
          createdAt: behaviorRecords.createdAt,
          updatedAt: behaviorRecords.updatedAt,
          // Joined fields
          studentName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
          className: classes.name,
          schoolName: schools.name,
          reportedByName: sql<string>`reported_by.firstName || ' ' || reported_by.lastName`,
          verifiedByName: sql<string>`verified_by.firstName || ' ' || verified_by.lastName`,
        })
        .from(behaviorRecords)
        .innerJoin(users, eq(behaviorRecords.studentId, users.id))
        .innerJoin(classes, eq(behaviorRecords.classId, classes.id))
        .innerJoin(schools, eq(behaviorRecords.schoolId, schools.id))
        .leftJoin(users.as("reported_by"), eq(behaviorRecords.reportedBy, sql`reported_by.id`))
        .leftJoin(users.as("verified_by"), eq(behaviorRecords.verifiedBy, sql`verified_by.id`))
        .where(whereClause)
        .orderBy(
          sortOrder === "asc"
            ? sql`${behaviorRecords[sortBy]} ASC`
            : sql`${behaviorRecords[sortBy]} DESC`
        )
        .limit(parseInt(limit))
        .offset(offset);

      // Get total count for pagination
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(behaviorRecords)
        .innerJoin(users, eq(behaviorRecords.studentId, users.id))
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
      const { behaviorRecords, users, classes, schools } = await import("@/lib/db/schema");
      const { eq, and, sql } = await import("drizzle-orm");

      const [record] = await db
        .select({
          id: behaviorRecords.id,
          studentId: behaviorRecords.studentId,
          classId: behaviorRecords.classId,
          schoolId: behaviorRecords.schoolId,
          incidentDate: behaviorRecords.incidentDate,
          incidentType: behaviorRecords.incidentType,
          severity: behaviorRecords.severity,
          description: behaviorRecords.description,
          actionTaken: behaviorRecords.actionTaken,
          reportedBy: behaviorRecords.reportedBy,
          verifiedBy: behaviorRecords.verifiedBy,
          status: behaviorRecords.status,
          createdAt: behaviorRecords.createdAt,
          updatedAt: behaviorRecords.updatedAt,
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
        .from(behaviorRecords)
        .innerJoin(users, eq(behaviorRecords.studentId, users.id))
        .innerJoin(classes, eq(behaviorRecords.classId, classes.id))
        .innerJoin(schools, eq(behaviorRecords.schoolId, schools.id))
        .where(eq(behaviorRecords.id, id));

      if (!record) {
        return {
          success: false,
          error: "Behavior record not found",
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

    // Create behavior record
    create: async (data: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { behaviorRecords } = await import("@/lib/db/schema");
      const { nanoid } = await import("nanoid");

      const [record] = await db
        .insert(behaviorRecords)
        .values({
          id: nanoid(),
          studentId: data.studentId,
          classId: data.classId,
          schoolId: data.schoolId || auth.user?.schoolId,
          incidentDate: data.incidentDate,
          incidentType: data.incidentType,
          severity: data.severity,
          description: data.description || null,
          actionTaken: data.actionTaken || null,
          reportedBy: auth.user?.id,
          verifiedBy: null,
          status: data.status || "reported",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return {
        success: true,
        data: record,
      };
    },

    // Update behavior record
    update: async (id: string, data: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { behaviorRecords } = await import("@/lib/db/schema");
      const { eq, and } = await import("drizzle-orm");

      const updateData: any = {
        ...data,
        updatedAt: new Date(),
      };

      // Auto-set verifiedBy when status changes to verified/resolved
      if (data.status === "verified" || data.status === "resolved") {
        updateData.verifiedBy = auth.user?.id;
      }

      const [record] = await db
        .update(behaviorRecords)
        .set(updateData)
        .where(
          and(
            eq(behaviorRecords.id, id),
            auth.user?.schoolId ? eq(behaviorRecords.schoolId, auth.user.schoolId) : undefined
          )
        )
        .returning();

      if (!record) {
        return {
          success: false,
          error: "Behavior record not found or unauthorized",
        };
      }

      return {
        success: true,
        data: record,
      };
    },

    // Delete behavior record
    delete: async (id: string, auth: any) => {
      const { db } = await import("@/lib/db");
      const { behaviorRecords } = await import("@/lib/db/schema");
      const { eq, and } = await import("drizzle-orm");

      await db
        .delete(behaviorRecords)
        .where(
          and(
            eq(behaviorRecords.id, id),
            auth.user?.schoolId ? eq(behaviorRecords.schoolId, auth.user.schoolId) : undefined
          )
        );

      return {
        success: true,
        message: "Behavior record deleted",
      };
    },
  },

  // Bulk operations for behavior records
  bulkOperations: {
    // Get behavior summary for a student
    getStudentSummary: async (studentId: string, auth: any, dateFrom?: string, dateTo?: string) => {
      const { db } = await import("@/lib/db");
      const { behaviorRecords } = await import("@/lib/db/schema");
      const { eq, and, sql, gte, lte } = await import("drizzle-orm");

      const conditions = [eq(behaviorRecords.studentId, studentId)];

      if (auth.user?.schoolId) {
        conditions.push(eq(behaviorRecords.schoolId, auth.user.schoolId));
      }
      if (dateFrom) conditions.push(gte(behaviorRecords.incidentDate, dateFrom));
      if (dateTo) conditions.push(lte(behaviorRecords.incidentDate, dateTo));

      const summary = await db
        .select({
          incidentType: behaviorRecords.incidentType,
          severity: behaviorRecords.severity,
          status: behaviorRecords.status,
          count: sql<number>`count(*)::int`,
        })
        .from(behaviorRecords)
        .where(and(...conditions))
        .groupBy(behaviorRecords.incidentType, behaviorRecords.severity, behaviorRecords.status);

      const total = summary.reduce((sum, row) => sum + row.count, 0);

      return {
        success: true,
        data: {
          summary,
          total,
          byType: summary.reduce((acc: any, row) => {
            acc[row.incidentType] = (acc[row.incidentType] || 0) + row.count;
            return acc;
          }, {}),
          bySeverity: summary.reduce((acc: any, row) => {
            acc[row.severity] = (acc[row.severity] || 0) + row.count;
            return acc;
          }, {}),
          byStatus: summary.reduce((acc: any, row) => {
            acc[row.status] = (acc[row.status] || 0) + row.count;
            return acc;
          }, {}),
        },
      };
    },

    // Get behavior summary for a class
    getClassSummary: async (classId: string, dateFrom: string, dateTo: string, auth: any) => {
      const { db } = await import("@/lib/db");
      const { behaviorRecords } = await import("@/lib/db/schema");
      const { eq, and, sql, gte, lte } = await import("drizzle-orm");

      const summary = await db
        .select({
          incidentType: behaviorRecords.incidentType,
          severity: behaviorRecords.severity,
          count: sql<number>`count(*)::int`,
        })
        .from(behaviorRecords)
        .where(
          and(
            eq(behaviorRecords.classId, classId),
            auth.user?.schoolId ? eq(behaviorRecords.schoolId, auth.user.schoolId) : undefined,
            gte(behaviorRecords.incidentDate, dateFrom),
            lte(behaviorRecords.incidentDate, dateTo)
          )
        )
        .groupBy(behaviorRecords.incidentType, behaviorRecords.severity);

      const total = summary.reduce((sum, row) => sum + row.count, 0);

      return {
        success: true,
        data: {
          summary,
          total,
          byType: summary.reduce((acc: any, row) => {
            acc[row.incidentType] = (acc[row.incidentType] || 0) + row.count;
            return acc;
          }, {}),
          bySeverity: summary.reduce((acc: any, row) => {
            acc[row.severity] = (acc[row.severity] || 0) + row.count;
            return acc;
          }, {}),
        },
      };
    },
  },
});
