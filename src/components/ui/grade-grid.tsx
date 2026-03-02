/**
 * GradeGrid Component - Smart UX for Inline Grade Entry
 *
 * FEATURES:
 * - Table view with inline grade input
 * - Auto-save on blur
 * - Bulk grade action
 * - Grade statistics (average, max, min)
 * - Max score display
 * - Validation (grade <= max)
 * - Loading state per cell
 *
 * DESIGN PHILOSOPHY:
 * - Fast inline editing without modal
 * - Visual feedback for validation states
 * - Bulk operations for efficiency
 * - Accessible keyboard navigation
 */

"use client";

import * as React from "react";
import { Loader2, Check, AlertCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ============================================================================
// TYPES
// ============================================================================

export interface Student {
  id: string;
  name: string;
  rollNumber?: string;
}

export interface GradeGridProps {
  /** Array of students to display grades for */
  students: Array<Student>;
  /** Maximum possible score for this assessment */
  maxScore: number;
  /** Initial grades mapped by student ID */
  initialGrades?: Record<string, number | null>;
  /** Callback when a single grade is saved */
  onSave: (studentId: string, grade: number) => Promise<void>;
  /** Callback when bulk grades are saved */
  onBulkSave?: (grades: Record<string, number>) => Promise<void>;
  /** Optional class name for styling */
  className?: string;
  /** Whether to show statistics row */
  showStatistics?: boolean;
  /** Optional bulk grade value to apply to all students */
  bulkGradeValue?: number;
}

export interface GradeGridStats {
  average: number;
  max: number;
  min: number;
  count: number;
  submitted: number;
}

// ============================================================================
// GRADE CELL COMPONENT
// ============================================================================

interface GradeCellProps {
  studentId: string;
  studentName: string;
  initialGrade: number | null;
  maxScore: number;
  onSave: (studentId: string, grade: number) => Promise<void>;
}

function GradeCell({ studentId, studentName, initialGrade, maxScore, onSave }: GradeCellProps) {
  const [value, setValue] = React.useState<string>(initialGrade?.toString() ?? "");
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<"success" | "error" | null>(null);
  const [isValid, setIsValid] = React.useState(true);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Reset value when initialGrade changes
  React.useEffect(() => {
    setValue(initialGrade?.toString() ?? "");
    setSaveStatus(null);
    setIsValid(true);
  }, [initialGrade]);

  const validateGrade = (val: string): boolean => {
    if (val === "") return true; // Empty is valid (means not graded yet)
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0 && num <= maxScore;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    setIsValid(validateGrade(newValue));
    setSaveStatus(null);
  };

  const handleBlur = async () => {
    if (value === "" || value === initialGrade?.toString()) {
      return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0 || numValue > maxScore) {
      setIsValid(false);
      setSaveStatus("error");
      return;
    }

    setIsSaving(true);
    try {
      await onSave(studentId, numValue);
      setSaveStatus("success");
      // Clear success indicator after 2 seconds
      setTimeout(() => setSaveStatus(null), 2000);
    } catch {
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      inputRef.current?.blur();
    }
  };

  const getGradeColor = (grade: number, max: number): string => {
    const percentage = (grade / max) * 100;
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-blue-600";
    if (percentage >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="relative flex items-center gap-2">
      <div className="relative w-20">
        <Input
          ref={inputRef}
          type="number"
          min={0}
          max={maxScore}
          step="0.5"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            "h-9 text-center",
            !isValid && "border-red-500 focus:border-red-500",
            value && isValid && getGradeColor(parseFloat(value), maxScore)
          )}
          disabled={isSaving}
          placeholder="-"
        />
        {isSaving && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
        {!isSaving && saveStatus === "success" && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <Check className="h-4 w-4 text-green-500" />
          </div>
        )}
        {!isSaving && saveStatus === "error" && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
        )}
      </div>
      <span className="text-xs text-gray-400">/ {maxScore}</span>
    </div>
  );
}

// ============================================================================
// GRADE STATISTICS COMPONENT
// ============================================================================

interface GradeStatsProps {
  grades: Array<number | null>;
  maxScore: number;
}

