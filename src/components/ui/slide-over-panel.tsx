/**
 * SlideOverPanel Component
 *
 * A Notion-style slide-over panel for viewing/editing details without navigation.
 * Features include:
 *
 * - Slides from right with smooth animation
 * - Backdrop blur effect
 * - Close on backdrop click
 * - Close on Escape key
 * - Breadcrumb navigation
 * - Preserves page context
 * - Size variants (sm, md, lg, xl)
 * - Custom header actions
 *
 * @example
 * ```tsx
 * import { SlideOverPanel } from "@/components/ui/slide-over-panel"
 * import { User, Mail, Phone } from "lucide-react"
 *
 * function StudentDetails({ student, open, onClose }) {
 *   return (
 *     <SlideOverPanel
 *       open={open}
 *       onClose={onClose}
 *       title="Student Details"
 *       size="lg"
 *       breadcrumbs={[
 *         { label: "Students", href: "/school-admin/students" },
 *         { label: student.name, href: "#" }
 *       ]}
 *     >
 *       <div className="space-y-6">
 *         <div className="flex items-center gap-3">
 *           <User className="w-5 h-5 text-gray-400" />
 *           <div>
 *             <p className="font-medium">{student.name}</p>
 *             <p className="text-sm text-gray-500">{student.email}</p>
 *           </div>
 *         </div>
 *       </div>
 *     </SlideOverPanel>
 *   )
 * }
 * ```
 */

"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// ============================================================================
// TYPES
// ============================================================================

export type SlideOverSize = "sm" | "md" | "lg" | "xl" | "full"

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface SlideOverPanelProps {
  /** Whether the panel is open */
  open: boolean
  /** Callback when panel closes */
  onClose: () => void
  /** Panel title */
  title?: string
  /** Panel subtitle */
  subtitle?: string
  /** Size variant */
  size?: SlideOverSize
  /** Breadcrumb items */
  breadcrumbs?: BreadcrumbItem[]
  /** Header actions (buttons shown next to close) */
  headerActions?: React.ReactNode
  /** Footer content */
  footer?: React.ReactNode
  /** Custom className for panel */
  className?: string
  /** Children content */
  children: React.ReactNode
  /** Whether to show backdrop (default: true) */
  showBackdrop?: boolean
  /** Whether to close on backdrop click (default: true) */
  closeOnBackdropClick?: boolean
  /** Whether to close on Escape key (default: true) */
  closeOnEscape?: boolean
}

// ============================================================================
// SIZE CONFIGURATION
// ============================================================================

const sizeClasses: Record<SlideOverSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-full ml-0",
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SlideOverPanel({
  open,
  onClose,
  title,
  subtitle,
  size = "lg",
  breadcrumbs = [],
  headerActions,
  footer,
  className,
  children,
  showBackdrop = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
}: SlideOverPanelProps) {
  const panelRef = React.useRef<HTMLDivElement>(null)

  // Handle Escape key
  React.useEffect(() => {
    if (!closeOnEscape || !open) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [open, closeOnEscape, onClose])

  // Focus trap
  React.useEffect(() => {
    if (!open) return

    const focusableElements =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    const panel = panelRef.current

    if (!panel) return

    const firstElement = panel.querySelector(focusableElements) as HTMLElement
    const lastElement = panel.querySelectorAll<HTMLElement>(focusableElements)?.[
      panel.querySelectorAll(focusableElements).length - 1
    ]

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    firstElement?.focus()
    document.addEventListener("keydown", handleTab)

    return () => document.removeEventListener("keydown", handleTab)
  }, [open])

  // Prevent body scroll when open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  const handleBackdropClick = () => {
    if (closeOnBackdropClick) {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          {showBackdrop && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
              onClick={handleBackdropClick}
            />
          )}

          {/* Panel */}
          <div className="fixed inset-y-0 right-0 z-50 flex">
            <motion.div
              ref={panelRef}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 200,
              }}
              className={cn(
                "h-full w-full bg-white dark:bg-gray-800 shadow-2xl",
                "flex flex-col",
                size !== "full" && sizeClasses[size],
                className
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              {(title || breadcrumbs.length > 0) && (
                <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
                  {/* Breadcrumbs */}
                  {breadcrumbs.length > 0 && (
                    <div className="flex items-center gap-2 px-6 pt-4 pb-2">
                      {breadcrumbs.map((crumb, index) => (
                        <React.Fragment key={index}>
                          {index > 0 && (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          )}
                          {crumb.href ? (
                            <a
                              href={crumb.href}
                              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                            >
                              {crumb.label}
                            </a>
                          ) : (
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {crumb.label}
                            </span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  )}

                  {/* Title Row */}
                  <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex-1">
                      {title && (
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {title}
                        </h2>
                      )}
                      {subtitle && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          {subtitle}
                        </p>
                      )}
                    </div>

                    {/* Header Actions */}
                    <div className="flex items-center gap-2">
                      {headerActions}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="flex-shrink-0 h-8 w-8"
                      >
                        <X className="w-4 h-4" />
                        <span className="sr-only">Close</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6">
                  {children}
                </div>
              </div>

              {/* Footer */}
              {footer && (
                <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

// ============================================================================
// CONVENIENCE COMPONENTS
// ============================================================================

/**
 * SlideOverPanel with default styling for viewing student details
 */
export function StudentDetailsSlideOver({
  open,
  onClose,
  children,
  ...props
}: Omit<SlideOverPanelProps, "size" | "title">) {
  return (
    <SlideOverPanel
      open={open}
      onClose={onClose}
      size="lg"
      title="Student Details"
      {...props}
    >
      {children}
    </SlideOverPanel>
  )
}

/**
 * SlideOverPanel with default styling for viewing teacher profile
 */
export function TeacherProfileSlideOver({
  open,
  onClose,
  children,
  ...props
}: Omit<SlideOverPanelProps, "size" | "title">) {
  return (
    <SlideOverPanel
      open={open}
      onClose={onClose}
      size="lg"
      title="Teacher Profile"
      {...props}
    >
      {children}
    </SlideOverPanel>
  )
}

/**
 * SlideOverPanel with default styling for viewing class details
 */
export function ClassDetailsSlideOver({
  open,
  onClose,
  children,
  ...props
}: Omit<SlideOverPanelProps, "size" | "title">) {
  return (
    <SlideOverPanel
      open={open}
      onClose={onClose}
      size="xl"
      title="Class Details"
      {...props}
    >
      {children}
    </SlideOverPanel>
  )
}

/**
 * SlideOverPanel with default styling for viewing homework submissions
 */
export function HomeworkSubmissionsSlideOver({
  open,
  onClose,
  children,
  ...props
}: Omit<SlideOverPanelProps, "size" | "title">) {
  return (
    <SlideOverPanel
      open={open}
      onClose={onClose}
      size="xl"
      title="Homework Submissions"
      {...props}
    >
      {children}
    </SlideOverPanel>
  )
}

// ============================================================================
// EXPORTS
// ============================================================================

export default SlideOverPanel
