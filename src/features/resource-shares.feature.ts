/**
 * RESOURCE SHARES FEATURE
 *
 * Share resources between users
 */

import { defineFeature } from "@/lib/features/define-feature";

export const ResourceShareFeature = defineFeature({
  name: "resource-shares",
  tableName: "resource_shares",

  schema: {
    id: { type: "text", required: true },
    resourceId: { type: "text", required: true },
    resourceType: { type: "select", options: ["lesson-plan", "worksheet", "video", "document", "assessment"] },
    sharedBy: { type: "text", required: true, reference: "users" },
    sharedWith: { type: "text", required: true, reference: "users" },
    sharedWithGroup: { type: "text" }, // Class, department, etc.
    permissions: { type: "select", options: ["read", "write", "admin"] },
    expiresAt: { type: "timestamp" },
    accessedAt: { type: "timestamp" },
    downloadCount: { type: "integer" },
    message: { type: "text" },
    isActive: { type: "boolean" },
    createdAt: { type: "timestamp" },
    updatedAt: { type: "timestamp" },
  },

  permissions: {
    read: ["admin", "school-admin", "teacher", "student"],
    create: ["admin", "school-admin", "teacher"],
    update: ["admin", "school-admin", "teacher"],
    delete: ["admin", "school-admin", "teacher"],
  },

  ui: {
    title: "Resource Share",
    titlePlural: "Resource Shares",
    basePath: "/resource-shares",
    columns: [
      { key: "resourceType", label: "Type" },
      { key: "sharedBy", label: "Shared By" },
      { key: "sharedWith", label: "Shared With" },
      { key: "permissions", label: "Permissions" },
      { key: "createdAt", label: "Shared" },
    ],
  },
});
