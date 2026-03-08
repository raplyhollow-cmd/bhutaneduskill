/**
import { sql } from "drizzle-orm";
 * SKILLS FEATURE DEFINITION
 *
 * Unified definition for skills catalog.
 */

import { defineFeature } from "@/lib/features/define-feature";

export const SkillFeature = defineFeature({
  name: "skills",
  tableName: "skills",

  schema: {
    id: { type: "text", required: true, primary: true },
    name: {
      type: "text",
      required: true,
      unique: true,
      label: "Skill Name",
      sortable: true,
      searchable: true,
    },
    code: {
      type: "text",
      unique: true,
      label: "Code",
      filterable: true,
    },
    category: {
      type: "enum",
      options: ["academic", "technical", "soft", "creative", "physical"],
      label: "Category",
      filterable: true,
    },
    description: {
      type: "text",
      label: "Description",
      multiline: true,
      searchable: true,
    },
    proficiencyLevels: {
      type: "json",
      label: "Proficiency Levels",
    },
    schoolId: {
      type: "reference",
      reference: { table: "schools", onDelete: "cascade" },
    },
    departmentId: {
      type: "reference",
      reference: { table: "departments", onDelete: "set null" },
      label: "Department",
    },
    isActive: {
      type: "boolean",
      label: "Active",
      defaultValue: true,
      filterable: true,
    },
    createdAt: { type: "timestamp", sortable: true },
    updatedAt: { type: "timestamp", sortable: true },
  },

  permissions: {
    read: ["school-admin", "teacher", "student", "counselor"],
    create: ["school-admin", "counselor"],
    update: ["school-admin", "counselor"],
    delete: ["school-admin"],
  },

  ui: {
    title: "Skill",
    titlePlural: "Skills",
    basePath: "/school-admin/skills",
    columns: [
      { key: "name", label: "Name", sortable: true, searchable: true },
      { key: "code", label: "Code", filterable: true },
      { key: "category", label: "Category", filterable: true },
      { key: "departmentName", label: "Department" },
      { key: "isActive", label: "Active", type: "boolean", filterable: true },
    ],
  },

  customHandlers: {
    list: async (params: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { skills, departments } = await import("@/lib/db/schema");
      const { eq, and, desc, sql } = await import("drizzle-orm");

      const { page = "1", limit = "20", category, isActive, search } = params;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const conditions = [eq(skills.isActive, true)];
      if (category) conditions.push(eq(skills.category, category));
      if (isActive !== undefined) conditions.push(eq(skills.isActive, isActive === "true"));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const data = await db
        .select({
          id: skills.id,
          name: skills.name,
          code: skills.code,
          category: skills.category,
          description: skills.description,
          proficiencyLevels: skills.proficiencyLevels,
          departmentId: skills.departmentId,
          isActive: skills.isActive,
          createdAt: skills.createdAt,
          departmentName: departments.name,
        })
        .from(skills)
        .leftJoin(departments, eq(skills.departmentId, departments.id))
        .where(whereClause)
        .orderBy(desc(skills.createdAt))
        .limit(parseInt(limit))
        .offset(offset);

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(skills)
        .where(whereClause);

      return {
        success: true,
        data: { data, pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / parseInt(limit)) } },
      };
    },
  },
});
