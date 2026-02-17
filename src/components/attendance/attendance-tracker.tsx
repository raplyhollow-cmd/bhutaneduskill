"use client";

import { logger } from "@/lib/logger";
/**
 * ATTENDANCE TRACKER
 * Teacher interface for taking attendance
 *
 * Features:
 * - Display list of students in a class
 * - Allow marking Present/Absent/Late/Excused
 * - Show attendance summary
 * - Save attendance to existing API
 * - Support quick marking with keyboard shortcuts (P=Present, A=Absent, L=Late, E=Excused)
 */

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  X,
  Clock,
  Search,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Keyboard,
  Save,
  Loader2,
} from "lucide-react";

export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  classId: string;
  section?: string;
}

export interface AttendanceRecord {
  studentId: string;
  status: "present" | "absent" | "late" | "excused";
  notes?: string;
  timeIn?: string;
  timeOut?: string;
}

export interface AttendanceSession {
  id: string;
  classId: string;
  date: string;
  subject: string;
  teacherId: string;
  records: AttendanceRecord[];
}

interface AttendanceTrackerProps {
  classId: string;
  className: string;
  subject: string;
  students: Student[];
  date?: string;
  existingRecords?: AttendanceRecord[];
  onSave: (sessionId: string, records: AttendanceRecord[]) => void | Promise<void>;
  schoolId?: string;
  teacherId?: string;
}

type AttendanceStatus = "present" | "absent" | "late" | "excused";

const statusConfig: Record<
  AttendanceStatus,
  { label: string; icon: typeof Check; color: string; bgColor: string }
> = {
  present: { label: "Present", icon: Check, color: "text-green-600", bgColor: "bg-green-100" },
  absent: { label: "Absent", icon: X, color: "text-red-600", bgColor: "bg-red-100" },
  late: { label: "Late", icon: Clock, color: "text-yellow-600", bgColor: "bg-yellow-100" },
  excused: { label: "Excused", icon: AlertCircle, color: "text-blue-600", bgColor: "bg-blue-100" },
};

