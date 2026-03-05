/**
 * MEETINGS FEATURE DEFINITION
 */

import { defineFeature } from "@/lib/features/define-feature";

export const MeetingFeature = defineFeature({
  name: "meetings",
  tableName: "meetings",

  schema: {
    id: { type: "text", required: true, primary: true },
    title: { type: "text", required: true, label: "Title", sortable: true, searchable: true },
    description: { type: "text", multiline: true },
    meetingType: { type: "enum", options: ["parent_teacher", "staff", "board", "other"], label: "Type", filterable: true },
    schoolId: { type: "reference", reference: { table: "schools", onDelete: "cascade" } },
    scheduledDate: { type: "date", required: true, label: "Date", sortable: true },
    startTime: { type: "text", label: "Start Time" },
    endTime: { type: "text", label: "End Time" },
    location: { type: "text", label: "Location" },
    attendees: { type: "json", label: "Attendees" },
    agenda: { type: "text", multiline: true },
    minutes: { type: "text", multiline: true },
    status: { type: "enum", options: ["scheduled", "completed", "cancelled"], label: "Status", filterable: true },
    createdBy: { type: "reference", reference: { table: "users", onDelete: "set null" } },
    createdAt: { type: "timestamp", sortable: true },
    updatedAt: { type: "timestamp", sortable: true },
  },

  permissions: {
    read: ["school-admin", "teacher", "parent"],
    create: ["school-admin", "admin"],
    update: ["school-admin", "admin"],
    delete: ["school-admin", "admin"],
  },

  ui: {
    title: "Meeting",
    titlePlural: "Meetings",
    basePath: "/school-admin/meetings",
    columns: [
      { key: "title", label: "Title", sortable: true },
      { key: "meetingType", label: "Type", filterable: true },
      { key: "scheduledDate", label: "Date", type: "date" },
      { key: "location", label: "Location" },
      { key: "status", label: "Status" },
    ],
  },
});
