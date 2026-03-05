/**
 * BATCHES FEATURE DEFINITION
 */

import { defineFeature } from "@/lib/features/define-feature";

export const BatchFeature = defineFeature({
  name: "batches",
  tableName: "batches",

  schema: {
    id: { type: "text", required: true, primary: true },
    name: { type: "text", required: true, label: "Batch Name", sortable: true, searchable: true },
    code: { type: "text", unique: true, label: "Code", filterable: true },
    schoolId: { type: "reference", reference: { table: "schools", onDelete: "cascade" } },
    classId: { type: "reference", reference: { table: "classes", onDelete: "set null" }, label: "Class" },
    year: { type: "integer", label: "Year", sortable: true },
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
    title: "Batch",
    titlePlural: "Batches",
    basePath: "/school-admin/batches",
    columns: [
      { key: "name", label: "Name", sortable: true, searchable: true },
      { key: "code", label: "Code", filterable: true },
      { key: "year", label: "Year", sortable: true },
      { key: "className", label: "Class" },
      { key: "isActive", label: "Active", type: "boolean" },
    ],
  },
});