function GradeStats({ grades, maxScore }: GradeStatsProps) {
  const validGrades = grades.filter((g): g is number => g !== null && !isNaN(g));

  const stats: GradeGridStats = React.useMemo(() => {
    if (validGrades.length === 0) {
      return { average: 0, max: 0, min: 0, count: grades.length, submitted: 0 };
    }

    const sum = validGrades.reduce((acc, g) => acc + g, 0);
    return {
      average: Math.round((sum / validGrades.length) * 10) / 10,
      max: Math.max(...validGrades),
      min: Math.min(...validGrades),
      count: grades.length,
      submitted: validGrades.length,
    };
  }, [validGrades, grades.length]);

  const getPercentage = (grade: number): string => {
    return Math.round((grade / maxScore) * 100) + "%";
  };

  const StatBadge: React.FC<{
    label: string;
    value: string | number;
    icon?: React.ReactNode;
    variant?: "default" | "success" | "warning" | "info";
  }> = ({ label, value, icon, variant = "default" }) => (
    <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-gray-50 dark:bg-gray-800">
      {icon && <span className="text-gray-500">{icon}</span>}
      <div className="flex flex-col">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{value}</span>
      </div>
    </div>
  );

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <StatBadge
        label="Average"
        value={`${stats.average} (${getPercentage(stats.average)})`}
        icon={<TrendingUp className="h-4 w-4" />}
        variant="info"
      />
      <StatBadge
        label="Highest"
        value={`${stats.max} (${getPercentage(stats.max)})`}
        icon={<TrendingUp className="h-4 w-4 text-green-500" />}
        variant="success"
      />
      <StatBadge
        label="Lowest"
        value={`${stats.min} (${getPercentage(stats.min)})`}
        icon={<TrendingDown className="h-4 w-4 text-orange-500" />}
        variant="warning"
      />
      <StatBadge
        label="Submitted"
        value={`${stats.submitted}/${stats.count}`}
        variant="default"
      />
    </div>
  );
}

// ============================================================================
// MAIN GRADE GRID COMPONENT
// ============================================================================

