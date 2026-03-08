/**
 * Command Palette Component - Engineer Premium (Vercel/Clerk Inspired)
 *
 * ENGINEER PREMIUM FEATURES:
 * - Cmd+K trigger (Mac) / Ctrl+K (Windows)
 * - Dual-layer "milled" border shadow
 * - 150ms snappy animations
 * - 20% backdrop opacity with blur
 * - Navigation and Actions groups
 * - Keyboard hints footer
 * - 8px border radius
 *
 * DESIGN PHILOSOPHY:
 * - "Keyboard-first search"
 * - "Fast, feels instant"
 * - "Clean, minimal UI"
 * - "Grouped results"
 */

"use client"

import * as React from "react"
import { Command } from "cmdk"
import { Search, LayoutDashboard, Users, Plus, Settings, LogOut, FileText, Calendar, BarChart3, Home } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import * as Dialog from "@radix-ui/react-dialog"

// Type guard for component type
// Returns true for both function components and JSX elements (which are ReactElements)
function isComponentType(icon: CommandItem['icon']): icon is React.ComponentType<{ className?: string }> {
  return typeof icon === 'function' || (typeof icon === 'object' && icon !== null && '$$typeof' in icon)
}

export interface CommandItem {
  id: string
  label: string
  description?: string
  icon?: React.ReactNode | React.ComponentType<{ className?: string }>
  shortcut?: string
  keywords?: string[]
  action: () => void
  group?: "navigation" | "actions" | "settings"
}

export interface CommandGroupData {
  heading: string
  items: CommandItem[]
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  items?: CommandGroupData[]
  commands?: CommandItem[]  // Legacy support - flat list of commands
  trigger?: React.ReactNode
  placeholder?: string
}

const defaultItems: CommandGroupData[] = [
  {
    heading: "Navigation",
    items: [
      { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" />, action: () => {} },
      { id: "students", label: "Students", icon: <Users className="w-4 h-4" />, action: () => {} },
      { id: "classes", label: "Classes", icon: <FileText className="w-4 h-4" />, action: () => {} },
      { id: "reports", label: "Reports", icon: <BarChart3 className="w-4 h-4" />, action: () => {} },
    ],
  },
  {
    heading: "Actions",
    items: [
      { id: "create", label: "Create New", icon: <Plus className="w-4 h-4" />, shortcut: "N", action: () => {} },
      { id: "schedule", label: "Schedule", icon: <Calendar className="w-4 h-4" />, action: () => {} },
    ],
  },
  {
    heading: "Settings",
    items: [
      { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" />, action: () => {} },
      { id: "logout", label: "Logout", icon: <LogOut className="w-4 h-4" />, action: () => {} },
    ],
  },
]

export function CommandPalette({ isOpen, onClose, items, commands, trigger, placeholder = "Search anything..." }: CommandPaletteProps) {
  const router = useRouter()

  // Support legacy `commands` prop - convert to items format
  const itemsList = React.useMemo(() => {
    if (items) return items
    if (commands) {
      return [{ heading: "Actions", items: commands }]
    }
    return defaultItems
  }, [items, commands])

  const runCommand = React.useCallback((command: () => void) => {
    onClose()
    command()
  }, [onClose])

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        {/* Backdrop overlay - 20% opacity with blur */}
        <Dialog.Overlay className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 transition-opacity duration-150 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out data-[state=open]:fade-in" />

        {/* Command dialog */}
        <Dialog.Content className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] sm:pt-[20vh]">
          <Dialog.Title className="sr-only">Command Palette</Dialog.Title>
          <div className="w-full max-w-lg mx-4 overflow-hidden rounded-[8px] bg-white border border-gray-200 shadow-[0_0_0_1px_rgba(255,255,255,0.8)_inset,0_16px_48px_rgba(0,0,0,0.15)] animate-in fade-in slide-in-from-top-4 duration-150 ease-out dark:bg-gray-900 dark:border-gray-700">
            <Command
              className="w-full"
              loop
            >
              {/* Search input */}
              <div className="flex items-center border-b border-gray-100 px-4 dark:border-gray-800">
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <Command.Input
                  placeholder={placeholder}
                  className="flex h-12 w-full bg-transparent px-3 py-2 text-sm outline-none text-[#000000] placeholder:text-gray-400 dark:text-gray-100 dark:placeholder:text-gray-500"
                />
                {/* Keyboard hint */}
                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 border border-gray-200 rounded text-[11px] text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400">
                  <span>{typeof window !== "undefined" && window.navigator.platform.toLowerCase().includes("mac") ? "⌘" : "Ctrl"}</span>
                  <span>K</span>
                </kbd>
              </div>

              {/* Results list */}
              <Command.List className="max-h-80 overflow-y-auto p-2">
                {itemsList.map((group) => (
                  <Command.Group
                    key={group.heading}
                    heading={
                      <div className="px-2 py-1.5 text-[13px] font-medium text-gray-500 dark:text-gray-400">
                        {group.heading}
                      </div>
                    }
                  >
                    {group.items.map((item) => (
                      <Command.Item
                        key={item.id}
                        onSelect={() => runCommand(item.action)}
                        value={item.label}
                        keywords={item.keywords}
                        className="group flex items-center gap-3 px-3 py-2 rounded-[6px] text-[14px] text-gray-700 cursor-pointer hover:bg-gray-100 data-[selected=true]:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 dark:data-[selected=true]:bg-gray-800 transition-colors duration-75"
                      >
                        {item.icon && (
                          <span className="text-gray-400 dark:text-gray-500">
                            {isComponentType(item.icon)
                              ? React.createElement(item.icon, { className: "w-4 h-4" })
                              : item.icon
                            }
                          </span>
                        )}
                        <span className="flex-1">{item.label}</span>
                        {item.shortcut && (
                          <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[11px] text-gray-400 dark:bg-gray-800 dark:text-gray-500">
                            {item.shortcut}
                          </kbd>
                        )}
                      </Command.Item>
                    ))}
                  </Command.Group>
                ))}

                {/* No results */}
                <Command.Empty className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  No results found.
                </Command.Empty>
              </Command.List>

              {/* Footer - keyboard navigation hint */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-4 text-[12px] text-gray-400 dark:text-gray-500">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded dark:bg-gray-800 dark:border-gray-700">↑↓</kbd>
                    <span>to navigate</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded dark:bg-gray-800 dark:border-gray-700">↵</kbd>
                    <span>to select</span>
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded dark:bg-gray-800 dark:border-gray-700">esc</kbd>
                    <span>to close</span>
                  </span>
                </div>
              </div>
            </Command>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/**
 * Command Palette Trigger Button
 * Optional trigger component for headers
 */
export function CommandPaletteTrigger({ className, onClick }: { className?: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5",
        "bg-gray-50 border border-gray-200 rounded-[6px]",
        "text-sm text-gray-500",
        "hover:bg-gray-100 hover:text-gray-700",
        "transition-colors duration-150",
        "focus-visible:ring-2 focus-visible:ring-black/10 focus-visible:outline-none",
        "dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300",
        className
      )}
    >
      <Search className="w-4 h-4" />
      <span>Search...</span>
      <kbd className="ml-auto text-[11px] text-gray-400">
        {typeof window !== "undefined" && window.navigator.platform.toLowerCase().includes("mac") ? "⌘K" : "Ctrl+K"}
      </kbd>
    </button>
  )
}

// =============================================================================
// HOOK FOR EASY INTEGRATION
// =============================================================================

export function useCommandPalette() {
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen])

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
  }
}

