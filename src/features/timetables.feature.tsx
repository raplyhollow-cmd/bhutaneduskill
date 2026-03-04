/**
 * TIMETABLES FEATURE DEFINITION
 *
 * Unified definition for timetable management across all portals.
 * Manages class schedules with periods, days, subjects, teachers, and rooms.
 */

import { defineFeature } from "@/lib/features/define-feature";

export const TimetableFeature = defineFeature({
  name: "timetables",
  tableName: "timetables",

  schema: {
    // Primary fields
    id: { type: "text", required: true, primary: true },
    classId: {
      type: "reference",
      reference: { table: "classes", displayField: "name", onDelete: "cascade" },
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

    // Schedule details
    dayOfWeek: {
      type: "enum",
      options: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
      required: true,
      label: "Day",
      sortable: true,
      filterable: true,
    },
    periodNumber: {
      type: "integer",
      required: true,
      label: "Period",
      sortable: true,
      filterable: true,
    },
    startTime: {
      type: "text",
      label: "Start Time",
      sortable: true,
    },
    endTime: {
      type: "text",
      label: "End Time",
      sortable: true,
    },

    // Assignment details
    subjectId: {
      type: "reference",
      reference: { table: "subjects", displayField: "name" },
      required: true,
      label: "Subject",
      sortable: true,
      filterable: true,
    },
    teacherId: {
      type: "reference",
      reference: { table: "users", displayField: "firstName" },
      required: true,
      label: "Teacher",
      sortable: true,
      filterable: true,
    },
    roomNumber: {
      type: "text",
      label: "Room",
      sortable: true,
      searchable: true,
    },

    // Academic context
    semester: {
      type: "text",
      label: "Semester",
      filterable: true,
    },
    academicYear: {
      type: "text",
      label: "Academic Year",
      filterable: true,
    },

    // Status
    isActive: {
      type: "boolean",
      label: "Active",
      sortable: true,
      filterable: true,
      defaultValue: true,
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
    read: ["school-admin", "teacher", "student", "parent", "counselor", "admin"],
    create: ["school-admin", "admin"],
    update: ["school-admin", "admin"],
    delete: ["school-admin", "admin"],
  },

  ui: {
    title: "Timetable",
    titlePlural: "Timetables",
    basePath: "/school-admin/timetables",

    // Table column definitions
    columns: [
      {
        key: "className",
        label: "Class",
        sortable: true,
        filterable: true,
        searchable: true,
        render: (value: any, row: any) => row.className || value,
      },
      {
        key: "dayOfWeek",
        label: "Day",
        sortable: true,
        filterable: true,
        render: (value: string) => {
          const dayNames = {
            mon: "Monday",
            tue: "Tuesday",
            wed: "Wednesday",
            thu: "Thursday",
            fri: "Friday",
            sat: "Saturday",
            sun: "Sunday",
          };
          return dayNames[value as keyof typeof dayNames] || value;
        },
      },
      {
        key: "periodNumber",
        label: "Period",
        sortable: true,
        filterable: true,
      },
      {
        key: "subjectName",
        label: "Subject",
        sortable: true,
        filterable: true,
        render: (value: any, row: any) => row.subjectName || value,
      },
      {
        key: "teacherName",
        label: "Teacher",
        sortable: true,
        filterable: true,
        render: (value: any, row: any) => row.teacherName || value,
      },
      {
        key: "roomNumber",
        label: "Room",
        sortable: true,
        searchable: true,
      },
      {
        key: "startTime",
        label: "Start Time",
        sortable: true,
        render: (value: string) => value || "-",
      },
      {
        key: "endTime",
        label: "End Time",
        sortable: true,
        render: (value: string) => value || "-",
      },
      {
        key: "academicYear",
        label: "Academic Year",
        filterable: true,
      },
      {
        key: "isActive",
        label: "Status",
        sortable: true,
        filterable: true,
        render: (value: boolean) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              value ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {value ? "Active" : "Inactive"}
          </span>
        ),
      },
    ],
  },

  // Custom handlers for timetable-specific logic
  customHandlers: {
    // List with joins to get class, subject, and teacher names
    list: async (params: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { timetables, classes, subjects, users, schools } = await import("@/lib/db/schema");
      const { eq, and, desc, like, or, sql, inArray } = await import("drizzle-orm");

      const {
        page = "1",
        limit = "20",
        search,
        classId,
        schoolId,
        dayOfWeek,
        subjectId,
        teacherId,
        academicYear,
        semester,
        isActive,
        sortBy = "dayOfWeek,periodNumber",
        sortOrder = "asc",
      } = params;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Build conditions
      const conditions = [];

      // School isolation
      if (auth.user?.schoolId) {
        conditions.push(eq(timetables.schoolId, auth.user.schoolId));
      } else if (schoolId) {
        conditions.push(eq(timetables.schoolId, schoolId));
      }

      // Only active records
      if (isActive !== "false") {
        conditions.push(eq(timetables.isActive, true));
      } else if (isActive === "false") {
        conditions.push(eq(timetables.isActive, false));
      }

      if (classId) conditions.push(eq(timetables.classId, classId));
      if (dayOfWeek) conditions.push(eq(timetables.dayOfWeek, dayOfWeek));
      if (subjectId) conditions.push(eq(timetables.subjectId, subjectId));
      if (teacherId) conditions.push(eq(timetables.teacherId, teacherId));
      if (academicYear) conditions.push(eq(timetables.academicYear, academicYear));
      if (semester) conditions.push(eq(timetables.semester, semester));

      // Search across multiple fields
      if (search) {
        const searchCondition = or(
          like(classes.name, `%${search}%`),
          like(subjects.name, `%${search}%`),
          like(users.firstName, `%${search}%`),
          like(users.lastName, `%${search}%`),
          like(timetables.roomNumber, `%${search}%`)
        );
        if (searchCondition) conditions.push(searchCondition);
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Handle composite sort
      let orderByClause;
      if (sortBy.includes(",")) {
        const sortFields = sortBy.split(",");
        orderByClause = sortFields.map((field: string) =>
          sortOrder === "asc" ? sql`${timetables[field.trim()]} ASC` : sql`${timetables[field.trim()]} DESC`
        );
      } else {
        orderByClause =
          sortOrder === "asc" ? sql`${timetables[sortBy]} ASC` : sql`${timetables[sortBy]} DESC`;
      }

      // Execute query with joins
      const data = await db
        .select({
          id: timetables.id,
          classId: timetables.classId,
          schoolId: timetables.schoolId,
          dayOfWeek: timetables.dayOfWeek,
          periodNumber: timetables.periodNumber,
          startTime: timetables.startTime,
          endTime: timetables.endTime,
          subjectId: timetables.subjectId,
          teacherId: timetables.teacherId,
          roomNumber: timetables.roomNumber,
          semester: timetables.semester,
          academicYear: timetables.academicYear,
          isActive: timetables.isActive,
          createdAt: timetables.createdAt,
          updatedAt: timetables.updatedAt,
          // Joined fields
          className: classes.name,
          subjectName: subjects.name,
          subjectCode: subjects.code,
          teacherName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
          teacherEmail: users.email,
          schoolName: schools.name,
        })
        .from(timetables)
        .innerJoin(classes, eq(timetables.classId, classes.id))
        .innerJoin(subjects, eq(timetables.subjectId, subjects.id))
        .innerJoin(users, eq(timetables.teacherId, users.id))
        .innerJoin(schools, eq(timetables.schoolId, schools.id))
        .where(whereClause)
        .orderBy(...(Array.isArray(orderByClause) ? orderByClause : [orderByClause]))
        .limit(parseInt(limit))
        .offset(offset);

      // Get total count for pagination
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(timetables)
        .innerJoin(classes, eq(timetables.classId, classes.id))
        .innerJoin(subjects, eq(timetables.subjectId, subjects.id))
        .innerJoin(users, eq(timetables.teacherId, users.id))
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
      const { timetables, classes, subjects, users, schools } = await import("@/lib/db/schema");
      const { eq, sql } = await import("drizzle-orm");

      const [record] = await db
        .select({
          id: timetables.id,
          classId: timetables.classId,
          schoolId: timetables.schoolId,
          dayOfWeek: timetables.dayOfWeek,
          periodNumber: timetables.periodNumber,
          startTime: timetables.startTime,
          endTime: timetables.endTime,
          subjectId: timetables.subjectId,
          teacherId: timetables.teacherId,
          roomNumber: timetables.roomNumber,
          semester: timetables.semester,
          academicYear: timetables.academicYear,
          isActive: timetables.isActive,
          createdAt: timetables.createdAt,
          updatedAt: timetables.updatedAt,
          // Joined fields
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
            type: subjects.type,
          },
          teacher: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          },
          school: {
            id: schools.id,
            name: schools.name,
          },
        })
        .from(timetables)
        .innerJoin(classes, eq(timetables.classId, classes.id))
        .innerJoin(subjects, eq(timetables.subjectId, subjects.id))
        .innerJoin(users, eq(timetables.teacherId, users.id))
        .innerJoin(schools, eq(timetables.schoolId, schools.id))
        .where(eq(timetables.id, id));

      if (!record) {
        return {
          success: false,
          error: "Timetable entry not found",
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

    // Create timetable entry
    create: async (data: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { timetables } = await import("@/lib/db/schema");
      const { nanoid } = await import("nanoid");

      const [record] = await db
        .insert(timetables)
        .values({
          id: nanoid(),
          classId: data.classId,
          schoolId: data.schoolId || auth.user?.schoolId,
          dayOfWeek: data.dayOfWeek,
          periodNumber: data.periodNumber,
          startTime: data.startTime || null,
          endTime: data.endTime || null,
          subjectId: data.subjectId,
          teacherId: data.teacherId,
          roomNumber: data.roomNumber || null,
          semester: data.semester || null,
          academicYear: data.academicYear || null,
          isActive: data.isActive ?? true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return {
        success: true,
        data: record,
      };
    },

    // Update timetable entry
    update: async (id: string, data: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { timetables } = await import("@/lib/db/schema");
      const { eq, and } = await import("drizzle-orm");

      const updateData: any = {
        ...data,
        updatedAt: new Date(),
      };

      const [record] = await db
        .update(timetables)
        .set(updateData)
        .where(
          and(
            eq(timetables.id, id),
            auth.user?.schoolId ? eq(timetables.schoolId, auth.user.schoolId) : undefined
          )
        )
        .returning();

      if (!record) {
        return {
          success: false,
          error: "Timetable entry not found or unauthorized",
        };
      }

      return {
        success: true,
        data: record,
      };
    },

    // Delete timetable entry (soft delete)
    delete: async (id: string, auth: any) => {
      const { db } = await import("@/lib/db");
      const { timetables } = await import("@/lib/db/schema");
      const { eq, and } = await import("drizzle-orm");

      await db
        .delete(timetables)
        .where(
          and(
            eq(timetables.id, id),
            auth.user?.schoolId ? eq(timetables.schoolId, auth.user.schoolId) : undefined
          )
        );

      return {
        success: true,
        message: "Timetable entry deleted",
      };
    },
  },

  // Bulk operations for timetable management
  bulkOperations: {
    // Get full weekly timetable for a class
    getClassTimetable: async (classId: string, academicYear?: string, semester?: string, auth: any) => {
      const { db } = await import("@/lib/db");
      const { timetables, classes, subjects, users } = await import("@/lib/db/schema");
      const { eq, and, asc } = await import("drizzle-orm");

      const conditions = [eq(timetables.classId, classId)];

      if (auth.user?.schoolId) {
        conditions.push(eq(timetables.schoolId, auth.user.schoolId));
      }
      if (academicYear) conditions.push(eq(timetables.academicYear, academicYear));
      if (semester) conditions.push(eq(timetables.semester, semester));
      conditions.push(eq(timetables.isActive, true));

      const entries = await db
        .select({
          id: timetables.id,
          dayOfWeek: timetables.dayOfWeek,
          periodNumber: timetables.periodNumber,
          startTime: timetables.startTime,
          endTime: timetables.endTime,
          roomNumber: timetables.roomNumber,
          subjectName: subjects.name,
          subjectCode: subjects.code,
          teacherName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
          teacherId: users.id,
        })
        .from(timetables)
        .innerJoin(subjects, eq(timetables.subjectId, subjects.id))
        .innerJoin(users, eq(timetables.teacherId, users.id))
        .where(and(...conditions))
        .orderBy(asc(timetables.dayOfWeek), asc(timetables.periodNumber));

      // Group by day
      const byDay: Record<string, any[]> = {};
      const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

      days.forEach((day) => {
        byDay[day] = entries.filter((e) => e.dayOfWeek === day);
      });

      return {
        success: true,
        data: {
          entries,
          byDay,
        },
      };
    },

    // Get teacher's schedule
    getTeacherSchedule: async (teacherId: string, dayOfWeek?: string, auth: any) => {
      const { db } = await import("@/lib/db");
      const { timetables, classes, subjects } = await import("@/lib/db/schema");
      const { eq, and, asc } = await import("drizzle-orm");

      const conditions = [eq(timetables.teacherId, teacherId)];

      if (auth.user?.schoolId) {
        conditions.push(eq(timetables.schoolId, auth.user.schoolId));
      }
      if (dayOfWeek) conditions.push(eq(timetables.dayOfWeek, dayOfWeek));
      conditions.push(eq(timetables.isActive, true));

      const entries = await db
        .select({
          id: timetables.id,
          dayOfWeek: timetables.dayOfWeek,
          periodNumber: timetables.periodNumber,
          startTime: timetables.startTime,
          endTime: timetables.endTime,
          roomNumber: timetables.roomNumber,
          className: classes.name,
          subjectName: subjects.name,
        })
        .from(timetables)
        .innerJoin(classes, eq(timetables.classId, classes.id))
        .innerJoin(subjects, eq(timetables.subjectId, subjects.id))
        .where(and(...conditions))
        .orderBy(asc(timetables.dayOfWeek), asc(timetables.periodNumber));

      return {
        success: true,
        data: entries,
      };
    },

    // Check for conflicts
    checkConflicts: async (data: {
      classId: string;
      teacherId: string;
      dayOfWeek: string;
      periodNumber: number;
      startTime?: string;
      endTime?: string;
      roomNumber?: string;
      excludeId?: string;
    }, auth: any) => {
      const { db } = await import("@/lib/db");
      const { timetables } = await import("@/lib/db/schema");
      const { eq, and, sql } = await import("drizzle-orm");

      const conditions = [
        eq(timetables.dayOfWeek, data.dayOfWeek),
        eq(timetables.isActive, true),
      ];

      if (data.excludeId) {
        conditions.push(sql`${timetables.id} != ${data.excludeId}`);
      }

      // Check class conflict (same period)
      const classConflict = await db
        .select()
        .from(timetables)
        .where(
          and(
            ...conditions,
            eq(timetables.classId, data.classId),
            data.periodNumber
              ? eq(timetables.periodNumber, data.periodNumber)
              : sql`${timetables.startTime} < ${data.endTime} AND ${timetables.endTime} > ${data.startTime}`
          )
        );

      // Check teacher conflict (same period)
      const teacherConflict = await db
        .select()
        .from(timetables)
        .where(
          and(
            ...conditions,
            eq(timetables.teacherId, data.teacherId),
            data.periodNumber
              ? eq(timetables.periodNumber, data.periodNumber)
              : sql`${timetables.startTime} < ${data.endTime} AND ${timetables.endTime} > ${data.startTime}`
          )
        );

      // Check room conflict if room number provided
      let roomConflict: any[] = [];
      if (data.roomNumber) {
        roomConflict = await db
          .select()
          .from(timetables)
          .where(
            and(
              ...conditions,
              eq(timetables.roomNumber, data.roomNumber),
              data.periodNumber
                ? eq(timetables.periodNumber, data.periodNumber)
                : sql`${timetables.startTime} < ${data.endTime} AND ${timetables.endTime} > ${data.startTime}`
            )
          );
      }

      const hasConflict =
        classConflict.length > 0 || teacherConflict.length > 0 || roomConflict.length > 0;

      return {
        success: true,
        data: {
          hasConflict,
          classConflict: classConflict.length > 0,
          teacherConflict: teacherConflict.length > 0,
          roomConflict: roomConflict.length > 0,
          conflicts: {
            class: classConflict,
            teacher: teacherConflict,
            room: roomConflict,
          },
        },
      };
    },

    // Bulk create timetable entries for a class
    bulkCreate: async (
      entries: Array<{
        classId: string;
        dayOfWeek: string;
        periodNumber: number;
        subjectId: string;
        teacherId: string;
        roomNumber?: string;
        startTime?: string;
        endTime?: string;
      }>,
      auth: any
    ) => {
      const { db } = await import("@/lib/db");
      const { timetables } = await import("@/lib/db/schema");
      const { nanoid } = await import("nanoid");

      const values = entries.map((entry) => ({
        id: nanoid(),
        classId: entry.classId,
        schoolId: auth.user?.schoolId,
        dayOfWeek: entry.dayOfWeek,
        periodNumber: entry.periodNumber,
        startTime: entry.startTime || null,
        endTime: entry.endTime || null,
        subjectId: entry.subjectId,
        teacherId: entry.teacherId,
        roomNumber: entry.roomNumber || null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const inserted = await db.insert(timetables).values(values).returning();

      return {
        success: true,
        data: inserted,
        message: `Created ${entries.length} timetable entries`,
      };
    },
  },

  tableConfig: {
    comments: "Stores timetable/schedule entries for classes. Each entry represents a period on a specific day.",
    additionalIndexes: [
      {
        columns: ["class_id", "day_of_week", "period_number"],
        unique: false,
      },
      {
        columns: ["teacher_id", "day_of_week", "period_number"],
        unique: false,
      },
      {
        columns: ["school_id", "academic_year", "semester"],
        unique: false,
      },
    ],
  },
});
