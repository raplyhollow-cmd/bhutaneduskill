/**
 * SESSIONS FEATURE DEFINITION
 */

import { defineFeature } from "@/lib/features/define-feature";

export const SessionFeature = defineFeature({
  name: "sessions",
  tableName: "sessions",

  schema: {
    id: { type: "text", required: true, primary: true },
    title: { type: "text", required: true, label: "Title", sortable: true },
    sessionType: { type: "enum", options: ["counseling", "tutoring", "mentoring", "disciplinary"], label: "Type", filterable: true },
    studentId: { type: "reference", reference: { table: "users", onDelete: "cascade" }, required: true, label: "Student" },
    teacherId: { type: "reference", reference: { table: "users", onDelete: "set null" }, label: "Teacher/Counselor" },
    schoolId: { type: "reference", reference: { table: "schools", onDelete: "cascade" } },
    scheduledDate: { type: "date", label: "Date", sortable: true },
    startTime: { type: "text", label: "Start" },
    endTime: { type: "text", label: "End" },
    location: { type: "text", label: "Location" },
    notes: { type: "text", multiline: true },
    outcome: { type: "text", multiline: true },
    status: { type: "enum", options: ["scheduled", "completed", "cancelled"], label: "Status", filterable: true },
    createdAt: { type: "timestamp", sortable: true },
    updatedAt: { type: "timestamp", sortable: true },
  },

  permissions: {
    read: ["school-admin", "teacher", "counselor"],
    create: ["school-admin", "teacher", "counselor"],
    update: ["school-admin", "teacher", "counselor"],
    delete: ["school-admin"],
  },

  ui: {
    title: "Session",
    titlePlural: "Sessions",
    basePath: "/counselor/sessions",
    columns: [
      { key: "title", label: "Title", sortable: true },
      { key: "sessionType", label: "Type", filterable: true },
      { key: "studentName", label: "Student" },
      { key: "scheduledDate", label: "Date", type: "date" },
      { key: "status", label: "Status" },
    ],
  },
});
