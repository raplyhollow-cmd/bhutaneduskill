"use client";

/**
 * ATTENDANCE REPORTS
 * Analytics and reporting for attendance data
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Calendar,
  TrendingDown,
  AlertTriangle,
  Download,
  Filter,
  BarChart3,
  PieChart,
} from "lucide-react";

export interface AttendanceSummary {
  studentId: string;
  studentName: string;
  rollNumber: string;
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  percentage: number;
  alertLevel?: "critical" | "warning" | "none";
}

export interface DailyAttendance {
  date: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
}

export interface AttendanceAlert {
  studentId: string;
  studentName: string;
  type: "critical" | "warning" | "info";
  message: string;
  days: number;
}

interface AttendanceReportsProps {
  classId: string;
  className: string;
  summary: AttendanceSummary[];
  dailyData: DailyAttendance[];
  alerts: AttendanceAlert[];
  onExport?: (type: "summary" | "daily" | "alerts") => void;
}

export function AttendanceReports({
  classId,
  className,
  summary,
  dailyData,
  alerts,
  onExport,
}: AttendanceReportsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "term">("month");
  const [selectedTab, setSelectedTab] = useState<"overview" | "students" | "alerts">("overview");

  // Calculate overall stats
  const overallStats = useMemo(() => {
    const totalStudents = summary.length;
    const avgAttendance =
      totalStudents > 0
        ? Math.round(summary.reduce((sum, s) => sum + s.percentage, 0) / totalStudents)
        : 0;

    const criticalStudents = alerts.filter((a) => a.type === "critical").length;
    const warningStudents = alerts.filter((a) => a.type === "warning").length;

    const todayRecord = dailyData[dailyData.length - 1];
    const todayPercentage = todayRecord
      ? Math.round((todayRecord.present / todayRecord.total) * 100)
      : 0;

    return {
      totalStudents,
      avgAttendance,
      criticalStudents,
      warningStudents,
      todayPercentage,
    };
  }, [summary, alerts, dailyData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Attendance Reports - {className}</h1>
              <p className="text-muted-foreground">Analytics and insights</p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm" onClick={() => onExport?.("summary")}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overallStats.avgAttendance}%</p>
                <p className="text-sm text-muted-foreground">Avg Attendance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overallStats.todayPercentage}%</p>
                <p className="text-sm text-muted-foreground">Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={overallStats.criticalStudents > 0 ? "border-red-200" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overallStats.criticalStudents}</p>
                <p className="text-sm text-muted-foreground">Critical</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overallStats.warningStudents}</p>
                <p className="text-sm text-muted-foreground">Warnings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as "overview" | "students" | "alerts")}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Student Details</TabsTrigger>
          <TabsTrigger value="alerts">Alerts ({alerts.length})</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Daily Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Attendance Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dailyData.slice(-7).map((day) => {
                  const percentage = Math.round((day.present / day.total) * 100);
                  return (
                    <div key={day.date}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>{new Date(day.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                        <span>{percentage}% ({day.present}/{day.total})</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Attendance Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: "Excellent (90%+)", color: "bg-green-500", count: summary.filter((s) => s.percentage >= 90).length },
                  { label: "Good (75-89%)", color: "bg-blue-500", count: summary.filter((s) => s.percentage >= 75 && s.percentage < 90).length },
                  { label: "Fair (60-74%)", color: "bg-yellow-500", count: summary.filter((s) => s.percentage >= 60 && s.percentage < 75).length },
                  { label: "Poor (<60%)", color: "bg-red-500", count: summary.filter((s) => s.percentage < 60).length },
                ].map((bucket) => (
                  <div key={bucket.label} className="text-center">
                    <div className={`w-16 h-16 mx-auto rounded-lg ${bucket.color} flex items-center justify-center`}>
                      <span className="text-2xl font-bold text-white">{bucket.count}</span>
                    </div>
                    <p className="text-sm mt-2">{bucket.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Student Attendance Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Roll No</th>
                      <th className="text-left py-3 px-4">Name</th>
                      <th className="text-center py-3 px-4">Present</th>
                      <th className="text-center py-3 px-4">Absent</th>
                      <th className="text-center py-3 px-4">Late</th>
                      <th className="text-center py-3 px-4">Excused</th>
                      <th className="text-center py-3 px-4">Percentage</th>
                      <th className="text-left py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.map((student) => (
                      <tr key={student.studentId} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">{student.rollNumber}</td>
                        <td className="py-3 px-4">{student.studentName}</td>
                        <td className="py-3 px-4 text-center text-green-600">{student.present}</td>
                        <td className="py-3 px-4 text-center text-red-600">{student.absent}</td>
                        <td className="py-3 px-4 text-center text-yellow-600">{student.late}</td>
                        <td className="py-3 px-4 text-center text-blue-600">{student.excused}</td>
                        <td className="py-3 px-4 text-center font-medium">{student.percentage}%</td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              student.percentage >= 75
                                ? "default"
                                : student.percentage >= 60
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {student.percentage >= 75
                              ? "Good"
                              : student.percentage >= 60
                              ? "Warning"
                              : "Critical"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No alerts</p>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div
                      key={alert.studentId}
                      className={`p-4 rounded-lg border ${
                        alert.type === "critical"
                          ? "bg-red-50 border-red-200"
                          : alert.type === "warning"
                          ? "bg-yellow-50 border-yellow-200"
                          : "bg-blue-50 border-blue-200"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{alert.studentName}</p>
                          <p className="text-sm mt-1">{alert.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {alert.days} consecutive days affected
                          </p>
                        </div>
                        <Badge
                          variant={
                            alert.type === "critical"
                              ? "destructive"
                              : alert.type === "warning"
                              ? "secondary"
                              : "default"
                          }
                        >
                          {alert.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
