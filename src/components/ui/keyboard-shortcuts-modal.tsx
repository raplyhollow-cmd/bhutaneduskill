/**
 * Keyboard Shortcuts Modal Component
 *
 * FEATURES:
 * - Cmd/Ctrl + / trigger
 * - Searchable shortcuts list
 * - Grouped by category (Navigation, Editing, Actions, etc.)
 * - Key combo display (⌘K, ⌘;, etc.)
 * - Context-aware (show shortcuts for current portal)
 * - Close on Escape or backdrop click
 *
 * DESIGN PHILOSOPHY:
 * - "Learnable power user features"
 * - "Clean, organized shortcuts display"
 * - "Context-aware help"
 */

"use client"

import * as React from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { Search, X, Navigation, Edit2, Trash2, Save, Zap, Keyboard, ArrowRight, Home, Users, FileText, Calendar, BarChart3, Settings, LogOut, Plus, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

// =============================================================================
// TYPES
// =============================================================================

export type PortalContext = 'school-admin' | 'teacher' | 'student' | 'parent' | 'admin' | 'counselor' | 'ministry' | 'global'

export interface Shortcut {
  key: string
  description: string
  icon?: React.ReactNode
  category?: string
}

export interface ShortcutGroup {
  category: string
  shortcuts: Shortcut[]
  icon?: React.ReactNode
}

export interface KeyboardShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
  shortcuts?: ShortcutGroup[]
  context?: PortalContext
}

// =============================================================================
// DEFAULT SHORTCUTS BY PORTAL
// =============================================================================

const globalShortcuts: ShortcutGroup[] = [
  {
    category: "Navigation",
    icon: <Navigation className="w-4 h-4" />,
    shortcuts: [
      { key: "⌘K", description: "Open command palette", icon: <Search className="w-4 h-4" /> },
      { key: "⌘/", description: "Open keyboard shortcuts", icon: <Keyboard className="w-4 h-4" /> },
      { key: "⌘;", description: "Toggle AI assistant", icon: <Sparkles className="w-4 h-4" /> },
      { key: "Esc", description: "Close modal/dropdown", icon: <X className="w-4 h-4" /> },
    ],
  },
  {
    category: "Actions",
    icon: <Zap className="w-4 h-4" />,
    shortcuts: [
      { key: "C", description: "Create new", icon: <Plus className="w-4 h-4" /> },
      { key: "E", description: "Edit selected", icon: <Edit2 className="w-4 h-4" /> },
      { key: "D", description: "Delete selected", icon: <Trash2 className="w-4 h-4" /> },
      { key: "S", description: "Save changes", icon: <Save className="w-4 h-4" /> },
    ],
  },
]

const schoolAdminShortcuts: ShortcutGroup[] = [
  ...globalShortcuts,
  {
    category: "Quick Navigation",
    icon: <ArrowRight className="w-4 h-4" />,
    shortcuts: [
      { key: "G + D", description: "Go to Dashboard", icon: <Home className="w-4 h-4" /> },
      { key: "G + S", description: "Go to Students", icon: <Users className="w-4 h-4" /> },
      { key: "G + T", description: "Go to Teachers", icon: <Users className="w-4 h-4" /> },
      { key: "G + C", description: "Go to Classes", icon: <FileText className="w-4 h-4" /> },
    ],
  },
]

const teacherShortcuts: ShortcutGroup[] = [
  ...globalShortcuts,
  {
    category: "Quick Navigation",
    icon: <ArrowRight className="w-4 h-4" />,
    shortcuts: [
      { key: "G + D", description: "Go to Dashboard", icon: <Home className="w-4 h-4" /> },
      { key: "G + S", description: "Go to Students", icon: <Users className="w-4 h-4" /> },
      { key: "G + H", description: "Go to Homework", icon: <FileText className="w-4 h-4" /> },
      { key: "G + A", description: "Go to Assessments", icon: <BarChart3 className="w-4 h-4" /> },
    ],
  },
]

const studentShortcuts: ShortcutGroup[] = [
  ...globalShortcuts,
  {
    category: "Quick Navigation",
    icon: <ArrowRight className="w-4 h-4" />,
    shortcuts: [
      { key: "G + D", description: "Go to Dashboard", icon: <Home className="w-4 h-4" /> },
      { key: "G + C", description: "Go to Classes", icon: <FileText className="w-4 h-4" /> },
      { key: "G + H", description: "Go to Homework", icon: <FileText className="w-4 h-4" /> },
      { key: "G + P", description: "Go to Progress", icon: <BarChart3 className="w-4 h-4" /> },
    ],
  },
]

