"use client";

/**
 * MODERN ATTENDANCE CLIENT COMPONENT
 *
 * Features:
 * - Grid view with student cards
 * - One-click attendance marking (Present/Absent/Late)
 * - Color-coded status badges
 * - Bulk actions
 * - Date picker and class selector
 * - Visual progress bar
 * - Export functionality
 */

import { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UserCheck,
  Search,
  Upload,
  Download,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  List,
  MoreVertical,
  Check,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { markAttendance } from "../_actions";
import type { StudentAttendance } from "@/components/ui/attendance-grid";

interface AttendanceClientProps {
  initialDate: string;
  initialClassId: string;
  initialView: string;
  classes: Array<{ id: string; name: string; grade: number; section: string }>;
  students: Array<{ id: string; name: string; avatarUrl?: string }>;
  totalStudents: number;
  attendanceSummary: {
    present: number;
    absent: number;
    late: number;
    pending: number;
  };
}

type AttendanceStatus = "present" | "absent" | "late" | null;

interface StudentAttendanceState extends StudentAttendance {
  status: AttendanceStatus;
  checkInTime?: string;
  notes?: string;
}

const statusConfig = {
  present: {
    label: "Present",
    icon: CheckCircle2,
    bgColor: "bg-green-50 dark:bg-green-900/20",
    textColor: "text-green-700 dark:text-green-400",
    borderColor: "border-green-200 dark:border-green-800",
    badgeVariant: "success" as const,
  },
  absent: {
    label: "Absent",
    icon: XCircle,
    bgColor: "bg-red-50 dark:bg-red-900/20",
    textColor: "text-red-700 dark:text-red-400",
    borderColor: "border-red-200 dark:border-red-800",
    badgeVariant: "error" as const,
  },
  late: {
    label: "Late",
    icon: Clock,
    bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    textColor: "text-yellow-700 dark:text-yellow-400",
    borderColor: "border-yellow-200 dark:border-yellow-800",
    badgeVariant: "warning" as const,
  },
};

export function AttendanceClient({
  initialDate,
  initialClassId,
  initialView,
  classes,
  students: initialStudents,
  totalStudents,
  attendanceSummary: initialSummary,
}: AttendanceClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // State
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedClassId, setSelectedClassId] = useState(initialClassId);
  const [view, setView] = useState<"grid" | "list">(initialView as "grid" | "list");
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState<StudentAttendanceState[]>(
    initialStudents.map((s) => ({ ...s, status: null }))
  );
  const [summary, setSummary] = useState(initialSummary);
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [saveSuccess, setSaveSuccess] = useState<Set<string>>(new Set());

  // Update URL when filters change
  const updateFilters = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
      router.push(`?${params.toString()}`);
    },
    [searchParams, router]
  );

  // Handle date change
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    updateFilters({ date });
  };

  // Handle class change
  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    updateFilters({ classId, date: selectedDate });
  };

  // Handle view toggle
  const handleViewToggle = (newView: "grid" | "list") => {
    setView(newView);
    updateFilters({ view: newView, date: selectedDate, classId: selectedClassId });
  };

  // Handle individual student attendance click
  const handleAttendanceClick = async (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    // Cycle: null -> present -> absent -> late -> null
    let nextStatus: AttendanceStatus;
    if (student.status === null) {
      nextStatus = "present";
    } else if (student.status === "present") {
      nextStatus = "absent";
    } else if (student.status === "absent") {
      nextStatus = "late";
    } else {
      nextStatus = null;
    }

    // Optimistic update
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status: nextStatus } : s))
    );

    // Clear success indicator
    setSaveSuccess((prev) => {
      const next = new Set(prev);
      next.delete(studentId);
      return next;
    });

    // Save to server
    if (selectedClassId && nextStatus) {
      setSaving((prev) => new Set(prev).add(studentId));
      try {
        await markAttendance({
          classId: selectedClassId,
          date: selectedDate,
          attendance: [
            {
              studentId,
              status: nextStatus,
            },
          ],
          entryMethod: "manual",
        });

        // Show success indicator
        setSaveSuccess((prev) => new Set(prev).add(studentId));
        setTimeout(() => {
          setSaveSuccess((prev) => {
            const next = new Set(prev);
            next.delete(studentId);
            return next;
          });
        }, 1500);

        // Update summary
        setSummary((prev) => {
          const newSummary = { ...prev };
          if (student.status === "present") newSummary.present--;
          else if (student.status === "absent") newSummary.absent--;
          else if (student.status === "late") newSummary.late--;
          else newSummary.pending--;

          if (nextStatus === "present") newSummary.present++;
          else if (nextStatus === "absent") newSummary.absent++;
          else if (nextStatus === "late") newSummary.late++;

          return newSummary;
        });
      } catch (error) {
        console.error("Failed to save attendance:", error);
        // Revert on error
        setStudents((prev) =>
          prev.map((s) => (s.id === studentId ? { ...s, status: student.status } : s))
        );
      } finally {
        setSaving((prev) => {
          const next = new Set(prev);
          next.delete(studentId);
          return next;
        });
      }
    }
  };

  // Bulk mark all
  const handleBulkMark = async (status: "present" | "absent") => {
    if (!selectedClassId) return;

    setSaving(new Set(students.map((s) => s.id)));

    try {
      await markAttendance({
        classId: selectedClassId,
        date: selectedDate,
        attendance: students.map((s) => ({
          studentId: s.id,
          status,
        })),
        entryMethod: "manual",
      });

      // Update all students
      setStudents((prev) => prev.map((s) => ({ ...s, status })));

      // Update summary
      setSummary({
        present: status === "present" ? students.length : 0,
        absent: status === "absent" ? students.length : 0,
        late: 0,
        pending: 0,
      });
    } catch (error) {
      console.error("Failed to save bulk attendance:", error);
    } finally {
      setSaving(new Set());
    }
  };

  // Navigate date
  const navigateDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    const newDate = date.toISOString().split("T")[0];
    handleDateChange(newDate);
  };

  // Filter students
  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate attendance percentage
  const attendancePercentage =
    students.length > 0
      ? Math.round(
          ((summary.present + summary.late) / (summary.present + summary.absent + summary.late + summary.pending || 1)) * 100
        )
      : 0;

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-gray-600 mt-1">Mark and track daily student attendance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Attendance Progress */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Daily Attendance Rate</span>
                <span className="text-sm font-bold text-gray-900">{attendancePercentage}%</span>
              </div>
              <Progress value={attendancePercentage} className="h-3" />
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  {summary.present} Present
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  {summary.late} Late
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  {summary.absent} Absent
                </span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{summary.present}</p>
                <p className="text-xs text-gray-500">Present</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{summary.absent}</p>
                <p className="text-xs text-gray-500">Absent</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{summary.late}</p>
                <p className="text-xs text-gray-500">Late</p>
              </div>
            </div>

            {/* Pending */}
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold text-orange-600">{summary.pending}</p>
                  <p className="text-xs text-gray-600">Pending</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters Bar */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Date Navigation */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => navigateDate(-1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="pl-10 w-[160px]"
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => navigateDate(1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Class Selector */}
            <div className="flex-1 min-w-[200px]">
              <Select value={selectedClassId} onValueChange={handleClassChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a class">
                    {selectedClassId
                      ? classes.find((c) => c.id === selectedClassId)?.name || "Select class"
                      : "Select a class"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      Class {cls.grade} - {cls.section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* View Toggle */}
            <div className="flex border rounded-lg">
              <Button
                variant={view === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => handleViewToggle("grid")}
                className="rounded-r-none"
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant={view === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => handleViewToggle("list")}
                className="rounded-l-none"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            {/* Bulk Actions (when class is selected) */}
            {selectedClassId && filteredStudents.length > 0 && (
              <div className="flex gap-2 border-l pl-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkMark("present")}
                  disabled={saving.size > 0}
                >
                  <Check className="w-4 h-4 mr-2 text-green-600" />
                  All Present
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkMark("absent")}
                  disabled={saving.size > 0}
                >
                  <X className="w-4 h-4 mr-2 text-red-600" />
                  All Absent
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* No Class Selected State */}
      {!selectedClassId && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Class</h3>
            <p className="text-gray-500">Choose a class from the dropdown above to start marking attendance.</p>
          </CardContent>
        </Card>
      )}

      {/* Student Grid */}
      {selectedClassId && view === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStudents.map((student) => {
            const config = student.status ? statusConfig[student.status] : null;
            const isSaving = saving.has(student.id);
            const isSuccess = saveSuccess.has(student.id);

            return (
              <Card
                key={student.id}
                className={`
                  cursor-pointer transition-all hover:shadow-md
                  ${isSuccess ? "ring-2 ring-green-500" : ""}
                  ${config ? config.borderColor : "border-gray-200"}
                `}
                onClick={() => !isSaving && handleAttendanceClick(student.id)}
              >
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div
                      className={`
                        w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0
                        ${config ? config.bgColor : "bg-gray-100"}
                      `}
                    >
                      {student.avatarUrl ? (
                        <img
                          src={student.avatarUrl}
                          alt={student.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className={config ? config.textColor : "text-gray-600"}>
                          {getInitials(student.name)}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{student.name}</p>
                      {config && (
                        <Badge variant={config.badgeVariant} size="sm" className="mt-1">
                          <config.icon className="w-3 h-3" />
                          {config.label}
                        </Badge>
                      )}
                      {!config && (
                        <span className="text-xs text-gray-400 mt-1 block">Not marked</span>
                      )}
                    </div>

                    {/* Loading/Success */}
                    {isSaving && (
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400 flex-shrink-0" />
                    )}
                    {isSuccess && (
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    )}
                  </div>

                  {/* Click instruction */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400">
                      {isSaving
                        ? "Saving..."
                        : isSuccess
                        ? "Saved!"
                        : "Click to cycle: Present → Absent → Late"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Student List View */}
      {selectedClassId && view === "list" && (
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-2">
              {filteredStudents.map((student) => {
                const config = student.status ? statusConfig[student.status] : null;
                const isSaving = saving.has(student.id);
                const isSuccess = saveSuccess.has(student.id);

                return (
                  <div
                    key={student.id}
                    className={`
                      flex items-center gap-4 p-3 rounded-lg border-2 cursor-pointer transition-all
                      ${isSuccess ? "ring-2 ring-green-500" : ""}
                      ${config ? config.borderColor : "border-gray-200 hover:border-gray-300"}
                    `}
                    onClick={() => !isSaving && handleAttendanceClick(student.id)}
                  >
                    {/* Avatar */}
                    <div
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0
                        ${config ? config.bgColor : "bg-gray-100"}
                      `}
                    >
                      {student.avatarUrl ? (
                        <img
                          src={student.avatarUrl}
                          alt={student.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className={config ? config.textColor : "text-gray-600"}>
                          {getInitials(student.name)}
                        </span>
                      )}
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{student.name}</p>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-3">
                      {config && (
                        <Badge variant={config.badgeVariant}>
                          <config.icon className="w-3 h-3 mr-1" />
                          {config.label}
                        </Badge>
                      )}
                      {!config && (
                        <span className="text-sm text-gray-400">Not marked</span>
                      )}
                      {isSaving && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                      {isSuccess && <Check className="w-4 h-4 text-green-500" />}
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {selectedClassId && filteredStudents.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Students Found</h3>
            <p className="text-gray-500">
              {searchQuery
                ? "No students match your search. Try a different query."
                : "This class has no students enrolled yet."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      {selectedClassId && filteredStudents.length > 0 && (
        <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
          <span>Click on a student to mark attendance:</span>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>Present</span>
          </div>
          <div className="flex items-center gap-1">
            <XCircle className="w-4 h-4 text-red-600" />
            <span>Absent</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-yellow-600" />
            <span>Late</span>
          </div>
        </div>
      )}
    </div>
  );
}
