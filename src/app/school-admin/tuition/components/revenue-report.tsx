"use client";

/**
 * REVENUE REPORT COMPONENT
 *
 * Displays revenue statistics for tuition courses.
 * Shows total revenue, tutor earnings, platform fees, and monthly trends.
 */


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  DollarSign,
  GraduationCap,
  Building,
  Download,
  Calendar,
  BarChart3,
} from "lucide-react";

interface RevenueStats {
  totalRevenue: number;
  tutorEarnings: number;
  platformFees: number;
  pendingPayments: number;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  courseRevenue: Array<{ courseId: string; courseTitle: string; revenue: number }>;
}

interface RevenueReportProps {
  revenueStats: RevenueStats;
  onLoadData: () => void;
}

export function RevenueReport({ revenueStats, onLoadData }: RevenueReportProps) {
  const maxMonthlyRevenue = Math.max(...revenueStats.monthlyRevenue.map((m) => m.revenue), 1);

  const totalRevenue = revenueStats.totalRevenue;
  const tutorEarnings = revenueStats.tutorEarnings;
  const platformFees = revenueStats.platformFees;
  const tutorPercentage = totalRevenue > 0 ? Math.round((tutorEarnings / totalRevenue) * 100) : 0;
  const platformPercentage = totalRevenue > 0 ? Math.round((platformFees / totalRevenue) * 100) : 0;

  const handleExport = () => {
    const csvContent = [
      ["Month", "Revenue"],
      ...revenueStats.monthlyRevenue.map((m) => [m.month, m.revenue.toString()]),
      [],
      ["Course", "Revenue"],
      ...revenueStats.courseRevenue.map((c) => [c.courseTitle, c.revenue.toString()]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tuition-revenue-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Revenue Reports</h2>
          <p className="text-gray-600">Track tuition center earnings and payouts</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">Nu. {totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">Nu. {tutorEarnings.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Tutor Earnings ({tutorPercentage}%)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">Nu. {platformFees.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Platform Fees ({platformPercentage}%)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">Nu. {revenueStats.pendingPayments.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Distribution */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Distribution</CardTitle>
            <CardDescription>How revenue is split between tutors and platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Tutor Earnings Bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Tutor Earnings</span>
                  <span className="text-sm text-gray-600">Nu. {tutorEarnings.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-purple-600 h-3 rounded-full"
                    style={{ width: `${tutorPercentage}%` }}
                  />
                </div>
              </div>

              {/* Platform Fees Bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Platform Fees</span>
                  <span className="text-sm text-gray-600">Nu. {platformFees.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full"
                    style={{ width: `${platformPercentage}%` }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t text-sm text-gray-600">
                <p>Standard 80/20 split: 80% to tutors, 20% platform fee</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue Trend</CardTitle>
            <CardDescription>Revenue over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {revenueStats.monthlyRevenue.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No revenue data available</p>
              ) : (
                revenueStats.monthlyRevenue.map((month) => {
                  const percentage = (month.revenue / maxMonthlyRevenue) * 100;
                  return (
                    <div key={month.month} className="flex items-center gap-3">
                      <span className="w-16 text-sm text-gray-600">{month.month}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-purple-700 h-6 rounded-full flex items-center justify-end pr-2"
                          style={{ width: `${percentage}%` }}
                        >
                          {percentage > 10 && (
                            <span className="text-xs text-white font-medium">
                              Nu. {month.revenue.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Revenue Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Course</CardTitle>
          <CardDescription>Top performing courses by revenue</CardDescription>
        </CardHeader>
        <CardContent>
          {revenueStats.courseRevenue.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No course revenue data available</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Course</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Revenue</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueStats.courseRevenue
                    .sort((a, b) => b.revenue - a.revenue)
                    .slice(0, 10)
                    .map((course) => {
                      const percentage = totalRevenue > 0 ? (course.revenue / totalRevenue) * 100 : 0;
                      return (
                        <tr key={course.courseId} className="border-b border-gray-100">
                          <td className="py-3 px-4">{course.courseTitle}</td>
                          <td className="py-3 px-4 text-right font-semibold">
                            Nu. {course.revenue.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Badge variant="secondary">{percentage.toFixed(1)}%</Badge>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fee Collection Status */}
      <Card>
        <CardHeader>
          <CardTitle>Fee Collection Status</CardTitle>
          <CardDescription>Track payment collection from enrollments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">
                {revenueStats.monthlyRevenue.reduce((sum, m) => sum + (m.revenue > 0 ? 1 : 0), 0)}
              </p>
              <p className="text-sm text-green-700">Paid Enrollments</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-3xl font-bold text-yellow-600">
                {revenueStats.pendingPayments > 0 ? Math.ceil(revenueStats.pendingPayments / 500) : 0}
              </p>
              <p className="text-sm text-yellow-700">Pending Payments</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">
                {totalRevenue > 0 ? Math.round((totalRevenue - revenueStats.pendingPayments) / totalRevenue * 100) : 0}%
              </p>
              <p className="text-sm text-blue-700">Collection Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
