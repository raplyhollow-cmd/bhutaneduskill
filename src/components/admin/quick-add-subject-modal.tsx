/**
 * QUICK ADD SUBJECT MODAL
 *
 * A streamlined version of AddSubjectModal using ExpressAddModal.
 * Quickly add a subject with just the name - code and other fields are auto-generated.
 *
 * DESIGN:
 * - Single field: Subject name
 * - Auto-generates: Code (first 3-4 letters), default type (core), empty description
 * - User can edit details later via the edit modal
 */

"use client";

import { ExpressAddModal, useExpressAdd, type ExpressAddResult } from "@/components/ui/express-add-modal";
import { BookOpen } from "lucide-react";

interface QuickAddSubjectModalProps {
  onSuccess: () => void;
}

export function useQuickAddSubject({ onSuccess }: QuickAddSubjectModalProps) {
  const { isOpen, open, close } = useExpressAdd();

  const handleSubmit = async (name: string): Promise<ExpressAddResult> => {
    // Auto-generate code from name
    const generateCode = (value: string) => {
      if (!value) return "";
      const words = value.toUpperCase().split(" ");
      if (words.length >= 3) {
        return words.slice(0, 3).map(w => w[0]).join("");
      } else if (words.length === 2) {
        return words.map(w => w.substring(0, 2)).join("");
      } else {
        return value.substring(0, 4).toUpperCase();
      }
    };

    const code = generateCode(name);

    try {
      const response = await fetch("/api/admin/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          code,
          type: "core",
          description: `Auto-generated subject for ${name}`,
          grade: null,
          applicableGrades: undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        return { success: false, error: data.error || "Failed to create subject" };
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
      title="Add Subject"
      description="Enter subject name to create"
      placeholder="e.g., Mathematics"
      successMessage="Subject created successfully!"
      errorMessage="Failed to create subject"
      icon={BookOpen}
      minLength={2}
      maxLength={50}
    />
  );

  return { isOpen, open, close, Modal };
}
