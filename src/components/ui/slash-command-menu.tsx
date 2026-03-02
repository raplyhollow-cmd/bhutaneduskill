/**
 * SlashCommandMenu Component
 *
 * A Notion-style slash command menu triggered by typing `/`.
 * Features include:
 *
 * - Triggered by `/` key in any text input
 * - Searchable commands
 * - Context-aware (different commands per portal)
 * - Keyboard navigation (arrow keys + Enter)
 * - Categorized commands
 * - Icon display for each command
 * - Description for each command
 * - Auto-positioning near cursor
 *
 * @example
 * ```tsx
 * import { SlashCommandMenu, useSlashCommand } from "@/components/ui/slash-command-menu"
 *
 * function MyPage() {
 *   const { SlashCommandTrigger, menuState } = useSlashCommand({
 *     commands: "school-admin",
 *     onCommand: (command) => {
 *       if (command.id === "add-student") {
 *         // Open add student modal
 *       }
 *     }
 *   })
 *
 *   return (
 *     <div>
 *       <SlashCommandTrigger />
 *       <textarea placeholder="Type / for commands..." />
 *     </div>
 *   )
 * }
 * ```
 */

"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  UserPlus,
  User,
  BookOpen,
  FileText,
  Calendar,
  MessageSquare,
  Settings,
  GraduationCap,
  Users,
  CreditCard,
  AlertCircle,
  CheckSquare,
  Target,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ============================================================================
// TYPES
// ============================================================================

export type PortalType =
  | "school-admin"
  | "teacher"
  | "student"
  | "parent"
  | "counselor"
  | "admin"
  | "ministry"

export interface SlashCommand {
  /** Unique identifier for the command */
  id: string
  /** Display label */
  label: string
  /** Description of what the command does */
  description?: string
  /** Icon to display */
  icon?: LucideIcon
  /** Category for grouping */
  category?: string
  /** Keyboard shortcut hint */
  shortcut?: string
  /** Portal-specific availability */
  portals?: PortalType[]
}

export interface SlashCommandMenuProps {
  /** Whether the menu is open */
  open: boolean
  /** Callback when a command is selected */
  onSelect: (command: SlashCommand) => void
  /** Callback when menu closes */
  onClose: () => void
  /** Position for the menu */
  position?: { x: number; y: number }
  /** Portal type for context-aware commands */
  portal?: PortalType
  /** Custom className */
  className?: string
}

export interface UseSlashCommandOptions {
  /** Portal type or predefined command set */
  commands: PortalType | SlashCommand[]
  /** Callback when command is triggered */
  onCommand: (command: SlashCommand) => void | Promise<void>
  /** Custom trigger element */
  triggerRef?: React.RefObject<HTMLElement>
}

// ============================================================================
// PREDEFINED COMMAND SETS
// ============================================================================

const commandCategories = {
  quickActions: "Quick Actions",
  people: "People",
  academic: "Academic",
  communication: "Communication",
  settings: "Settings",
  navigation: "Navigation",
}

