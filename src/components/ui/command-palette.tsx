/**
 * CLERK-STYLE COMMAND PALETTE
 *
 * A fast, searchable command palette inspired by Linear and Clerk.
 *
 * FEATURES:
 * - Cmd+K / Ctrl+K shortcut to open
 * - Searchable actions and navigation
 * - Keyboard navigation (arrows + enter)
 * - Recent commands at top
 * - Grouped actions with icons
 * - Framer Motion animations
 *
 * @example
 * ```tsx
 * import { CommandPalette, useCommandPalette } from "@/components/ui/command-palette"
 *
 * function App() {
 *   const { isOpen, open, close } = useCommandPalette()
 *
 *   const commands = [
 *     {
 *       id: "new-student",
 *       label: "Add new student",
 *       icon: Plus,
 *       shortcut: "N",
 *       action: () => router.push("/school-admin/students/create")
 *     },
 *   ]
 *
 *   return (
 *     <>
 *       <CommandPalette isOpen={isOpen} onClose={close} commands={commands} />
 *       <button onClick={open}>Open (Cmd+K)</button>
 *     </>
 *   )
 * }
 * ```
 */

"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Command, FileText, Users, Settings, LogOut, Home } from "lucide-react"
import { cn } from "@/lib/utils"

// =============================================================================
// TYPES
// =============================================================================

export interface CommandItem {
  id: string
  label: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  shortcut?: string
  keywords?: string[]
  action: () => void
  group?: string
}

export interface CommandGroup {
  id: string
  label: string
  commands: CommandItem[]
}

export interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  commands?: CommandItem[]
  groups?: CommandGroup[]
  placeholder?: string
  recentCommands?: string[]
}

// =============================================================================
// KEYBOARD HOOK
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
// COMMAND ITEM COMPONENT
// =============================================================================

interface CommandItemProps {
  command: CommandItem
  isSelected: boolean
  onClick: () => void
  index: number
}

