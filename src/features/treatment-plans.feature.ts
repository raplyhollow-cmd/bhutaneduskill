/**
 * TREATMENT PLANS FEATURE
 *
 * Counselor treatment plans for students
 */

import { defineFeature } from "@/lib/features/define-feature";

export const TreatmentPlanFeature = defineFeature({
  name: "treatment-plans",
  tableName: "treatment_plans",

  schema: {
    id: { type: "text", required: true },
    studentId: { type: "text", required: true, reference: "users" },
    counselorId: { type: "text", required: true, reference: "users" },
    title: { type: "text", required: true },
    description: { type: "text", multiline: true },
    goals: { type: "json", required: true }, // Array of {id, title, description, targetDate, status}
    interventions: { type: "json" }, // Array of interventions
    status: { type: "select", options: ["active", "completed", "cancelled", "on-hold"] },
    priority: { type: "select", options: ["low", "medium", "high", "urgent"] },
    confidentiality: { type: "select", options: ["public", "confidential", "restricted"] },
    parentConsent: { type: "boolean" },
    parentConsentAt: { type: "timestamp" },
    startDate: { type: "date", required: true },
    endDate: { type: "date" },
    reviewDate: { type: "date" },
    outcomes: { type: "json" }, // Array of outcomes
    notes: { type: "text", multiline: true },
    isActive: { type: "boolean" },
    createdAt: { type: "timestamp" },
    updatedAt: { type: "timestamp" },
  },

  permissions: {
    read: ["admin", "school-admin", "counselor", "teacher", "parent"],
    create: ["admin", "school-admin", "counselor"],
    update: ["admin", "school-admin", "counselor"],
    delete: ["admin", "school-admin", "counselor"],
  },

  ui: {
    title: "Treatment Plan",
    titlePlural: "Treatment Plans",
    basePath: "/counselor/treatment-plans",
    columns: [
      { key: "title", label: "Title" },
      { key: "studentId", label: "Student" },
      { key: "counselorId", label: "Counselor" },
      { key: "priority", label: "Priority" },
      { key: "status", label: "Status" },
      { key: "endDate", label: "End Date" },
    ],
  },

  actions: {
    updateGoal: {
      handler: async (id: string | undefined, data: any, auth: any) => {
        const { db } = await import("@/lib/db");
        const { treatmentPlans } = await import("@/lib/db/schema");
        const { eq } = await import("drizzle-orm");
        const { successResponse, notFoundResponse } = await import("@/lib/api/response-helpers");

        if (!id) {
          return { error: "Treatment Plan ID is required", status: 400 };
        }

        const { goalId, status, outcome } = data;

        // Get current plan
        const [plan] = await db
          .select()
          .from(treatmentPlans)
          .where(eq(treatmentPlans.id, id))
          .limit(1);

        if (!plan) {
          return notFoundResponse("Treatment Plan");
        }

        // Update goal
        const goals = plan.goals || [];
        const updatedGoals = goals.map((g: any) =>
          g.id === goalId
            ? { ...g, status: status || g.status, outcome, updatedAt: new Date() }
            : g
        );

        // Check if all goals are completed
        const allCompleted = updatedGoals.every((g: any) => g.status === "completed");

        const [updated] = await db
          .update(treatmentPlans)
          .set({
            goals: updatedGoals,
            status: allCompleted ? "completed" : plan.status,
            updatedAt: new Date(),
          })
          .where(eq(treatmentPlans.id, id))
          .returning();

        return successResponse({ data: updated[0] });
      },
      allowedRoles: ["admin", "school-admin", "counselor"] as any[],
    },

    addIntervention: {
      handler: async (id: string | undefined, data: any, auth: any) => {
        const { db } = await import("@/lib/db");
        const { treatmentPlans } = await import("@/lib/db/schema");
        const { eq } = await import("drizzle-orm");
        const { successResponse, notFoundResponse } = await import("@/lib/api/response-helpers");
        const { nanoid } = await import("nanoid");

        if (!id) {
          return { error: "Treatment Plan ID is required", status: 400 };
        }

        const { type, description, date } = data;

        // Get current plan
        const [plan] = await db
          .select()
          .from(treatmentPlans)
          .where(eq(treatmentPlans.id, id))
          .limit(1);

        if (!plan) {
          return notFoundResponse("Treatment Plan");
        }

        // Add new intervention
        const interventions = plan.interventions || [];
        interventions.push({
          id: `int-${nanoid()}`,
          type,
          description,
          date,
          createdBy: auth.userId,
          createdAt: new Date(),
        });

        const [updated] = await db
          .update(treatmentPlans)
          .set({
            interventions,
            updatedAt: new Date(),
          })
          .where(eq(treatmentPlans.id, id))
          .returning();

        return successResponse({ data: updated[0] });
      },
      allowedRoles: ["admin", "school-admin", "counselor"] as any[],
    },
  },
});