export const slashCommands: Record<PortalType, SlashCommand[]> = {
  "school-admin": [
    {
      id: "add-student",
      label: "Add Student",
      description: "Create a new student record",
      icon: UserPlus,
      category: commandCategories.quickActions,
      shortcut: "S",
    },
    {
      id: "add-teacher",
      label: "Add Teacher",
      description: "Create a new teacher record",
      icon: User,
      category: commandCategories.quickActions,
      shortcut: "T",
    },
    {
      id: "add-class",
      label: "Add Class",
      description: "Create a new class",
      icon: LayoutDashboard,
      category: commandCategories.quickActions,
    },
    {
      id: "add-subject",
      label: "Add Subject",
      description: "Create a new subject",
      icon: BookOpen,
      category: commandCategories.academic,
    },
    {
      id: "manage-homework",
      label: "Manage Homework",
      description: "View and manage all homework",
      icon: FileText,
      category: commandCategories.academic,
    },
    {
      id: "view-attendance",
      label: "View Attendance",
      description: "Check attendance records",
      icon: Calendar,
      category: commandCategories.academic,
    },
    {
      id: "send-notification",
      label: "Send Notification",
      description: "Send a notification to users",
      icon: MessageSquare,
      category: commandCategories.communication,
    },
    {
      id: "settings",
      label: "Settings",
      description: "Open school settings",
      icon: Settings,
      category: commandCategories.settings,
    },
  ],
  teacher: [
    {
      id: "add-homework",
      label: "Add Homework",
      description: "Create a new homework assignment",
      icon: FileText,
      category: commandCategories.quickActions,
      shortcut: "H",
    },
    {
      id: "add-assignment",
      label: "Add Assignment",
      description: "Create a new assignment",
      icon: CheckSquare,
      category: commandCategories.quickActions,
    },
    {
      id: "take-attendance",
      label: "Take Attendance",
      description: "Record student attendance",
      icon: Calendar,
      category: commandCategories.academic,
      shortcut: "A",
    },
    {
      id: "message-students",
      label: "Message Students",
      description: "Send message to students",
      icon: MessageSquare,
      category: commandCategories.communication,
    },
    {
      id: "view-class",
      label: "View Class",
      description: "View class details",
      icon: Users,
      category: commandCategories.navigation,
    },
    {
      id: "grade-submissions",
      label: "Grade Submissions",
      description: "Grade homework submissions",
      icon: CheckSquare,
      category: commandCategories.academic,
    },
  ],
  student: [
    {
      id: "add-goal",
      label: "Add Goal",
      description: "Create a new learning goal",
      icon: Target,
      category: commandCategories.quickActions,
      shortcut: "G",
    },
    {
      id: "view-homework",
      label: "View Homework",
      description: "See all homework assignments",
      icon: FileText,
      category: commandCategories.academic,
    },
    {
      id: "journal-entry",
      label: "Journal Entry",
      description: "Write a journal entry",
      icon: BookOpen,
      category: commandCategories.quickActions,
      shortcut: "J",
    },
    {
      id: "view-progress",
      label: "View Progress",
      description: "Check your learning progress",
      icon: GraduationCap,
      category: commandCategories.navigation,
    },
    {
      id: "view-classes",
      label: "View Classes",
      description: "See your class schedule",
      icon: LayoutDashboard,
      category: commandCategories.navigation,
    },
  ],
  parent: [
    {
      id: "message-school",
      label: "Message School",
      description: "Send a message to the school",
      icon: MessageSquare,
      category: commandCategories.communication,
      shortcut: "M",
    },
    {
      id: "view-child-progress",
      label: "View Child Progress",
      description: "Check your child's academic progress",
      icon: GraduationCap,
      category: commandCategories.navigation,
    },
    {
      id: "view-homework",
      label: "View Homework",
      description: "See your child's homework",
      icon: FileText,
      category: commandCategories.academic,
    },
    {
      id: "pay-fees",
      label: "Pay Fees",
      description: "Pay school fees online",
      icon: CreditCard,
      category: commandCategories.quickActions,
    },
  ],
  counselor: [
    {
      id: "add-session",
      label: "Add Session",
      description: "Schedule a counseling session",
      icon: Calendar,
      category: commandCategories.quickActions,
    },
    {
      id: "add-note",
      label: "Add Note",
      description: "Create a counseling note",
      icon: FileText,
      category: commandCategories.quickActions,
    },
    {
      id: "view-students",
      label: "View Students",
      description: "View assigned students",
      icon: Users,
      category: commandCategories.navigation,
    },
    {
      id: "create-intervention",
      label: "Create Intervention",
      description: "Create a student intervention plan",
      icon: AlertCircle,
      category: commandCategories.quickActions,
    },
  ],
  admin: [
    {
      id: "add-school",
      label: "Add School",
      description: "Register a new school",
      icon: LayoutDashboard,
      category: commandCategories.quickActions,
    },
    {
      id: "manage-users",
      label: "Manage Users",
      description: "Manage platform users",
      icon: Users,
      category: commandCategories.people,
    },
    {
      id: "send-notification",
      label: "Send Notification",
      description: "Send platform-wide notification",
      icon: MessageSquare,
      category: commandCategories.communication,
    },
    {
      id: "view-analytics",
      label: "View Analytics",
      description: "Check platform analytics",
      icon: GraduationCap,
      category: commandCategories.navigation,
    },
  ],
  ministry: [
    {
      id: "add-school",
      label: "Add School",
      description: "Register a new school",
      icon: LayoutDashboard,
      category: commandCategories.quickActions,
    },
    {
      id: "view-reports",
      label: "View Reports",
      description: "View ministry reports",
      icon: FileText,
      category: commandCategories.navigation,
    },
    {
      id: "manage-billing",
      label: "Manage Billing",
      description: "Manage school billing",
      icon: CreditCard,
      category: commandCategories.settings,
    },
    {
      id: "send-notification",
      label: "Send Notification",
      description: "Send notification to schools",
      icon: MessageSquare,
      category: commandCategories.communication,
    },
  ],
}

