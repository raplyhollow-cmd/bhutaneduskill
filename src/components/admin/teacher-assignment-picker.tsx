/**
 * TEACHER ASSIGNMENT PICKER
 *
 * Reusable component for assigning teachers to:
 * - Subjects
 * - Classes
 * - Specific periods
 *
 * Features:
 * - Quick teacher selection
 * - Role selection (Primary/Substitute)
 * - Avatar display
 * - Inline removal
 */

"use client";

import { useState, useEffect } from "react";
import { X, UserPlus, GraduationCap, Star, Loader2, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Teacher {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  employeeId: string | null;
}

interface TeacherAssignment {
  id: string;
  teacherId: string;
  role?: string;
  isPrimary?: boolean;
  teacher: Teacher;
}

interface TeacherAssignmentPickerProps {
  assignments: TeacherAssignment[];
  teachers: Teacher[];
  onAssign: (teacherId: string, role?: string, isPrimary?: boolean) => Promise<void>;
  onRemove: (assignmentId: string, teacherId: string) => Promise<void>;
  isLoading?: boolean;
  contextLabel?: string;
  showRole?: boolean;
  allowMultiple?: boolean;
  size?: "sm" | "md" | "lg";
}

export function TeacherAssignmentPicker({
  assignments,
  teachers,
  onAssign,
  onRemove,
  isLoading = false,
  contextLabel = "teacher",
  showRole = true,
  allowMultiple = true,
  size = "md",
}: TeacherAssignmentPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState<string | null>(null);

  const getTeacherName = (teacher: Teacher) => {
    if (teacher.firstName && teacher.lastName) {
      return `${teacher.firstName} ${teacher.lastName}`;
    }
    return teacher.email;
  };

  const getTeacherInitials = (teacher: Teacher) => {
    if (teacher.firstName && teacher.lastName) {
      return `${teacher.firstName[0]}${teacher.lastName[0]}`;
    }
    return teacher.email.slice(0, 2).toUpperCase();
  };

  const handleAssign = async (teacherId: string) => {
    setIsAssigning(teacherId);
    try {
      await onAssign(teacherId);
      setIsOpen(false);
    } finally {
      setIsAssigning(null);
    }
  };

  const sizeClasses = {
    sm: { avatar: "w-6 h-6 text-xs", container: "gap-1" },
    md: { avatar: "w-8 h-8 text-sm", container: "gap-1.5" },
    lg: { avatar: "w-10 h-10 text-sm", container: "gap-2" },
  };

  return (
    <div className="flex items-center">
      <div className={cn("flex items-center", sizeClasses[size].container)}>
        {/* Assigned Teachers */}
        {assignments.length === 0 ? (
          <Button
            variant="outline"
            size={size === "sm" ? "sm" : "default"}
            onClick={() => setIsOpen(true)}
            disabled={isLoading}
            className="text-gray-500 hover:text-violet-600"
          >
            <UserPlus className={cn("w-4 h-4", size === "lg" && "w-5 h-5")} />
            Assign {contextLabel}
          </Button>
        ) : (
          <>
            <div className="flex -space-x-2">
              {assignments.slice(0, 3).map((assignment) => (
                <div
                  key={assignment.id}
                  className="group relative"
                  title={getTeacherName(assignment.teacher)}
                >
                  <div
                    className={cn(
                      "rounded-full flex items-center justify-center text-white font-medium border-2 border-white",
                      sizeClasses[size].avatar,
                      assignment.isPrimary
                        ? "bg-gradient-to-br from-amber-400 to-orange-500"
                        : "bg-gradient-to-br from-violet-500 to-purple-600"
                    )}
                  >
                    {getTeacherInitials(assignment.teacher)}
                  </div>
                  {/* Remove button on hover */}
                  <button
                    onClick={() => onRemove(assignment.id, assignment.teacherId)}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
                    disabled={isLoading}
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {assignment.isPrimary && (
                    <Star className="absolute -bottom-1 -right-1 w-3 h-3 text-amber-500 fill-amber-500" />
                  )}
                </div>
              ))}
              {assignments.length > 3 && (
                <div
                  className={cn(
                    "rounded-full flex items-center justify-center font-medium border-2 border-white bg-gray-200 text-gray-600",
                    sizeClasses[size].avatar
                  )}
                >
                  +{assignments.length - 3}
                </div>
              )}
            </div>

            {/* Add button */}
            {allowMultiple && (
              <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "rounded-full flex items-center justify-center transition-colors",
                      size === "sm" && "w-6 h-6 bg-violet-100 text-violet-600 hover:bg-violet-200",
                      size === "md" && "w-7 h-7 bg-violet-100 text-violet-600 hover:bg-violet-200",
                      size === "lg" && "w-8 h-8 bg-violet-100 text-violet-600 hover:bg-violet-200"
                    )}
                    disabled={isLoading}
                  >
                    <UserPlus className={size === "lg" ? "w-4 h-4" : "w-3 h-3"} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase">
                    Select {contextLabel}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {teachers.map((teacher) => {
                      const isAssigned = assignments.some(a => a.teacherId === teacher.id);
                      const isThisAssigning = isAssigning === teacher.id;

                      return (
                        <DropdownMenuItem
                          key={teacher.id}
                          disabled={isAssigned || isLoading}
                          onClick={() => handleAssign(teacher.id)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-2 w-full">
                            <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-xs font-medium">
                              {getTeacherInitials(teacher)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {getTeacherName(teacher)}
                              </p>
                              {teacher.employeeId && (
                                <p className="text-xs text-gray-500">{teacher.employeeId}</p>
                              )}
                            </div>
                            {isThisAssigning ? (
                              <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
                            ) : isAssigned ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : null}
                          </div>
                        </DropdownMenuItem>
                      );
                    })}
                  </div>
                  {teachers.length === 0 && (
                    <div className="px-2 py-4 text-center text-sm text-gray-500">
                      No teachers available
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Compact teacher badge for list views
 */
export function TeacherBadge({
  teacher,
  onRemove,
  isPrimary = false,
  size = "sm",
}: {
  teacher: Teacher;
  onRemove?: () => void;
  isPrimary?: boolean;
  size?: "sm" | "md";
}) {
  const getTeacherName = (teacher: Teacher) => {
    if (teacher.firstName && teacher.lastName) {
      return `${teacher.firstName} ${teacher.lastName}`;
    }
    return teacher.email;
  };

  const getInitials = (teacher: Teacher) => {
    if (teacher.firstName && teacher.lastName) {
      return `${teacher.firstName[0]}${teacher.lastName[0]}`;
    }
    return teacher.email.slice(0, 2).toUpperCase();
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full pl-1 pr-2",
        size === "sm" ? "py-0.5" : "py-1",
        isPrimary
          ? "bg-amber-100 text-amber-800"
          : "bg-violet-100 text-violet-800"
      )}
    >
      <div
        className={cn(
          "rounded-full flex items-center justify-center text-white font-medium",
          size === "sm" ? "w-5 h-5 text-xs" : "w-6 h-6 text-sm",
          isPrimary
            ? "bg-amber-500"
            : "bg-violet-500"
        )}
      >
        {getInitials(teacher)}
      </div>
      <span className={cn("font-medium", size === "sm" ? "text-xs" : "text-sm")}>
        {getTeacherName(teacher)}
      </span>
      {isPrimary && <Star className="w-3 h-3 fill-current" />}
      {onRemove && (
        <button
          onClick={onRemove}
          className="hover:opacity-70 transition-opacity"
        >
          <X className={cn(size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5")} />
        </button>
      )}
    </div>
  );
}
