/**
 * TEACHER DASHBOARD
 *
 * Key features:
 * - Real data from database queries - Server Component for performance
 * - AI insights for class performance
 * - At-risk student alerts
 * - Teaching suggestions
 * - Quick actions for class management
 */

// Force dynamic rendering because this page uses authentication
export const dynamic = 'force-dynamic';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  BookOpen,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { TeacherAIInsights } from "./ai-insights-wrapper";
import Link from "next/link";
import { getTeacherDashboardData } from "./_actions";
import { Skeleton } from "@/components/ui/skeleton";

// Loading component
function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-12 h-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    </div>
  );
}

interface TeacherDashboardProps {
  params: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function TeacherDashboardPage({ params }: TeacherDashboardProps) {
  // Resolve params promise
  const resolvedParams = await params;

  // Fetch dashboard data server-side
  const dashboardData = await getTeacherDashboardData();

  if (!dashboardData) {
    return (
      <div className="space-y-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-16 text-center">
            <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-900 mb-2">Error Loading Dashboard</h2>
            <p className="text-red-700">Failed to load dashboard data. Please try refreshing.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { stats, classes, upcomingHomework, recentActivity, needsAttention } = dashboardData;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
        <p className="text-gray-600">Manage your classes and track student progress</p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalStudents}</div>
            <p className="text-xs text-gray-500 mt-1">Across all classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Active Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.activeClasses}</div>
            <p className="text-xs text-gray-500 mt-1">This academic year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending Grading
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.pendingHomework}</div>
            <p className="text-xs text-gray-500 mt-1">Submissions to grade</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Avg Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.averageAttendance}%</div>
            <p className="text-xs text-gray-500 mt-1">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Section - Server Component wrapper */}
      <TeacherAIInsights dashboardData={dashboardData} />

      {/* Classes Overview */}
      {classes && classes.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Your Classes</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/teacher/classes">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.slice(0, 6).map((cls) => (
                <Link key={cls.id} href={`/teacher/classes/${cls.id}`}>
                  <div className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors cursor-pointer group">
                    <div className="font-medium text-gray-900 group-hover:text-blue-600">{cls.name}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      Grade {cls.grade} - {cls.section}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <Badge className="bg-blue-100 text-blue-700">
                        {cls.studentCount} students
                      </Badge>
                      <div className="text-xs text-gray-500">
                        {cls.completionRate}% completion
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Homework to Grade */}
      {upcomingHomework && upcomingHomework.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Pending Grading
            </CardTitle>
            <CardDescription>Homework submissions waiting for your review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingHomework.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.homeworkTitle}</p>
                    <p className="text-sm text-gray-500">
                      {item.studentName} • Submitted {item.submittedAt}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/teacher/homework/${item.homeworkId}/grade`}>
                      Grade
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Students Needing Attention */}
      {needsAttention && needsAttention.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <AlertTriangle className="w-5 h-5" />
              Needs Attention
            </CardTitle>
            <CardDescription className="text-amber-700">Students who may need extra support</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {needsAttention.slice(0, 5).map((student) => (
                <div key={student.id} className="flex items-center justify-between p-3 rounded-lg bg-white border border-amber-200">
                  <div>
                    <p className="font-medium text-gray-900">{student.name}</p>
                    <p className="text-sm text-gray-500">
                      {student.reason} • {student.className}
                    </p>
                  </div>
                  <Badge className={
                    student.severity === "high" ? "bg-red-100 text-red-700" :
                    student.severity === "medium" ? "bg-amber-100 text-amber-700" :
                    "bg-gray-100 text-gray-700"
                  }>
                    {student.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="flex gap-4 flex-wrap">
        <Button variant="outline" asChild>
          <Link href="/teacher/students">
            <Users className="w-4 h-4 mr-2" />
            Manage Students
          </Link>
        </Button>
        <Button asChild>
          <Link href="/teacher/homework">
            <BookOpen className="w-4 h-4 mr-2" />
            Create Homework
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/teacher/assessments">
            <TrendingUp className="w-4 h-4 mr-2" />
            Create Assessment
          </Link>
        </Button>
      </div>
    </div>
  );
}
