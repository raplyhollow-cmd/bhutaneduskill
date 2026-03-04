/**
 * SUBJECT TEACHER INLINE DROPDOWN
 *
 * Replaces modal with inline interface.
 * Shows assigned teachers as chips with dropdown for:
 * - Viewing all assigned classes
 * - Assigning to "All classes for this subject"
 * - Assigning to specific classes
 * - Removing assignments
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Check, X, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface Teacher {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email?: string | null;
  employeeId?: string | null;
}

interface ClassInfo {
  id: string;
  name: string;
  grade: number;
  section: string;
}

interface TeacherAssignment {
  id: string;
  teacherId: string;
  teacher: Teacher;
  assignedClasses: ClassInfo[];
  isPrimary: boolean;
  role: string;
}

interface SubjectTeacherDropdownProps {
  subjectId: string;
  subjectName: string;
  assignedTeachers: TeacherAssignment[];
  allClasses: ClassInfo[];
  availableTeachers?: Teacher[];
  onAssign: (teacherId: string, classIds: string[], isAllClasses: boolean) => Promise<boolean>;
  onRemove: (teacherId: string, classId?: string) => Promise<boolean>;
  onRefresh?: () => Promise<void>;
}

export function SubjectTeacherDropdown({
  subjectId,
  subjectName,
  assignedTeachers,
  allClasses,
  availableTeachers = [],
  onAssign,
  onRemove,
  onRefresh,
}: SubjectTeacherDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedClassIds, setSelectedClassIds] = useState<Set<string>>(new Set());
  const [isAllClasses, setIsAllClasses] = useState(false);
  const [showClassSelector, setShowClassSelector] = useState<string | false>(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset state when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedClassIds(new Set());
      setIsAllClasses(false);
      setShowClassSelector(false);
      setSuccess(null);
      setError(null);
    }
  }, [isOpen]);

  const handleClassToggle = (classId: string) => {
    const newSelected = new Set(selectedClassIds);
    if (newSelected.has(classId)) {
      newSelected.delete(classId);
    } else {
      newSelected.add(classId);
    }
    setSelectedClassIds(newSelected);
  };

  const handleAllClassesToggle = () => {
    if (isAllClasses) {
      setIsAllClasses(false);
      setSelectedClassIds(new Set());
    } else {
      setIsAllClasses(true);
      setSelectedClassIds(new Set(allClasses.map((c) => c.id)));
    }
  };

  const handleAssign = async (teacherId: string) => {
    if (selectedClassIds.size === 0 && !isAllClasses) {
      setError("Please select at least one class");
      return;
    }

    setIsAssigning(true);
    setError(null);

    try {
      const classIds = isAllClasses ? [] : Array.from(selectedClassIds);
      const result = await onAssign(teacherId, classIds, isAllClasses);

      if (result) {
        const message = isAllClasses
          ? "all classes"
          : `${selectedClassIds.size} class(es)`;
        setSuccess(`Assigned to ${message}`);
        await onRefresh?.();

        // Reset and close
        setSelectedClassIds(new Set());
        setIsAllClasses(false);
        setShowClassSelector(false);

        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign teacher");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemove = async (assignmentId: string, teacherId: string) => {
    setIsAssigning(true);
    setError(null);

    try {
      const result = await onRemove(teacherId);

      if (result) {
        setSuccess("Teacher removed successfully");
        await onRefresh?.();
        setTimeout(() => setSuccess(null), 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove teacher");
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Assigned Teachers as Chips */}
      {assignedTeachers.length === 0 ? (
        <Button
          size="sm"
          variant="outline"
          className="text-violet-600 border-violet-200 hover:bg-violet-50"
          onClick={() => setShowClassSelector("new")}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Assign Teacher
        </Button>
      ) : (
        assignedTeachers.map((assignment) => (
          <div key={assignment.id} className="relative">
            <DropdownMenu open={isOpen && showClassSelector === assignment.id} onOpenChange={(open) => {
              setIsOpen(open);
              if (open) setShowClassSelector(assignment.id);
              else setShowClassSelector(false);
            }}>
              <DropdownMenuTrigger asChild>
                <button
                  className={`
                    flex items-center gap-2 px-3 py-1.5 pr-8
                    rounded-full border-2
                    transition-all
                    ${assignment.isPrimary
                      ? "border-violet-500 bg-violet-50 text-violet-700"
                      : "border-gray-300 bg-gray-50 text-gray-700 hover:border-violet-300 hover:bg-violet-50"
                    }
                  `}
                >
                  <div className="w-7 h-7 rounded-full bg-violet-200 flex items-center justify-center text-violet-700 text-xs font-medium">
                    {assignment.teacher.firstName?.[0]}
                    {assignment.teacher.lastName?.[0]}
                  </div>
                  <span className="text-sm font-medium">
                    {assignment.teacher.firstName} {assignment.teacher.lastName}
                  </span>
                  {assignment.isPrimary && (
                    <Badge className="bg-blue-100 text-blue-700 text-xs py-0 h-5">
                      Primary
                    </Badge>
                  )}
                  <span className="text-xs text-gray-500">
                    ({assignment.assignedClasses.length} class{assignment.assignedClasses.length !== 1 ? "es" : ""})
                  </span>
                  <ChevronDown className="w-4 h-4 opacity-50" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="start" className="w-80">
                <div className="px-4 py-3 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                      <span className="text-violet-600 font-medium">
                        {assignment.teacher.firstName?.[0]}
                        {assignment.teacher.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {assignment.teacher.firstName} {assignment.teacher.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {assignment.teacher.employeeId || "No Employee ID"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-4 py-2 border-b">
                  <p className="text-xs text-gray-500 mb-2">Assigned Classes:</p>
                  <div className="flex flex-wrap gap-1">
                    {assignment.assignedClasses.map((cls) => (
                      <Badge key={cls.id} variant="secondary" className="text-xs">
                        {cls.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="px-4 py-2">
                  <p className="text-xs text-gray-500 mb-2">Assign to more classes:</p>
                  <div className="space-y-2">
                    {/* All Classes Option */}
                    <button
                      onClick={handleAllClassesToggle}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-colors ${
                        isAllClasses
                          ? "bg-violet-50 border-violet-200"
                          : "hover:bg-gray-50 border-gray-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isAllClasses}
                        onChange={handleAllClassesToggle}
                        className="w-4 h-4 text-violet-600 rounded"
                      />
                      <span className="text-sm font-medium">
                        All classes for this subject
                      </span>
                      <span className="text-xs text-gray-400 ml-auto">
                        ({allClasses.length} total)
                      </span>
                    </button>

                    {/* Individual Classes */}
                    {!isAllClasses && (
                      <div className="max-h-40 overflow-y-auto space-y-1 pl-7">
                        {allClasses.map((cls) => {
                          const isAssigned = assignment.assignedClasses.some((c) => c.id === cls.id);
                          const isSelected = selectedClassIds.has(cls.id);

                          return (
                            <button
                              key={cls.id}
                              disabled={isAssigned}
                              onClick={() => handleClassToggle(cls.id)}
                              className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-colors text-left ${
                                isAssigned
                                  ? "opacity-50 cursor-not-allowed"
                                  : isSelected
                                    ? "bg-violet-50 border-violet-200"
                                    : "hover:bg-gray-50 border-gray-200"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected || isAssigned}
                                disabled={isAssigned}
                                onChange={() => handleClassToggle(cls.id)}
                                className="w-4 h-4 text-violet-600 rounded"
                              />
                              <span className="text-sm">
                                {cls.name}
                                {isAssigned && " (already assigned)"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Selected Count & Action */}
                  {(selectedClassIds.size > 0 || isAllClasses) && (
                    <div className="mt-3 pt-3 border-t flex items-center justify-between">
                      <span className="text-xs text-gray-600">
                        {isAllClasses
                          ? `All ${allClasses.length} classes selected`
                          : `${selectedClassIds.size} class(es) selected`
                        }
                      </span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedClassIds(new Set());
                            setIsAllClasses(false);
                          }}
                          disabled={isAssigning}
                        >
                          Clear
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAssign(assignment.teacherId)}
                          disabled={isAssigning}
                          className="bg-violet-600 hover:bg-violet-700"
                        >
                          {isAssigning ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              Assign
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Success/Error Messages */}
                  {success && (
                    <div className="mt-2 text-sm text-green-600 flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      {success}
                    </div>
                  )}
                  {error && (
                    <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <X className="w-4 h-4" />
                      {error}
                    </div>
                  )}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => handleRemove(assignment.id, assignment.teacherId)}
                    className="text-red-600 focus:text-red-600"
                    disabled={isAssigning}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove {assignment.teacher.firstName} from this subject
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))
      )}

      {/* Add Teacher Button (when no teachers assigned or to add more) */}
      <Button
        size="sm"
        variant="outline"
        className="text-violet-600 border-violet-200 hover:bg-violet-50"
        onClick={() => setShowClassSelector("new")}
      >
        <UserPlus className="w-4 h-4 mr-2" />
        {assignedTeachers.length === 0 ? "Assign Teacher" : "Add More"}
      </Button>

      {/* New Teacher Selection (inline) */}
      {showClassSelector === "new" && (
        <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
          <span className="text-sm text-gray-600">Select teacher to assign:</span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={availableTeachers.length === 0}>
                {availableTeachers.length > 0 ? "Choose teacher..." : "No teachers available"}
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              {availableTeachers.map((teacher) => (
                <DropdownMenuItem
                  key={teacher.id}
                  onClick={() => {
                    // Start assignment flow for this teacher
                    setShowClassSelector(teacher.id);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-600 text-xs">
                        {teacher.firstName?.[0]}
                        {teacher.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {teacher.firstName} {teacher.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {teacher.employeeId || "No Employee ID"}
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowClassSelector(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Class Selection for New Teacher */}
      {typeof showClassSelector === "string" && showClassSelector !== "new" && (
        <div className="flex items-center gap-2 p-3 border rounded-lg bg-violet-50">
          <span className="text-sm font-medium">
            Assign {availableTeachers.find((t) => t.id === showClassSelector)?.firstName} to:
          </span>

          {/* All Classes Checkbox */}
          <button
            onClick={handleAllClassesToggle}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
              isAllClasses
                ? "bg-violet-100 border-violet-300"
                : "hover:bg-gray-100 border-gray-200"
            }`}
          >
            <input
              type="checkbox"
              checked={isAllClasses}
              onChange={handleAllClassesToggle}
              className="w-4 h-4 text-violet-600 rounded"
            />
            <span className="text-sm">All classes</span>
            <span className="text-xs text-gray-400">({allClasses.length})</span>
          </button>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedClassIds(new Set());
                setIsAllClasses(false);
              }}
              disabled={isAssigning}
            >
              Clear
            </Button>
            <Button
              size="sm"
              onClick={() => handleAssign(showClassSelector)}
              disabled={isAssigning || (selectedClassIds.size === 0 && !isAllClasses)}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {isAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : "Assign"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowClassSelector(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {error && (
            <div className="col-span-full text-sm text-red-600 flex items-center gap-1">
              <X className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
