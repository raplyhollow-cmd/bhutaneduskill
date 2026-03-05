/**
 * TREATMENT PLANS FEATURE DEFINITION
 */

import { defineFeature } from "@/lib/features/define-feature";

export const TreatmentPlanFeature = defineFeature({
  name: "treatment-plans",
  tableName: "treatment_plans",

  schema: {
    id: { type: "text", required: true, primary: true },
    studentId: { type: "reference", reference: { table: "users", onDelete: "cascade" }, required: true, label: "Student" },
    counselorId: { type: "reference", reference: { table: "users", onDelete: "set null" }, label: "Counselor" },
    schoolId: { type: "reference", reference: { table: "schools", onDelete: "cascade" } },
    planType: { type: "enum", options: ["behavioral", "academic", "social", "emotional"], label: "Type", filterable: true },
    title: { type: "text", required: true, label: "Title", sortable: true },
    description: { type: "text", multiline: true, rows: 3 },
    goals: { type: "json", label: "Goals" },
    interventions: { type: "json", label: "Interventions" },
    startDate: { type: "date", label: "Start", sortable: true },
    endDate: { type: "date", label: "End", sortable: true },
    status: { type: "enum", options: ["draft", "active", "completed", "cancelled"], label: "Status", filterable: true },
    reviewDate: { type: "date", label: "Review" },
    outcomes: { type: "text", multiline: true },
    createdAt: { type: "timestamp", sortable: true },
    updatedAt: { type: "timestamp", sortable: true },
  },

  permissions: {
    read: ["school-admin", "counselor"],
    create: ["school-admin", "counselor"],
    update: ["school-admin", "counselor"],
    delete: ["school-admin"],
  },

  ui: {
    title: "Treatment Plan",
    titlePlural: "Treatment Plans",
    basePath: "/counselor/treatment-plans",
    columns: [
      { key: "title", label: "Title", sortable: true },
      { key: "studentName", label: "Student" },
      { key: "planType", label: "Type", filterable: true },
      { key: "startDate", label: "Start", type: "date" },
      { key: "status", label: "Status" },
    ],
  },
});
