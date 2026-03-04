/**
 * WORKFORCE DATA FEATURE DEFINITION
 */

import { defineFeature } from "@/lib/features/define-feature";

export const WorkforceDataFeature = defineFeature({
  name: "workforce-data",
  tableName: "workforce_data",

  schema: {
    id: { type: "text", required: true, primary: true },
    schoolId: { type: "reference", reference: { table: "schools", onDelete: "cascade" }, required: true },
    dataType: { type: "enum", options: ["enrollment", "graduation", "employment", "certification"], label: "Data Type", filterable: true },
    academicYear: { type: "text", label: "Academic Year", filterable: true },
    data: { type: "json", label: "Data" },
    source: { type: "text", label: "Source" },
    verifiedBy: { type: "reference", reference: { table: "users", onDelete: "set null" } },
    verifiedAt: { type: "timestamp", label: "Verified" },
    isActive: { type: "boolean", defaultValue: true },
    createdAt: { type: "timestamp", sortable: true },
    updatedAt: { type: "timestamp", sortable: true },
  },

  permissions: {
    read: ["ministry", "admin"],
    create: ["ministry", "admin"],
    update: ["ministry", "admin"],
    delete: ["admin"],
  },

  ui: {
    title: "Workforce Data",
    titlePlural: "Workforce Data",
    basePath: "/ministry/workforce",
    columns: [
      { key: "schoolName", label: "School" },
      { key: "dataType", label: "Type" },
      { key: "academicYear", label: "Year" },
      { key: "verifiedAt", label: "Verified" },
    ],
  },
});
