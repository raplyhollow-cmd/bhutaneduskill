#!/bin/bash
# Create missing feature files

create_feature() {
  local name=$1
  local table=$2
  local title=$3

  cat > "src/features/${name}.feature.tsx" << FEATURE
/**
 * ${title} Feature Definition
 */

import { defineFeature } from "@/lib/features/define-feature";

export const ${title}Feature = defineFeature({
  name: "${table}",
  tableName: "${table}",

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
    title: "${title}",
    titlePlural: "${title}s",
    basePath: "/admin/${table}",
    icon: "FileText",
    columns: [
      { key: "name", label: "Name", sortable: true },
      { key: "createdAt", label: "Created", sortable: true },
    ],
  },
});
FEATURE
}

# Create missing features
create_feature "users" "users" "Users"
create_feature "schools" "schools" "Schools"
create_feature "students" "students" "Students"
create_feature "teachers" "teachers" "Teachers"
create_feature "classes" "classes" "Classes"
create_feature "subjects" "subjects" "Subjects"
create_feature "sections" "sections" "Sections"
create_feature "homework" "homework" "Homework"
create_feature "assessments" "assessments" "Assessments"
create_feature "transport" "transport" "Transport"
create_feature "subscriptions" "subscriptions" "Subscriptions"

echo "✓ Created missing feature files"
