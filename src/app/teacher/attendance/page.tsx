"use client";

import { logger } from "@/lib/logger";

/**
 * TEACHER ATTENDANCE PAGE
 * Take and manage student attendance
 *
 * Features:
 * - Take daily attendance for assigned classes
 * - View attendance history and reports
 * - Export attendance data as CSV
 * - Add attendance notes for individual students
 */

import { useState, useEffect, useMemo } from "react";
import { PortalHeader } from "@/components/shared/portal-sidebar";
import { AttendanceTracker, Student, AttendanceRecord } from "@/components/attendance";
import { AttendanceReports, AttendanceSummary, DailyAttendance, AttendanceAlert } from "@/components/attendance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Calendar, Clock, Users, Loader2, AlertCircle, Download, History, FileText, BarChart3 } from "lucide-react";

interface ClassData {
  id: string;
  name: string;
  grade: number;
  section: string;
  students: Student[];
  subject?: string;
}

// API response types for teacher attendance
interface ApiClassResponse {
  classId: string;
  className?: string;
  name?: string;
  grade?: number;
  section?: string;
  subject?: string;
  students?: ApiStudentResponse[];
  id: string; // For use in the UI
  studentsCount?: number; // For displaying student count
}

interface ApiStudentResponse {
  id: string;
  name: string;
  rollNumber?: string;
  classId: string;
  section?: string;
}

interface AttendanceHistoryData {
  students: AttendanceSummary[];
  dailyData: DailyAttendance[];
  summary: {
    totalStudents: number;
    avgAttendance: number;
    criticalCount: number;
    warningCount: number;
  };
}

interface AttendanceRecordWithStudent extends AttendanceRecord {
  id: string;
  studentName?: string;
  studentRollNumber?: string;
  date?: string;
}

