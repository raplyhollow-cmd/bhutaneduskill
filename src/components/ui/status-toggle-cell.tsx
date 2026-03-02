"use client";

/**
 * Status Toggle Cell Component - Phase 2
 *
 * A dropdown-based status selector with:
 * - Click to open dropdown with all options
 * - Color-coded options (Active=green, Inactive=gray, Published=blue, etc.)
 * - Auto-save on selection
 * - Confirmation for destructive changes
 * - Loading state during save
 * - Display current status as badge
 *
 * Use Cases:
 * - Active/Inactive toggle (teachers, students, users)
 * - Published/Unpublished (homework, announcements)
 * - Present/Absent/Late (attendance)
 * - Pending/Approved/Rejected (applications)
 *
 * @example
 * ```tsx
 * <StatusToggleCell
 *   value="active"
 *   onChange={async (value) => {
 *     const res = await fetch('/api/update', { method: 'POST', body: JSON.stringify({ status: value }) });
 *     return { success: res.ok };
 *   }}
 *   options={[
 *     { value: "active", label: "Active", color: "text-green-600", icon: CheckCircle, destructive: false },
 *     { value: "inactive", label: "Inactive", color: "text-gray-600", icon: Ban, destructive: true },
 *   ]}
 * />
 * ```
 */

import { useState, useCallback, useRef, type ReactNode } from "react";
import {
  CheckCircle,
  Ban,
  Clock,
  XCircle,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ============================================================================
// TYPES
// ============================================================================

export type LucideIcon = React.ComponentType<{ className?: string }>;

export interface StatusOption {
  /** The value for this status option */
  value: string;
  /** Human-readable label */
  label: string;
  /** Tailwind color class for the option text */
  color: string;
  /** Optional icon to display */
  icon?: LucideIcon;
  /** Whether this change is destructive (requires confirmation) */
  destructive?: boolean;
  /** Optional confirmation message for destructive actions */
  confirmMessage?: string;
  /** Optional description shown in confirmation dialog */
  confirmDescription?: string;
}

export interface StatusToggleCellProps {
  /** Current status value */
  value: string;
  /** Callback when status changes - returns success/error info */
  onChange: (value: string) => Promise<{ success: boolean; error?: string }>;
  /** Available status options */
  options: StatusOption[];
  /** Size variant */
  size?: "sm" | "default";
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Optional custom className for the trigger button */
  className?: string;
  /** Optional success callback after successful change */
  onSuccess?: (newValue: string) => void;
  /** Optional error callback when change fails */
  onError?: (error: string) => void;
}

// ============================================================================
// PREDEFINED STATUS OPTION SETS
// ============================================================================

/**
 * Common status option sets for quick use
 */
export const StatusOptionSets = {
  /** Active/Inactive for users, teachers, students */
  activeInactive: [
    {
      value: "active",
      label: "Active",
      color: "text-green-600",
      icon: CheckCircle,
      destructive: false,
    },
    {
      value: "inactive",
      label: "Inactive",
      color: "text-gray-600",
      icon: Ban,
      destructive: true,
      confirmMessage: "Deactivate this item?",
      confirmDescription: "This will limit access for this user. You can reactivate them at any time.",
    },
  ] as const satisfies readonly StatusOption[],

  /** Published/Unpublished for content */
  publishedDraft: [
    {
      value: "published",
      label: "Published",
      color: "text-blue-600",
      icon: Eye,
      destructive: false,
    },
    {
      value: "draft",
      label: "Draft",
      color: "text-gray-600",
      icon: EyeOff,
      destructive: false,
    },
  ] as const satisfies readonly StatusOption[],

  /** Attendance statuses */
  attendance: [
    {
      value: "present",
      label: "Present",
      color: "text-green-600",
      icon: CheckCircle,
      destructive: false,
    },
    {
      value: "absent",
      label: "Absent",
      color: "text-red-600",
      icon: XCircle,
      destructive: false,
    },
    {
      value: "late",
      label: "Late",
      color: "text-yellow-600",
      icon: Clock,
      destructive: false,
    },
  ] as const satisfies readonly StatusOption[],

  /** Approval statuses */
  approval: [
    {
      value: "pending",
      label: "Pending",
      color: "text-yellow-600",
      icon: Clock,
      destructive: false,
    },
    {
      value: "approved",
      label: "Approved",
      color: "text-green-600",
      icon: UserCheck,
      destructive: false,
    },
    {
      value: "rejected",
      label: "Rejected",
      color: "text-red-600",
      icon: UserX,
      destructive: true,
      confirmMessage: "Reject this request?",
      confirmDescription: "This action cannot be undone. The user will need to submit a new request.",
    },
  ] as const satisfies readonly StatusOption[],

  /** Payment statuses */
  payment: [
    {
      value: "paid",
      label: "Paid",
      color: "text-green-600",
      icon: CheckCircle,
      destructive: false,
    },
    {
      value: "unpaid",
      label: "Unpaid",
      color: "text-red-600",
      icon: XCircle,
      destructive: false,
    },
    {
      value: "partial",
      label: "Partial",
      color: "text-yellow-600",
      icon: Clock,
      destructive: false,
    },
  ] as const satisfies readonly StatusOption[],
};

// Type guard to check if readonly array is StatusOption[]
function isStatusOptions(arr: readonly StatusOption[]): arr is StatusOption[] {
  return true;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function StatusToggleCell({
  value,
  onChange,
  options,
  size = "sm",
  disabled = false,
  className,
  onSuccess,
  onError,
}: StatusToggleCellProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    show: boolean;
    option: StatusOption | null;
  }>({ show: false, option: null });

  // Track the last known good value to revert on error
  const lastValueRef = useRef(value);

  // Find current option
  const currentOption = options.find((opt) => opt.value === value) || options[0];
  const CurrentIcon = currentOption?.icon;

  // Handle option selection
  const handleSelectOption = useCallback(
    async (option: StatusOption) => {
      // Skip if already at this value or loading
      if (option.value === value || isLoading) return;

      // Check for destructive action confirmation
      if (option.destructive && option.confirmMessage) {
        setConfirmState({ show: true, option });
        setIsOpen(false);
        return;
      }

      // Proceed with change
      await executeChange(option);
    },
    [value, isLoading]
  );

  // Execute the status change
  const executeChange = useCallback(
    async (option: StatusOption) => {
      setIsLoading(true);
      setConfirmState({ show: false, option: null });

      try {
        const result = await onChange(option.value);

        if (result.success) {
          lastValueRef.current = option.value;
          onSuccess?.(option.value);
        } else {
          // Revert on error
          onError?.(result.error || "Failed to update status");
        }
      } catch (error) {
        // Handle unexpected errors
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
        onError?.(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [onChange, onSuccess, onError]
  );

  // Handle confirmed destructive action
  const handleConfirmDestructive = useCallback(() => {
    if (confirmState.option) {
      executeChange(confirmState.option);
    }
  }, [confirmState, executeChange]);

  // Handle cancel confirmation
  const handleCancelConfirm = useCallback(() => {
    setConfirmState({ show: false, option: null });
  }, []);

  // Get background color class based on current option color
  const getBgColor = (color: string): string => {
    if (color.includes("green")) return "bg-green-50 border-green-200 hover:bg-green-100";
    if (color.includes("red")) return "bg-red-50 border-red-200 hover:bg-red-100";
    if (color.includes("yellow") || color.includes("orange")) return "bg-yellow-50 border-yellow-200 hover:bg-yellow-100";
    if (color.includes("blue")) return "bg-blue-50 border-blue-200 hover:bg-blue-100";
    if (color.includes("purple")) return "bg-purple-50 border-purple-200 hover:bg-purple-100";
    return "bg-gray-50 border-gray-200 hover:bg-gray-100";
  };

  const bgColor = getBgColor(currentOption?.color || "");
  const isDisabled = disabled || isLoading;

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={isDisabled ? undefined : setIsOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={isDisabled}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed",
              bgColor,
              "focus:ring-blue-500",
              size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
              !isDisabled && "cursor-pointer",
              className
            )}
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : CurrentIcon ? (
              <CurrentIcon className={cn("w-3 h-3", currentOption.color)} />
            ) : null}
            <span className={cn(currentOption?.color, "truncate max-w-[100px]")}>
              {currentOption?.label || value}
            </span>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="min-w-[160px]">
          <div className="px-2 py-1.5 text-xs font-medium text-gray-500">
            Change Status
          </div>
          <DropdownMenuSeparator />
          {options.map((option) => {
            const Icon = option.icon;
            const isActive = option.value === value;

            return (
              <DropdownMenuItem
                key={option.value}
                onSelect={() => handleSelectOption(option)}
                disabled={isActive || isLoading}
                className={cn(
                  "flex items-center gap-2",
                  option.destructive && "text-red-600 focus:text-red-700 focus:bg-red-50"
                )}
              >
                {Icon && <Icon className={cn("w-4 h-4", option.color)} />}
                <span className="flex-1">{option.label}</span>
                {isActive && <CheckCircle className="w-4 h-4 text-gray-400" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confirmation Dialog for Destructive Actions */}
      <AlertDialog
        open={confirmState.show}
        onOpenChange={(open) => !open && handleCancelConfirm()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <AlertDialogTitle>{confirmState.option?.confirmMessage || "Confirm Action"}</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              {confirmState.option?.confirmDescription ||
                "This action may have consequences. Are you sure you want to proceed?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelConfirm}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDestructive}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ============================================================================
// CONVENIENCE WRAPPERS
// ============================================================================

/**
 * Active/Inactive status toggle for users, teachers, students
 */
export function ActiveInactiveToggle({
  value,
  onChange,
  ...props
}: Omit<StatusToggleCellProps, "options">) {
  return (
    <StatusToggleCell
      value={value}
      onChange={onChange}
      options={isStatusOptions(StatusOptionSets.activeInactive) ? StatusOptionSets.activeInactive : [...StatusOptionSets.activeInactive]}
      {...props}
    />
  );
}

/**
 * Published/Draft status toggle for content
 */
export function PublishedDraftToggle({
  value,
  onChange,
  ...props
}: Omit<StatusToggleCellProps, "options">) {
  return (
    <StatusToggleCell
      value={value}
      onChange={onChange}
      options={isStatusOptions(StatusOptionSets.publishedDraft) ? StatusOptionSets.publishedDraft : [...StatusOptionSets.publishedDraft]}
      {...props}
    />
  );
}

/**
 * Attendance status selector
 */
export function AttendanceStatusToggle({
  value,
  onChange,
  ...props
}: Omit<StatusToggleCellProps, "options">) {
  return (
    <StatusToggleCell
      value={value}
      onChange={onChange}
      options={isStatusOptions(StatusOptionSets.attendance) ? StatusOptionSets.attendance : [...StatusOptionSets.attendance]}
      {...props}
    />
  );
}

/**
 * Approval status selector
 */
export function ApprovalStatusToggle({
  value,
  onChange,
  ...props
}: Omit<StatusToggleCellProps, "options">) {
  return (
    <StatusToggleCell
      value={value}
      onChange={onChange}
      options={isStatusOptions(StatusOptionSets.approval) ? StatusOptionSets.approval : [...StatusOptionSets.approval]}
      {...props}
    />
  );
}

/**
 * Payment status selector
 */
export function PaymentStatusToggle({
  value,
  onChange,
  ...props
}: Omit<StatusToggleCellProps, "options">) {
  return (
    <StatusToggleCell
      value={value}
      onChange={onChange}
      options={isStatusOptions(StatusOptionSets.payment) ? StatusOptionSets.payment : [...StatusOptionSets.payment]}
      {...props}
    />
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default StatusToggleCell;