export function GradeGrid({
  students,
  maxScore,
  initialGrades = {},
  onSave,
  onBulkSave,
  className,
  showStatistics = true,
}: GradeGridProps) {
  const [isBulkSaving, setIsBulkSaving] = React.useState(false);
  const [bulkValue, setBulkValue] = React.useState<string>("");
  const [bulkSelectMode, setBulkSelectMode] = React.useState(false);
  const [selectedStudents, setSelectedStudents] = React.useState<Set<string>>(new Set());

  // Computed grades array for statistics
  const gradesArray = React.useMemo(
    () => students.map((s) => initialGrades[s.id] ?? null),
    [students, initialGrades]
  );

  // Bulk grade all students with the same value
  const handleBulkApply = async () => {
    const value = parseFloat(bulkValue);
    if (isNaN(value) || value < 0 || value > maxScore) {
      return;
    }

    if (onBulkSave) {
      setIsBulkSaving(true);
      try {
        const gradesToSave: Record<string, number> = {};
        students.forEach((s) => {
          gradesToSave[s.id] = value;
        });
        await onBulkSave(gradesToSave);
        setBulkValue("");
      } finally {
        setIsBulkSaving(false);
      }
    } else {
      // Fallback: save individually
      setIsBulkSaving(true);
      try {
        for (const student of students) {
          await onSave(student.id, value);
        }
        setBulkValue("");
      } finally {
        setIsBulkSaving(false);
      }
    }
  };

  const handleBulkApplySelected = async () => {
    const value = parseFloat(bulkValue);
    if (isNaN(value) || value < 0 || value > maxScore || selectedStudents.size === 0) {
      return;
    }

    setIsBulkSaving(true);
    try {
      if (onBulkSave) {
        const gradesToSave: Record<string, number> = {};
        selectedStudents.forEach((id) => {
          gradesToSave[id] = value;
        });
        await onBulkSave(gradesToSave);
      } else {
        for (const id of selectedStudents) {
          await onSave(id, value);
        }
      }
      setBulkValue("");
      setSelectedStudents(new Set());
      setBulkSelectMode(false);
    } finally {
      setIsBulkSaving(false);
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const selectAll = () => {
    setSelectedStudents(new Set(students.map((s) => s.id)));
  };

  const clearSelection = () => {
    setSelectedStudents(new Set());
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Statistics Row */}
      {showStatistics && (
        <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Grade Statistics
          </h3>
          <GradeStats grades={gradesArray} maxScore={maxScore} />
        </div>
      )}

      {/* Bulk Actions Toolbar */}
      <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={bulkSelectMode ? "secondary" : "ghost"}
            onClick={() => setBulkSelectMode(!bulkSelectMode)}
          >
            {bulkSelectMode ? "Cancel Selection" : "Select Students"}
          </Button>
          {bulkSelectMode && (
            <>
              <Button size="sm" variant="ghost" onClick={selectAll}>
                Select All
              </Button>
              <Button size="sm" variant="ghost" onClick={clearSelection}>
                Clear
              </Button>
              <Badge variant="secondary">{selectedStudents.size} selected</Badge>
            </>
          )}
        </div>

        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            max={maxScore}
            step="0.5"
            placeholder="Grade"
            value={bulkValue}
            onChange={(e) => setBulkValue(e.target.value)}
            className="w-24 h-8"
          />
          <span className="text-sm text-gray-500">/ {maxScore}</span>
          <Button
            size="sm"
            onClick={bulkSelectMode ? handleBulkApplySelected : handleBulkApply}
            disabled={isBulkSaving || !bulkValue || (bulkSelectMode && selectedStudents.size === 0)}
            loading={isBulkSaving}
          >
            {bulkSelectMode ? "Apply Selected" : "Apply All"}
          </Button>
        </div>
      </div>

      {/* Grade Table */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                {bulkSelectMode && (
                  <th className="h-12 px-4 text-left align-middle font-medium text-gray-700 dark:text-gray-300 w-12">
                    <input
                      type="checkbox"
                      checked={selectedStudents.size === students.length && students.length > 0}
                      onChange={(e) => (e.target.checked ? selectAll() : clearSelection())}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </th>
                )}
                <th className="h-12 px-4 text-left align-middle font-medium text-gray-700 dark:text-gray-300">
                  Student
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-gray-700 dark:text-gray-300">
                  Roll Number
                </th>
                <th className="h-12 px-4 text-center align-middle font-medium text-gray-700 dark:text-gray-300">
                  Grade
                </th>
                <th className="h-12 px-4 text-center align-middle font-medium text-gray-700 dark:text-gray-300 w-24">
                  Percentage
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => {
                const grade = initialGrades[student.id];
                const percentage = grade !== null ? Math.round((grade / maxScore) * 100) : null;
                const isSelected = selectedStudents.has(student.id);

                return (
                  <tr
                    key={student.id}
                    className={cn(
                      "border-b border-gray-100 dark:border-gray-800 transition-colors",
                      "hover:bg-gray-50 dark:hover:bg-gray-800/50",
                      isSelected && "bg-blue-50 dark:bg-blue-900/20",
                      index % 2 === 0 && "bg-white dark:bg-gray-900",
                      index % 2 === 1 && "bg-gray-50/50 dark:bg-gray-800/30"
                    )}
                  >
                    {bulkSelectMode && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleStudentSelection(student.id)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3 align-middle font-medium text-gray-900 dark:text-gray-100">
                      {student.name}
                    </td>
                    <td className="px-4 py-3 align-middle text-gray-600 dark:text-gray-400">
                      {student.rollNumber || "-"}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <div className="flex justify-center">
                        <GradeCell
                          studentId={student.id}
                          studentName={student.name}
                          initialGrade={grade ?? null}
                          maxScore={maxScore}
                          onSave={onSave}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle text-center">
                      {percentage !== null ? (
                        <Badge
                          variant={percentage >= 60 ? "success" : percentage >= 40 ? "warning" : "error"}
                          className="text-xs"
                        >
                          {percentage}%
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {students.length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No students found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

GradeGrid.displayName = "GradeGrid";

export default GradeGrid;
