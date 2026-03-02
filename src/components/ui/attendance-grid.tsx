/**
 * AttendanceGrid Component
 *
 * Grid view with inline attendance marking.
 * Features include:
 *
 * - Students × dates grid
 * - Inline status toggle (Present/Absent/Late)
 * - Bulk mark all Present
 * - Save with confirmation
 * - Color-coded cells
 * - Statistics summary
 *
 * @example
 * ```tsx
 * import { AttendanceGrid } from "@/components/ui/attendance-grid"
 *
 * function AttendancePage() {
 *   const students = [
 *     { id: "1", name: "Tashi Wangmo", rollNumber: "01" },
 *     { id: "2", name: "Karma Dorji", rollNumber: "02" },
 *   ]
 *
 *   const handleSave = async (studentId: string, date: string, status: string) => {
 *     await saveAttendanceToDatabase(studentId, date, status)
 *   }
 *
 *   return (
 *     <AttendanceGrid
 *       students={students}
 *       startDate="2026-03-01"
 *       endDate="2026-03-07"
 *       onSave={handleSave}
 *     />
 *   )
 * }
 * ```
 */

"use client"

import * as React from "react"
import {
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Check,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// ============================================================================
// TYPES
// ============================================================================

export type AttendanceStatus = "present" | "absent" | "late" | null

export interface StudentAttendance {
  id: string
  name: string
  rollNumber?: string
  avatarUrl?: string
}

export interface AttendanceRecord {
  studentId: string
  date: string
  status: AttendanceStatus
}

export interface AttendanceGridProps {
  /** List of students */
  students: StudentAttendance[]
  /** Start date (ISO string) */
  startDate: string
  /** End date (ISO string) */
  endDate: string
  /** Callback when attendance is saved */
  onSave: (studentId: string, date: string, status: AttendanceStatus) => Promise<void>
  /** Initial attendance data */
  initialAttendance?: AttendanceRecord[]
  /** Show roll number column */
  showRollNumber?: boolean
  /** Custom className */
  className?: string
  /** Show statistics */
  showStatistics?: boolean
}

// ============================================================================
// DATE UTILITIES (inline to avoid date-fns dependency)
// ============================================================================

function formatDate(date: Date, formatStr: string): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  if (formatStr === "yyyy-MM-dd") {
    return date.toISOString().split("T")[0]
  }
  if (formatStr === "MMM d") {
    return `${months[date.getMonth()]} ${date.getDate()}`
  }
  if (formatStr === "EEE") {
    return days[date.getDay()]
  }
  return date.toISOString().split("T")[0]
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function parseISO(dateStr: string): Date {
  return new Date(dateStr)
}

// ============================================================================
// STATUS CONFIG
// ============================================================================

const statusConfig = {
  present: {
    label: "Present",
    icon: CheckCircle,
    bgColor: "bg-green-50 dark:bg-green-900/20",
    textColor: "text-green-700 dark:text-green-400",
    borderColor: "border-green-200 dark:border-green-800",
  },
  absent: {
    label: "Absent",
    icon: XCircle,
    bgColor: "bg-red-50 dark:bg-red-900/20",
    textColor: "text-red-700 dark:text-red-400",
    borderColor: "border-red-200 dark:border-red-800",
  },
  late: {
    label: "Late",
    icon: Clock,
    bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    textColor: "text-yellow-700 dark:text-yellow-400",
    borderColor: "border-yellow-200 dark:border-yellow-800",
  },
} as const

const statusOrder: AttendanceStatus[] = ["present", "absent", "late"]

// ============================================================================
// COMPONENT
// ============================================================================

export function AttendanceGrid({
  students,
  startDate,
  endDate,
  onSave,
  initialAttendance = [],
  showRollNumber = true,
  className,
  showStatistics = true,
}: AttendanceGridProps) {
  // Generate date range
  const dates = React.useMemo(() => {
    const start = parseISO(startDate)
    const end = parseISO(endDate)
    const dateList: Date[] = []

    let current = start
    while (current <= end) {
      dateList.push(current)
      current = addDays(current, 1)
    }

    return dateList
  }, [startDate, endDate])

  // Attendance state
  const [attendance, setAttendance] = React.useState<Record<string, AttendanceStatus>>(() => {
    const initial: Record<string, AttendanceStatus> = {}
    initialAttendance.forEach((record) => {
      initial[`${record.studentId}-${record.date}`] = record.status
    })
    return initial
  })

  // Loading state
  const [savingCells, setSavingCells] = React.useState<Set<string>>(new Set())

  // Bulk action confirmation
  const [showBulkConfirm, setShowBulkConfirm] = React.useState(false)
  const [pendingBulkAction, setPendingBulkAction] = React.useState<{
    status: AttendanceStatus
  } | null>(null)

  // Calculate statistics
  const statistics = React.useMemo(() => {
    let present = 0
    let absent = 0
    let late = 0

    Object.values(attendance).forEach((status) => {
      if (status === "present") present++
      if (status === "absent") absent++
      if (status === "late") late++
    })

    const totalCells = students.length * dates.length
    const marked = Object.keys(attendance).length

    return { present, absent, late, marked, total: totalCells }
  }, [attendance, students.length, dates.length])

  // Handle cell click - cycle through statuses
  const handleCellClick = async (studentId: string, date: Date) => {
    const dateStr = formatDate(date, "yyyy-MM-dd")
    const key = `${studentId}-${dateStr}`
    const currentStatus = attendance[key]

    // Cycle to next status: null -> present -> absent -> late -> null
    let nextStatus: AttendanceStatus
    if (currentStatus === null) {
      nextStatus = "present"
    } else {
      const currentIndex = statusOrder.indexOf(currentStatus)
      if (currentIndex === statusOrder.length - 1) {
        nextStatus = null
      } else {
        nextStatus = statusOrder[currentIndex + 1]
      }
    }

    // Optimistic update
    setAttendance((prev) => ({ ...prev, [key]: nextStatus }))

    // Save to server
    setSavingCells((prev) => new Set(prev).add(key))
    try {
      await onSave(studentId, dateStr, nextStatus)
    } catch (error) {
      // Revert on error
      setAttendance((prev) => ({ ...prev, [key]: currentStatus }))
      console.error("Failed to save attendance:", error)
    } finally {
      setSavingCells((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  // Handle bulk mark all
  const handleBulkMarkAll = (status: AttendanceStatus) => {
    setPendingBulkAction({ status })
    setShowBulkConfirm(true)
  }

  const confirmBulkAction = async () => {
    if (!pendingBulkAction) return

    setShowBulkConfirm(false)
    const status = pendingBulkAction.status

    // Mark all cells with the status
    const updates: Array<{ studentId: string; date: string }> = []

    students.forEach((student) => {
      dates.forEach((date) => {
        const dateStr = formatDate(date, "yyyy-MM-dd")
        const key = `${student.id}-${dateStr}`

        // Skip if already this status
        if (attendance[key] === status) return

        updates.push({ studentId: student.id, date: dateStr })
        setAttendance((prev) => ({ ...prev, [key]: status }))
      })
    })

    // Save all updates
    setSavingCells(new Set(updates.map((u) => `${u.studentId}-${u.date}`)))

    try {
      await Promise.all(
        updates.map((update) => onSave(update.studentId, update.date, status))
      )
    } catch (error) {
      console.error("Failed to save bulk attendance:", error)
    } finally {
      setSavingCells(new Set())
    }

    setPendingBulkAction(null)
  }

  return (
    <>
      <div className={cn("space-y-4", className)}>
        {/* Statistics */}
        {showStatistics && (
          <div className="flex items-center gap-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Present: <span className="font-bold">{statistics.present}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Absent: <span className="font-bold">{statistics.absent}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Late: <span className="font-bold">{statistics.late}</span>
              </span>
            </div>
            <div className="ml-auto text-sm text-gray-500 dark:text-gray-400">
              {statistics.marked} / {statistics.total} marked
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Bulk Actions:
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleBulkMarkAll("present")}
            className="gap-2"
          >
            <Check className="w-4 h-4" />
            Mark All Present
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleBulkMarkAll("absent")}
            className="gap-2"
          >
            <X className="w-4 h-4" />
            Mark All Absent
          </Button>
        </div>

        {/* Grid */}
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Header Row */}
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
              <div
                className={cn(
                  "flex-shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400",
                  showRollNumber ? "w-24" : "w-16"
                )}
              >
                #
              </div>
              <div className="flex-shrink-0 w-48 text-xs font-medium text-gray-500 dark:text-gray-400">
                Student
              </div>
              {dates.map((date) => (
                <div key={date.toISOString()} className="flex-shrink-0 w-14 text-center">
                  <div className="text-xs font-medium text-gray-900 dark:text-gray-100">
                    {formatDate(date, "MMM d")}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(date, "EEE")}
                  </div>
                </div>
              ))}
            </div>

            {/* Student Rows */}
            {students.map((student, idx) => (
              <div
                key={student.id}
                className="flex items-center gap-2 py-2 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                {/* Roll Number / Index */}
                {showRollNumber ? (
                  <div className="flex-shrink-0 w-24 text-xs text-gray-500 dark:text-gray-400">
                    {student.rollNumber || (idx + 1).toString().padStart(2, "0")}
                  </div>
                ) : (
                  <div className="flex-shrink-0 w-16 text-xs text-gray-500 dark:text-gray-400">
                    #{idx + 1}
                  </div>
                )}

                {/* Student Name */}
                <div className="flex-shrink-0 w-48">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {student.name}
                  </div>
                </div>

                {/* Attendance Cells */}
                {dates.map((date) => {
                  const key = `${student.id}-${formatDate(date, "yyyy-MM-dd")}`
                  const status = attendance[key]
                  const isSaving = savingCells.has(key)
                  const config = status ? statusConfig[status] : null

                  return (
                    <button
                      key={key}
                      onClick={() => handleCellClick(student.id, date)}
                      disabled={isSaving}
                      className={cn(
                        "flex-shrink-0 w-14 h-10 rounded-md border-2 transition-all",
                        "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-1",
                        "hover:shadow-sm",
                        config
                          ? cn(config.bgColor, config.borderColor)
                          : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
                        isSaving && "opacity-60 cursor-wait"
                      )}
                    >
                      {isSaving ? (
                        <Loader2 className="w-5 h-5 mx-auto animate-spin text-gray-400" />
                      ) : status ? (
                        <config.icon className={cn("w-5 h-5 mx-auto", config.textColor)} />
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 text-sm">
          <span className="text-gray-500 dark:text-gray-400">Click to cycle:</span>
          <div className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-gray-600 dark:text-gray-400">Present</span>
          </div>
          <div className="flex items-center gap-1">
            <XCircle className="w-4 h-4 text-red-600" />
            <span className="text-gray-600 dark:text-gray-400">Absent</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-yellow-600" />
            <span className="text-gray-600 dark:text-gray-400">Late</span>
          </div>
        </div>
      </div>

      {/* Bulk Action Confirmation Dialog */}
      <AlertDialog open={showBulkConfirm} onOpenChange={setShowBulkConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Mark All {pendingBulkAction?.status === "present" ? "Present" : "Absent"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will mark {students.length} student(s) as{" "}
              <span className="font-medium">
                {pendingBulkAction?.status === "present" ? "Present" : "Absent"}
              </span>{" "}
              for {dates.length} day(s). This action will be saved immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowBulkConfirm(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkAction}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ============================================================================
// CONVENIENCE WRAPPERS
// ============================================================================

/**
 * Pre-configured attendance grid for current week
 */
export function WeeklyAttendanceGrid(props: Omit<AttendanceGridProps, "startDate" | "endDate">) {
  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay())
  const endOfWeek = addDays(startOfWeek, 6)

  return (
    <AttendanceGrid
      startDate={formatDate(startOfWeek, "yyyy-MM-dd")}
      endDate={formatDate(endOfWeek, "yyyy-MM-dd")}
      {...props}
    />
  )
}

/**
 * Pre-configured attendance grid for current month
 */
export function MonthlyAttendanceGrid(props: Omit<AttendanceGridProps, "startDate" | "endDate">) {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  return (
    <AttendanceGrid
      startDate={formatDate(startOfMonth, "yyyy-MM-dd")}
      endDate={formatDate(endOfMonth, "yyyy-MM-dd")}
      {...props}
    />
  )
}

// ============================================================================
// EXPORTS
// ============================================================================

export default AttendanceGrid
