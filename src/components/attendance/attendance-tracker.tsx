/**
 * ATTENDANCE TRACKER
 * Teacher interface for taking attendance
 */
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter((s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [students, searchQuery]);

  // Stats
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
    const recordsArray = Object.values(records);
    const sessionId = `${classId}-${date}`;
    await onSave(sessionId, recordsArray);
  };

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
                    px-3 py-1 rounded text-sm font-medium
                    ${
                      quickMarkMode === status
                        ? statusConfig[status].bgColor + " " + statusConfig[status].color
                        : "hover:bg-muted"
                    }
                  `}
                >
                  {statusConfig[status].label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student List */}
      <Card>
        <CardHeader>
          <CardTitle>Students ({filteredStudents.length})</CardTitle>
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
                {filteredStudents.map((student) => {
                  const record = records[student.id];
                  const config = statusConfig[record.status];

                  return (
                    <tr
                      key={student.id}
                      className="border-b hover:bg-muted/50 cursor-pointer"
                      onClick={() => {
                        if (quickMarkMode) {
                          updateStatus(student.id, quickMarkMode);
                        }
                      }}
                    >
                      <td className="py-3 px-4 font-medium">{student.rollNumber}</td>
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
                                  w-10 h-10 rounded-lg flex items-center justify-center
                                  ${
                                    record.status === status
                                      ? statusConfig[status].bgColor +
                                        " " +
                                        statusConfig[status].color
                                      : "bg-muted hover:bg-muted/80"
                                  }
                                `}
                                title={statusConfig[status].label}
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
      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          <Check className="w-4 h-4 mr-2" />
          Save Attendance
        </Button>
      </div>
    </div>
  );
}
