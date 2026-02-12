/**
 * PLATFORM ADMIN - ANALYTICS DASHBOARD
 *
 * Platform-wide analytics and insights dashboard.
 * View trends, engagement metrics, and school performance.
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  Download,
  ArrowUp,
  ArrowDown,
  Filter,
  Search,
  School,
  Eye,
  CheckCircle,
  Sparkles,
  Target,
} from "lucide-react";
import Link from "next/link";
import { AIInsightCard } from "@/components/ai/ai-insight-card";

interface SchoolEngagementData {
  id: string;
  name: string;
  studentCount: number;
  assessmentCompletion: number;
  revenue: number;
  growth: number;
}

interface CareerInterestData {
  career: string;
  count: number;
  percentage: number;
  trend: "up" | "down" | "stable";
}

interface TimeSeriesData {
  period: string;
  students: number;
  assessments: number;
  revenue: number;
}

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [selectedMetric, setSelectedMetric] = useState<string>("overview");

  // Mock data - would come from API
  const [schoolEngagement, setSchoolEngagement] = useState<SchoolEngagementData[]>([
    {
      id: "1",
      name: "Thimphu HSS",
      studentCount: 456,
      assessmentCompletion: 78.5,
      revenue: 125000,
      growth: 15.2,
    },
    {
      id: "2",
      name: "Yangchenphug HSS",
      studentCount: 389,
      assessmentCompletion: 82.3,
      revenue: 98000,
      growth: 12.8,
    },
    {
      id: "3",
      name: "Moiyul Goenpa HSS",
      studentCount: 234,
      assessmentCompletion: 71.2,
      revenue: 76000,
      growth: 18.5,
    },
    {
      id: "4",
      name: "Pelkhil HSS",
      studentCount: 312,
      assessmentCompletion: 85.7,
      revenue: 89000,
      growth: 22.1,
    },
    {
      id: "5",
      name: "Rigsum HSS",
      studentCount: 267,
      assessmentCompletion: 76.4,
      revenue: 67000,
      growth: 8.9,
    },
  ]);

  const [careerInterests, setCareerInterests] = useState<CareerInterestData[]>([
    { career: "Software Engineer", count: 456, percentage: 18.5, trend: "up" },
    { career: "Healthcare Professional", count: 312, percentage: 12.7, trend: "up" },
    { career: "Teacher", count: 234, percentage: 9.6, trend: "stable" },
    { career: "Business", count: 189, percentage: 7.7, trend: "up" },
    { career: "Engineer", count: 267, percentage: 10.8, trend: "up" },
    { career: "Arts & Design", count: 145, percentage: 5.9, trend: "down" },
    { career: "Agriculture", count: 123, percentage: 5.0, trend: "stable" },
  ]);

  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([
    { period: "Jan 2025", students: 1800, assessments: 4200, revenue: 45000 },
    { period: "Feb 2025", students: 1950, assessments: 5100, revenue: 52000 },
    { period: "Mar 2025", students: 2100, assessments: 5800, revenue: 58000 },
  ]);

  // Calculate totals
  const totalStudents = schoolEngagement.reduce((sum, s) => sum + s.studentCount, 0);
  const totalAssessments = careerInterests.reduce((sum, c) => sum + c.count, 0);
  const avgCompletion = schoolEngagement.reduce((sum, s) => sum + s.assessmentCompletion, 0) / schoolEngagement.length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Platform Analytics
          </h1>
          <p className="text-gray-600">
            Comprehensive insights and trends across all schools
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-4 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none bg-white"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          <Button
            style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
            className="text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* AI Insights Section */}
      <div className="grid md:grid-cols-3 gap-4">
        <AIInsightCard
          type="success"
          title="Platform Growth Strong"
          message={`Total of ${totalStudents.toLocaleString()} students across ${schoolEngagement.length} schools. ${((totalStudents / 1800) * 100).toFixed(1)}% growth in student enrollment this semester.`}
          actions={[
            { label: "View Schools", href: "/admin/schools" },
          ]}
        />

        <AIInsightCard
          type="warning"
          title="Assessment Engagement Varies"
          message={`Assessment completion rates vary from ${Math.min(...schoolEngagement.map(s => s.assessmentCompletion)).toFixed(0)}% to ${Math.max(...schoolEngagement.map(s => s.assessmentCompletion)).toFixed(0)}%. Consider targeted outreach to low-performing schools.`}
          actions={[
            { label: "View Details", href: "/admin/analytics" },
          ]}
        />

        <AIInsightCard
          type="tip"
          title="Career Interest Trends"
          message={`Software Engineer (${careerInterests[0].trend === "up" ? "↑" : careerInterests[0].trend === "down" ? "↓" : "→"}) and Healthcare remain top interests. Consider partnering with relevant RUB colleges for ${careerInterests[0].career.toLowerCase()} programs.`}
          actions={[
            { label: "View Content", href: "/admin/content" },
          ]}
        />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalStudents.toLocaleString()}</div>
            <p className="text-xs text-green-600 mt-1">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              +12.5% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Active Schools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{schoolEngagement.length}</div>
            <p className="text-xs text-gray-500 mt-1">On platform</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Total Assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalAssessments.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Career assessments taken</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Avg Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{avgCompletion.toFixed(1)}%</div>
            <p className="text-xs text-gray-500 mt-1">Across all schools</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* School Engagement */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>School Engagement</CardTitle>
                <CardDescription>Assessment completion by school</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {schoolEngagement.slice(0, 5).map((school) => (
                <div key={school.id} className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-pink-700">
                          {school.name.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{school.name}</p>
                        <p className="text-sm text-gray-500">{school.studentCount} students</p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        school.growth > 15
                          ? "bg-green-50 text-green-700 border-green-200"
                          : school.growth > 10
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-yellow-50 text-yellow-700 border-yellow-200"
                      }
                    >
                      {school.growth > 0 ? "+" : ""}{school.growth.toFixed(1)}%
                    </Badge>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Assessment Completion</span>
                      <span className="font-medium">{school.assessmentCompletion.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${school.assessmentCompletion}%`,
                          background: "linear-gradient(90deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)",
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Revenue</span>
                    <span className="font-medium">
                      Nu {(school.revenue / 1000).toFixed(0)}K
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Career Interests */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Popular Career Interests</CardTitle>
                <CardDescription>Top career choices across platform</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {careerInterests.slice(0, 6).map((career, index) => (
                <div key={career.career} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        index === 0 ? "bg-yellow-100" : index === 1 ? "bg-blue-100" : index === 2 ? "bg-green-100" : "bg-purple-100"
                      }`}
                    >
                      <span className="text-sm font-bold">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{career.career}</p>
                      <p className="text-sm text-gray-500">{career.count} students interested</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-gray-900">{career.percentage.toFixed(1)}%</span>
                      {career.trend === "up" && <TrendingUp className="w-4 h-4 text-green-600" />}
                      {career.trend === "down" && <TrendingDown className="w-4 h-4 text-red-600" />}
                      {career.trend === "stable" && <span className="w-4 h-4 text-gray-400">-</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest platform activities and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">New school registered</p>
                  <p className="text-sm text-gray-500">Rigsum HSS joined the platform</p>
                  <p className="text-xs text-gray-400">2 hours ago</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Assessment milestone reached</p>
                  <p className="text-sm text-gray-500">10,000 career assessments completed this month</p>
                  <p className="text-xs text-gray-400">5 hours ago</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">AI Career Coach deployed</p>
                  <p className="text-sm text-gray-500">New AI-powered career recommendations now available</p>
                  <p className="text-xs text-gray-400">1 day ago</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-yellow-50 rounded-lg">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Target className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">System update completed</p>
                  <p className="text-sm text-gray-500">Platform maintenance and optimizations deployed</p>
                  <p className="text-xs text-gray-400">3 days ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
