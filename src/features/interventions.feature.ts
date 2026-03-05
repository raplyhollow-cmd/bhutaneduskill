/**
 * INTERVENTIONS FEATURE DEFINITION
 *
 * Unified definition for student intervention records across all portals.
 * Tracks academic, behavioral, and counseling interventions for students.
 */

import { defineFeature } from "@/lib/features/define-feature";

export const InterventionFeature = defineFeature({
  name: "interventions",
  tableName: "interventions",

  schema: {
    // Primary fields
    id: { type: "text", required: true, primary: true },
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

    // Intervention details
    type: {
      type: "enum",
      options: ["academic", "behavioral", "counseling"],
      required: true,
      label: "Type",
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
      required: true,
      label: "Description",
      multiline: true,
      rows: 4,
      searchable: true,
    },
    startDate: {
      type: "date",
      required: true,
      label: "Start Date",
      sortable: true,
      filterable: true,
    },
    endDate: {
      type: "date",
      label: "End Date",
      sortable: true,
      filterable: true,
    },
    assignedTo: {
      type: "reference",
      reference: { table: "users", displayField: "firstName" },
      label: "Assigned To",
      sortable: true,
      filterable: true,
    },
    status: {
      type: "enum",
      options: ["planned", "active", "completed", "cancelled"],
      required: true,
      label: "Status",
      sortable: true,
      filterable: true,
    },
    outcome: {
      type: "text",
      label: "Outcome",
      multiline: true,
      rows: 3,
      searchable: true,
    },
    followUpDate: {
      type: "date",
      label: "Follow-up Date",
      sortable: true,
      filterable: true,
    },

    // Metadata
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
    read: ["school-admin", "teacher", "counselor"],
    create: ["school-admin", "counselor"],
    update: ["school-admin", "counselor"],
    delete: ["school-admin", "counselor"],
  },

  ui: {
    title: "Intervention",
    titlePlural: "Interventions",
    basePath: "/school-admin/interventions",

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
        key: "type",
        label: "Type",
        sortable: true,
        filterable: true,
            behavioral: { label: "Behavioral", color: "bg-amber-100 text-amber-700" },
            counseling: { label: "Counseling", color: "bg-purple-100 text-purple-700" },
          };
          const config = typeConfig[value as keyof typeof typeConfig] || typeConfig.academic;
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
            medium: { label: "Medium", color: "bg-yellow-100 text-yellow-700" },
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
            active: { label: "Active", color: "bg-blue-100 text-blue-700" },
            completed: { label: "Completed", color: "bg-green-100 text-green-700" },
            cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700" },
          };
          const config = statusConfig[value as keyof typeof statusConfig] || statusConfig.planned;
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
              {config.label}
            </span>
          );
        },
      },
      {
        key: "assignedToName",
        label: "Assigned To",
        sortable: true,
        render: (value: any, row: any) => row.assignedToName || "-",
      },
      {
        key: "startDate",
        label: "Start Date",
        sortable: true,
        type: "date",
      },
    ],
  },

  // Custom handlers for interventions-specific logic
  customHandlers: {
    // List with joins to get student and assigned user names
    list: async (params: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { interventions, users, schools } = await import("@/lib/db/schema");
      const { eq, and, desc, like, or, sql, isNull } = await import("drizzle-orm");

      const {
        page = "1",
        limit = "20",
        search,
        studentId,
        schoolId,
        type,
        severity,
        status,
        assignedTo,
        sortBy = "startDate",
        sortOrder = "desc",
      } = params;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Build conditions
      const conditions = [];

      // School isolation
      if (auth.user?.schoolId) {
        conditions.push(eq(interventions.schoolId, auth.user.schoolId));
      } else if (schoolId) {
        conditions.push(eq(interventions.schoolId, schoolId));
      }

      if (studentId) conditions.push(eq(interventions.studentId, studentId));
      if (type) conditions.push(eq(interventions.type, type));
      if (severity) conditions.push(eq(interventions.severity, severity));
      if (status) conditions.push(eq(interventions.status, status));
      if (assignedTo) conditions.push(eq(interventions.assignedTo, assignedTo));

      // Search across multiple fields
      if (search) {
        const searchCondition = or(
          like(users.firstName, `%${search}%`),
          like(users.lastName, `%${search}%`),
          like(interventions.description, `%${search}%`),
          like(interventions.outcome, `%${search}%`)
        );
        if (searchCondition) conditions.push(searchCondition);
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Student alias for name
      const student = users;
      const assignedUser = users;

      // Execute query with joins
      const data = await db
        .select({
          id: interventions.id,
          studentId: interventions.studentId,
          schoolId: interventions.schoolId,
          type: interventions.type,
          severity: interventions.severity,
          description: interventions.description,
          startDate: interventions.startDate,
          endDate: interventions.endDate,
          assignedTo: interventions.assignedTo,
          status: interventions.status,
          outcome: interventions.outcome,
          followUpDate: interventions.followUpDate,
          createdAt: interventions.createdAt,
          updatedAt: interventions.updatedAt,
          // Joined fields
          studentName: sql<string>`concat(${student.firstName}, ' ', ${student.lastName})`,
          schoolName: schools.name,
        })
        .from(interventions)
        .innerJoin(student, eq(interventions.studentId, student.id))
        .innerJoin(schools, eq(interventions.schoolId, schools.id))
        .where(whereClause)
        .orderBy(
          sortOrder === "asc"
            ? sql`${interventions[sortBy]} ASC`
            : sql`${interventions[sortBy]} DESC`
        )
        .limit(parseInt(limit))
        .offset(offset);

      // Get total count for pagination
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(interventions)
        .innerJoin(student, eq(interventions.studentId, student.id))
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
      const { interventions, users, schools } = await import("@/lib/db/schema");
      const { eq, and, sql } = await import("drizzle-orm");

      const [record] = await db
        .select({
          id: interventions.id,
          studentId: interventions.studentId,
          schoolId: interventions.schoolId,
          type: interventions.type,
          severity: interventions.severity,
          description: interventions.description,
          startDate: interventions.startDate,
          endDate: interventions.endDate,
          assignedTo: interventions.assignedTo,
          status: interventions.status,
          outcome: interventions.outcome,
          followUpDate: interventions.followUpDate,
          createdAt: interventions.createdAt,
          updatedAt: interventions.updatedAt,
        })
        .from(interventions)
        .where(eq(interventions.id, id));

      if (!record) {
        return {
          success: false,
          error: "Intervention not found",
        };
      }

      // Get related data
      const [student] = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          rollNumber: users.rollNumber,
        })
        .from(users)
        .where(eq(users.id, record.studentId))
        .limit(1);

      const [assignedUser] = record.assignedTo
        ? await db
            .select({
              id: users.id,
              firstName: users.firstName,
              lastName: users.lastName,
              email: users.email,
            })
            .from(users)
            .where(eq(users.id, record.assignedTo))
            .limit(1)
        : [null];

      // School isolation check
      if (auth.user?.schoolId && record.schoolId !== auth.user.schoolId) {
        return {
          success: false,
          error: "Unauthorized",
        };
      }

      return {
        success: true,
        data: {
          ...record,
          student,
          assignedToUser: assignedUser,
        },
      };
    },

    // Create intervention record
    create: async (data: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { interventions } = await import("@/lib/db/schema");
      const { nanoid } = await import("nanoid");

      const [record] = await db
        .insert(interventions)
        .values({
          id: nanoid(),
          studentId: data.studentId,
          schoolId: data.schoolId || auth.user?.schoolId,
          type: data.type,
          severity: data.severity,
          description: data.description,
          startDate: data.startDate,
          endDate: data.endDate || null,
          assignedTo: data.assignedTo || null,
          status: data.status || "planned",
          outcome: data.outcome || null,
          followUpDate: data.followUpDate || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return {
        success: true,
        data: record,
      };
    },

    // Update intervention record
    update: async (id: string, data: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { interventions } = await import("@/lib/db/schema");
      const { eq, and } = await import("drizzle-orm");

      const updateData: any = {
        ...data,
        updatedAt: new Date(),
      };

      const [record] = await db
        .update(interventions)
        .set(updateData)
        .where(
          and(
            eq(interventions.id, id),
            auth.user?.schoolId ? eq(interventions.schoolId, auth.user.schoolId) : undefined
          )
        )
        .returning();

      if (!record) {
        return {
          success: false,
          error: "Intervention not found or unauthorized",
        };
      }

      return {
        success: true,
        data: record,
      };
    },

    // Delete intervention record
    delete: async (id: string, auth: any) => {
      const { db } = await import("@/lib/db");
      const { interventions } = await import("@/lib/db/schema");
      const { eq, and } = await import("drizzle-orm");

      await db
        .delete(interventions)
        .where(
          and(
            eq(interventions.id, id),
            auth.user?.schoolId ? eq(interventions.schoolId, auth.user.schoolId) : undefined
          )
        );

      return {
        success: true,
        message: "Intervention deleted",
      };
    },
  },

  // Bulk operations for interventions management
  bulkOperations: {
    // Get interventions summary for a student
    getStudentInterventions: async (studentId: string, auth: any) => {
      const { db } = await import("@/lib/db");
      const { interventions } = await import("@/lib/db/schema");
      const { eq, and, desc, sql } = await import("drizzle-orm");

      const records = await db
        .select()
        .from(interventions)
        .where(
          and(
            eq(interventions.studentId, studentId),
            auth.user?.schoolId ? eq(interventions.schoolId, auth.user.schoolId) : undefined
          )
        )
        .orderBy(desc(interventions.createdAt))
        .limit(50);

      // Calculate statistics
      const stats = {
        total: records.length,
        byType: {
          academic: records.filter((r) => r.type === "academic").length,
          behavioral: records.filter((r) => r.type === "behavioral").length,
          counseling: records.filter((r) => r.type === "counseling").length,
        },
        byStatus: {
          planned: records.filter((r) => r.status === "planned").length,
          active: records.filter((r) => r.status === "active").length,
          completed: records.filter((r) => r.status === "completed").length,
          cancelled: records.filter((r) => r.status === "cancelled").length,
        },
        bySeverity: {
          low: records.filter((r) => r.severity === "low").length,
          medium: records.filter((r) => r.severity === "medium").length,
          high: records.filter((r) => r.severity === "high").length,
        },
        activeCount: records.filter((r) => r.status === "active").length,
        highSeverityActive: records.filter((r) => r.severity === "high" && r.status === "active").length,
      };

      return {
        success: true,
        data: {
          records,
          stats,
        },
      };
    },

    // Get interventions needing follow-up
    getFollowUpRequired: async (auth: any, daysThreshold = 7) => {
      const { db } = await import("@/lib/db");
      const { interventions } = await import("@/lib/db/schema");
      const { eq, and, lte, sql, isNull } = await import("drizzle-orm");

      const today = new Date().toISOString().split('T')[0];
      const thresholdDate = new Date(Date.now() + daysThreshold * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const records = await db
        .select()
        .from(interventions)
        .where(
          and(
            auth.user?.schoolId ? eq(interventions.schoolId, auth.user.schoolId) : undefined,
            sql`${interventions.followUpDate} <= ${thresholdDate}`,
            sql`${interventions.status} IN ('active', 'planned')`
          )
        )
        .orderBy(interventions.followUpDate);

      return {
        success: true,
        data: records,
      };
    },

    // Get active interventions by severity
    getBySeverity: async (severity: string, auth: any) => {
      const { db } = await import("@/lib/db");
      const { interventions } = await import("@/lib/db/schema");
      const { eq, and } = await import("drizzle-orm");

      const records = await db
        .select()
        .from(interventions)
        .where(
          and(
            eq(interventions.severity, severity),
            eq(interventions.status, "active"),
            auth.user?.schoolId ? eq(interventions.schoolId, auth.user.schoolId) : undefined
          )
        )
        .orderBy(interventions.startDate);

      return {
        success: true,
        data: records,
      };
    },
  },
});
