"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useUnsavedChangesToast } from "@/components/ui/toaster";
import { portal } from "@/styles/design-tokens";

interface SlideInFormProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  onSave?: () => void | Promise<void>;
  portalType?: "student" | "teacher" | "parent" | "counselor" | "admin" | "school-admin" | "ministry";
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
 * Ultra-Modern Slide-In Form with Unsaved Changes Toast
 *
 * Features:
 * - Slides in from right side (modern, space-efficient)
 * - Shows toast with Save button when user types (no auto-save)
 * - Toast has "Save" button - user clicks to save
 * - Discord/Clerk style gradient toasts
 * - Smooth animations with backdrop blur
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
}: SlideInFormProps) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { showUnsaved, hideUnsaved, showSaved } = useUnsavedChangesToast();
  const formContainerRef = useRef<HTMLDivElement>(null);

  // Create stable handleSave function
  const handleSave = useCallback(async () => {
    if (!onSave) return;

    setIsSaving(true);
    try {
      await onSave();
      setHasUnsavedChanges(false);
      showSaved();
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setIsSaving(false);
    }
  }, [onSave, showSaved]);

  // Show unsaved changes toast when form is dirty
  useEffect(() => {
    if (hasUnsavedChanges && isOpen) {
      showUnsaved(handleSave);
    } else if (!hasUnsavedChanges) {
      hideUnsaved();
    }

    return () => {
      if (hasUnsavedChanges) {
        hideUnsaved();
      }
    };
  // Note: showUnsaved and hideUnsaved intentionally excluded from deps
  // They are stable references from useUnsavedChangesToast hook
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasUnsavedChanges, isOpen, handleSave]);

  // Handle close with unsaved changes warning
  const handleClose = () => {
    if (hasUnsavedChanges) {
      const shouldClose = confirm("You have unsaved changes. Are you sure you want to close?");
      if (!shouldClose) return;
    }
    setHasUnsavedChanges(false);
    hideUnsaved();
    onClose();
  };

  // Handle keyboard escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, hasUnsavedChanges]);

  // Track form changes
  const handleFormChange = useCallback(() => {
    if (!hasUnsavedChanges) {
      setHasUnsavedChanges(true);
    }
  }, [hasUnsavedChanges]);

  // Reset when form opens/closes
  useEffect(() => {
    if (!isOpen) {
      setHasUnsavedChanges(false);
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
            className="fixed inset-0 bg-ceramic-black/40 z-50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Slide-in Panel - Ceramic styled */}
          <motion.div
            ref={formContainerRef}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              mass: 0.8,
            }}
            className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-ceramic-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header with gradient accent */}
            <div className="flex-shrink-0">
              <div
                className="h-1.5 w-full"
                style={{ background: portalGradients[portalType] }}
              />
              <div className="flex items-center justify-between px-6 py-5 border-b border-ceramic-border">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-ceramic-primary">{title}</h2>
                  {description && (
                    <p className="text-sm text-ceramic-secondary mt-1">{description}</p>
                  )}
                </div>
                <button
                  onClick={handleClose}
                  className="ml-4 p-2 hover:bg-ceramic-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ceramic-gray-200"
                  aria-label="Close form"
                >
                  <X className="w-5 h-5 text-ceramic-secondary" />
                </button>
              </div>
            </div>

            {/* Saving indicator - ceramic styled */}
            {isSaving && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="px-6 py-2 bg-ceramic-info/10 border-b border-ceramic-info/20 flex items-center gap-2"
              >
                <div className="w-2 h-2 bg-ceramic-info rounded-full animate-pulse" />
                <span className="text-xs text-ceramic-info font-medium">Saving...</span>
              </motion.div>
            )}

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div onChange={handleFormChange}>
                {children}
              </div>
            </div>

            {/* Footer - Status bar - ceramic styled */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-ceramic-border bg-ceramic-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      hasUnsavedChanges ? "bg-ceramic-warning" : "bg-ceramic-positive"
                    )}
                  />
                  <span className="text-xs text-ceramic-secondary">
                    {hasUnsavedChanges ? "Unsaved changes" : "All changes saved"}
                  </span>
                </div>
                {hasUnsavedChanges && !isSaving && (
                  <span className="text-xs text-ceramic-dimmed">
                    Click "Save" in the toast notification
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Quick action button that opens slide-in form
 * Use this in place of "Add" buttons
 * Now with ceramic design system styling
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
