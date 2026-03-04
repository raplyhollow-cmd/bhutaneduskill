/**
 * COUNSELOR NOTES FEATURE DEFINITION
 */

import { defineFeature } from "@/lib/features/define-feature";

export const CounselorNoteFeature = defineFeature({
  name: "counselor-notes",
  tableName: "counselor_notes",

  schema: {
    id: { type: "text", required: true, primary: true },
    studentId: { type: "reference", reference: { table: "users", onDelete: "cascade" }, required: true, label: "Student" },
    counselorId: { type: "reference", reference: { table: "users", onDelete: "set null" }, label: "Counselor" },
    schoolId: { type: "reference", reference: { table: "schools", onDelete: "cascade" } },
    noteDate: { type: "date", required: true, label: "Date", sortable: true },
    category: { type: "enum", options: ["academic", "behavioral", "social", "emotional", "career"], label: "Category", filterable: true },
    confidentiality: { type: "enum", options: ["public", "restricted", "confidential"], label: "Confidentiality", filterable: true },
    notes: { type: "text", multiline: true, rows: 5, searchable: true },
    followUpRequired: { type: "boolean", defaultValue: false, label: "Follow-up" },
    followUpDate: { type: "date", label: "Follow-up Date" },
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
    title: "Counselor Note",
    titlePlural: "Counselor Notes",
    basePath: "/counselor/notes",
    columns: [
      { key: "studentName", label: "Student" },
      { key: "noteDate", label: "Date", type: "date" },
      { key: "category", label: "Category" },
      { key: "confidentiality", label: "Confidentiality" },
      { key: "followUpRequired", label: "Follow-up" },
    ],
  },
});
