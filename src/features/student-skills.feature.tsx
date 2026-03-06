/**
 * STUDENT SKILLS FEATURE DEFINITION
 *
 * Unified definition for student skill records across all portals.
 * Uses the existing "student_skills" table from intelligence schema.
 */

import { defineFeature } from "@/lib/features/define-feature";

export const StudentSkillFeature = defineFeature({
  name: "student-skills",
  tableName: "student_skills",

  schema: {
    // Primary fields
    id: { type: "text", required: true },
    userId: {
      type: "reference",
      reference: { table: "users", displayField: "firstName" },
      required: true,
      label: "Student",
      sortable: true,
      filterable: true,
    },
    skillName: {
      type: "text",
      required: true,
      label: "Skill",
      sortable: true,
      filterable: true,
      searchable: true,
    },
    category: {
      type: "enum",
      options: ["academic", "soft", "technical", "creative", "service", "vocational", "other"],
      required: true,
      label: "Category",
      sortable: true,
      filterable: true,
    },
    level: {
      type: "enum",
      options: ["beginner", "intermediate", "advanced", "expert"],
      required: true,
      label: "Proficiency Level",
      sortable: true,
      filterable: true,
    },
    source: {
      type: "enum",
      options: ["inferred", "self_report", "teacher_assigned"],
      required: true,
      label: "Source",
      sortable: true,
      filterable: true,
    },

    // Assessment details
    status: {
      type: "enum",
      options: ["pending", "approved", "rejected"],
      required: true,
      label: "Status",
      sortable: true,
      filterable: true,
    },
    validatedBy: {
      type: "reference",
      reference: { table: "users", displayField: "firstName" },
      label: "Validated By",
      sortable: true,
    },
    validatedAt: {
      type: "timestamp",
      label: "Validated At",
      sortable: true,
    },

    // Evidence and metadata
    evidence: {
      type: "json",
      label: "Evidence",
      description: "Proof of skill (homework scores, portfolio, certificates, etc.)",
    },
    confidence: {
      type: "number",
      label: "Confidence",
      description: "0-100 for inferred skills",
      sortable: true,
    },
    isInferred: {
      type: "boolean",
      label: "Is Inferred",
      sortable: true,
      filterable: true,
    },
    expiresAt: {
      type: "timestamp",
      label: "Expires At",
      sortable: true,
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
    read: ["school-admin", "teacher", "student", "counselor", "parent"],
    create: ["school-admin", "teacher", "counselor", "student"],
    update: ["school-admin", "teacher", "counselor"],
    delete: ["school-admin", "teacher"],
  },

  ui: {
    title: "Student Skills",
    titlePlural: "Student Skills",
    basePath: "/student/skills",

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
        key: "skillName",
        label: "Skill",
        sortable: true,
        filterable: true,
        searchable: true,
      },
      {
        key: "category",
        label: "Category",
        sortable: true,
        filterable: true,
        render: (value: string) => {
          const categoryConfig = {
            academic: { label: "Academic", color: "bg-blue-100 text-blue-700" },
            soft: { label: "Soft", color: "bg-purple-100 text-purple-700" },
            technical: { label: "Technical", color: "bg-green-100 text-green-700" },
            creative: { label: "Creative", color: "bg-pink-100 text-pink-700" },
            service: { label: "Service", color: "bg-amber-100 text-amber-700" },
            vocational: { label: "Vocational", color: "bg-cyan-100 text-cyan-700" },
            other: { label: "Other", color: "bg-gray-100 text-gray-700" },
          };
          const config = categoryConfig[value] || categoryConfig.other;
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
              {config.label}
            </span>
          );
        },
      },
      {
        key: "level",
        label: "Proficiency",
        sortable: true,
        filterable: true,
        render: (value: string) => {
          const levelConfig = {
            beginner: { label: "Beginner", color: "bg-gray-100 text-gray-700", bar: 1 },
            intermediate: { label: "Intermediate", color: "bg-blue-100 text-blue-700", bar: 2 },
            advanced: { label: "Advanced", color: "bg-green-100 text-green-700", bar: 3 },
            expert: { label: "Expert", color: "bg-purple-100 text-purple-700", bar: 4 },
          };
          const config = levelConfig[value as keyof typeof levelConfig] || levelConfig.beginner;
          return (
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                {config.label}
              </span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 w-3 rounded-full ${i <= (config.bar || 1) ? "bg-current" : "bg-gray-200"}`}
                  />
                ))}
              </div>
            </div>
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
            pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700" },
            approved: { label: "Approved", color: "bg-green-100 text-green-700" },
            rejected: { label: "Rejected", color: "bg-red-100 text-red-700" },
          };
          const config = statusConfig[value as keyof typeof statusConfig] || statusConfig.pending;
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
              {config.label}
            </span>
          );
        },
      },
      {
        key: "source",
        label: "Source",
        sortable: true,
        filterable: true,
        render: (value: string) => {
          const sourceConfig = {
            inferred: { label: "Inferred", color: "bg-gray-100 text-gray-700" },
            self_report: { label: "Self-Report", color: "bg-blue-100 text-blue-700" },
            teacher_assigned: { label: "Teacher Assigned", color: "bg-green-100 text-green-700" },
          };
          const config = sourceConfig[value as keyof typeof sourceConfig] || sourceConfig.inferred;
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
              {config.label}
            </span>
          );
        },
      },
      {
        key: "validatedByName",
        label: "Validated By",
        render: (value: any, row: any) => row.validatedByName || "-",
      },
      {
        key: "createdAt",
        label: "Created",
        sortable: true,
        type: "date",
      },
    ],
  },

  // Custom handlers for student skills specific logic
  customHandlers: {
    // List with joins to get student and validator names
    list: async (params: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { studentSkills, users } = await import("@/lib/db/schema/intelligence");
      const { eq, and, desc, like, or, sql } = await import("drizzle-orm");

      const {
        page = "1",
        limit = "20",
        search,
        userId,
        category,
        level,
        source,
        status,
        isInferred,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = params;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Build conditions
      const conditions = [];

      // User filter (for students viewing their own skills)
      if (auth.user?.role === "student") {
        conditions.push(eq(studentSkills.userId, auth.user.id));
      } else if (userId) {
        conditions.push(eq(studentSkills.userId, userId));
      }

      if (category) conditions.push(eq(studentSkills.category, category));
      if (level) conditions.push(eq(studentSkills.level, level));
      if (source) conditions.push(eq(studentSkills.source, source));
      if (status) conditions.push(eq(studentSkills.status, status));
      if (isInferred !== undefined) {
        conditions.push(eq(studentSkills.isInferred, isInferred === "true"));
      }

      // Search across multiple fields
      if (search) {
        const searchCondition = or(
          like(users.firstName, `%${search}%`),
          like(users.lastName, `%${search}%`),
          like(studentSkills.skillName, `%${search}%`)
        );
        if (searchCondition) conditions.push(searchCondition);
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Execute query with joins
      const data = await db
        .select({
          id: studentSkills.id,
          userId: studentSkills.userId,
          skillName: studentSkills.skillName,
          category: studentSkills.category,
          level: studentSkills.level,
          source: studentSkills.source,
          status: studentSkills.status,
          validatedBy: studentSkills.validatedBy,
          validatedAt: studentSkills.validatedAt,
          evidence: studentSkills.evidence,
          confidence: studentSkills.confidence,
          isInferred: studentSkills.isInferred,
          expiresAt: studentSkills.expiresAt,
          createdAt: studentSkills.createdAt,
          updatedAt: studentSkills.updatedAt,
          // Joined fields
          studentName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
        })
        .from(studentSkills)
        .innerJoin(users, eq(studentSkills.userId, users.id))
        .where(whereClause)
        .orderBy(
          sortOrder === "asc"
            ? sql`${studentSkills[sortBy]} ASC`
            : sql`${studentSkills[sortBy]} DESC`
        )
        .limit(parseInt(limit))
        .offset(offset);

      // Get total count for pagination
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(studentSkills)
        .innerJoin(users, eq(studentSkills.userId, users.id))
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
      const { studentSkills, users } = await import("@/lib/db/schema/intelligence");
      const { eq, sql } = await import("drizzle-orm");

      const [record] = await db
        .select({
          id: studentSkills.id,
          userId: studentSkills.userId,
          skillName: studentSkills.skillName,
          category: studentSkills.category,
          level: studentSkills.level,
          source: studentSkills.source,
          status: studentSkills.status,
          validatedBy: studentSkills.validatedBy,
          validatedAt: studentSkills.validatedAt,
          evidence: studentSkills.evidence,
          confidence: studentSkills.confidence,
          isInferred: studentSkills.isInferred,
          expiresAt: studentSkills.expiresAt,
          createdAt: studentSkills.createdAt,
          updatedAt: studentSkills.updatedAt,
          // Joined fields
          student: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            rollNumber: users.rollNumber,
          },
        })
        .from(studentSkills)
        .innerJoin(users, eq(studentSkills.userId, users.id))
        .where(eq(studentSkills.id, id));

      if (!record) {
        return {
          success: false,
          error: "Student skill record not found",
        };
      }

      // Authorization check - students can only see their own skills
      if (auth.user?.role === "student" && record.userId !== auth.user.id) {
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

    // Create student skill record
    create: async (data: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { studentSkills } = await import("@/lib/db/schema/intelligence");
      const { nanoid } = await import("nanoid");

      const newRecord = {
        id: nanoid(),
        userId: data.userId || auth.user?.id,
        skillName: data.skillName,
        category: data.category,
        level: data.level,
        source: data.source || (auth.user?.role === "teacher" || auth.user?.role === "counselor" ? "teacher_assigned" : "self_report"),
        status: data.status || ((auth.user?.role === "teacher" || auth.user?.role === "counselor" || auth.user?.role === "school-admin") ? "approved" : "pending"),
        evidence: data.evidence || null,
        confidence: data.confidence || null,
        isInferred: data.isInferred || false,
        validatedBy: data.validatedBy || null,
        validatedAt: data.validatedAt || null,
        expiresAt: data.expiresAt || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const [record] = await db.insert(studentSkills).values(newRecord).returning();

      return {
        success: true,
        data: record,
      };
    },

    // Update student skill record
    update: async (id: string, data: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { studentSkills } = await import("@/lib/db/schema/intelligence");
      const { eq } = await import("drizzle-orm");

      // Build update data
      const updateData: any = {
        ...data,
        updatedAt: new Date(),
      };

      // Handle validation status changes
      if (data.status === "approved" && !data.validatedBy) {
        updateData.validatedBy = auth.user?.id;
        updateData.validatedAt = new Date();
      }

      const [record] = await db
        .update(studentSkills)
        .set(updateData)
        .where(eq(studentSkills.id, id))
        .returning();

      if (!record) {
        return {
          success: false,
          error: "Student skill record not found",
        };
      }

      return {
        success: true,
        data: record,
      };
    },

    // Delete student skill record
    delete: async (id: string, auth: any) => {
      const { db } = await import("@/lib/db");
      const { studentSkills } = await import("@/lib/db/schema/intelligence");
      const { eq } = await import("drizzle-orm");

      await db.delete(studentSkills).where(eq(studentSkills.id, id));

      return {
        success: true,
        message: "Student skill record deleted",
      };
    },
  },

  // Bulk operations for student skills
  bulkOperations: {
    // Approve multiple skills at once
    bulkApprove: async (ids: string[], auth: any) => {
      const { db } = await import("@/lib/db");
      const { studentSkills } = await import("@/lib/db/schema/intelligence");
      const { eq, inArray } = await import("drizzle-orm");

      const updated = await db
        .update(studentSkills)
        .set({
          status: "approved",
          validatedBy: auth.user?.id,
          validatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(inArray(studentSkills.id, ids))
        .returning();

      return {
        success: true,
        data: updated,
        message: `Approved ${updated.length} skills`,
      };
    },

    // Get skills summary for a student
    getStudentSkillsSummary: async (userId: string, auth: any) => {
      const { db } = await import("@/lib/db");
      const { studentSkills } = await import("@/lib/db/schema/intelligence");
      const { eq, sql, and } = await import("drizzle-orm");

      // Authorization check
      if (auth.user?.role === "student" && userId !== auth.user.id) {
        return {
          success: false,
          error: "Unauthorized",
        };
      }

      // Get summary by category and level
      const byCategory = await db
        .select({
          category: studentSkills.category,
          count: sql<number>`count(*)::int`,
        })
        .from(studentSkills)
        .where(and(eq(studentSkills.userId, userId), eq(studentSkills.status, "approved")))
        .groupBy(studentSkills.category);

      const byLevel = await db
        .select({
          level: studentSkills.level,
          count: sql<number>`count(*)::int`,
        })
        .from(studentSkills)
        .where(and(eq(studentSkills.userId, userId), eq(studentSkills.status, "approved")))
        .groupBy(studentSkills.level);

      const total = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(studentSkills)
        .where(eq(studentSkills.userId, userId));

      return {
        success: true,
        data: {
          total: total[0]?.count || 0,
          byCategory: byCategory.reduce((acc: any, row) => {
            acc[row.category] = row.count;
            return acc;
          }, {}),
          byLevel: byLevel.reduce((acc: any, row) => {
            acc[row.level] = row.count;
            return acc;
          }, {}),
        },
      };
    },

    // Get skills requiring validation
    getPendingSkills: async (auth: any) => {
      const { db } = await import("@/lib/db");
      const { studentSkills, users } = await import("@/lib/db/schema/intelligence");
      const { eq, sql } = await import("drizzle-orm");

      const records = await db
        .select({
          id: studentSkills.id,
          userId: studentSkills.userId,
          skillName: studentSkills.skillName,
          category: studentSkills.category,
          level: studentSkills.level,
          source: studentSkills.source,
          evidence: studentSkills.evidence,
          createdAt: studentSkills.createdAt,
          studentName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
          studentEmail: users.email,
        })
        .from(studentSkills)
        .innerJoin(users, eq(studentSkills.userId, users.id))
        .where(eq(studentSkills.status, "pending"))
        .orderBy(sql`${studentSkills.createdAt} DESC`)
        .limit(50);

      return {
        success: true,
        data: records,
      };
    },
  },
});
