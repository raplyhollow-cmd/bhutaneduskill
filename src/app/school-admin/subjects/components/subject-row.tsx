"use client";

import { motion } from "framer-motion";
import { BookOpen, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { InlineEdit } from "@/components/ui/inline-edit";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Subject } from "@/lib/grouping";

interface SubjectRowProps {
  subject: Subject;
  index: number;
  onUpdate?: (id: string, field: string, value: string) => Promise<void>;
  onEdit?: (subject: Subject) => void;
  onDelete?: (subject: Subject) => void;
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
 */
export function SubjectRow({ subject, index, onUpdate, onEdit, onDelete }: SubjectRowProps) {
  const handleSave = async (field: string) => {
    return async (value: string) => {
      if (onUpdate) {
        await onUpdate(subject.id, field, value);
      }
    };
  };

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

        {/* Subject Name */}
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium truncate"
            style={{ color: "var(--ceramic-gray-900, #4c4c5c)" }}
          >
            {subject.name}
          </p>
          <p className="text-xs truncate" style={{ color: "var(--ceramic-gray-500, #adadb7)" }}>
            {subject.type}
          </p>
        </div>

        {/* Code - Inline Editable */}
        <div className="w-24">
          <InlineEdit
            value={subject.code}
            onSave={handleSave("code")}
            placeholder="—"
            className="text-sm"
          />
        </div>

        {/* Assigned Teacher - Placeholder for now */}
        <div className="w-32">
          <InlineEdit
            value=""
            onSave={handleSave("teacher")}
            placeholder="Unassigned"
            className="text-sm"
          />
        </div>

        {/* Room No - Placeholder for now */}
        <div className="w-20">
          <InlineEdit
            value=""
            onSave={handleSave("room")}
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
              className="p-1.5 rounded hover:bg-ceramic-gray-200 transition-colors duration-75"
              style={{ backgroundColor: "transparent" }}
            >
              <MoreVertical className="w-4 h-4" style={{ color: "var(--ceramic-gray-500, #adadb7)" }} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" variant="ceramic">
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
