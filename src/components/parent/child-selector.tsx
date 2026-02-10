/**
 * CHILD SELECTOR COMPONENT
 *
 * Allows parents to switch between their children to view different students' data.
 * This is a client component that manages the selected child state.
 */

"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, User } from "lucide-react";

export interface Child {
  id: string;
  name: string;
  grade: string;
  school: string;
  clerkUserId?: string;
}

interface ChildSelectorProps {
  children: Child[];
  selectedChildId?: string;
  onChildChange?: (child: Child) => void;
  className?: string;
}

export function ChildSelector({
  children,
  selectedChildId,
  onChildChange,
  className = "",
}: ChildSelectorProps) {
  const [selectedId, setSelectedId] = useState(
    selectedChildId || children[0]?.id
  );

  const selectedChild = children.find((c) => c.id === selectedId) || children[0];

  const handleValueChange = (value: string) => {
    setSelectedId(value);
    const child = children.find((c) => c.id === value);
    if (child && onChildChange) {
      onChildChange(child);
    }
  };

  if (children.length === 0) {
    return (
      <div className={`p-4 bg-yellow-50 border border-yellow-200 rounded-lg ${className}`}>
        <p className="text-sm text-yellow-800">No children linked to your account yet.</p>
      </div>
    );
  }

  // Single child - show as display only
  if (children.length === 1) {
    return (
      <div className={`flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
            <span className="text-white text-lg font-bold">
              {selectedChild?.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{selectedChild?.name}</p>
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <GraduationCap className="w-3 h-3" />
              {selectedChild?.grade} • {selectedChild?.school}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Multiple children - show selector
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2">
        <User className="w-4 h-4 text-gray-500" />
        <label className="text-sm font-medium text-gray-700">
          Select Child to View
        </label>
      </div>
      <Select value={selectedId} onValueChange={handleValueChange}>
        <SelectTrigger className="w-full md:w-[300px]">
          <SelectValue placeholder="Select a child" />
        </SelectTrigger>
        <SelectContent>
          {children.map((child) => (
            <SelectItem key={child.id} value={child.id}>
              <div className="flex items-center gap-2">
                <span>{child.name}</span>
                <Badge variant="outline" className="text-xs">
                  {child.grade}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedChild && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
          <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">
              {selectedChild.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </span>
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">{selectedChild.name}</p>
            <p className="text-xs text-gray-600">
              {selectedChild.grade} • {selectedChild.school}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Default export for convenience
export default ChildSelector;
