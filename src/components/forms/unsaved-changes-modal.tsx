"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UnsavedChangesModalProps {
  isOpen: boolean;
  isSaving?: boolean;
  onReset: () => void;
  onSave: () => void;
  className?: string;
}

/**
 * UnsavedChangesModal
 *
 * A Clerk-style modal that appears at the bottom-center of the screen
 * when form changes are detected. Features:
 *
 * - Immediate appearance when form becomes dirty
 * - Bottom-center positioning (not full screen)
 * - 3D-style buttons with gradients and shadows
 * - Reset (red) and Save (brand color) actions
 * - Optional backdrop blur effect
 */
export function UnsavedChangesModal({
  isOpen,
  isSaving = false,
  onReset,
  onSave,
  className,
}: UnsavedChangesModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed bottom-8 left-1/2 z-50 -translate-x-1/2",
        "pointer-events-none", // Allows clicks to pass through the container
        className
      )}
    >
      {/* Backdrop blur effect (optional - adds polish) */}
      <div
        className="absolute inset-0 h-56 w-[800px] -translate-x-1/2 translate-y-24 rotate-180"
        aria-hidden="true"
        style={{
          maskImage: "radial-gradient(closest-side, black, transparent)",
          maskPosition: "bottom, center",
          maskRepeat: "no-repeat",
          WebkitMaskImage: "radial-gradient(closest-side, black, transparent)",
          WebkitMaskPosition: "bottom, center",
          WebkitMaskRepeat: "no-repeat",
        }}
      >
        {/* Multiple blur layers for smooth effect */}
        <div
          className="absolute inset-0 rotate-180"
          style={{
            backdropFilter: "blur(0.5px)",
            maskImage: "radial-gradient(closest-side, black, transparent)",
            maskPosition: "bottom, center",
            maskRepeat: "no-repeat",
            WebkitMaskImage: "radial-gradient(closest-side, black, transparent)",
            WebkitMaskPosition: "bottom, center",
            WebkitMaskRepeat: "no-repeat",
          }}
        />
        <div
          className="absolute inset-0 rotate-180"
          style={{
            backdropFilter: "blur(1px)",
            maskImage: "radial-gradient(closest-side, black, transparent)",
            maskPosition: "bottom, center",
            maskRepeat: "no-repeat",
            WebkitMaskImage: "radial-gradient(closest-side, black, transparent)",
            WebkitMaskPosition: "bottom, center",
            WebkitMaskRepeat: "no-repeat",
          }}
        />
        <div
          className="absolute inset-0 rotate-180"
          style={{
            backdropFilter: "blur(2px)",
            maskImage: "radial-gradient(closest-side, black, transparent)",
            maskPosition: "bottom, center",
            maskRepeat: "no-repeat",
            WebkitMaskImage: "radial-gradient(closest-side, black, transparent)",
            WebkitMaskPosition: "bottom, center",
            WebkitMaskRepeat: "no-repeat",
          }}
        />
        <div
          className="absolute inset-0 rotate-180"
          style={{
            backdropFilter: "blur(4px)",
            maskImage: "radial-gradient(closest-side, black, transparent)",
            maskPosition: "bottom, center",
            maskRepeat: "no-repeat",
            WebkitMaskImage: "radial-gradient(closest-side, black, transparent)",
            WebkitMaskPosition: "bottom, center",
            WebkitMaskRepeat: "no-repeat",
          }}
        />
        <div
          className="absolute inset-0 rotate-180"
          style={{
            backdropFilter: "blur(8px)",
            maskImage: "radial-gradient(closest-side, black, transparent)",
            maskPosition: "bottom, center",
            maskRepeat: "no-repeat",
            WebkitMaskImage: "radial-gradient(closest-side, black, transparent)",
            WebkitMaskPosition: "bottom, center",
            WebkitMaskRepeat: "no-repeat",
          }}
        />
      </div>

      {/* Modal content */}
      <div
        className={cn(
          "pointer-events-auto", // Re-enable clicks for the modal
          "mx-auto flex min-h-10 w-fit min-w-[21.25rem] items-center gap-2 rounded-lg p-2 pl-3 text-white shadow-lg transition-all duration-300",
          "bg-gray-800"
        )}
        style={{
          background: "linear-gradient(to bottom, rgba(55, 65, 81, 0.95), rgba(31, 41, 55, 0.98))",
          boxShadow: `
            inset 0 0 0 1px rgba(255, 255, 255, 0.1),
            inset 0 2px 0 rgba(255, 255, 255, 0.12),
            inset 0 0 2px 2px rgba(255, 255, 255, 0.06),
            0 16px 36px -6px rgba(0, 0, 0, 0.36),
            0 6px 16px -2px rgba(0, 0, 0, 0.2)
          `.trim().replace(/\s+/g, " "),
        }}
      >
        {/* Warning Icon */}
        <div className="flex shrink-0 items-center justify-center">
          <svg
            className="w-4 h-4"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="10"
              cy="10"
              r="8"
              fill="rgba(255, 255, 255, 0.15)"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M10 11V13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M10 7.01V7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Message */}
        <div className="flex-1 pr-2 text-sm">
          Unsaved changes
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Reset Button */}
          <button
            onClick={onReset}
            disabled={isSaving}
            className={cn(
              "inline-flex min-w-fit shrink-0 select-none transition rounded-[0.375rem] text-sm font-medium",
              "px-3 py-1.5",
              "bg-red-700 hover:bg-red-600 text-white",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.12),0_2px_2px_-1px_rgba(0,0,0,0.16),0_4px_4px_-3px_rgba(0,0,0,0.24),0_0_0_1px_rgb(185,28,28)]"
            )}
            style={{
              background: isSaving
                ? "rgb(185, 28, 28)"
                : "linear-gradient(to bottom, rgb(185, 28, 28), rgb(153, 27, 27))",
            }}
            type="button"
          >
            Reset
          </button>

          {/* Save Button */}
          <button
            onClick={onSave}
            disabled={isSaving}
            className={cn(
              "inline-flex min-w-fit shrink-0 select-none transition rounded-[0.375rem] text-sm font-medium",
              "px-3 py-1.5 flex items-center gap-1.5",
              "bg-orange-600 hover:bg-orange-500 text-white",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.12),0_2px_2px_-1px_rgba(0,0,0,0.16),0_4px_4px_-2px_rgba(0,0,0,0.24),0_0_0_1px_rgb(194,65,12)]"
            )}
            style={{
              background: isSaving
                ? "rgb(194, 65, 12)"
                : "linear-gradient(to bottom, rgb(234, 88, 12), rgb(194, 65, 12))",
            }}
            type="submit"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
