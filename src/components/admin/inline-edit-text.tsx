"use client";

import { useState } from "react";
import { Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface InlineEditTextProps {
  value: string;
  onSave: (newValue: string) => Promise<void> | void;
  className?: string;
}

export function InlineEditText({ value, onSave, className }: InlineEditTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      setEditValue(value); // Revert on error
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  return (
    <div className={cn("group relative", className)}>
      {isEditing ? (
        <input
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          className="w-full px-2 py-1 text-sm border border-pink-300 rounded focus:outline-none focus:ring-2 focus:ring-pink-500/20 bg-white"
          placeholder="Enter value..."
        />
      ) : (
        <span
          onClick={() => setIsEditing(true)}
          className="block truncate cursor-text hover:bg-gray-50 rounded px-2 py-1 transition-colors"
        >
          {value || <span className="text-gray-400 italic">Add...</span>}
          <Edit2 className="hidden group-hover:inline w-3 h-3 ml-1 opacity-0 group-hover:opacity-50 text-gray-400 align-middle" />
        </span>
      )}
    </div>
  );
}