// =============================================================================
// PRESET COMMANDS
// =============================================================================

export function createNavigationCommands(router: { push: (path: string) => void }): CommandItem[] {
  return [
    {
      id: "dashboard",
      label: "Go to Dashboard",
      icon: <Home className="w-4 h-4" />,
      shortcut: "G D",
      keywords: ["home", "main"],
      action: () => router.push("/dashboard"),
    },
    {
      id: "students",
      label: "View Students",
      icon: <Users className="w-4 h-4" />,
      shortcut: "G S",
      keywords: ["learners", "pupils"],
      action: () => router.push("/school-admin/students"),
    },
    {
      id: "settings",
      label: "Open Settings",
      icon: <Settings className="w-4 h-4" />,
      shortcut: "G S",
      keywords: ["config", "preferences"],
      action: () => router.push("/settings"),
    },
  ]
}

export function createQuickActionsCommands(router: { push: (path: string) => void }): CommandItem[] {
  return [
    {
      id: "new-student",
      label: "Add New Student",
      icon: <Users className="w-4 h-4" />,
      shortcut: "N",
      keywords: ["create", "add", "student"],
      action: () => router.push("/school-admin/students/create"),
    },
    {
      id: "new-teacher",
      label: "Add New Teacher",
      icon: <Users className="w-4 h-4" />,
      shortcut: "T",
      keywords: ["create", "add", "teacher", "staff"],
      action: () => router.push("/school-admin/teachers/create"),
    },
    {
      id: "new-class",
      label: "Create New Class",
      icon: <FileText className="w-4 h-4" />,
      shortcut: "C",
      keywords: ["create", "add", "class", "section"],
      action: () => router.push("/school-admin/classes/create"),
    },
  ]
}

export default CommandPalette
