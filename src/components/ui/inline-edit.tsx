"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface InlineEditProps {
  value: string;
  onSave: (value: string) => Promise<void> | void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  type?: "text" | "number";
}

/**
 * Inline edit component with zero layout shift
 *
 * Features:
 * - Click to edit
 * - Enter to save, Escape to cancel
 * - Auto-focus and select text on edit
 * - Save on blur
 * - Scale feedback on interaction
 */
export function InlineEdit({
  value,
  onSave,
  placeholder = "Click to edit",
  className,
  disabled = false,
  type = "text"
}: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update edit value when prop changes
  useEffect(() => {
    setEditValue(value);
  }, [value]);

  // Focus and select text when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    if (!disabled && !isEditing) {
      setIsEditing(true);
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      await saveChanges();
    } else if (e.key === "Escape") {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  const handleBlur = async () => {
    if (isEditing && editValue !== value) {
      await saveChanges();
    } else {
      setIsEditing(false);
    }
  };

  const saveChanges = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      // Revert on error
      setEditValue(value);
      console.error("Failed to save:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      className={cn("relative", className)}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ duration: 0.075 }}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          disabled={isSaving || disabled}
          className={cn(
            "w-full px-2 py-1 text-sm bg-white border rounded",
            "focus:outline-none focus:ring-2 focus:ring-violet-500",
            "transition-all duration-75",
            isSaving && "opacity-50"
          )}
          style={{
            borderColor: "var(--ceramic-gray-300, #d1d5db)",
            transition: "all var(--transition-instant, 75ms)"
          }}
        />
      ) : (
        <span
          onClick={handleClick}
          className={cn(
            "cursor-text px-2 py-1 -mx-2 rounded block",
            "transition-colors duration-75",
            !disabled && "hover:bg-ceramic-gray-100",
            disabled && "cursor-default opacity-50",
            !value && "text-ceramic-gray-500 italic"
          )}
          style={{
            transition: "background-color var(--transition-instant, 75ms)",
            color: value ? "var(--ceramic-gray-900, #111827)" : "var(--ceramic-gray-500, #6b7280)"
          }}
        >
          {value || placeholder}
        </span>
      )}
    </motion.div>
  );
}
