/**
 * ROADMAPS FEATURE
 *
 * Career and learning roadmaps for students
 */

import { defineFeature } from "@/lib/features/define-feature";

export const RoadmapFeature = defineFeature({
  name: "roadmaps",
  tableName: "roadmaps",

  schema: {
    id: { type: "text", required: true },
    studentId: { type: "text", required: true, reference: "users" },
    careerId: { type: "text", reference: "careers" },
    title: { type: "text", required: true },
    description: { type: "text", multiline: true },
    milestones: { type: "json" }, // Array of {id, title, completed, completedAt, dueDate}
    progress: { type: "integer" }, // 0-100 percentage
    status: { type: "select", options: ["active", "completed", "paused", "cancelled"] },
    startDate: { type: "date" },
    targetDate: { type: "date" },
    completedAt: { type: "timestamp" },
    assignedBy: { type: "text", reference: "users" }, // Counselor or teacher
    notes: { type: "text", multiline: true },
    isActive: { type: "boolean" },
    createdAt: { type: "timestamp" },
    updatedAt: { type: "timestamp" },
  },

  permissions: {
    read: ["admin", "school-admin", "teacher", "counselor", "student", "parent"],
    create: ["admin", "school-admin", "counselor", "teacher"],
    update: ["admin", "school-admin", "counselor", "teacher"],
    delete: ["admin", "school-admin"],
  },

  ui: {
    title: "Roadmap",
    titlePlural: "Roadmaps",
    basePath: "/roadmaps",
    columns: [
      { key: "title", label: "Title" },
      { key: "studentId", label: "Student" },
      { key: "progress", label: "Progress" },
      { key: "status", label: "Status" },
      { key: "targetDate", label: "Target Date" },
    ],
  },

  actions: {
    updateProgress: {
      handler: async (context: { db: any; params: any; auth: any; schema: any; request?: Request }) => {
        const { db } = await import("@/lib/db");
        const { roadmaps } = await import("@/lib/db/schema") as any;
        const { eq, and } = await import("drizzle-orm");
        const { successResponse, notFoundResponse } = await import("@/lib/api/response-helpers");
        if (!context.params?.id) {
          return { error: "Roadmap ID is required", status: 400 };
        }

        const { milestoneId, completed } = context.params?.body || {};

        // Get roadmap
        const [roadmap] = await db
          .select()
          .from(roadmaps)
          .where(eq(roadmaps.id, context.params.id))
          .limit(1);

        if (!roadmap) {
          return notFoundResponse("Roadmap");
        }

        // Update milestone
        const milestones = roadmap.milestones || [];
        let updatedMilestones = milestones;
        let progress = roadmap.progress;

        if (completed) {
          // Mark milestone as completed
          updatedMilestones = milestones.map((m: any) =>
            m.id === milestoneId
              ? { ...m, completed: true, completedAt: new Date() }
              : m
          );
        } else {
          updatedMilestones = milestones.map((m: any) =>
            m.id === milestoneId
              ? { ...m, completed: false, completedAt: null }
              : m
          );
        }

        // Recalculate progress
        const completedCount = updatedMilestones.filter((m: any) => m.completed).length;
        progress = Math.round((completedCount / updatedMilestones.length) * 100);

        const [updated] = await db
          .update(roadmaps)
          .set({
            milestones: updatedMilestones,
            progress,
            updatedAt: new Date(),
          })
          .where(eq(roadmaps.id, context.params.id))
          .returning();

        return successResponse({ data: updated[0] });
      },
      allowedRoles: ["admin", "school-admin", "counselor", "teacher", "student"] as any[],
    },
  },
});