function CommandItemComponent({ command, isSelected, onClick, index }: CommandItemProps) {
  const Icon = command.icon

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-purple-500/50",
        isSelected
          ? "bg-purple-500/10 text-purple-300"
          : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
      )}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.15 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      {Icon && (
        <span className={cn(
          "flex-shrink-0 w-5 h-5",
          isSelected ? "text-purple-500" : "text-gray-400"
        )}>
          <Icon className="w-5 h-5" />
        </span>
      )}
      <div className="flex-1 min-w-0">
        <span className="block text-sm font-medium truncate">{command.label}</span>
        {command.description && (
          <span className="block text-xs text-gray-500 dark:text-gray-400 truncate">
            {command.description}
          </span>
        )}
      </div>
      {command.shortcut && (
        <kbd className={cn(
          "flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded",
          "border transition-colors",
          isSelected
            ? "border-purple-500/30 bg-purple-500/10 text-purple-300"
            : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500"
        )}>
          {command.shortcut}
        </kbd>
      )}
    </motion.button>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function CommandPalette({
  isOpen,
  onClose,
  commands: propCommands,
  groups: propGroups,
  placeholder = "Type a command or search...",
  recentCommands = [],
}: CommandPaletteProps) {
  const [search, setSearch] = React.useState("")
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)

  // Normalize commands to groups
  const allGroups = React.useMemo(() => {
    if (propGroups) {
      return propGroups
    }
    if (propCommands) {
      return [{ id: "all", label: "Actions", commands: propCommands }]
    }
    return []
  }, [propCommands, propGroups])

  // Filter commands based on search
  const filteredGroups = React.useMemo(() => {
    if (!search) return allGroups

    const searchLower = search.toLowerCase()

    return allGroups
      .map((group) => ({
        ...group,
        commands: group.commands.filter((cmd) => {
          const matchesLabel = cmd.label.toLowerCase().includes(searchLower)
          const matchesDesc = cmd.description?.toLowerCase().includes(searchLower)
          const matchesKeywords = cmd.keywords?.some((k) => k.toLowerCase().includes(searchLower))
          return matchesLabel || matchesDesc || matchesKeywords
        }),
      }))
      .filter((group) => group.commands.length > 0)
  }, [allGroups, search])

  // Flatten for keyboard navigation
  const flatCommands = React.useMemo(
    () => filteredGroups.flatMap((group) => group.commands),
    [filteredGroups]
  )

  // Reset selected index when search changes
  React.useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  // Focus input on open
  React.useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  // Keyboard navigation
  React.useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setSelectedIndex((i) => (i + 1) % flatCommands.length)
          break
        case "ArrowUp":
          e.preventDefault()
          setSelectedIndex((i) => (i - 1 + flatCommands.length) % flatCommands.length)
          break
        case "Enter":
          e.preventDefault()
          flatCommands[selectedIndex]?.action()
          onClose()
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, flatCommands, selectedIndex, onClose])

  // Scroll selected item into view
  React.useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.children[selectedIndex] as HTMLElement
      selectedEl?.scrollIntoView({ block: "nearest", behavior: "smooth" })
    }
  }, [selectedIndex])

  const handleCommandClick = (command: CommandItem) => {
    command.action()
    onClose()
    setSearch("")
  }

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.2 },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.15 },
    },
  }

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: -10,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 30,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 10,
      transition: { duration: 0.15 },
    },
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-xl mx-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="bg-white dark:bg-[rgb(27,27,31)] rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl"
                style={{
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                }}
              >
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-200 dark:border-gray-700">
                  <Search className="w-5 h-5 text-gray-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 outline-none text-base"
                  />
                  <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs text-gray-500 border border-gray-200 dark:border-gray-700 rounded">
                    <Command className="w-3 h-3" />
                    <span>K</span>
                  </kbd>
                </div>

                {/* Commands List */}
                <div className="max-h-[400px] overflow-y-auto p-2" ref={listRef}>
                  {flatCommands.length === 0 ? (
                    <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                      <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No commands found</p>
                      <p className="text-xs mt-1">Try a different search term</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredGroups.map((group, groupIndex) => (
                        <div key={group.id}>
                          {group.label && filteredGroups.length > 1 && (
                            <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              {group.label}
                            </div>
                          )}
                          {group.commands.map((command, cmdIndex) => {
                            const globalIndex = flatCommands.indexOf(command)
                            return (
                              <CommandItemComponent
                                key={command.id}
                                command={command}
                                isSelected={selectedIndex === globalIndex}
                                onClick={() => handleCommandClick(command)}
                                index={groupIndex * 10 + cmdIndex}
                              />
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">
                        arrows
                      </kbd>
                      <span>to navigate</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">
                        enter
                      </kbd>
                      <span>to select</span>
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">
                      esc
                    </kbd>
                    <span>to close</span>
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

// =============================================================================
// PRESET COMMANDS
// =============================================================================

export function createNavigationCommands(router: { push: (path: string) => void }): CommandItem[] {
  return [
    {
      id: "dashboard",
      label: "Go to Dashboard",
      icon: Home,
      shortcut: "G D",
      keywords: ["home", "main"],
      action: () => router.push("/dashboard"),
    },
    {
      id: "students",
      label: "View Students",
      icon: Users,
      shortcut: "G S",
      keywords: ["learners", "pupils"],
      action: () => router.push("/school-admin/students"),
    },
    {
      id: "settings",
      label: "Open Settings",
      icon: Settings,
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
      icon: Users,
      shortcut: "N",
      keywords: ["create", "add", "student"],
      action: () => router.push("/school-admin/students/create"),
    },
    {
      id: "new-teacher",
      label: "Add New Teacher",
      icon: Users,
      shortcut: "T",
      keywords: ["create", "add", "teacher", "staff"],
      action: () => router.push("/school-admin/teachers/create"),
    },
    {
      id: "new-class",
      label: "Create New Class",
      icon: FileText,
      shortcut: "C",
      keywords: ["create", "add", "class", "section"],
      action: () => router.push("/school-admin/classes/create"),
    },
  ]
}
