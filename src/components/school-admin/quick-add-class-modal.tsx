/**
 * QUICK ADD CLASS MODAL
 *
 * A streamlined class creation modal using ExpressAddModal.
 * Quickly add a class with just the name - code and grade are auto-detected.
 *
 * DESIGN:
 * - Single field: Class name (e.g., "10-A", "Grade 10 Section A", "Class 7B")
 * - Auto-detects: Grade (from name) and Section (from name)
 * - Generates: Class code
 */

"use client";

import { ExpressAddModal, useExpressAdd, type ExpressAddResult } from "@/components/ui/express-add-modal";
import { Users } from "lucide-react";

interface QuickAddClassModalProps {
  onSuccess: () => void;
}

/**
 * Parse class name to extract grade and section
 * Supports formats: "10-A", "10A", "Grade 10 Section A", "Class 7B", etc.
 */
function parseClassName(name: string) {
  const trimmed = name.trim().toUpperCase();

  // Pattern 1: "10-A" or "10A" -> grade: 10, section: A
  const pattern1 = /^(\d+)[-:\s]?([A-Z])$/i;
  const match1 = trimmed.match(pattern1);
  if (match1) {
    return { grade: parseInt(match1[1]), section: match1[2] };
  }

  // Pattern 2: "GRADE 10 SECTION A" -> grade: 10, section: A
  const pattern2 = /GRADE\s+(\d+)\s+SECTION\s+([A-Z])/i;
  const match2 = trimmed.match(pattern2);
  if (match2) {
    return { grade: parseInt(match2[1]), section: match2[2] };
  }

  // Pattern 3: "CLASS 7B" -> grade: 7, section: B
  const pattern3 = /CLASS\s+(\d+)([A-Z])/i;
  const match3 = trimmed.match(pattern3);
  if (match3) {
    return { grade: parseInt(match3[1]), section: match3[2] };
  }

  // Pattern 4: Just a number like "10" -> grade: 10, section: A (default)
  const pattern4 = /^(\d{1,2})$/;
  const match4 = trimmed.match(pattern4);
  if (match4) {
    return { grade: parseInt(match4[1]), section: "A" };
  }

  return { grade: null, section: null };
}

/**
 * Generate class code from grade and section
 */
function generateClassCode(grade: number | null, section: string | null) {
  if (grade && section) {
    return `${grade}-${section}`;
  }
  return null;
}

export function useQuickAddClass({ onSuccess }: QuickAddClassModalProps) {
  const { isOpen, open, close } = useExpressAdd();

  const handleSubmit = async (name: string): Promise<ExpressAddResult> => {
    const { grade, section } = parseClassName(name);
    const code = generateClassCode(grade, section);

    if (!grade || !section) {
      return {
        success: false,
        error: "Could not detect grade and section. Use format like '10-A' or 'Grade 10 Section A'"
      };
    }

    try {
      const response = await fetch("/api/school-admin/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Grade ${grade} - Section ${section}`,
          code,
          grade,
          section,
          capacity: 40, // Default capacity
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        return { success: false, error: data.error || "Failed to create class" };
      }

      onSuccess();
      return { success: true };
    } catch (error) {
      return { success: false, error: "Network error. Please try again." };
    }
  };

  const Modal = () => (
    <ExpressAddModal
      isOpen={isOpen}
      onClose={close}
      onSubmit={handleSubmit}
      title="Add Class"
      description="Enter class name like '10-A' or 'Grade 10 Section A'"
      placeholder="e.g., 10-A, 9B, Grade 8 Section C"
      successMessage="Class created successfully!"
      errorMessage="Could not create class"
      icon={Users}
      minLength={2}
      maxLength={30}
    />
  );

  return { isOpen, open, close, Modal };
}