export function AttendanceTracker({
  classId,
  className,
  subject,
  students,
  date: initialDate,
  existingRecords = [],
  onSave,
  schoolId,
  teacherId,
}: AttendanceTrackerProps) {
  const [date, setDate] = useState(initialDate || new Date().toISOString().split("T")[0]);
  const [records, setRecords] = useState<Record<string, AttendanceRecord>>(() => {
    const initial: Record<string, AttendanceRecord> = {};
    students.forEach((s) => {
      const existing = existingRecords.find((r) => r.studentId === s.id);
      initial[s.id] = existing || { studentId: s.id, status: "present" };
    });
    return initial;
  });
  const [notes, setNotes] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    existingRecords.forEach((r) => {
      if (r.notes) initial[r.studentId] = r.notes;
    });
    return initial;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [quickMarkMode, setQuickMarkMode] = useState<AttendanceStatus | null>(null);
  const [selectedStudentIndex, setSelectedStudentIndex] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  // Filter students for navigation
  const filteredStudents = useMemo(() => {
    return students.filter((s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [students, searchQuery]);

  // Reset selection when filter changes
  useEffect(() => {
    setSelectedStudentIndex(0);
  }, [searchQuery]);

  // Stats calculation
  const stats = useMemo(() => {
    return Object.values(records).reduce(
      (acc, r) => {
        acc[r.status]++;
        return acc;
      },
      { present: 0, absent: 0, late: 0, excused: 0 }
    );
  }, [records]);

  const updateStatus = (studentId: string, status: AttendanceStatus) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
  };

  const updateNote = (studentId: string, note: string) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], notes: note },
    }));
    setNotes((prev) => ({ ...prev, [studentId]: note }));
  };

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      // Status shortcuts (P, A, L, E)
      if (["p", "a", "l", "e"].includes(key)) {
        e.preventDefault();
        const currentStudent = filteredStudents[selectedStudentIndex];
        if (currentStudent) {
          const statusMap: Record<string, AttendanceStatus> = {
            p: "present",
            a: "absent",
            l: "late",
            e: "excused",
          };
          updateStatus(currentStudent.id, statusMap[key]);

          // Move to next student
          if (selectedStudentIndex < filteredStudents.length - 1) {
            setSelectedStudentIndex(selectedStudentIndex + 1);
          }
        }
        return;
      }

      // Arrow keys for navigation
      if (key === "arrowdown" && selectedStudentIndex < filteredStudents.length - 1) {
        e.preventDefault();
        setSelectedStudentIndex(selectedStudentIndex + 1);
        return;
      }
      if (key === "arrowup" && selectedStudentIndex > 0) {
        e.preventDefault();
        setSelectedStudentIndex(selectedStudentIndex - 1);
        return;
      }

      // Quick mark mode toggles
      if (key === "1") setQuickMarkMode("present");
      if (key === "2") setQuickMarkMode("absent");
      if (key === "3") setQuickMarkMode("late");
      if (key === "4") setQuickMarkMode("excused");
      if (key === "0" || key === "escape") setQuickMarkMode(null);

      // Save shortcut
      if ((key === "s" && e.ctrlKey) || key === "f5") {
        e.preventDefault();
        handleSave();
        return;
      }

      // Toggle help
      if (key === "?") {
        setShowKeyboardHelp(!showKeyboardHelp);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredStudents, selectedStudentIndex, quickMarkMode, showKeyboardHelp]);

  const markAll = (status: AttendanceStatus) => {
    setRecords((prev) => {
      const updated = { ...prev };
      filteredStudents.forEach((s) => {
        updated[s.id] = { ...updated[s.id], status };
      });
      return updated;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("idle");
    try {
      const recordsArray = Object.values(records);
      const sessionId = `${classId}-${date}`;
      await onSave(sessionId, recordsArray);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      logger.error("Save error:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Scroll selected student into view
  useEffect(() => {
    const selectedRow = document.querySelector(`[data-student-index="${selectedStudentIndex}"]`);
    if (selectedRow) {
      selectedRow.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedStudentIndex]);

  const exportCSV = () => {
    const headers = ["Roll Number", "Name", "Status", "Notes"];
    const rows = filteredStudents.map((s) => {
      const r = records[s.id];
      return [s.rollNumber, s.name, r.status, r.notes || ""];
    });

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${className}-${date}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Attendance - {className}</h1>
              <p className="text-muted-foreground">{subject}</p>
            </div>

            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-40"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className={stats.present > 0 ? "border-green-200" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.present}</p>
                <p className="text-sm text-muted-foreground">Present</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={stats.absent > 0 ? "border-red-200" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.absent}</p>
                <p className="text-sm text-muted-foreground">Absent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={stats.late > 0 ? "border-yellow-200" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.late}</p>
                <p className="text-sm text-muted-foreground">Late</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={stats.excused > 0 ? "border-blue-200" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.excused}</p>
                <p className="text-sm text-muted-foreground">Excused</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Quick Mark:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAll("present")}
                className="text-green-600 hover:bg-green-50"
              >
                <Check className="w-4 h-4 mr-1" />
                All Present
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAll("absent")}
                className="text-red-600 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-1" />
                All Absent
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
                title="Keyboard shortcuts (? to toggle)"
              >
                <Keyboard className="w-4 h-4 mr-2" />
                Shortcuts
              </Button>
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search student..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
            </div>

            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Keyboard shortcuts help */}
          {showKeyboardHelp && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-sm mb-2 text-blue-900 dark:text-blue-100">Keyboard Shortcuts</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-blue-800 dark:text-blue-200">
                <div><kbd className="px-1.5 py-0.5 bg-white dark:bg-blue-900 rounded border border-blue-300 dark:border-blue-700">P</kbd> Present</div>
                <div><kbd className="px-1.5 py-0.5 bg-white dark:bg-blue-900 rounded border border-blue-300 dark:border-blue-700">A</kbd> Absent</div>
                <div><kbd className="px-1.5 py-0.5 bg-white dark:bg-blue-900 rounded border border-blue-300 dark:border-blue-700">L</kbd> Late</div>
                <div><kbd className="px-1.5 py-0.5 bg-white dark:bg-blue-900 rounded border border-blue-300 dark:border-blue-700">E</kbd> Excused</div>
                <div><kbd className="px-1.5 py-0.5 bg-white dark:bg-blue-900 rounded border border-blue-300 dark:border-blue-700">↑↓</kbd> Navigate</div>
                <div><kbd className="px-1.5 py-0.5 bg-white dark:bg-blue-900 rounded border border-blue-300 dark:border-blue-700">1-4</kbd> Quick Mark Mode</div>
                <div><kbd className="px-1.5 py-0.5 bg-white dark:bg-blue-900 rounded border border-blue-300 dark:border-blue-700">0/Esc</kbd> Clear Mode</div>
                <div><kbd className="px-1.5 py-0.5 bg-white dark:bg-blue-900 rounded border border-blue-300 dark:border-blue-700">Ctrl+S</kbd> Save</div>
              </div>
            </div>
          )}

          {/* Quick mark mode toggle */}
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Click mode:</span>
            <div className="flex rounded-lg border p-1">
              {(
                ["present", "absent", "late", "excused"] as AttendanceStatus[]
              ).map((status) => (
                <button
                  key={status}
                  onClick={() =>
                    setQuickMarkMode(quickMarkMode === status ? null : status)
                  }
                  className={`
                    px-3 py-1 rounded text-sm font-medium transition-colors
                    ${
                      quickMarkMode === status
                        ? statusConfig[status].bgColor + " " + statusConfig[status].color
                        : "hover:bg-muted"
                    }
                  `}
                >
                  <span className="opacity-60 mr-1">({["present", "absent", "late", "excused"].indexOf(status) + 1})</span>
                  {statusConfig[status].label}
                </button>
              ))}
            </div>
            {quickMarkMode && (
              <Badge variant="secondary" className="ml-2">
                Click on any student to mark as {quickMarkMode}
                <button
                  onClick={() => setQuickMarkMode(null)}
                  className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Student List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Students ({filteredStudents.length})</CardTitle>
            {filteredStudents.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Use <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">P</kbd>
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs ml-1">A</kbd>
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs ml-1">L</kbd>
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs ml-1">E</kbd> to mark
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 w-20">Roll No</th>
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-center py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4 w-64">Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, index) => {
                  const record = records[student.id];
                  const config = statusConfig[record.status];
                  const isSelected = index === selectedStudentIndex;

                  return (
                    <tr
                      key={student.id}
                      data-student-index={index}
                      className={`
                        border-b cursor-pointer transition-colors
                        ${isSelected ? "bg-blue-50 dark:bg-blue-950" : "hover:bg-muted/50"}
                        ${quickMarkMode ? "hover:bg-muted" : ""}
                      `}
                      onClick={() => {
                        if (quickMarkMode) {
                          updateStatus(student.id, quickMarkMode);
                        } else {
                          setSelectedStudentIndex(index);
                        }
                      }}
                    >
                      <td className="py-3 px-4 font-medium">
                        {isSelected && <span className="mr-2">→</span>}
                        {student.rollNumber}
                      </td>
                      <td className="py-3 px-4">{student.name}</td>

                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-1">
                          {(
                            ["present", "absent", "late", "excused"] as AttendanceStatus[]
                          ).map((status) => {
                            const StatusIcon = statusConfig[status].icon;
                            return (
                              <button
                                key={status}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateStatus(student.id, status);
                                }}
                                className={`
                                  w-10 h-10 rounded-lg flex items-center justify-center transition-all
                                  ${
                                    record.status === status
                                      ? statusConfig[status].bgColor +
                                        " " +
                                        statusConfig[status].color +
                                        " ring-2 ring-offset-1 ring-" + status
                                      : "bg-muted hover:bg-muted/80"
                                  }
                                `}
                                title={`${statusConfig[status].label} (${status[0].toUpperCase()})`}
                              >
                                <StatusIcon className="w-5 h-5" />
                              </button>
                            );
                          })}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <Input
                          value={record.notes || ""}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateNote(student.id, e.target.value);
                          }}
                          placeholder="Add note..."
                          onClick={(e) => e.stopPropagation()}
                          onFocus={() => setSelectedStudentIndex(index)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {saveStatus === "success" && (
            <span className="text-green-600 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Attendance saved successfully!
            </span>
          )}
          {saveStatus === "error" && (
            <span className="text-red-600 flex items-center gap-1">
              <XCircle className="w-4 h-4" />
              Failed to save. Please try again.
            </span>
          )}
        </div>
        <Button
          onClick={handleSave}
          size="lg"
          disabled={isSaving}
          className="min-w-32"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Attendance
            </>
          )}
        </Button>
      </div>

      {/* Footer keyboard hint */}
      <div className="text-center text-xs text-muted-foreground">
        Press <kbd className="px-1 py-0.5 bg-muted rounded">?</kbd> to toggle keyboard shortcuts • Press <kbd className="px-1 py-0.5 bg-muted rounded">Ctrl+S</kbd> to save
      </div>
    </div>
  );
}
