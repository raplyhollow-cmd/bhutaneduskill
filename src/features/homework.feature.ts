/**
 * Homework Feature Definition
 */

import { defineFeature } from "@/lib/features/define-feature";

export const HomeworkFeature = defineFeature({
  name: "homework",
  tableName: "homework",

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
    title: "Homework",
    titlePlural: "Homeworks",
    basePath: "/admin/homework",
    icon: "FileText",
    columns: [
      { key: "name", label: "Name", sortable: true },
      { key: "createdAt", label: "Created", sortable: true },
    ],
  },
});
