"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Users, MoreVertical, ChevronDown, ChevronRight, UserPlus, BookOpen, Users as UsersIcon, Eye, Edit, Trash2, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { InlineEdit } from "@/components/ui/inline-edit";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Class } from "@/lib/grouping";

interface ClassSectionRowProps {
  section: string;
  classes: Class[];
  index: number;
  onUpdate?: (id: string, field: string, value: string) => Promise<void>;
  onEdit?: (cls: Class) => void;
  onDelete?: (cls: Class) => void;
  onViewStudents?: (cls: Class) => void;
  onAssignTeacher?: (cls: Class) => void;
  onManageSubjects?: (cls: Class) => void;
}

/**
 * Class section row with expandable sub-rows
 *
 * Features:
 * - Section header (A, B, C) with expand/collapse
 * - Individual class rows with inline editing
 * - Purple left border accent on hover
 * - Status badge (Active/Inactive)
 * - Editable capacity
 * - 3-dot menu with multiple actions
 */
export function ClassSectionRow({
  section,
  classes,
  index,
  onUpdate,
  onEdit,
  onDelete,
  onViewStudents,
  onAssignTeacher,
  onManageSubjects
}: ClassSectionRowProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <motion.div
      className="border-b"
      style={{ borderColor: "var(--ceramic-gray-100, #f6f6f7)" }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.03,
        duration: 0.2,
        ease: [0.4, 0, 0.2, 1],
      }}
    >
      {/* Section Header */}
      <div
        className={cn(
          "flex items-center px-4 py-2.5 cursor-pointer transition-colors duration-75 relative group",
          "hover:bg-ceramic-gray-50 active:scale-[0.98]"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Purple left border accent */}
        <div className="absolute left-0 top-0 bottom-0 w-0 group-hover:w-[2px] transition-all duration-75"
             style={{ backgroundColor: "var(--ceramic-purple-500, #846bff)" }}
        />

        <div className="flex items-center gap-3 flex-1 pl-3">
          {/* Chevron */}
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" style={{ color: "var(--ceramic-gray-400, #c7c7cf)" }} />
          ) : (
            <ChevronRight className="w-4 h-4" style={{ color: "var(--ceramic-gray-400, #c7c7cf)" }} />
          )}

          {/* Section Name */}
          <span
            className="text-sm font-medium"
            style={{ color: "var(--ceramic-gray-900, #4c4c5c)" }}
          >
            Section {section}
          </span>

          {/* Class Count Badge */}
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              color: "var(--ceramic-gray-600, #90909d)",
              backgroundColor: "var(--ceramic-gray-100, #f6f6f7)"
            }}
          >
            {classes.length} {classes.length === 1 ? "class" : "classes"}
          </span>
        </div>
      </div>

      {/* Expandable Class Rows */}
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
          className="overflow-hidden"
        >
          {classes.map((cls, classIndex) => (
            <ClassSubRow
              key={cls.id}
              class={cls}
              index={classIndex}
              onUpdate={onUpdate}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewStudents={onViewStudents}
              onAssignTeacher={onAssignTeacher}
              onManageSubjects={onManageSubjects}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

// Sub-component for individual class row
interface ClassSubRowProps {
  class: Class;
  index: number;
  onUpdate?: (id: string, field: string, value: string) => Promise<void>;
  onEdit?: (cls: Class) => void;
  onDelete?: (cls: Class) => void;
  onViewStudents?: (cls: Class) => void;
  onAssignTeacher?: (cls: Class) => void;
  onManageSubjects?: (cls: Class) => void;
}

function ClassSubRow({
  class: cls,
  index,
  onUpdate,
  onEdit,
  onDelete,
  onViewStudents,
  onAssignTeacher,
  onManageSubjects
}: ClassSubRowProps) {
  const handleSave = (field: string) => async (value: string) => {
    if (onUpdate) {
      await onUpdate(cls.id, field, value);
    }
  };

  return (
    <motion.div
      className={cn(
        "flex items-center px-12 py-3 border-b transition-all duration-75 relative group",
        "hover:bg-ceramic-gray-50 active:scale-[0.98]",
        !cls.isActive && "opacity-50 grayscale"
      )}
      style={{
        borderBottomColor: "var(--ceramic-gray-50, #fafafb)",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.1 }}
    >
      {/* Purple left border accent */}
      <div className="absolute left-0 top-0 bottom-0 w-0 group-hover:w-[2px] transition-all duration-75 ml-10"
           style={{ backgroundColor: "var(--ceramic-purple-500, #846bff)" }}
      />

      <div className="flex items-center gap-4 flex-1">
        {/* Icon */}
        <div
          className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "var(--ceramic-gray-100, #f6f6f7)" }}
        >
          <Users className="w-4 h-4" style={{ color: "var(--ceramic-gray-600, #90909d)" }} />
        </div>

        {/* Class Name */}
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium truncate"
            style={{ color: "var(--ceramic-gray-900, #4c4c5c)" }}
          >
            {cls.name}
          </p>
        </div>

        {/* Code/Section */}
        <div className="w-20 text-sm" style={{ color: "var(--ceramic-gray-600, #90909d)" }}>
          {cls.section}
        </div>

        {/* Room No - Inline Editable */}
        <div className="w-24">
          <InlineEdit
            value={cls.roomNumber || ""}
            onSave={handleSave("room")}
            placeholder="—"
            className="text-sm"
          />
        </div>

        {/* Capacity - Inline Editable */}
        <div className="w-24 flex items-center gap-1">
          <span className="text-xs" style={{ color: "var(--ceramic-gray-600, #90909d)" }}>
            {cls.enrolled || 0}/
          </span>
          <InlineEdit
            value={String(cls.capacity || "")}
            onSave={handleSave("capacity")}
            placeholder="—"
            className="text-sm w-14"
          />
        </div>

        {/* Class Teacher - Inline Editable */}
        <div className="w-32">
          <InlineEdit
            value={cls.classTeacherName || cls.homeroomTeacherName || ""}
            onSave={handleSave("teacher")}
            placeholder="Unassigned"
            className="text-sm"
          />
        </div>

        {/* Status Badge */}
        <Badge
          className={cn(
            "text-xs",
            cls.isActive
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-600"
          )}
        >
          {cls.isActive ? "Active" : "Inactive"}
        </Badge>

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-1.5 rounded hover:bg-ceramic-gray-200 transition-colors duration-75"
              style={{ backgroundColor: "transparent" }}
            >
              <MoreVertical className="w-4 h-4" style={{ color: "var(--ceramic-gray-500, #adadb7)" }} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" variant="ceramic" className="w-48">
            {onViewStudents && (
              <DropdownMenuItem onClick={() => onViewStudents(cls)}>
                <Eye className="w-4 h-4 mr-2" />
                View Students
              </DropdownMenuItem>
            )}
            {onAssignTeacher && (
              <DropdownMenuItem onClick={() => onAssignTeacher(cls)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Assign Teacher
              </DropdownMenuItem>
            )}
            {onManageSubjects && (
              <DropdownMenuItem onClick={() => onManageSubjects(cls)}>
                <BookOpen className="w-4 h-4 mr-2" />
                Manage Subjects
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit?.(cls)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete?.(cls)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
