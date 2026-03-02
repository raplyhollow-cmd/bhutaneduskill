"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import { groupSubjectsByGrade, getSortedGrades, type Subject } from "@/lib/grouping";
import { GradeGroupHeader } from "./grade-group-header";
import { SubjectRow } from "./subject-row";

interface SubjectsGridProps {
  subjects: Subject[];
  onUpdate?: (id: string, field: string, value: string) => Promise<void>;
  onEdit?: (subject: Subject) => void;
  onDelete?: (subject: Subject) => void;
  onView?: (subject: Subject) => void;
}

/**
 * Hierarchical subjects grid grouped by grade
 *
 * Features:
 * - Auto-groups subjects by grade
 * - Sticky grade headers
 * - Staggered row animations
 * - Empty state handling
 */
export function SubjectsGrid({ subjects, onUpdate, onEdit, onDelete, onView }: SubjectsGridProps) {
  // Memoize grouped data to avoid re-computation
  const grouped = useMemo(() => groupSubjectsByGrade(subjects), [subjects]);
  const sortedGrades = useMemo(() => getSortedGrades(grouped), [grouped]);

  if (subjects.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 text-center rounded-lg"
        style={{ backgroundColor: "var(--ceramic-gray-50, #f6f6f7)" }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: "var(--ceramic-gray-200, #ececee)" }}
        >
          <BookOpen className="w-8 h-8" style={{ color: "var(--ceramic-gray-400, #c7c7cf)" }} />
        </div>
        <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--ceramic-gray-900, #4c4c5c)" }}>
          No subjects yet
        </h3>
        <p className="text-sm max-w-sm" style={{ color: "var(--ceramic-gray-600, #90909d)" }}>
          Add subjects from the standard curriculum or create custom ones for your school.
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
          {/* Sticky Grade Header */}
          <GradeGroupHeader
            grade={grade}
            count={grouped[grade].subjects.length}
          />

          {/* Subjects in this grade */}
          <div
            className="mt-2 bg-white rounded-lg overflow-hidden"
            style={{
              border: "1px solid var(--ceramic-gray-100, #f6f6f7)"
            }}
          >
            {grouped[grade].subjects.map((subject, index) => (
              <SubjectRow
                key={subject.id}
                subject={subject}
                index={index}
                onUpdate={onUpdate}
                onEdit={onEdit}
                onDelete={onDelete}
                onView={onView}
              />
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
