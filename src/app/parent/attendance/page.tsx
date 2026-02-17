"use client";

/**
 * PARENT ATTENDANCE PAGE
 *
 * Fetches real attendance data from database API
 */


import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChildSelector, Child } from "@/components/parent/child-selector";
import {
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  TrendingUp,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

interface AttendanceRecord {
  date: string;
  status: "present" | "absent" | "late" | "excused";
  checkIn?: string;
  checkOut?: string;
}

interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  percentage: number;
}

export default function ParentAttendancePage() {
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    percentage: 0,
  });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);

  // Fetch children and attendance data
  useEffect(() => {
    async function loadData() {
      try {
        // Fetch children from parent API
        const childrenRes = await fetch("/api/parent/children");
        if (!childrenRes.ok) throw new Error("Failed to fetch children");
        const childrenData = await childrenRes.json();

        if (childrenData.children && childrenData.children.length > 0) {
          setChildren(childrenData.children);
          setSelectedChild(childrenData.children[0]);
          await fetchAttendance(childrenData.children[0].id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Fetch attendance for selected child
  async function fetchAttendance(childId: string) {
    try {
      const response = await fetch(`/api/parent/attendance?childId=${childId}`);
      if (!response.ok) throw new Error("Failed to fetch attendance");
      const data = await response.json();

      setAttendance(data.attendance || []);
      calculateStats(data.attendance || []);
    } catch (error) {
      console.error("Error loading attendance:", error);
      setAttendance([]);
      setAttendanceStats({
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        percentage: 0,
      });
    } finally {
      setLoading(false);
    }
  }

  // Handle child selection change
  async function handleChildChange(child: Child) {
    setSelectedChild(child);
    setLoading(true);
    await fetchAttendance(child.id);
  }

  // Calculate statistics from attendance data
  function calculateStats(data: AttendanceRecord[]) {
    const total = data.length;
    const present = data.filter((a) => a.status === "present").length;
    const absent = data.filter((a) => a.status === "absent").length;
    const late = data.filter((a) => a.status === "late").length;
    const excused = data.filter((a) => a.status === "excused").length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    setAttendanceStats({ total, present, absent, late, excused, percentage });
  }

  const getStatusBadge = (status: string) => {
    const config = {
      present: { label: "Present", color: "bg-green-100 text-green-700", icon: CheckCircle },
      absent: { label: "Absent", color: "bg-red-100 text-red-700", icon: XCircle },
      late: { label: "Late", color: "bg-yellow-100 text-yellow-700", icon: Clock },
      excused: { label: "Excused", color: "bg-blue-100 text-blue-700", icon: Calendar },
    };
    const { label, color, icon: Icon } = config[status as keyof typeof config] || config.present;
    return (
      <Badge className={color}>
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const getMonthData = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return {
      year,
      month,
      daysInMonth,
      startingDayOfWeek,
      monthName: date.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    };
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentMonth);
    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentMonth(newDate);
  };

  const monthData = getMonthData(currentMonth);

  const getAttendanceForDate = (day: number) => {
    const dateStr = `${monthData.year}-${String(monthData.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return attendance.find((a) => a.date === dateStr);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  // No children state
  if (children.length === 0) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Children Found</h3>
              <p className="text-gray-600 mb-6">
                Please add your children to view their attendance records.
              </p>
              <Button asChild>
                <Link href="/parent/children">Add Child</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Attendance Records
        </h1>
        <p className="text-gray-600">
          Monitor {selectedChild?.name || "your child"}&apos;s attendance and patterns
        </p>
      </div>

      {/* Child Selector */}
      {children.length > 0 && (
        <ChildSelector
          children={children}
          selectedChildId={selectedChild?.id || ""}
          onChildChange={handleChildChange}
        />
      )}

      {/* Attendance Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="col-span-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Attendance Rate</p>
                <p
                  className="text-3xl font-bold"
                  style={{ color: "rgb(107 114 128)" }}
                >
                  {attendanceStats.percentage}%
                </p>
              </div>
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)",
                }}
              >
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
            </div>
            {attendanceStats.percentage < 80 && (
              <div className="mt-3 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">
                <AlertTriangle className="w-4 h-4" />
                <span>Attention needed - Below 80%</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold text-green-600">
                {attendanceStats.present}
              </p>
              <p className="text-sm text-gray-500">Present</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
              <p className="text-2xl font-bold text-red-600">
                {attendanceStats.absent}
              </p>
              <p className="text-sm text-gray-500">Absent</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-2xl font-bold text-yellow-600">
                {attendanceStats.late}
              </p>
              <p className="text-sm text-gray-500">Late</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" style={{ color: "rgb(107 114 128)" }} />
                Attendance Calendar
              </CardTitle>
              <CardDescription>Visual overview of monthly attendance</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => navigateMonth("prev")}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium min-w-[150px] text-center">
                {monthData.monthName}
              </span>
              <Button variant="outline" size="icon" onClick={() => navigateMonth("next")}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500" />
              <span>Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500" />
              <span>Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500" />
              <span>Late</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500" />
              <span>Excused</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-200" />
              <span>No Data</span>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center text-sm text-gray-500 py-2 font-medium"
              >
                {day}
              </div>
            ))}

            {/* Empty cells for days before the first day of month */}
            {[...Array(monthData.startingDayOfWeek)].map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Days of the month */}
            {Array.from({ length: monthData.daysInMonth }, (_, i) => {
              const day = i + 1;
              const attendanceRecord = getAttendanceForDate(day);
              const isToday =
                new Date().toISOString().startsWith(
                  `${monthData.year}-${String(monthData.month + 1).padStart(2, "0")}`
                ) && new Date().getDate() === day;

              return (
                <div
                  key={day}
                  className={`aspect-square rounded-lg flex items-center justify-center text-sm relative
                    ${isToday ? "ring-2 ring-offset-1 ring-gray-400" : ""}
                    ${attendanceRecord?.status === "absent" ? "bg-red-100" : ""}
                    ${attendanceRecord?.status === "present" ? "bg-green-100" : ""}
                    ${attendanceRecord?.status === "late" ? "bg-yellow-100" : ""}
                    ${attendanceRecord?.status === "excused" ? "bg-blue-100" : ""}
                    ${!attendanceRecord ? "bg-gray-50" : ""}
                  `}
                >
                  <span className={isToday ? "font-bold" : ""}>{day}</span>
                  {attendanceRecord && (
                    <div
                      className={`absolute bottom-1 w-2 h-2 rounded-full ${
                        attendanceRecord.status === "present"
                          ? "bg-green-500"
                          : attendanceRecord.status === "absent"
                          ? "bg-red-500"
                          : attendanceRecord.status === "late"
                          ? "bg-yellow-500"
                          : "bg-blue-500"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Attendance History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
          <CardDescription>Detailed attendance records for the current term</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Day</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Check In
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Check Out
                  </th>
                </tr>
              </thead>
              <tbody>
                {attendance.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      No attendance records found for the selected period.
                    </td>
                  </tr>
                ) : (
                  attendance.slice(0, 15).map((record, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        {new Date(record.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(record.date).toLocaleDateString("en-US", {
                          weekday: "long",
                        })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {getStatusBadge(record.status)}
                      </td>
                      <td className="py-3 px-4">
                        {record.checkIn || <span className="text-gray-400">—</span>}
                      </td>
                      <td className="py-3 px-4">
                        {record.checkOut || <span className="text-gray-400">—</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Load More Button */}
          {attendance.length > 15 && (
            <div className="mt-4 text-center">
              <Button variant="outline">Load More Records</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendance Insights */}
      <Card
        className="border-2"
        style={{
          borderColor: "rgb(107 114 128)",
          background:
            "linear-gradient(to right, rgb(249 250 251), rgb(243 244 246))",
        }}
      >
        <CardHeader>
          <CardTitle
            className="flex items-center gap-2"
            style={{ color: "rgb(55 65 81)" }}
          >
            <TrendingUp className="w-5 h-5" />
            Attendance Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Good attendance pattern</p>
              <p className="text-sm text-gray-600">
                {selectedChild?.name || "Your child"} has maintained consistent attendance this
                term.
              </p>
            </div>
          </div>
          {attendanceStats.late > 0 && (
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Occasional late arrivals</p>
                <p className="text-sm text-gray-600">
                  Consider adjusting morning routine to help arrive on time.
                </p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Keep it up!</p>
              <p className="text-sm text-gray-600">
                Regular attendance is key to academic success. Continue supporting{" "}
                {selectedChild?.name || "your child"}&apos;s learning journey.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Back to Dashboard */}
      <div className="pt-4">
        <Button variant="outline" asChild>
          <Link href="/parent">← Back to Parent Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