export default function TeacherAttendancePage() {
  // View state
  const [activeTab, setActiveTab] = useState<"take" | "history" | "reports">("take");

  // Data state
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [originalClasses, setOriginalClasses] = useState<ApiClassResponse[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  // Attendance taking state
  const [existingAttendance, setExistingAttendance] = useState<AttendanceRecord[]>([]);

  // History state
  const [historyData, setHistoryData] = useState<AttendanceHistoryData | null>(null);
  const [recentRecords, setRecentRecords] = useState<AttendanceRecordWithStudent[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Fetch teacher's classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/teacher/attendance");
        if (!response.ok) {
          throw new Error("Failed to fetch classes");
        }
        const data = await response.json();

        // Transform API data to ClassData format
        // API should return class info directly, use it from the response
        const classData: ClassData[] = data.classes.map((cls: ApiClassResponse) => ({
          id: cls.classId,
          name: cls.className || cls.name || "",
          grade: cls.grade || 0,
          section: cls.section || "",
          subject: cls.subject || "Class",
          students: cls.students?.map((s: ApiStudentResponse) => ({
            id: s.id,
            name: s.name,
            rollNumber: s.rollNumber || "",
            classId: cls.classId,
            section: cls.section || "",
          })) || [],
        }));

        setClasses(classData);
        setOriginalClasses(data.classes);
      } catch (err) {
        logger.error("Error fetching classes:", err);
        setError("Failed to load classes. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchClasses();
  }, []);

  // Fetch attendance history when class is selected and history tab is active
  useEffect(() => {
    if (selectedClass && activeTab === "history") {
      const fetchHistory = async () => {
        try {
          setIsLoadingHistory(true);
          const response = await fetch(
            `/api/teacher/attendance/history?classId=${selectedClass.id}&summary=true&limit=100`
          );
          if (response.ok) {
            const data = await response.json();
            setHistoryData(data);
          }
        } catch (err) {
          logger.error("Error fetching history:", err);
        } finally {
          setIsLoadingHistory(false);
        }
      };

      fetchHistory();
    }
  }, [selectedClass, activeTab]);

  // Fetch recent attendance records for the selected class
  useEffect(() => {
    if (selectedClass && activeTab === "history") {
      const fetchRecentRecords = async () => {
        try {
          const response = await fetch(
            `/api/teacher/attendance/history?classId=${selectedClass.id}&limit=50`
          );
          if (response.ok) {
            const data = await response.json();
            const recordsWithStudent = data.records.map((r: AttendanceRecord & { student: { name: string; rollNumber: string } }) => ({
              ...r,
              studentName: r.student?.name,
              studentRollNumber: r.student?.rollNumber,
            }));
            setRecentRecords(recordsWithStudent);
          }
        } catch (err) {
          logger.error("Error fetching recent records:", err);
        }
      };

      fetchRecentRecords();
    }
  }, [selectedClass, activeTab]);

  // Generate alerts from history data
  const alerts = useMemo(() => {
    if (!historyData) return [];
    const studentAlerts: AttendanceAlert[] = [];

    historyData.students.forEach((student) => {
      if (student.alertLevel === "critical") {
        studentAlerts.push({
          studentId: student.studentId,
          studentName: student.studentName,
          type: "critical",
          message: `${student.studentName} has ${student.absent} absences and only ${student.percentage}% attendance`,
          days: student.absent,
        });
      } else if (student.alertLevel === "warning") {
        studentAlerts.push({
          studentId: student.studentId,
          studentName: student.studentName,
          type: "warning",
          message: `${student.studentName} is at ${student.percentage}% attendance threshold`,
          days: student.absent,
        });
      }
    });

    return studentAlerts;
  }, [historyData]);

  // Export attendance history as CSV
  const exportHistoryCSV = () => {
    if (!historyData) return;

    const headers = ["Roll Number", "Name", "Total Days", "Present", "Absent", "Late", "Excused", "Percentage", "Status"];
    const rows = historyData.students.map((s) => {
      const status = s.percentage >= 75 ? "Good" : s.percentage >= 60 ? "Warning" : "Critical";
      return [s.rollNumber, s.studentName, s.totalDays.toString(), s.present.toString(), s.absent.toString(), s.late.toString(), s.excused.toString(), `${s.percentage}%`, status];
    });

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-history-${selectedClass?.name}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  // Export daily attendance as CSV
  const exportDailyCSV = () => {
    if (!historyData) return;

    const headers = ["Date", "Total Students", "Present", "Absent", "Late", "Excused", "Percentage"];
    const rows = historyData.dailyData.map((d) => {
      const percentage = d.total > 0 ? Math.round(((d.present + d.excused) / d.total) * 100) : 0;
      return [d.date, d.total.toString(), d.present.toString(), d.absent.toString(), d.late.toString(), d.excused.toString(), `${percentage}%`];
    });

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `daily-attendance-${selectedClass?.name}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  // Fetch existing attendance when class and date are selected
  useEffect(() => {
    if (selectedClass && selectedDate) {
      const fetchAttendance = async () => {
        try {
          const response = await fetch(`/api/teacher/attendance/${selectedClass.id}/${selectedDate}`);
          if (response.ok) {
            const data = await response.json();
            // Transform API data to AttendanceRecord format
            const records: AttendanceRecord[] = data.students
              .filter((s: { attendance: unknown }) => s.attendance)
              .map((s: {
                student: { id: string };
                attendance: {
                  status: string;
                  notes?: string;
                  reason?: string;
                  checkInTime?: string;
                  checkOutTime?: string;
                };
              }) => ({
                studentId: s.student.id,
                status: s.attendance.status,
                notes: s.attendance.notes || s.attendance.reason || "",
                timeIn: s.attendance.checkInTime || undefined,
                timeOut: s.attendance.checkOutTime || undefined,
              }));
            setExistingAttendance(records);
          } else {
            setExistingAttendance([]);
          }
        } catch (err) {
          logger.error("Error fetching attendance:", err);
          setExistingAttendance([]);
        }
      };

      fetchAttendance();
    }
  }, [selectedClass, selectedDate]);

  const handleSave = async (sessionId: string, records: AttendanceRecord[]) => {
    if (!selectedClass) return;

    try {
      setSaveError(null);
      const response = await fetch(`/api/teacher/attendance/${selectedClass.id}/${selectedDate}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendance: records.map((r) => ({
            studentId: r.studentId,
            status: r.status,
            notes: r.notes || "",
            reason: r.notes || "",
          })),
        }),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to save attendance");
        }
        throw new Error(`Failed to save attendance (${response.status})`);
      }

      const result = await response.json();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      // Refresh existing attendance
      const attendanceResponse = await fetch(`/api/teacher/attendance/${selectedClass.id}/${selectedDate}`);
      if (attendanceResponse.ok) {
        const data = await attendanceResponse.json();
        const attendanceRecords: AttendanceRecord[] = data.students
          .filter((s: { attendance: unknown }) => s.attendance)
          .map((s: {
            student: { id: string };
            attendance: {
              status: string;
              notes?: string;
              reason?: string;
              checkInTime?: string;
              checkOutTime?: string;
            };
          }) => ({
            studentId: s.student.id,
            status: s.attendance.status,
            notes: s.attendance.notes || s.attendance.reason || "",
            timeIn: s.attendance.checkInTime || undefined,
            timeOut: s.attendance.checkOutTime || undefined,
          }));
        setExistingAttendance(attendanceRecords);
      }

      return Promise.resolve();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save attendance";
      setSaveError(message);
      throw err;
    }
  };

  if (selectedClass) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PortalHeader userType="teacher" userName="Teacher" title={`Attendance - ${selectedClass.name}`} />
        <div className="lg:ml-64 p-6">
          {/* Header with back button and class selector */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <Button variant="outline" onClick={() => {
                    setSelectedClass(null);
                    setHistoryData(null);
                    setRecentRecords([]);
                    setActiveTab("take");
                  }}>
                    ← Back
                  </Button>
                  <div>
                    <h2 className="text-lg font-semibold">{selectedClass.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      Grade {selectedClass.grade} - {selectedClass.section || "No Section"} • {selectedClass.students.length} students
                    </p>
                  </div>
                </div>

                {saveSuccess && (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Saved successfully
                  </Badge>
                )}

                {saveError && (
                  <Badge variant="destructive">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {saveError}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tabs for different views */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "take" | "history" | "reports")}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="take">
                <Calendar className="w-4 h-4 mr-2" />
                Take Attendance
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="w-4 h-4 mr-2" />
                History
              </TabsTrigger>
              <TabsTrigger value="reports">
                <BarChart3 className="w-4 h-4 mr-2" />
                Reports
              </TabsTrigger>
            </TabsList>

            {/* Take Attendance Tab */}
            <TabsContent value="take">
              <div className="mb-4 flex items-center gap-4">
                <label className="text-sm font-medium">Select Date:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border rounded-md px-3 py-2"
                />
                {existingAttendance.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {existingAttendance.length} records loaded
                  </Badge>
                )}
              </div>

              <AttendanceTracker
                classId={selectedClass.id}
                className={selectedClass.name}
                subject={selectedClass.subject || "Class"}
                students={selectedClass.students}
                date={selectedDate}
                existingRecords={existingAttendance}
                onSave={handleSave}
              />
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history">
              {isLoadingHistory ? (
                <Card>
                  <CardContent className="pt-6 flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-muted-foreground">Loading attendance history...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  {historyData && (
                    <div className="grid grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Users className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{historyData.summary.totalStudents}</p>
                              <p className="text-sm text-muted-foreground">Total Students</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              <BarChart3 className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{historyData.summary.avgAttendance}%</p>
                              <p className="text-sm text-muted-foreground">Avg Attendance</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className={historyData.summary.criticalCount > 0 ? "border-red-200" : ""}>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                              <AlertCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{historyData.summary.criticalCount}</p>
                              <p className="text-sm text-muted-foreground">Critical</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                              <AlertCircle className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{historyData.summary.warningCount}</p>
                              <p className="text-sm text-muted-foreground">Warnings</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Recent Attendance Records */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Recent Attendance Records</CardTitle>
                        <Button variant="outline" size="sm" onClick={() => {
                          // Trigger a refresh
                          const fetchData = async () => {
                            const response = await fetch(`/api/teacher/attendance/history?classId=${selectedClass.id}&limit=50`);
                            if (response.ok) {
                              const data = await response.json();
                              const recordsWithStudent = data.records.map((r: AttendanceRecord & { student: { name: string; rollNumber: string } }) => ({
                                ...r,
                                studentName: r.student?.name,
                                studentRollNumber: r.student?.rollNumber,
                              }));
                              setRecentRecords(recordsWithStudent);
                            }
                          };
                          fetchData();
                        }}>
                          Refresh
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-3 px-4">Date</th>
                              <th className="text-left py-3 px-4">Student</th>
                              <th className="text-left py-3 px-4">Roll No</th>
                              <th className="text-center py-3 px-4">Status</th>
                              <th className="text-left py-3 px-4">Notes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recentRecords.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="py-8 text-center text-muted-foreground">
                                  No attendance records found
                                </td>
                              </tr>
                            ) : (
                              recentRecords.slice(0, 20).map((record) => (
                                <tr key={record.id} className="border-b hover:bg-muted/50">
                                  <td className="py-3 px-4">{record.date}</td>
                                  <td className="py-3 px-4">{record.studentName || "Unknown"}</td>
                                  <td className="py-3 px-4">{record.studentRollNumber || "N/A"}</td>
                                  <td className="py-3 px-4 text-center">
                                    <Badge
                                      variant={
                                        record.status === "present"
                                          ? "default"
                                          : record.status === "absent"
                                          ? "destructive"
                                          : record.status === "late"
                                          ? "secondary"
                                          : "outline"
                                      }
                                    >
                                      {record.status}
                                    </Badge>
                                  </td>
                                  <td className="py-3 px-4 text-sm text-muted-foreground">
                                    {record.notes || "-"}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports">
              {historyData ? (
                <>
                  <div className="mb-6 flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={exportHistoryCSV}>
                      <Download className="w-4 h-4 mr-2" />
                      Export Student Summary
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportDailyCSV}>
                      <Download className="w-4 h-4 mr-2" />
                      Export Daily Report
                    </Button>
                  </div>

                  <AttendanceReports
                    classId={selectedClass.id}
                    className={selectedClass.name}
                    summary={historyData.students}
                    dailyData={historyData.dailyData}
                    alerts={alerts}
                    onExport={(type) => {
                      if (type === "summary") exportHistoryCSV();
                      if (type === "daily") exportDailyCSV();
                    }}
                  />
                </>
              ) : (
                <Card>
                  <CardContent className="pt-6 flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <FileText className="w-12 h-12 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No attendance data available. Go to the History tab first to load data.
                      </p>
                      <Button variant="outline" onClick={() => setActiveTab("history")}>
                        Go to History
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalHeader userType="teacher" userName="Teacher" title="Take Attendance" />
      <div className="lg:ml-64 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Take Attendance</h1>
          <p className="text-muted-foreground">Select a class to take attendance</p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="pt-6 flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading classes...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6 flex items-center gap-4 py-6">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div>
                <p className="font-medium text-red-900">Error Loading Classes</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <Button variant="outline" size="sm" className="ml-auto" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Date Selector */}
        {!isLoading && !error && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium">Select Date:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border rounded-md px-3 py-2"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Class Cards */}
        {!isLoading && !error && classes.length === 0 && (
          <Card>
            <CardContent className="pt-6 py-12 text-center">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No classes assigned yet.</p>
              <p className="text-sm text-muted-foreground mt-2">Contact your school administrator to get class assignments.</p>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && classes.length > 0 && (
          <div className="grid md:grid-cols-3 gap-4">
            {classes.map((cls: ClassData) => (
              <Card
                key={cls.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedClass(cls)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{
                        background: "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)"
                      }}
                    >
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{cls.name}</h3>
                      <p className="text-sm text-muted-foreground">Grade {cls.grade} - {cls.section || "No Section"}</p>
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{cls.students?.length || 0} students</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full mt-4"
                    style={{
                      background: "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)"
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Open Attendance
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Check-In Kiosk Link */}
        {!isLoading && !error && (
          <Card
            className="mt-6 text-white"
            style={{
              background: "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)"
            }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Self Check-In Kiosk</h3>
                  <p className="text-white/80 text-sm">
                    Allow students to check in themselves using QR codes or biometric
                  </p>
                </div>
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-white/90"
                  onClick={() => setActiveTab("take")}
                >
                  <Clock className="w-5 h-5 mr-2" />
                  Open Kiosk
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
