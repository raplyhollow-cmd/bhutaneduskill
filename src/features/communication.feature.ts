/**
 * COMMUNICATION FEATURE DEFINITION
 */

import { defineFeature } from "@/lib/features/define-feature";

export const CommunicationFeature = defineFeature({
  name: "communication",
  tableName: "communication",

  schema: {
    id: { type: "text", required: true, primary: true },
    subject: { type: "text", required: true, label: "Subject", sortable: true },
    message: { type: "text", multiline: true, rows: 5, searchable: true },
    senderId: { type: "reference", reference: { table: "users", onDelete: "set null" }, label: "From" },
    recipientId: { type: "reference", reference: { table: "users", onDelete: "cascade" }, required: true, label: "To" },
    schoolId: { type: "reference", reference: { table: "schools", onDelete: "cascade" } },
    sentAt: { type: "timestamp", label: "Sent", sortable: true },
    readAt: { type: "timestamp", label: "Read" },
    status: { type: "enum", options: ["sent", "delivered", "read", "failed"], label: "Status", filterable: true },
    priority: { type: "enum", options: ["low", "normal", "high", "urgent"], label: "Priority", filterable: true },
    parentId: { type: "text", label: "Parent Message" },
    createdAt: { type: "timestamp", sortable: true },
  },

  permissions: {
    read: ["school-admin", "teacher", "student", "parent"],
    create: ["school-admin", "teacher", "admin"],
    update: [],
    delete: ["school-admin", "admin"],
  },

  ui: {
    title: "Message",
    titlePlural: "Messages",
    basePath: "/messages",
    columns: [
      { key: "subject", label: "Subject", sortable: true },
      { key: "senderName", label: "From" },
      { key: "recipientName", label: "To" },
      { key: "sentAt", label: "Sent", type: "date" },
      { key: "status", label: "Status" },
      { key: "priority", label: "Priority" },
    ],
  },
});