// ============================================================================
// SLASH COMMAND MENU COMPONENT
// ============================================================================

export function SlashCommandMenu({
  open,
  onSelect,
  onClose,
  position = { x: 0, y: 0 },
  portal = "school-admin",
  className,
}: SlashCommandMenuProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Get commands for current portal
  const commands = React.useMemo(() => {
    return slashCommands[portal] || []
  }, [portal])

  // Filter and group commands
  const { groupedCommands, categories } = React.useMemo(() => {
    const filtered = commands.filter((cmd) => {
      const search = searchQuery.toLowerCase()
      return (
        cmd.label.toLowerCase().includes(search) ||
        cmd.description?.toLowerCase().includes(search) ||
        cmd.id.toLowerCase().includes(search)
      )
    })

    const grouped: Record<string, SlashCommand[]> = {}
    const cats: string[] = []

    filtered.forEach((cmd) => {
      const cat = cmd.category || commandCategories.quickActions
      if (!grouped[cat]) {
        grouped[cat] = []
        cats.push(cat)
      }
      grouped[cat].push(cmd)
    })

    return { groupedCommands: grouped, categories: cats }
  }, [commands, searchQuery])

  // Flatten for keyboard navigation
  const flatCommands = React.useMemo(() => {
    return categories.flatMap((cat) => groupedCommands[cat])
  }, [categories, groupedCommands])

  // Reset selected index when search changes
  React.useEffect(() => {
    setSelectedIndex(0)
  }, [searchQuery])

  // Focus input on open
  React.useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    }
  }, [open])

  // Keyboard navigation
  React.useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setSelectedIndex((i) => Math.min(i + 1, flatCommands.length - 1))
          break
        case "ArrowUp":
          e.preventDefault()
          setSelectedIndex((i) => Math.max(i - 1, 0))
          break
        case "Enter":
          e.preventDefault()
          if (flatCommands[selectedIndex]) {
            handleSelect(flatCommands[selectedIndex])
          }
          break
        case "Escape":
          e.preventDefault()
          onClose()
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, selectedIndex, flatCommands, onClose])

  const handleSelect = (command: SlashCommand) => {
    onSelect(command)
    onClose()
    setSearchQuery("")
  }

  // Position menu to avoid going off-screen
  const menuStyle = React.useMemo(() => {
    const menuWidth = 320
    const menuHeight = 400

    let x = position.x
    let y = position.y

    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 16
    }
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 16
    }

    return { left: x, top: y }
  }, [position])

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.15 }}
        className={cn(
          "fixed z-50 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden",
          className
        )}
        style={menuStyle}
      >
        {/* Search Input */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            ref={inputRef}

            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search commands..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
          />
        </div>

        {/* Commands List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {categories.map((category, catIdx) => {
            const commandsInCategory = groupedCommands[category]
            const startIndex = categories
              .slice(0, catIdx)
              .reduce((sum, cat) => sum + groupedCommands[cat].length, 0)

            return (
              <div key={category} className="mb-2 last:mb-0">
                <div className="px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {category}
                </div>
                {commandsInCategory.map((command, idx) => {
                  const globalIndex = startIndex + idx
                  const Icon = command.icon
                  const isSelected = globalIndex === selectedIndex

                  return (
                    <button
                      key={command.id}
                      onClick={() => handleSelect(command)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors",
                        isSelected
                          ? "bg-violet-100 dark:bg-violet-900/30 text-violet-900 dark:text-violet-100"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                      )}
                    >
                      {Icon && (
                        <Icon
                          className={cn(
                            "w-4 h-4 flex-shrink-0",
                            isSelected ? "text-violet-600 dark:text-violet-400" : "text-gray-400"
                          )}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate">{command.label}</span>
                          {command.shortcut && (
                            <kbd className="px-1.5 py-0.5 text-xs font-mono bg-gray-100 dark:bg-gray-700 rounded text-gray-500 dark:text-gray-400">
                              {command.shortcut}
                            </kbd>
                          )}
                        </div>
                        {command.description && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 block truncate">
                            {command.description}
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )
          })}

          {flatCommands.length === 0 && (
            <div className="px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              No commands found
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 font-mono bg-gray-100 dark:bg-gray-700 rounded">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 font-mono bg-gray-100 dark:bg-gray-700 rounded">↵</kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 font-mono bg-gray-100 dark:bg-gray-700 rounded">esc</kbd>
              Close
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ============================================================================
// HOOK FOR SLASH COMMAND FUNCTIONALITY
// ============================================================================

export function useSlashCommand({
  commands,
  onCommand,
  triggerRef,
}: UseSlashCommandOptions) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [position, setPosition] = React.useState({ x: 0, y: 0 })
  const [portal, setPortal] = React.useState<PortalType>("school-admin")

  // Determine commands type
  const commandList = React.useMemo(() => {
    if (Array.isArray(commands)) {
      return commands
    }
    setPortal(commands)
    return slashCommands[commands] || []
  }, [commands])

  // Trigger element ref
  const internalTriggerRef = React.useRef<HTMLInputElement | HTMLTextAreaElement>(null)
  const triggerElement = triggerRef?.current || internalTriggerRef.current

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Trigger on slash
    if (e.key === "/") {
      const target = e.currentTarget as HTMLInputElement | HTMLTextAreaElement
      const rect = target.getBoundingClientRect()

      // Check if slash is at the beginning or after a space
      const value = target.value
      const cursorStart = target.selectionStart || 0

      if (cursorStart === 0 || (cursorStart > 0 && value[cursorStart - 1] === " ")) {
        e.preventDefault()

        // Position menu below cursor
        setPosition({
          x: rect.left,
          y: rect.bottom + 8,
        })

        setIsOpen(true)
      }
    }
  }

  const handleSelect = (command: SlashCommand) => {
    onCommand(command)
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  // Slash Command Trigger component
  const SlashCommandTrigger = React.useCallback(
    (props: React.InputHTMLAttributes<HTMLInputElement>) => (
      <input
        ref={internalTriggerRef as React.RefObject<HTMLInputElement>}
        onKeyDown={handleKeyDown}
        {...props}
      />
    ),
    []
  )

  return {
    SlashCommandTrigger,
    isOpen,
    setIsOpen,
    position,
    handleSelect,
    handleClose,
    portal,
  }
}

// ============================================================================
// CONVENIENCE WRAPPERS
// ============================================================================

/**
 * Pre-configured slash command menu for school admin portal
 */
export function SchoolAdminSlashCommandMenu(props: Omit<SlashCommandMenuProps, "portal">) {
  return <SlashCommandMenu portal="school-admin" {...props} />
}

/**
 * Pre-configured slash command menu for teacher portal
 */
export function TeacherSlashCommandMenu(props: Omit<SlashCommandMenuProps, "portal">) {
  return <SlashCommandMenu portal="teacher" {...props} />
}

/**
 * Pre-configured slash command menu for student portal
 */
export function StudentSlashCommandMenu(props: Omit<SlashCommandMenuProps, "portal">) {
  return <SlashCommandMenu portal="student" {...props} />
}

/**
 * Pre-configured slash command menu for parent portal
 */
export function ParentSlashCommandMenu(props: Omit<SlashCommandMenuProps, "portal">) {
  return <SlashCommandMenu portal="parent" {...props} />
}

/**
 * Pre-configured slash command menu for counselor portal
 */
export function CounselorSlashCommandMenu(props: Omit<SlashCommandMenuProps, "portal">) {
  return <SlashCommandMenu portal="counselor" {...props} />
}

/**
 * Pre-configured slash command menu for admin portal
 */
export function AdminSlashCommandMenu(props: Omit<SlashCommandMenuProps, "portal">) {
  return <SlashCommandMenu portal="admin" {...props} />
}

/**
 * Pre-configured slash command menu for ministry portal
 */
export function MinistrySlashCommandMenu(props: Omit<SlashCommandMenuProps, "portal">) {
  return <SlashCommandMenu portal="ministry" {...props} />
}

// ============================================================================
// EXPORTS
// ============================================================================

export default SlashCommandMenu
