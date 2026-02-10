/**
 * PARENT ATTENDANCE PAGE
 *
 * Allows parents to view their child's attendance records, including:
 * - Attendance calendar view
 * - Attendance statistics (present, absent, late, excused)
 * - Monthly summary
 * - Attendance history table
 */

"use client";

import { useState } from "react";
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

// Mock children data - will be replaced with real data from API
const mockChildren: Child[] = [
  {
    id: "child1",
    name: "Tashi Dorji",
    firstName: "Tashi",
    grade: "Class 10",
    school: "Yangchenphug HSS",
  },
  {
    id: "child2",
    name: "Pema Lhamo",
    firstName: "Pema",
    grade: "Class 8",
    school: "Motithang HSS",
  },
];

// Mock attendance data
const generateMockAttendance = (childId: string) => {
  const statuses = ["present", "present", "present", "present", "present", "late", "absent", "excused"];
  const attendance = [];

  for (let i = 0; i < 60; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      // Skip weekends
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      attendance.push({
        date: date.toISOString().split("T")[0],
        status,
        checkIn: status !== "absent" && status !== "excused" ? `08:${Math.floor(Math.random() * 30) + 30}` : null,
        checkOut: status !== "absent" && status !== "excused" ? `15:30` : null,
      });
    }
  }
  return attendance;
};

const getAttendanceStats = (attendance: typeof mockAttendance) => {
  const total = attendance.length;
  const present = attendance.filter((a) => a.status === "present").length;
  const absent = attendance.filter((a) => a.status === "absent").length;
  const late = attendance.filter((a) => a.status === "late").length;
  const excused = attendance.filter((a) => a.status === "excused").length;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

  return { total, present, absent, late, excused, percentage };
};

const mockAttendance = generateMockAttendance("child1");
const attendanceStats = getAttendanceStats(mockAttendance);

export default function ParentAttendancePage() {
  const [selectedChild, setSelectedChild] = useState<Child>(mockChildren[0]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getStatusBadge = (status: string) => {
    const config = {
      present: { label: "Present", color: "bg-green-100 text-green-700", icon: CheckCircle },
      absent: { label: "Absent", color: "bg-red-100 text-red-700", icon: XCircle },
      late: { label: "Late", color: "bg-yellow-100 text-yellow-700", icon: Clock },
      excused: { label: "Excused", color: "bg-blue-100 text-blue-700", icon: Calendar },
    };
    const { label, color, icon: Icon } = config[status as keyof typeof config];
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

    return { year, month, daysInMonth, startingDayOfWeek, monthName: date.toLocaleDateString("en-US", { month: "long", year: "numeric" }) };
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
    return mockAttendance.find((a) => a.date === dateStr);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Attendance Records
        </h1>
        <p className="text-gray-600">
          Monitor {selectedChild.name}&apos;s attendance and patterns
        </p>
      </div>

      {/* Child Selector */}
      <ChildSelector
        children={mockChildren}
        selectedChildId={selectedChild.id}
        onChildChange={setSelectedChild}
      />

      {/* Attendance Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="col-span-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Attendance Rate</p>
                <p className="text-3xl font-bold" style={{ color: "rgb(107 114 128)" }}>
                  {attendanceStats.percentage}%
                </p>
              </div>
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)" }}
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
              <p className="text-2xl font-bold text-green-600">{attendanceStats.present}</p>
              <p className="text-sm text-gray-500">Present</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
              <p className="text-2xl font-bold text-red-600">{attendanceStats.absent}</p>
              <p className="text-sm text-gray-500">Absent</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-2xl font-bold text-yellow-600">{attendanceStats.late}</p>
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
              <div key={day} className="text-center text-sm text-gray-500 py-2 font-medium">
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
              const attendance = getAttendanceForDate(day);
              const isToday =
                new Date().toISOString().startsWith(
                  `${monthData.year}-${String(monthData.month + 1).padStart(2, "0")}`
                ) && new Date().getDate() === day;

              return (
                <div
                  key={day}
                  className={`aspect-square rounded-lg flex items-center justify-center text-sm relative
                    ${isToday ? "ring-2 ring-offset-1 ring-gray-400" : ""}
                    ${attendance?.status === "absent" ? "bg-red-100" : ""}
                    ${attendance?.status === "present" ? "bg-green-100" : ""}
                    ${attendance?.status === "late" ? "bg-yellow-100" : ""}
                    ${attendance?.status === "excused" ? "bg-blue-100" : ""}
                    ${!attendance ? "bg-gray-50" : ""}
                  `}
                >
                  <span className={isToday ? "font-bold" : ""}>{day}</span>
                  {attendance && (
                    <div
                      className={`absolute bottom-1 w-2 h-2 rounded-full ${
                        attendance.status === "present"
                          ? "bg-green-500"
                          : attendance.status === "absent"
                          ? "bg-red-500"
                          : attendance.status === "late"
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
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Day</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Check In</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Check Out</th>
                </tr>
              </thead>
              <tbody>
                {mockAttendance.slice(0, 15).map((record, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {new Date(record.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(record.date).toLocaleDateString("en-US", { weekday: "long" })}
                    </td>
                    <td className="py-3 px-4 text-center">{getStatusBadge(record.status)}</td>
                    <td className="py-3 px-4">
                      {record.checkIn || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="py-3 px-4">
                      {record.checkOut || <span className="text-gray-400">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Load More Button */}
          <div className="mt-4 text-center">
            <Button variant="outline">Load More Records</Button>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Insights */}
      <Card
        className="border-2"
        style={{ borderColor: "rgb(107 114 128)", background: "linear-gradient(to right, rgb(249 250 251), rgb(243 244 246))" }}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: "rgb(55 65 81)" }}>
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
                {selectedChild.name} has maintained consistent attendance this term.
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
                Regular attendance is key to academic success. Continue supporting {selectedChild.name}&apos;s learning journey.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Back to Dashboard */}
      <div className="pt-4">
        <Button variant="outline" asChild>
          <Link href="/parent">
            ← Back to Parent Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