const parentShortcuts: ShortcutGroup[] = [
  ...globalShortcuts,
  {
    category: "Quick Navigation",
    icon: <ArrowRight className="w-4 h-4" />,
    shortcuts: [
      { key: "G + D", description: "Go to Dashboard", icon: <Home className="w-4 h-4" /> },
      { key: "G + C", description: "Go to Children", icon: <Users className="w-4 h-4" /> },
      { key: "G + P", description: "Go to Progress", icon: <BarChart3 className="w-4 h-4" /> },
      { key: "G + F", description: "Go to Fees", icon: <FileText className="w-4 h-4" /> },
    ],
  },
]

const adminShortcuts: ShortcutGroup[] = [
  ...globalShortcuts,
  {
    category: "Quick Navigation",
    icon: <ArrowRight className="w-4 h-4" />,
    shortcuts: [
      { key: "G + D", description: "Go to Dashboard", icon: <Home className="w-4 h-4" /> },
      { key: "G + S", description: "Go to Schools", icon: <Users className="w-4 h-4" /> },
      { key: "G + U", description: "Go to Users", icon: <Users className="w-4 h-4" /> },
      { key: "G + R", description: "Go to Reports", icon: <BarChart3 className="w-4 h-4" /> },
    ],
  },
]

const counselorShortcuts: ShortcutGroup[] = [
  ...globalShortcuts,
  {
    category: "Quick Navigation",
    icon: <ArrowRight className="w-4 h-4" />,
    shortcuts: [
      { key: "G + D", description: "Go to Dashboard", icon: <Home className="w-4 h-4" /> },
      { key: "G + S", description: "Go to Students", icon: <Users className="w-4 h-4" /> },
      { key: "G + I", description: "Go to Interventions", icon: <FileText className="w-4 h-4" /> },
      { key: "G + N", description: "Go to Notes", icon: <FileText className="w-4 h-4" /> },
    ],
  },
]

const ministryShortcuts: ShortcutGroup[] = [
  ...globalShortcuts,
  {
    category: "Quick Navigation",
    icon: <ArrowRight className="w-4 h-4" />,
    shortcuts: [
      { key: "G + D", description: "Go to Dashboard", icon: <Home className="w-4 h-4" /> },
      { key: "G + S", description: "Go to Schools", icon: <Users className="w-4 h-4" /> },
      { key: "G + A", description: "Go to Analytics", icon: <BarChart3 className="w-4 h-4" /> },
      { key: "G + B", description: "Go to Billing", icon: <FileText className="w-4 h-4" /> },
    ],
  },
]

// Get shortcuts based on portal context
function getShortcutsForContext(context?: PortalContext): ShortcutGroup[] {
  switch (context) {
    case "school-admin":
      return schoolAdminShortcuts
    case "teacher":
      return teacherShortcuts
    case "student":
      return studentShortcuts
    case "parent":
      return parentShortcuts
    case "admin":
      return adminShortcuts
    case "counselor":
      return counselorShortcuts
    case "ministry":
      return ministryShortcuts
    default:
      return globalShortcuts
  }
}

// =============================================================================
// KEY BADGE COMPONENT
// =============================================================================

interface KeyBadgeProps {
  keys: string[]
  className?: string
}

function KeyBadge({ keys, className }: KeyBadgeProps) {
  const isMac = typeof window !== "undefined" && window.navigator.platform.toLowerCase().includes("mac")

  const formatKey = (key: string): string => {
    if (isMac) {
      return key
        .replace("Cmd+", "⌘")
        .replace("Ctrl+", "⌃")
        .replace("Alt+", "⌥")
        .replace("Shift+", "⇧")
    }
    return key
      .replace("Cmd+", "Ctrl+")
      .replace("⌘", "Ctrl+")
      .replace("⌃", "Ctrl+")
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {keys.map((key, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span className="text-gray-400 text-xs">+</span>}
          <kbd className="min-w-[24px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-[11px] font-medium text-gray-600 dark:text-gray-400 flex items-center justify-center">
            {formatKey(key)}
          </kbd>
        </React.Fragment>
      ))}
    </div>
  )
}

