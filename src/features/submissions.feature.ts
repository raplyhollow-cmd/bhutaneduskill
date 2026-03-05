/**
 * SUBMISSIONS FEATURE
 *
 * Student homework submissions
 */

import { defineFeature } from "@/lib/features/define-feature";

export const SubmissionFeature = defineFeature({
  name: "submissions",
  tableName: "submissions",

  schema: {
    id: { type: "text", required: true },
    homeworkId: { type: "text", required: true, reference: "homework" },
    studentId: { type: "text", required: true, reference: "users" },
    content: { type: "text" },
    fileUrl: { type: "text" },
    fileName: { type: "text" },
    fileType: { type: "text" },
    fileSize: { type: "integer" },
    submittedAt: { type: "timestamp" },
    grade: { type: "integer" },
    maxGrade: { type: "integer" },
    feedback: { type: "text", multiline: true },
    gradedAt: { type: "timestamp" },
    gradedBy: { type: "text", reference: "users" },
    status: { type: "select", options: ["draft", "submitted", "late", "graded", "returned"] },
    lateSubmission: { type: "boolean" },
    isActive: { type: "boolean" },
    createdAt: { type: "timestamp" },
    updatedAt: { type: "timestamp" },
  },

  permissions: {
    read: ["admin", "school-admin", "teacher", "student", "parent"],
    create: ["admin", "school-admin", "teacher", "student"],
    update: ["admin", "school-admin", "teacher"],
    delete: ["admin", "school-admin", "teacher"],
  },

  ui: {
    title: "Submission",
    titlePlural: "Submissions",
    basePath: "/submissions",
    columns: [
      { key: "homeworkId", label: "Homework" },
      { key: "studentId", label: "Student" },
      { key: "status", label: "Status" },
      { key: "grade", label: "Grade" },
      { key: "submittedAt", label: "Submitted" },
    ],
  },
});
