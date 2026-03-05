/**
 * SKILL GAPS FEATURE
 *
 * Track skill gaps and learning needs
 */

import { defineFeature } from "@/lib/features/define-feature";

export const SkillGapFeature = defineFeature({
  name: "skill-gaps",
  tableName: "skill_gaps",

  schema: {
    id: { type: "text", required: true },
    studentId: { type: "text", required: true, reference: "users" },
    skillId: { type: "text", required: true, reference: "skills" },
    currentLevel: { type: "select", options: ["beginner", "developing", "proficient", "advanced"] },
    targetLevel: { type: "select", options: ["developing", "proficient", "advanced"] },
    gap: { type: "integer" }, // Calculated difference
    priority: { type: "select", options: ["low", "medium", "high", "critical"] },
    recommendations: { type: "json" }, // Array of learning resources
    status: { type: "select", options: ["open", "in-progress", "closed", "resolved"] },
    assignedTo: { type: "text", reference: "users" }, // Teacher helping
    notes: { type: "text", multiline: true },
    resolvedAt: { type: "timestamp" },
    isActive: { type: "boolean" },
    createdAt: { type: "timestamp" },
    updatedAt: { type: "timestamp" },
  },

  permissions: {
    read: ["admin", "school-admin", "teacher", "counselor", "student", "parent"],
    create: ["admin", "school-admin", "teacher", "counselor"],
    update: ["admin", "school-admin", "teacher", "counselor"],
    delete: ["admin", "school-admin"],
  },

  ui: {
    title: "Skill Gap",
    titlePlural: "Skill Gaps",
    basePath: "/skill-gaps",
    columns: [
      { key: "studentId", label: "Student" },
      { key: "skillId", label: "Skill" },
      { key: "currentLevel", label: "Current" },
      { key: "targetLevel", label: "Target" },
      { key: "priority", label: "Priority" },
      { key: "status", label: "Status" },
    ],
  },
});
