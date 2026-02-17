"use client";

/**
 * ATTENDANCE CLIENT COMPONENT
 *
 * Client-side component for attendance management with server actions.
 */


import { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  UserCheck,
  Search,
  Filter,
  Upload,
  Download,
  Calendar,
  Fingerprint,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchAttendanceRecords, markAttendance } from "../_actions";
import type { AttendanceRecord } from "@/lib/api/school-admin";

interface AttendanceClientProps {
  initialRecords: AttendanceRecord[];
  initialDate: string;
  initialClass: string;
  initialStatus: string;
  classOptions: string[];
  statusOptions: string[];
  totalStudents?: number;
}

export function AttendanceClient({
  initialRecords,
  initialDate,
  initialClass,
  initialStatus,
  classOptions,
  statusOptions,
  totalStudents = 0,
}: AttendanceClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState(initialClass);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [showMarkAttendanceModal, setShowMarkAttendanceModal] = useState(false);
  const [showKioskModeModal, setShowKioskModeModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const [isPending, startTransition] = useTransition();
  const [records, setRecords] = useState<AttendanceRecord[]>(initialRecords);
  const [loading, setLoading] = useState(false);

  // Fetch attendance data with filters
  const loadAttendance = async () => {
    setLoading(true);
    try {
      const result = await fetchAttendanceRecords({
        date: selectedDate,
        classId: selectedClass !== "All" ? selectedClass : undefined,
        status: selectedStatus !== "All" ? selectedStatus : undefined,
      });
      setRecords(result.records);
    } catch (error) {
      console.error("Failed to load attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [selectedDate, selectedStatus]);

  // Update URL when filters change
  const updateFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "All") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    router.push(`?${params.toString()}`);
  };

  const handleSearch = () => {
    loadAttendance();
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== "") {
        loadAttendance();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter attendance records by search query
  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      record.class.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.markedBy?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.entryMethod?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: "bg-green-100 text-green-700 border-green-200",
      pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const getMethodBadge = (method: string | null) => {
    if (!method) return null;
    const styles = {
      manual: "bg-blue-100 text-blue-700 border-blue-200",
      fingerprint: "bg-purple-100 text-purple-700 border-purple-200",
      csv_import: "bg-gray-100 text-gray-700 border-gray-200",
      app_check_in: "bg-green-100 text-green-700 border-green-200",
    };
    const labels = {
      manual: "Manual",
      fingerprint: "Fingerprint",
      csv_import: "CSV Import",
      app_check_in: "App Check-in",
    };
    return (
      <Badge className={styles[method as keyof typeof styles]} variant="outline">
        {labels[method as keyof typeof labels]}
      </Badge>
    );
  };

  // Calculate stats from real data
  const totalPresent = records.reduce((sum, r) => sum + r.present, 0);
  const totalAbsent = records.reduce((sum, r) => sum + r.absent, 0);
  const totalLate = records.reduce((sum, r) => sum + r.late, 0);
  const pendingCount = records.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-gray-600 mt-1">Track and manage student attendance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImportModal(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Button variant="outline" onClick={() => setShowKioskModeModal(true)}>
            <Fingerprint className="w-4 h-4 mr-2" />
            Kiosk Mode
          </Button>
          <Button
            style={{ background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)" }}
            onClick={() => setShowMarkAttendanceModal(true)}
          >
            <UserCheck className="w-4 h-4 mr-2" />
            Mark Attendance
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
                <p className="text-sm text-gray-500">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{totalPresent}</p>
                <p className="text-sm text-gray-500">Present Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{totalAbsent}</p>
                <p className="text-sm text-gray-500">Absent Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{totalLate}</p>
                <p className="text-sm text-gray-500">Late Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
                <p className="text-sm text-gray-500">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by class or teacher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                updateFilters({ date: e.target.value });
              }}
              className="w-auto"
            />

            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                updateFilters({ class: e.target.value });
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white min-h-[44px]"
            >
              {classOptions.map((cls) => (
                <option key={cls} value={cls}>
                  {cls === "All" ? "All Classes" : cls}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                updateFilters({ status: e.target.value });
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white min-h-[44px]"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === "All" ? "All Status" : status}
                </option>
              ))}
            </select>

            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Records */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>Daily attendance for all classes</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading attendance records...</div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No attendance records found for the selected criteria.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Class</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Students</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Attendance</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Marked By</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Method</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">{record.date}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">{record.class}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-900">{record.totalStudents} students</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="w-3 h-3" />
                            {record.present}
                          </span>
                          <span className="flex items-center gap-1 text-red-600">
                            <XCircle className="w-3 h-3" />
                            {record.absent}
                          </span>
                          <span className="flex items-center gap-1 text-yellow-600">
                            <Clock className="w-3 h-3" />
                            {record.late}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {record.markedBy ? (
                          <span className="text-gray-900">{record.markedBy}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">{getMethodBadge(record.entryMethod)}</td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusBadge(record.status)} variant="outline">
                          {record.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/school-admin/attendance/${record.id}`}>
                              <FileText className="w-4 h-4" />
                            </Link>
                          </Button>
                          {record.status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowMarkAttendanceModal(true)}
                              className="min-h-[36px]"
                            >
                              Mark Now
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mark Attendance Modal */}
      {showMarkAttendanceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Mark Attendance</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowMarkAttendanceModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6 space-y-6">
              {/* Select Class and Date */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Class *</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg min-h-[44px]">
                    {classOptions.filter((c) => c !== "All").map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <Input type="date" defaultValue={new Date().toISOString().split("T")[0]} />
                </div>
              </div>

              {/* Student List */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Student List</h3>
                <div className="space-y-2">
                  {[
                    { id: "STU001", name: "Tashi Dorji", roll: 1 },
                    { id: "STU002", name: "Karma Wangmo", roll: 2 },
                    { id: "STU003", name: "Pema Lhamo", roll: 3 },
                    { id: "STU004", name: "Dorji Wangchuk", roll: 4 },
                    { id: "STU005", name: "Sonam Yangdon", roll: 5 },
                  ].map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)" }}
                        >
                          <span className="text-white font-medium text-sm">
                            {student.name.split(" ").map((n) => n[0]).join("")}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{student.name}</p>
                          <p className="text-xs text-gray-500">Roll No: {student.roll}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:bg-green-50 has-[:checked]:bg-green-100 has-[:checked]:border-green-500 min-h-[44px]">
                          <input type="radio" name={`attendance-${student.id}`} value="present" defaultChecked className="w-4 h-4 text-green-600" />
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-sm">Present</span>
                        </label>
                        <label className="flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:bg-yellow-50 has-[:checked]:bg-yellow-100 has-[:checked]:border-yellow-500 min-h-[44px]">
                          <input type="radio" name={`attendance-${student.id}`} value="late" className="w-4 h-4 text-yellow-600" />
                          <Clock className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm">Late</span>
                        </label>
                        <label className="flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:bg-red-50 has-[:checked]:bg-red-100 has-[:checked]:border-red-500 min-h-[44px]">
                          <input type="radio" name={`attendance-${student.id}`} value="absent" className="w-4 h-4 text-red-600" />
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="text-sm">Absent</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                  Mark All Present
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <XCircle className="w-4 h-4 mr-2 text-red-600" />
                  Mark All Absent
                </Button>
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowMarkAttendanceModal(false)}>
                Cancel
              </Button>
              <Button
                style={{ background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)" }}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Save Attendance
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Kiosk Mode Modal */}
      {showKioskModeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Fingerprint
                  className="w-6 h-6"
                  style={{ color: "rgb(139 92 246)" }}
                />
                Kiosk Mode
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowKioskModeModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6 space-y-6">
              <div className="text-center">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)" }}
                >
                  <Fingerprint className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Fingerprint Check-In</h3>
                <p className="text-gray-600">
                  Students can scan their fingerprint to mark attendance. Place this device at the
                  school entrance.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg min-h-[44px]">
                  {classOptions.filter((c) => c !== "All").map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> Connect a fingerprint scanner to enable automatic check-in.
                  Students will be marked present upon scanning.
                </p>
              </div>
            </div>
            <div className="border-t px-6 py-4 flex justify-end">
              <Button
                className="w-full"
                style={{ background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)" }}
              >
                <Fingerprint className="w-4 h-4 mr-2" />
                Start Kiosk Mode
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Import Attendance</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowImportModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">Drag and drop your CSV file here, or</p>
                <Button variant="outline" size="sm" className="mx-auto">
                  Browse Files
                </Button>
                <p className="text-xs text-gray-500 mt-2">Supported format: CSV (Max 5MB)</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">CSV Format</h4>
                <code className="text-xs bg-blue-100 px-2 py-1 rounded block overflow-x-auto">
                  date, studentId, studentName, status, checkInTime, checkOutTime, notes
                </code>
              </div>

              <Button variant="outline" size="sm" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </div>
            <div className="border-t px-6 py-4 flex justify-end">
              <Button
                style={{ background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)" }}
                disabled
              >
                Import Attendance
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}