// =============================================================================
// MAIN MODAL COMPONENT
// =============================================================================

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
  shortcuts,
  context,
}: KeyboardShortcutsModalProps) {
  const [searchQuery, setSearchQuery] = React.useState("")

  // Use provided shortcuts or get based on context
  const allShortcuts = React.useMemo(() => {
    if (shortcuts) return shortcuts
    return getShortcutsForContext(context)
  }, [shortcuts, context])

  // Filter shortcuts based on search
  const filteredShortcuts = React.useMemo(() => {
    if (!searchQuery.trim()) return allShortcuts

    const query = searchQuery.toLowerCase()
    return allShortcuts
      .map((group) => ({
        ...group,
        shortcuts: group.shortcuts.filter(
          (shortcut) =>
            shortcut.description.toLowerCase().includes(query) ||
            shortcut.key.toLowerCase().includes(query) ||
            shortcut.category?.toLowerCase().includes(query)
        ),
      }))
      .filter((group) => group.shortcuts.length > 0)
  }, [allShortcuts, searchQuery])

  // Close on Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        {/* Backdrop */}
        <Dialog.Overlay className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 transition-opacity duration-150 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out data-[state=open]:fade-in" />

        {/* Modal */}
        <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-[8px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-[0_0_0_1px_rgba(255,255,255,0.8)_inset,0_16px_48px_rgba(0,0,0,0.15)] animate-in fade-in slide-in-from-top-4 duration-150 ease-out">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <Keyboard className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Keyboard Shortcuts
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {context ? `Shortcuts for ${context.replace("-", " ")}` : "Quick reference for keyboard shortcuts"}
                  </p>
                </div>
              </div>
              <Dialog.Close className="rounded-[6px] p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/10">
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="sr-only">Close</span>
              </Dialog.Close>
            </div>

            {/* Search */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search shortcuts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-[6px] text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  >
                    <X className="w-3 h-3 text-gray-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Shortcuts List */}
            <div className="overflow-y-auto max-h-[60vh] p-6">
              {filteredShortcuts.length === 0 ? (
                <div className="text-center py-12">
                  <Keyboard className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No shortcuts found</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try a different search term</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredShortcuts.map((group) => (
                    <div key={group.category}>
                      <div className="flex items-center gap-2 mb-3">
                        {group.icon && (
                          <div className="text-gray-400 dark:text-gray-500">
                            {group.icon}
                          </div>
                        )}
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                          {group.category}
                        </h3>
                      </div>
                      <div className="space-y-2 pl-6">
                        {group.shortcuts.map((shortcut, index) => (
                          <div
                            key={`${group.category}-${index}`}
                            className="flex items-center justify-between py-2 px-3 rounded-[6px] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              {shortcut.icon && (
                                <div className="text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                                  {shortcut.icon}
                                </div>
                              )}
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {shortcut.description}
                              </span>
                            </div>
                            <KeyBadge
                              keys={shortcut.key.split(" ")}
                              className="text-gray-400 dark:text-gray-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
              <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↑↓</kbd>
                  to scroll
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">esc</kbd>
                  to close
                </span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {typeof window !== "undefined" && window.navigator.platform.toLowerCase().includes("mac")
                  ? "Press ⌘"
                  : "Press Ctrl"}
                {" "}
                + / to open this modal
              </p>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// =============================================================================
// HOOK FOR EASY INTEGRATION
// =============================================================================

export interface UseKeyboardShortcutsOptions {
  context?: PortalContext
  shortcuts?: ShortcutGroup[]
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + / to open
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
      // Escape to close
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen])

  const triggerShortcut = React.useCallback((key: string) => {
    // This can be used to programmatically trigger shortcuts
    // Implementation depends on how shortcuts are registered
    console.log(`Trigger shortcut: ${key}`)
  }, [])

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
    triggerShortcut,
  }
}

// =============================================================================
// TRIGGER BUTTON COMPONENT
// =============================================================================

export interface KeyboardShortcutsTriggerProps {
  className?: string
  onClick?: () => void
  showShortcut?: boolean
}

export function KeyboardShortcutsTrigger({
  className,
  onClick,
  showShortcut = true,
}: KeyboardShortcutsTriggerProps) {
  const isMac = typeof window !== "undefined" && window.navigator.platform.toLowerCase().includes("mac")

  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5",
        "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-[6px]",
        "text-sm text-gray-500 dark:text-gray-400",
        "hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300",
        "transition-colors duration-150",
        "focus-visible:ring-2 focus-visible:ring-black/10 focus-visible:outline-none",
        className
      )}
    >
      <Keyboard className="w-4 h-4" />
      <span>Keyboard Shortcuts</span>
      {showShortcut && (
        <kbd className="ml-auto text-[11px] text-gray-400 dark:text-gray-500">
          {isMac ? "⌘/" : "Ctrl+/"}
        </kbd>
      )}
    </button>
  )
}

export default KeyboardShortcutsModal
