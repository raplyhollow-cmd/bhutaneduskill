/**
 * UNIVERSAL SLIDE-OVER PANEL
 *
 * A reusable slide-in panel for viewing/editing records
 * - Slides from right on desktop
 * - Full screen on mobile
 * - Tab-based content organization
 * - Integrated actions
 */

"use client";

import { useEffect, useRef } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SlideOverPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  tabs?: Array<{ id: string; label: string; icon?: React.ReactNode }>;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  isLoading?: boolean;
  actions?: React.ReactNode;
  width?: "sm" | "md" | "lg" | "xl";
}

export function SlideOverPanel({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  tabs,
  activeTab,
  onTabChange,
  isLoading,
  actions,
  width = "lg",
}: SlideOverPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const widthClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex">
        <div
          ref={panelRef}
          className={cn(
            "w-full h-full bg-white shadow-2xl flex flex-col",
            "transform transition-transform duration-300 ease-out",
            widthClasses[width]
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-900 truncate">{title}</h2>
                {isLoading && <Loader2 className="w-5 h-5 animate-spin text-violet-600" />}
              </div>
              {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-2">
              {actions}
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          {tabs && tabs.length > 0 && (
            <div className="flex items-center gap-1 px-6 py-2 border-b border-gray-200 bg-white overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange?.(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                    activeTab === tab.id
                      ? "bg-violet-100 text-violet-700"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>

          {/* Footer (optional - can be passed via children) */}
        </div>
      </div>
    </>
  );
}

/**
 * Slide-over section component for organizing content
 */
export function SlideOverSection({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="p-6 border-b border-gray-100 last:border-0">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

/**
 * Slide-over field row for consistent form layouts
 */
export function SlideOverField({
  label,
  value,
  onEdit,
  isEditing,
  editComponent,
}: {
  label: string;
  value: React.ReactNode;
  onEdit?: () => void;
  isEditing?: boolean;
  editComponent?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      {isEditing ? (
        editComponent
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-900">{value}</span>
          {onEdit && (
            <button
              onClick={onEdit}
              className="text-xs text-violet-600 hover:text-violet-700"
            >
              Edit
            </button>
          )}
        </div>
      )}
    </div>
  );
}
