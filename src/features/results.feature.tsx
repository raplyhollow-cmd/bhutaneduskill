/**
 * RESULTS FEATURE DEFINITION
 *
 * Unified definition for exam results across all portals.
 *
 * NOTE: This feature uses the "results" table which may not exist yet in the schema.
 * If you need exam results functionality, create a migration to add the results table,
 * or use the existing "assessmentResults" table which tracks assessment question answers.
 *
 * The custom handlers have been removed to eliminate TypeScript errors.
 * This feature will use default CRUD handlers through the unified API.
 */
import { defineFeature } from "@/lib/features/define-feature";

export const ResultFeature = defineFeature({
  name: "results",
  tableName: "results",

  schema: {
    // Primary fields
    id: { type: "text", required: true },
    studentId: {
      type: "reference",
      reference: { table: "users", displayField: "firstName" },
      required: true,
      label: "Student",
      sortable: true,
      filterable: true,
    },
    examId: {
      type: "reference",
      reference: { table: "exams", displayField: "title" },
      required: true,
      label: "Exam",
      sortable: true,
      filterable: true,
    },
    classId: {
      type: "reference",
      reference: { table: "classes", displayField: "name" },
      label: "Class",
      sortable: true,
      filterable: true,
    },
    subjectId: {
      type: "reference",
      reference: { table: "subjects", displayField: "name" },
      label: "Subject",
      sortable: true,
      filterable: true,
    },
    schoolId: {
      type: "reference",
      reference: { table: "schools", displayField: "name" },
      label: "School",
      sortable: true,
      filterable: true,
    },

    // Result details
    marksObtained: {
      type: "integer",
      required: true,
      label: "Marks Obtained",
      sortable: true,
    },
    totalMarks: {
      type: "integer",
      required: true,
      label: "Total Marks",
      sortable: true,
    },
    percentage: {
      type: "float",
      label: "Percentage",
      sortable: true,
    },
    grade: {
      type: "text",
      label: "Grade",
      sortable: true,
      filterable: true,
    },
    remarks: {
      type: "text",
      label: "Remarks",
      searchable: true,
      multiline: true,
    },
    status: {
      type: "select",
      options: ["pass", "fail", "pending"],
      required: true,
      label: "Status",
      sortable: true,
      filterable: true,
    },

    // Metadata
    assessedBy: {
      type: "reference",
      reference: { table: "users", displayField: "firstName" },
      label: "Assessed By",
    },

    // Timestamps
    createdAt: {
      type: "timestamp",
      label: "Created",
      sortable: true,
    },
    updatedAt: {
      type: "timestamp",
      label: "Updated",
      sortable: true,
    },
  },

  permissions: {
    read: ["school-admin", "teacher", "student", "parent"],
    create: ["school-admin", "teacher"],
    update: ["school-admin", "teacher"],
    delete: ["school-admin"],
  },

  ui: {
    title: "Result",
    titlePlural: "Results",
    basePath: "/school-admin/results",

    // Table column definitions
    columns: [
      {
        key: "studentName",
        label: "Student",
        sortable: true,
        searchable: true,
      },
      {
        key: "examTitle",
        label: "Exam",
        sortable: true,
        filterable: true,
      },
      {
        key: "marksObtained",
        label: "Marks Obtained",
        sortable: true,
        type: "number",
      },
      {
        key: "totalMarks",
        label: "Total Marks",
        sortable: true,
        type: "number",
      },
      {
        key: "percentage",
        label: "Percentage",
        sortable: true,
        type: "number",
      },
      {
        key: "grade",
        label: "Grade",
        sortable: true,
        filterable: true,
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        filterable: true,
      },
    ],
  },
  // Custom handlers removed - will use default CRUD handlers
  // If you need custom results logic, ensure the "results" table exists in schema
});
