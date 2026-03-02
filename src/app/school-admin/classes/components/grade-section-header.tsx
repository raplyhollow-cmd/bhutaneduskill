"use client";

import { cn } from "@/lib/utils";

interface GradeSectionHeaderProps {
  grade: string;
  sectionCount: number;
  classCount: number;
  isSticky?: boolean;
}

/**
 * Grade section header with ceramic styling
 *
 * Shows grade, number of sections, and total classes
 */
export function GradeSectionHeader({
  grade,
  sectionCount,
  classCount,
  isSticky = true
}: GradeSectionHeaderProps) {
  return (
    <div
      className={cn(
        "z-10 px-4 py-2 border-b",
        "flex items-center justify-between",
        isSticky && "sticky top-0 bg-white/95 backdrop-blur-sm"
      )}
      style={{
        backgroundColor: "var(--ceramic-gray-50, #f6f6f7)",
        borderBottomColor: "var(--ceramic-gray-200, #ececee)",
      }}
    >
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-semibold" style={{ color: "var(--ceramic-gray-900, #4c4c5c)" }}>
          Grade {grade}
        </h3>
        <div className="flex items-center gap-2">
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              color: "var(--ceramic-gray-600, #90909d)",
              backgroundColor: "var(--ceramic-gray-100, #f6f6f7)"
            }}
          >
            {sectionCount} {sectionCount === 1 ? "section" : "sections"}
          </span>
          <span
            className="text-xs"
            style={{ color: "var(--ceramic-gray-500, #adadb7)" }}
          >
            {classCount} {classCount === 1 ? "class" : "classes"}
          </span>
        </div>
      </div>
    </div>
  );
}
