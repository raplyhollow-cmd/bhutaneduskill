"use client";

import { cn } from "@/lib/utils";

interface GradeGroupHeaderProps {
  grade: number;
  count: number;
  isSticky?: boolean;
}

/**
 * Sticky grade group header
 *
 * Features:
 * - Sticky positioning with backdrop blur
 * - Ceramic gray background
 * - Shows grade and subject count
 * - Subtle border bottom
 */
export function GradeGroupHeader({ grade, count, isSticky = true }: GradeGroupHeaderProps) {
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
          Grade {grade === 0 ? "All" : grade}
        </h3>
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{
            color: "var(--ceramic-gray-600, #90909d)",
            backgroundColor: "var(--ceramic-gray-100, #f6f6f7)"
          }}
        >
          {count} {count === 1 ? "subject" : "subjects"}
        </span>
      </div>
    </div>
  );
}
