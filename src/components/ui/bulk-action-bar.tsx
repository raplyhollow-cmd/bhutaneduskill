/**
 * BulkActionBar Component
 *
 * A comprehensive bulk action bar component for managing selections and performing
 * bulk operations on multiple items. Features include:
 *
 * - Selection count display with visual indicator
 * - Grouped action buttons (primary and secondary actions)
 * - Preview/confirmation modal before applying bulk changes
 * - Progress indicator during execution
 * - Success/failure summary with counts and error details
 * - Clear selection button
 * - Disabled when no items selected
 * - Smooth animations with Framer Motion
 * - Portal-specific variant styling
 *
 * @example
 * ```tsx
 * import { BulkActionBar } from "@/components/ui/bulk-action-bar"
 * import { Edit, Trash2, Download, Mail } from "lucide-react"
 *
 * const actions = [
 *   {
 *     id: "edit",
 *     label: "Edit",
 *     icon: Edit,
 *     confirmMessage: (count) => `Edit ${count} students?`,
 *     execute: async (ids) => {
 *       const results = await bulkUpdateStudents(ids, { status: "active" })
 *       return { success: results.success, failed: results.failed }
 *     }
 *   },
 *   {
 *     id: "delete",
 *     label: "Delete",
 *     icon: Trash2,
 *     dangerous: true,
 *     confirmMessage: (count) => `Delete ${count} students? This cannot be undone.`,
 *     execute: async (ids) => {
 *       const results = await bulkDeleteStudents(ids)
 *       return { success: results.success, failed: results.failed }
 *     }
 *   },
 *   {
 *     id: "export",
 *     label: "Export",
 *     icon: Download,
 *     secondary: true,
 *     execute: async (ids) => {
 *       await exportStudents(ids)
 *       return { success: ids.length, failed: 0 }
 *     }
 *   }
 * ]
 *
 * <BulkActionBar
 *   selectedIds={selectedIds}
 *   totalCount={totalStudents}
 *   actions={actions}
 *   onClearSelection={() => setSelectedIds([])}
 *   position="bottom"
 *   variant="school-admin"
 * />
 * ```
 */

"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Check,
  X,
  Loader2,
  AlertCircle,
  ChevronDown,
  MoreVertical,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// =============================================================================
// TYPES
// =============================================================================

/**
 * Result of a bulk action execution
 */
export interface BulkActionResult {
  /** Number of successfully processed items */
  success: number
  /** Number of failed items */
  failed: number
  /** Optional array of error details for failed items */
  errors?: Array<{ id: string; error: string }>
}

/**
 * Configuration for a single bulk action
 */
export interface BulkAction {
  /** Unique identifier for the action */
  id: string
  /** Display label for the action button */
  label: string
  /** Lucide icon component to display */
  icon: LucideIcon
  /** Optional function to generate confirmation message based on count */
  confirmMessage?: (count: number) => string
  /** Async function that executes the bulk action */
  execute: (ids: string[]) => Promise<BulkActionResult>
  /** Whether this action is destructive (shows warning styling) */
  dangerous?: boolean
  /** Optional group name for organizing actions */
  group?: string
  /** Whether to show this action in a dropdown menu (for secondary actions) */
  secondary?: boolean
}

/**
 * Position of the bulk action bar
 */
export type BulkActionBarPosition = "top" | "bottom" | "both"

/**
 * Visual variant for the bulk action bar
 */
export type BulkActionBarVariant =
  | "default"
  | "school-admin"
  | "admin"
  | "teacher"
  | "student"

/**
 * Props for the BulkActionBar component
 */
export interface BulkActionBarProps {
  /** Array of selected item IDs */
  selectedIds: string[]
  /** Total count of items (for "select all" functionality) */
  totalCount: number
  /** Array of available bulk actions */
  actions: BulkAction[]
  /** Callback when user clears selection */
  onClearSelection: () => void
  /** Position of the bar */
  position?: BulkActionBarPosition
  /** Optional callback when action completes */
  onActionComplete?: (actionId: string, result: BulkActionResult) => void
  /** Optional variant for styling */
  variant?: BulkActionBarVariant
  /** Optional label for items (defaults to "items") */
  itemLabel?: string | ((count: number) => string)
  /** Optional custom className */
  className?: string
}

