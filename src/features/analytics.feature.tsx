/**
 * ANALYTICS FEATURE DEFINITION
 */

import { defineFeature } from "@/lib/features/define-feature";

export const AnalyticsFeature = defineFeature({
  name: "analytics",
  tableName: "analytics",

  schema: {
    id: { type: "text", required: true, primary: true },
    name: { type: "text", required: true, label: "Dashboard Name", sortable: true },
    type: { type: "enum", options: ["student", "teacher", "school", "ministry"], label: "Type", filterable: true },
    schoolId: { type: "reference", reference: { table: "schools", onDelete: "cascade" } },
    config: { type: "json", label: "Dashboard Config" },
    widgets: { type: "json", label: "Widgets" },
    createdBy: { type: "reference", reference: { table: "users", onDelete: "set null" } },
    isPublic: { type: "boolean", defaultValue: false, label: "Public" },
    isActive: { type: "boolean", defaultValue: true, filterable: true },
    createdAt: { type: "timestamp", sortable: true },
    updatedAt: { type: "timestamp", sortable: true },
  },

  permissions: {
    read: ["school-admin", "teacher", "admin"],
    create: ["school-admin", "admin"],
    update: ["school-admin", "admin"],
    delete: ["school-admin", "admin"],
  },

  ui: {
    title: "Analytics Dashboard",
    titlePlural: "Analytics Dashboards",
    basePath: "/school-admin/analytics",
    columns: [
      { key: "name", label: "Name", sortable: true },
      { key: "type", label: "Type", filterable: true },
      { key: "isPublic", label: "Public", type: "boolean" },
      { key: "createdByName", label: "Created By" },
      { key: "isActive", label: "Active", type: "boolean" },
    ],
  },
});
