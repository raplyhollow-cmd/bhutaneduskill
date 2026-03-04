/**
 * Transport Feature Definition
 */

import { defineFeature } from "@/lib/features/define-feature";

export const TransportFeature = defineFeature({
  name: "transport",
  tableName: "transport",

  schema: {
    id: {
      type: "text",
      required: true,
      primary: true,
      label: "ID",
    },
    name: {
      type: "text",
      required: true,
      label: "Name",
      sortable: true,
    },
    createdAt: {
      type: "timestamp",
      label: "Created At",
      sortable: true,
    },
    updatedAt: {
      type: "timestamp",
      label: "Updated At",
      sortable: true,
    },
  },

  permissions: {
    read: ["school-admin", "teacher", "ministry"],
    create: ["school-admin"],
    update: ["school-admin"],
    delete: ["school-admin"],
  },

  ui: {
    title: "Transport",
    titlePlural: "Transports",
    basePath: "/admin/transport",
    icon: "FileText",
    columns: [
      { key: "name", label: "Name", sortable: true },
      { key: "createdAt", label: "Created", sortable: true },
    ],
  },
});