// =============================================================================
// INTERNAL STATE TYPES
// =============================================================================

type ExecutionState = "idle" | "confirming" | "executing" | "complete" | "error"

interface BulkActionState {
  state: ExecutionState
  currentAction: BulkAction | null
  progress: number
  result: BulkActionResult | null
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function getItemLabel(
  itemLabel: string | ((count: number) => string) | undefined,
  count: number
): string {
  if (typeof itemLabel === "function") {
    return itemLabel(count)
  }
  if (itemLabel) {
    return count === 1 ? itemLabel.slice(0, -1) : itemLabel
  }
  return count === 1 ? "item" : "items"
}

function getVariantStyles(variant: BulkActionBarVariant) {
  const variants = {
    default: {
      bg: "bg-white dark:bg-gray-800",
      border: "border-gray-200 dark:border-gray-700",
      accent: "bg-purple-600",
      accentHover: "hover:bg-purple-700",
      text: "text-gray-700 dark:text-gray-200",
      badgeBg: "bg-purple-100 dark:bg-purple-900/20",
      badgeText: "text-purple-700 dark:text-purple-300",
    },
    "school-admin": {
      bg: "bg-white dark:bg-gray-800",
      border: "border-violet-200 dark:border-violet-700",
      accent: "bg-violet-600",
      accentHover: "hover:bg-violet-700",
      text: "text-violet-700 dark:text-violet-300",
      badgeBg: "bg-violet-100 dark:bg-violet-900/20",
      badgeText: "text-violet-700 dark:text-violet-300",
    },
    admin: {
      bg: "bg-white dark:bg-gray-800",
      border: "border-pink-200 dark:border-pink-700",
      accent: "bg-pink-600",
      accentHover: "hover:bg-pink-700",
      text: "text-pink-700 dark:text-pink-300",
      badgeBg: "bg-pink-100 dark:bg-pink-900/20",
      badgeText: "text-pink-700 dark:text-pink-300",
    },
    teacher: {
      bg: "bg-white dark:bg-gray-800",
      border: "border-blue-200 dark:border-blue-700",
      accent: "bg-blue-600",
      accentHover: "hover:bg-blue-700",
      text: "text-blue-700 dark:text-blue-300",
      badgeBg: "bg-blue-100 dark:bg-blue-900/20",
      badgeText: "text-blue-700 dark:text-blue-300",
    },
    student: {
      bg: "bg-white dark:bg-gray-800",
      border: "border-orange-200 dark:border-orange-700",
      accent: "bg-orange-600",
      accentHover: "hover:bg-orange-700",
      text: "text-orange-700 dark:text-orange-300",
      badgeBg: "bg-orange-100 dark:bg-orange-900/20",
      badgeText: "text-orange-700 dark:text-orange-300",
    },
  }
  return variants[variant] || variants.default
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function BulkActionBar({
  selectedIds,
  totalCount,
  actions,
  onClearSelection,
  position = "bottom",
  onActionComplete,
  variant = "default",
  itemLabel,
  className,
}: BulkActionBarProps) {
  const styles = getVariantStyles(variant)
  const [actionState, setActionState] = React.useState<BulkActionState>({
    state: "idle",
    currentAction: null,
    progress: 0,
    result: null,
  })
  const [showMoreDropdown, setShowMoreDropdown] = React.useState(false)
  const moreDropdownRef = React.useRef<HTMLDivElement>(null)

  const hasSelection = selectedIds.length > 0
  const canSelectAll = selectedIds.length < totalCount

  // Group actions
  const primaryActions = React.useMemo(
    () => actions.filter((a) => !a.secondary),
    [actions]
  )
  const secondaryActions = React.useMemo(
    () => actions.filter((a) => a.secondary),
    [actions]
  )

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        moreDropdownRef.current &&
        !moreDropdownRef.current.contains(event.target as Node)
      ) {
        setShowMoreDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Handle action initiation
  const handleActionClick = (action: BulkAction) => {
    setActionState({
      state: "confirming",
      currentAction: action,
      progress: 0,
      result: null,
    })
  }

  // Confirm and execute action
  const handleConfirm = async () => {
    if (!actionState.currentAction) return

    setActionState((prev) => ({ ...prev, state: "executing" }))

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setActionState((prev) => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90),
        }))
      }, 100)

      const result = await actionState.currentAction.execute(selectedIds)

      clearInterval(progressInterval)

      setActionState({
        state: result.failed === 0 ? "complete" : "error",
        currentAction: actionState.currentAction,
        progress: 100,
        result,
      })

      onActionComplete?.(actionState.currentAction.id, result)

      // Auto-clear on success after delay
      if (result.failed === 0) {
        setTimeout(() => {
          onClearSelection()
          handleClose()
        }, 1500)
      }
    } catch (error) {
      setActionState({
        state: "error",
        currentAction: actionState.currentAction,
        progress: 0,
        result: {
          success: 0,
          failed: selectedIds.length,
          errors: [{ id: "all", error: String(error) }],
        },
      })
    }
  }

  // Close modal and reset state
  const handleClose = () => {
    setActionState({
      state: "idle",
      currentAction: null,
      progress: 0,
      result: null,
    })
  }

  // Render position-specific bars
  const renderBar = (pos: "top" | "bottom") => (
    <motion.div
      initial={{ y: pos === "top" ? -100 : 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: pos === "top" ? -100 : 100, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "fixed left-0 right-0 z-40 shadow-lg",
        pos === "top" ? "top-0 border-b" : "bottom-0 border-t",
        styles.bg,
        styles.border,
        !hasSelection && "hidden",
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Selection Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-lg",
                styles.accent,
                "text-white"
              )}
            >
              <Check className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {selectedIds.length} {getItemLabel(itemLabel, selectedIds.length)} selected
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {canSelectAll && (
                  <button
                    onClick={() => {
                      // Trigger select all via callback if parent implements it
                      // For now, just visual indication
                    }}
                    className={cn(
                      "hover:underline transition-colors",
                      styles.text
                    )}
                  >
                    Select all {totalCount}
                  </button>
                )}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {primaryActions.map((action) => {
              const Icon = action.icon
              return (
                <Button
                  key={action.id}
                  variant={action.dangerous ? "danger" : "secondary"}
                  size="sm"
                  onClick={() => handleActionClick(action)}
                  className="gap-2"
                  disabled={actionState.state === "executing"}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{action.label}</span>
                </Button>
              )
            })}

            {/* More dropdown for secondary actions */}
            {secondaryActions.length > 0 && (
              <div className="relative" ref={moreDropdownRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMoreDropdown(!showMoreDropdown)}
                  className="gap-1"
                  disabled={actionState.state === "executing"}
                >
                  <MoreVertical className="w-4 h-4" />
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 transition-transform",
                      showMoreDropdown && "rotate-180"
                    )}
                  />
                </Button>

                <AnimatePresence>
                  {showMoreDropdown && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className={cn(
                        "absolute right-0 mt-2 w-48 rounded-lg shadow-lg border z-50",
                        styles.bg,
                        styles.border,
                        "py-1"
                      )}
                    >
                      {secondaryActions.map((action) => {
                        const Icon = action.icon
                        return (
                          <button
                            key={action.id}
                            onClick={() => {
                              setShowMoreDropdown(false)
                              handleActionClick(action)
                            }}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors",
                              action.dangerous
                                ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                            )}
                          >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <span>{action.label}</span>
                          </button>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Clear Selection */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="gap-2 text-gray-500 hover:text-gray-700"
              disabled={actionState.state === "executing"}
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )

  return (
    <>
      <AnimatePresence>
        {position === "top" || position === "both" ? renderBar("top") : null}
        {position === "bottom" || position === "both" ? renderBar("bottom") : null}
      </AnimatePresence>

      {/* Confirmation/Progress/Result Modal */}
      <Dialog
        open={
          actionState.state === "confirming" ||
          actionState.state === "executing" ||
          actionState.state === "complete" ||
          actionState.state === "error"
        }
        onOpenChange={(open) => !open && handleClose()}
      >
        <DialogContent className="sm:max-w-md">
          {actionState.state === "confirming" && actionState.currentAction && (
            <>
              <DialogHeader>
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4",
                    actionState.currentAction.dangerous
                      ? "bg-red-100 dark:bg-red-900/20"
                      : styles.badgeBg
                  )}
                >
                  <actionState.currentAction.icon
                    className={cn(
                      "w-6 h-6",
                      actionState.currentAction.dangerous
                        ? "text-red-600 dark:text-red-400"
                        : styles.badgeText
                    )}
                  />
                </div>
                <DialogTitle className="text-center">
                  {actionState.currentAction.dangerous
                    ? "Confirm Destructive Action"
                    : "Confirm Bulk Action"}
                </DialogTitle>
                <DialogDescription className="text-center">
                  {actionState.currentAction.confirmMessage?.(selectedIds.length) ||
                    `Are you sure you want to ${actionState.currentAction.label.toLowerCase()} ${selectedIds.length} ${getItemLabel(itemLabel, selectedIds.length)}?`}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                <Button
                  variant={actionState.currentAction.dangerous ? "danger" : "default"}
                  onClick={handleConfirm}
                >
                  Continue
                </Button>
              </DialogFooter>
            </>
          )}

          {actionState.state === "executing" && actionState.currentAction && (
            <>
              <DialogHeader>
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-6 h-6 text-purple-600 dark:text-purple-400 animate-spin" />
                </div>
                <DialogTitle className="text-center">
                  {actionState.currentAction.label}...
                </DialogTitle>
                <DialogDescription className="text-center">
                  Processing {selectedIds.length} {getItemLabel(itemLabel, selectedIds.length)}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Progress value={actionState.progress} showValue />
                <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                  {actionState.progress}% complete
                </p>
              </div>
            </>
          )}

          {(actionState.state === "complete" || actionState.state === "error") &&
            actionState.result && (
            <>
              <DialogHeader>
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4",
                    actionState.state === "complete"
                      ? "bg-green-100 dark:bg-green-900/20"
                      : "bg-orange-100 dark:bg-orange-900/20"
                  )}
                >
                  {actionState.state === "complete" ? (
                    <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  )}
                </div>
                <DialogTitle className="text-center">
                  {actionState.state === "complete"
                    ? "Action Complete"
                    : "Partial Success"}
                </DialogTitle>
                <DialogDescription className="text-center">
                  {actionState.result.success > 0 && (
                    <span className="text-green-600 dark:text-green-400">
                      {actionState.result.success} {getItemLabel(itemLabel, actionState.result.success)}{" "}
                      {actionState.result.success === 1 ? "was" : "were"} processed
                      successfully
                    </span>
                  )}
                  {actionState.result.failed > 0 && (
                    <span className="text-orange-600 dark:text-orange-400">
                      {" "}
                      • {actionState.result.failed} failed
                    </span>
                  )}
                </DialogDescription>
              </DialogHeader>

              {actionState.result.errors && actionState.result.errors.length > 0 && (
                <div className="max-h-40 overflow-y-auto py-4">
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-3 h-3" />
                      Errors ({actionState.result.errors.length}):
                    </p>
                    <ul className="space-y-1">
                      {actionState.result.errors.slice(0, 5).map((err, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-red-600 dark:text-red-400 flex items-start gap-2"
                        >
                          <span className="break-all">{err.error}</span>
                        </li>
                      ))}
                      {actionState.result.errors.length > 5 && (
                        <li className="text-xs text-gray-500 dark:text-gray-400">
                          ... and {actionState.result.errors.length - 5} more
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button onClick={handleClose}>
                  {actionState.state === "complete" ? "Done" : "Close"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================
