/**
 * PLANS FEATURE DEFINITION
 */

import { defineFeature } from "@/lib/features/define-feature";

export const PlanFeature = defineFeature({
  name: "plans",
  tableName: "plans",

  schema: {
    id: { type: "text", required: true, primary: true },
    name: { type: "text", required: true, label: "Plan Name", sortable: true, searchable: true },
    description: { type: "text", multiline: true },
    maxUsers: { type: "integer", label: "Max Users", sortable: true },
    maxStorage: { type: "integer", label: "Storage (GB)" },
    price: { type: "float", label: "Price", sortable: true },
    currency: { type: "text", defaultValue: "BTN" },
    billingCycle: { type: "enum", options: ["monthly", "quarterly", "annually"], label: "Billing", filterable: true },
    features: { type: "json", label: "Features" },
    isActive: { type: "boolean", defaultValue: true, filterable: true },
    tier: { type: "enum", options: ["basic", "standard", "premium", "enterprise"], label: "Tier", filterable: true },
    createdAt: { type: "timestamp", sortable: true },
    updatedAt: { type: "timestamp", sortable: true },
  },

  permissions: {
    read: ["admin", "school-admin"],
    create: ["admin"],
    update: ["admin"],
    delete: ["admin"],
  },

  ui: {
    title: "Plan",
    titlePlural: "Plans",
    basePath: "/admin/plans",
    columns: [
      { key: "name", label: "Name", sortable: true },
      { key: "tier", label: "Tier", filterable: true },
      { key: "price", label: "Price", sortable: true },
      { key: "billingCycle", label: "Billing", filterable: true },
      { key: "maxUsers", label: "Max Users", sortable: true },
      { key: "isActive", label: "Active", type: "boolean" },
    ],
  },
});
