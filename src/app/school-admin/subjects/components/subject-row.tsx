"use client";

import { motion } from "framer-motion";
import { BookOpen, MoreVertical, UserPlus, Users, X, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { InlineEdit } from "@/components/ui/inline-edit";
import { InPlaceText } from "@/components/ui/in-place-editor";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Subject } from "@/lib/grouping";

interface TeacherAssignment {
  id: string;
  teacherId: string;
  role: string;
  isPrimary: boolean;
  classId: string | null;
  teacher: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  class?: {
    id: string;
    name: string;
    grade: number;
    section: string;
  } | null;
}

interface SubjectRowProps {
  subject: Subject;
  index: number;
  onUpdate?: (id: string, field: string, value: string) => Promise<void>;
  onEdit?: (subject: Subject) => void;
  onDelete?: (subject: Subject) => void;
  onView?: (subject: Subject) => void;
  teacherAssignments?: Record<string, TeacherAssignment[]>;
  onAssignTeacher?: (subject: Subject) => void;
  onRemoveTeacher?: (subjectId: string, teacherId: string, classId?: string | null) => void;
}

/**
 * Subject row with inline editing and interactive hover states
 *
 * Features:
 * - Purple left border accent on hover (information scent)
 * - Inline editing for Code
 * - Scale-[0.98] on active/press
 * - 50% opacity + grayscale for inactive subjects
 * - Context menu for actions
 * - Teacher assignment display and quick actions
 */
export function SubjectRow({
  subject,
  index,
  onUpdate,
  onEdit,
  onDelete,
  onView,
  teacherAssignments,
  onAssignTeacher,
  onRemoveTeacher,
}: SubjectRowProps) {
  const handleInPlaceSave = async (field: string, value: string): Promise<{ success: boolean; error?: string }> => {
    if (onUpdate) {
      try {
        await onUpdate(subject.id, field, value);
        return { success: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Failed to save" };
      }
    }
    return { success: true };
  };

  const handleInlineSave = async (field: string, value: string): Promise<void> => {
    if (onUpdate) {
      await onUpdate(subject.id, field, value);
    }
  };

  // Get teacher name helper
  const getTeacherName = (teacher: TeacherAssignment["teacher"]) => {
    if (teacher.firstName && teacher.lastName) {
      return `${teacher.firstName} ${teacher.lastName}`;
    }
    return teacher.email;
  };

  // Get assignments for this subject
  const assignments = teacherAssignments?.[subject.id] || [];

  return (
    <motion.div
      className={cn(
        "flex items-center px-4 py-3 border-b transition-all duration-75 relative group",
        "hover:bg-ceramic-gray-50 active:scale-[0.98]",
        !subject.isActive && "opacity-50 grayscale"
      )}
      style={{
        borderBottomColor: "var(--ceramic-gray-100, #f6f6f7)",
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.03,
        duration: 0.2,
        ease: [0.4, 0, 0.2, 1],
      }}
    >
      {/* Purple left border accent on hover - using ::before pseudo-element */}
      <style jsx>{`
        .group:hover::before {
          width: 2px;
        }
      `}</style>
      <div className="absolute left-0 top-0 bottom-0 w-0 transition-all duration-75"
           style={{
             backgroundColor: "var(--ceramic-purple-500, #846bff)",
           }}
      />

      {/* Content */}
      <div className="flex items-center gap-3 flex-1 pl-3">
        {/* Icon */}
        <div
          className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "var(--ceramic-gray-100, #f6f6f7)" }}
        >
          <BookOpen className="w-4 h-4" style={{ color: "var(--ceramic-gray-600, #90909d)" }} />
        </div>

        {/* Subject Name - Inline Editable */}
        <div className="flex-1 min-w-0">
          <InPlaceText
            value={subject.name}
            onSave={(value) => handleInPlaceSave("name", value)}
            placeholder="Subject name"
            minLength={2}
            maxLength={100}
            required={true}
            displayClassName="text-sm font-medium truncate"
            showIcon={true}
          />
          <p className="text-xs truncate" style={{ color: "var(--ceramic-gray-500, #adadb7)" }}>
            {subject.type}
          </p>
        </div>

        {/* Code - Inline Editable */}
        <div className="w-24">
          <InlineEdit
            value={subject.code}
            onSave={(value) => handleInlineSave("code", value)}
            placeholder="—"
            className="text-sm"
          />
        </div>

        {/* Assigned Teachers */}
        <div className="w-48 flex items-center gap-1">
          {assignments.length === 0 ? (
            <button
              onClick={() => onAssignTeacher?.(subject)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-violet-600 transition-colors px-2 py-1 rounded hover:bg-violet-50"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Assign Teacher
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <div className="flex -space-x-1">
                {assignments.slice(0, 3).map((assignment) => (
                  <div
                    key={assignment.id}
                    className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                    title={getTeacherName(assignment.teacher)}
                  >
                    {assignment.teacher.firstName?.[0] || assignment.teacher.email[0].toUpperCase()}
                  </div>
                ))}
                {assignments.length > 3 && (
                  <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium border-2 border-white">
                    +{assignments.length - 3}
                  </div>
                )}
              </div>
              <button
                onClick={() => onAssignTeacher?.(subject)}
                className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center hover:bg-violet-200 transition-colors"
                title="Add teacher"
              >
                <UserPlus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Room No - Placeholder for now */}
        <div className="w-20">
          <InlineEdit
            value=""
            onSave={(value) => handleInlineSave("room", value)}
            placeholder="—"
            className="text-sm"
          />
        </div>

        {/* Status Badge */}
        <Badge
          className={cn(
            "text-xs",
            subject.isActive
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-600"
          )}
        >
          {subject.isActive ? "Active" : "Inactive"}
        </Badge>

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-1.5 rounded hover:bg-ceramic-gray-200 transition-colors duration-75 opacity-0 group-hover:opacity-100"
              style={{ backgroundColor: "transparent" }}
            >
              <MoreVertical className="w-4 h-4" style={{ color: "var(--ceramic-gray-500, #adadb7)" }} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" variant="ceramic">
            {onView && (
              <DropdownMenuItem onClick={() => onView(subject)}>
                View Details
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onEdit?.(subject)}>
              Edit Details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete?.(subject)}
              className="text-red-600 focus:text-red-600"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
