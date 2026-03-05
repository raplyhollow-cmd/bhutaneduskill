/**
 * RUBRICS FEATURE
 *
 * Assessment rubrics for grading
 */

import { defineFeature } from "@/lib/features/define-feature";

export const RubricFeature = defineFeature({
  name: "rubrics",
  tableName: "rubrics",

  schema: {
    id: { type: "text", required: true },
    name: { type: "text", required: true },
    description: { type: "text", multiline: true },
    subjectId: { type: "text", reference: "subjects" },
    classId: { type: "text", reference: "classes" },
    schoolId: { type: "text", reference: "schools" },
    criteria: { type: "json" }, // Array of {name, description, maxPoints}
    totalPoints: { type: "integer" },
    passingScore: { type: "integer" },
    scale: { type: "select", options: ["points", "percentage", "proficiency"] },
    createdBy: { type: "text", reference: "users" },
    isTemplate: { type: "boolean" },
    isPublic: { type: "boolean" },
    isActive: { type: "boolean" },
    createdAt: { type: "timestamp" },
    updatedAt: { type: "timestamp" },
  },

  permissions: {
    read: ["admin", "school-admin", "teacher"],
    create: ["admin", "school-admin", "teacher"],
    update: ["admin", "school-admin", "teacher"],
    delete: ["admin", "school-admin"],
  },

  ui: {
    title: "Rubric",
    titlePlural: "Rubrics",
    basePath: "/rubrics",
    columns: [
      { key: "name", label: "Name" },
      { key: "subjectId", label: "Subject" },
      { key: "totalPoints", label: "Total Points" },
      { key: "scale", label: "Scale" },
    ],
  },

  // Actions for rubrics
  actions: {
    // Duplicate a rubric
    duplicate: {
      handler: async (id: string | undefined, data: any, auth: any) => {
        const { db } = await import("@/lib/db");
        const { rubrics } = await import("@/lib/db/schema");
        const { eq, and } = await import("drizzle-orm");
        const { nanoid } = await import("nanoid");
        const { successResponse, notFoundResponse } = await import("@/lib/api/response-helpers");

        if (!id) {
          return { error: "Rubric ID is required", status: 400 };
        }

        // Get original rubric
        const [original] = await db
          .select()
          .from(rubrics)
          .where(eq(rubrics.id, id))
          .limit(1);

        if (!original) {
          return notFoundResponse("Rubric");
        }

        // Create duplicate
        const newId = `rub-${nanoid()}`;
        const [duplicate] = await db
          .insert(rubrics)
          .values({
            id: newId,
            name: `${original.name} (Copy)`,
            description: original.description,
            subjectId: original.subjectId,
            classId: original.classId,
            schoolId: original.schoolId,
            criteria: original.criteria,
            totalPoints: original.totalPoints,
            passingScore: original.passingScore,
            scale: original.scale,
            createdBy: auth.userId,
            isTemplate: false,
            isPublic: false,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        return successResponse({ data: duplicate[0] });
      },
      allowedRoles: ["admin", "school-admin", "teacher"] as any[],
    },
  },
});
