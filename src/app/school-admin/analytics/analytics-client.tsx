/**
 * ANALYTICS CLIENT COMPONENT
 *
 * Client-side component for school analytics with filtering.
 */

"use client";

import { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  Users,
  BookOpen,
  DollarSign,
  Award,
  AlertCircle,
  Calendar,
  ArrowUp,
  ArrowDown,
  Download,
} from "lucide-react";
import { fetchAnalytics } from "../_actions";
import type { AnalyticsData } from "@/lib/api/school-admin";

interface AnalyticsClientProps {
  initialData: AnalyticsData;
}

type TimePeriod = "week" | "month" | "quarter" | "year";

export function AnalyticsClient({ initialData }: AnalyticsClientProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("month");
  const [selectedMetric, setSelectedMetric] = useState<string>("overview");

  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<AnalyticsData>(initialData);
  const [loading, setLoading] = useState(false);

  // Fetch analytics with filters
  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const result = await fetchAnalytics();
      setData(result);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    startTransition(() => {
      loadAnalytics();
    });
  }, [timePeriod, selectedMetric]);

  // Calculate trend indicators (comparing with previous period)
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { isPositive: true, percentage: 0 };
    const change = ((current - previous) / previous) * 100;
    return {
      isPositive: change >= 0,
      percentage: Math.abs(Math.round(change)),
    };
  };

  const attendanceTrend = calculateTrend(data.averageAttendance, 85);
  const scoreTrend = calculateTrend(data.averageScore, 70);
  const feeTrend = calculateTrend(data.feeCollectionRate, 80);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">School Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive insights and metrics</p>
        </div>
        <div className="flex gap-2">
          <Select value={timePeriod} onValueChange={(v: TimePeriod) => setTimePeriod(v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" style={{ color: "rgb(139 92 246)" }}>
              {data.totalStudents}
            </div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <ArrowUp className="w-3 h-3 mr-1" />
              +12% from last year
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Avg Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" style={{ color: "rgb(139 92 246)" }}>
              {data.averageAttendance}%
            </div>
            <p
              className={`text-xs flex items-center mt-1 ${
                attendanceTrend.isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              {attendanceTrend.isPositive ? (
                <ArrowUp className="w-3 h-3 mr-1" />
              ) : (
                <ArrowDown className="w-3 h-3 mr-1" />
              )}
              {attendanceTrend.isPositive ? "+" : "-"}
              {attendanceTrend.percentage}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Avg Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" style={{ color: "rgb(139 92 246)" }}>
              {data.averageScore}%
            </div>
            <p
              className={`text-xs flex items-center mt-1 ${
                scoreTrend.isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              {scoreTrend.isPositive ? (
                <ArrowUp className="w-3 h-3 mr-1" />
              ) : (
                <ArrowDown className="w-3 h-3 mr-1" />
              )}
              {scoreTrend.isPositive ? "+" : "-"}
              {scoreTrend.percentage}% from last exam
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Fee Collection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" style={{ color: "rgb(139 92 246)" }}>
              {data.feeCollectionRate}%
            </div>
            <p
              className={`text-xs flex items-center mt-1 ${
                feeTrend.isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              {feeTrend.isPositive ? (
                <ArrowUp className="w-3 h-3 mr-1" />
              ) : (
                <ArrowDown className="w-3 h-3 mr-1" />
              )}
              {feeTrend.isPositive ? "+" : "-"}
              {feeTrend.percentage}% from last term
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Attendance Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Trends</CardTitle>
            <CardDescription>Daily attendance for the past 5 days</CardDescription>
          </CardHeader>
          <CardContent>
            {data.attendanceTrends.length > 0 ? (
              <div className="h-64 flex items-end justify-between gap-2">
                {data.attendanceTrends.map((trend, i) => (
                  <div key={trend.day} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t transition-all hover:opacity-80"
                      style={{
                        height: `${Math.max(trend.percentage, 10)}%`,
                        background: "linear-gradient(to top, rgb(139 92 246), rgb(124 58 237))",
                      }}
                    />
                    <span className="text-xs text-gray-600">{trend.day}</span>
                    <span className="text-xs font-medium text-gray-500">{trend.percentage}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No attendance data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance by Grade */}
        <Card>
          <CardHeader>
            <CardTitle>Performance by Grade</CardTitle>
            <CardDescription>Pass rate and average scores by grade level</CardDescription>
          </CardHeader>
          <CardContent>
            {data.performanceByGrade.length > 0 ? (
              <div className="space-y-3">
                {data.performanceByGrade.map((grade) => (
                  <div key={grade.grade} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Class {grade.grade}</span>
                      <span>{grade.passRate}% pass rate</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${grade.passRate}%`,
                          background: "linear-gradient(to right, rgb(139 92 246), rgb(124 58 237))",
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">Avg: {grade.avgScore}% • {grade.totalStudents} students</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-500">
                No exam results available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* More Analytics */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              Top Performers
            </CardTitle>
            <CardDescription>Students with highest scores</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topPerformers.length > 0 ? (
              <div className="space-y-3">
                {data.topPerformers.map((student, i) => (
                  <div key={student.id} className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        i === 0
                          ? "bg-yellow-100 text-yellow-700"
                          : i === 1
                          ? "bg-gray-100 text-gray-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{student.name}</p>
                      <p className="text-xs text-gray-500 truncate">{student.class}</p>
                    </div>
                    <span className="font-semibold text-sm" style={{ color: "rgb(139 92 246)" }}>
                      {student.score}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                No top performers data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Need Attention */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              Need Attention
            </CardTitle>
            <CardDescription>Students requiring intervention</CardDescription>
          </CardHeader>
          <CardContent>
            {data.studentsNeedingAttention.length > 0 ? (
              <div className="space-y-3">
                {data.studentsNeedingAttention.slice(0, 5).map((student) => (
                  <div
                    key={student.id}
                    className="p-2 bg-red-50 rounded-lg border border-red-100"
                  >
                    <p className="font-medium text-sm">{student.name}</p>
                    <p className="text-xs text-gray-600">{student.class}</p>
                    <p
                      className={`text-xs mt-1 ${
                        student.type === "attendance"
                          ? "text-yellow-600"
                          : student.type === "fees"
                          ? "text-red-600"
                          : "text-orange-600"
                      }`}
                    >
                      {student.issue}
                    </p>
                  </div>
                ))}
                {data.studentsNeedingAttention.length > 5 && (
                  <p className="text-xs text-gray-500 text-center">
                    +{data.studentsNeedingAttention.length - 5} more students
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                No students need attention
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fee Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              Fee Status
            </CardTitle>
            <CardDescription>Collection overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-center p-4 rounded-lg" style={{ background: "linear-gradient(135deg, rgb(239 246 255), rgb(219 234 254))" }}>
                <p className="text-3xl font-bold" style={{ color: "rgb(139 92 246)" }}>
                  {data.feeCollectionRate}%
                </p>
                <p className="text-sm text-gray-600">Collection Rate</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Paid</span>
                  <span className="text-green-600 font-medium">{data.feesPaid} students</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Partial</span>
                  <span className="text-yellow-600 font-medium">{data.feesPartial} students</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Pending</span>
                  <span className="text-red-600 font-medium">{data.feesPending} students</span>
                </div>
              </div>
              {data.totalRevenue > 0 && (
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Revenue</span>
                    <span className="font-bold" style={{ color: "rgb(139 92 246)" }}>
                      Nu. {data.totalRevenue.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <p className="text-sm text-gray-600">Loading analytics...</p>
          </div>
        </div>
      )}
    </div>
  );
}
