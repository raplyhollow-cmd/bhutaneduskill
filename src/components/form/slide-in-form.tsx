"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { portal } from "@/styles/design-tokens";
import { Button } from "@/components/ui/button";

interface SlideInFormProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  onSave?: () => void | Promise<void>;
  portalType?: "student" | "teacher" | "parent" | "counselor" | "admin" | "school-admin" | "ministry";
  saveLabel?: string;
}

const portalGradients = {
  student: portal.student.gradient,
  teacher: portal.teacher.gradient,
  parent: portal.parent.gradient,
  counselor: portal.counselor.gradient,
  admin: portal.admin.gradient,
  "school-admin": portal.schoolAdmin.gradient,
  ministry: portal.ministry.gradient,
};

const portalSolidColors = {
  student: portal.student.primary,
  teacher: portal.teacher.primary,
  parent: portal.parent.primary,
  counselor: portal.counselor.primary,
  admin: portal.admin.primary,
  "school-admin": portal.schoolAdmin.primary,
  ministry: portal.ministry.primary,
};

/**
 * Simplified Slide-In Form
 *
 * Features:
 * - Slides in from right side
 * - Clean, simple interface
 * - No complex unsaved changes tracking (handled by parent)
 * - Portal-specific gradient accents
 *
 * Usage:
 * <SlideInForm
 *   isOpen={showForm}
 *   onClose={() => setShowForm(false)}
 *   title="Add School"
 *   onSave={handleSave}
 *   portalType="admin"
 * >
 *   <YourFormFields />
 * </SlideInForm>
 */
export function SlideInForm({
  isOpen,
  onClose,
  title,
  description,
  children,
  onSave,
  portalType = "admin",
  saveLabel = "Save",
}: SlideInFormProps) {
  const [isSaving, setIsSaving] = useState(false);

  // Stable handleSave that wraps onSave
  const handleSaveClick = useCallback(async () => {
    if (!onSave || isSaving) return;

    setIsSaving(true);
    try {
      await onSave();
    } finally {
      setIsSaving(false);
    }
  }, [onSave, isSaving]);

  // Handle close
  const handleClose = useCallback(() => {
    if (isSaving) return; // Don't close while saving
    onClose();
  }, [onClose, isSaving]);

  // Handle keyboard escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSaving) {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, isSaving, handleClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  // Reset saving state when form closes
  useEffect(() => {
    if (!isOpen) {
      setIsSaving(false);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Slide-in Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              mass: 0.8,
            }}
            className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header with gradient accent */}
            <div className="flex-shrink-0">
              <div
                className="h-1.5 w-full"
                style={{ background: portalGradients[portalType] }}
              />
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
                  {description && (
                    <p className="text-sm text-gray-500 mt-1">{description}</p>
                  )}
                </div>
                <button
                  onClick={handleClose}
                  disabled={isSaving}
                  className="ml-4 p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:opacity-50"
                  aria-label="Close form"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Saving indicator */}
            {isSaving && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="px-6 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-2"
              >
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-xs text-blue-700 font-medium">Saving...</span>
              </motion.div>
            )}

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {children}
            </div>

            {/* Footer Actions */}
            {onSave && (
              <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClose}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant={portalType}
                  onClick={handleSaveClick}
                  disabled={isSaving}
                  loading={isSaving}
                >
                  {isSaving ? "Saving..." : saveLabel}
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Quick action button that opens slide-in form
 */
export function SlideInFormButton({
  onClick,
  children,
  portalType = "admin",
  icon,
}: {
  onClick: () => void;
  children: React.ReactNode;
  portalType?: SlideInFormProps["portalType"];
  icon?: React.ReactNode;
}) {
  const solidColor = portalSolidColors[portalType] || portalSolidColors.admin;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="inline-flex items-center gap-2 px-4 py-2 text-white font-medium rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50 transition-all"
      style={{
        background: portalGradients[portalType],
        boxShadow: `0 4px 14px 0 ${solidColor}33`,
      }}
    >
      {icon}
      {children}
    </motion.button>
  );
}
