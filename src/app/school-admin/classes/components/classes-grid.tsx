"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { groupClassesByGradeSection, getSortedClassGrades, type Class } from "@/lib/grouping";
import { GradeSectionHeader } from "./grade-section-header";
import { ClassSectionRow } from "./class-section-row";

interface ClassesGridProps {
  classes: Class[];
  onUpdate?: (id: string, field: string, value: string) => Promise<void>;
  onEdit?: (cls: Class) => void;
  onDelete?: (cls: Class) => void;
  onViewStudents?: (cls: Class) => void;
  onAssignTeacher?: (cls: Class) => void;
  onManageSubjects?: (cls: Class) => void;
}

/**
 * Hierarchical classes grid grouped by grade -> section
 *
 * Features:
 * - Auto-groups classes by grade, then by section
 * - Sticky grade headers
 * - Expandable section rows
 * - Staggered animations
 * - Editable capacity
 * - 3-dot menu with multiple actions
 */
export function ClassesGrid({
  classes,
  onUpdate,
  onEdit,
  onDelete,
  onViewStudents,
  onAssignTeacher,
  onManageSubjects
}: ClassesGridProps) {
  // Memoize grouped data
  const grouped = useMemo(() => groupClassesByGradeSection(classes), [classes]);
  const sortedGrades = useMemo(() => getSortedClassGrades(grouped), [grouped]);

  if (classes.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 text-center rounded-lg"
        style={{ backgroundColor: "var(--ceramic-gray-50, #f6f6f7)" }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: "var(--ceramic-gray-200, #ececee)" }}
        >
          <Users className="w-8 h-8" style={{ color: "var(--ceramic-gray-400, #c7c7cf)" }} />
        </div>
        <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--ceramic-gray-900, #4c4c5c)" }}>
          No classes yet
        </h3>
        <p className="text-sm max-w-sm" style={{ color: "var(--ceramic-gray-600, #90909d)" }}>
          Create classes for different grades and sections to manage your school.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sortedGrades.map((grade, groupIndex) => (
        <motion.div
          key={grade}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: groupIndex * 0.05,
            duration: 0.15,
            ease: [0.4, 0, 0.2, 1]
          }}
        >
          {/* Grade Header */}
          <GradeSectionHeader
            grade={grade}
            sectionCount={grouped[grade].sections.length}
            classCount={grouped[grade].sections.reduce((sum, s) => sum + s.classes.length, 0)}
          />

          {/* Sections Container */}
          <div
            className="mt-2 bg-white rounded-lg overflow-hidden"
            style={{
              border: "1px solid var(--ceramic-gray-100, #f6f6f7)"
            }}
          >
            {grouped[grade].sections.map((section, index) => (
              <ClassSectionRow
                key={section.section}
                section={section.section}
                classes={section.classes}
                index={index}
                onUpdate={onUpdate}
                onEdit={onEdit}
                onDelete={onDelete}
                onViewStudents={onViewStudents}
                onAssignTeacher={onAssignTeacher}
                onManageSubjects={onManageSubjects}
              />
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
