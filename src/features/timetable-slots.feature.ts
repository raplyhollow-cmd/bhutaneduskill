/**
 * TIMETABLE SLOTS FEATURE
 *
 * Individual time slots for timetable entries
 */

import { defineFeature } from "@/lib/features/define-feature";

export const TimetableSlotFeature = defineFeature({
  name: "timetable-slots",
  tableName: "timetable_slots",

  schema: {
    id: { type: "text", required: true },
    timetableId: { type: "text", required: true, reference: "timetables" },
    dayOfWeek: { type: "integer", required: true }, // 0-6 (Sun-Sat)
    startTime: { type: "text", required: true }, // HH:MM format
    endTime: { type: "text", required: true }, // HH:MM format
    subjectId: { type: "text", reference: "subjects" },
    teacherId: { type: "text", reference: "users" },
    classId: { type: "text", reference: "classes" },
    room: { type: "text" },
    breakTime: { type: "boolean" },
    isActive: { type: "boolean" },
    createdAt: { type: "timestamp" },
    updatedAt: { type: "timestamp" },
  },

  permissions: {
    read: ["admin", "school-admin", "teacher", "student"],
    create: ["admin", "school-admin"],
    update: ["admin", "school-admin"],
    delete: ["admin"],
  },

  ui: {
    title: "Timetable Slot",
    titlePlural: "Timetable Slots",
    basePath: "/admin/timetable-slots",
    columns: [
      { key: "dayOfWeek", label: "Day" },
      { key: "startTime", label: "Start Time" },
      { key: "endTime", label: "End Time" },
      { key: "room", label: "Room" },
    ],
  },
});
