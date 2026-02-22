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
import { CeramicCallout } from "@/components/ui/ceramic-callout";
import {
  Users,
  BookOpen,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  Award,
  FileText,
  Upload,
  TrendingDown,
} from "lucide-react";
import { TeacherAIInsights } from "./ai-insights-wrapper";
import Link from "next/link";
import { getTeacherDashboardData } from "./_actions";
import { Skeleton } from "@/components/ui/skeleton";
import { TeacherQuickActions } from "./teacher-quick-actions";

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
        <CeramicCallout variant="ceramic-error">
          <div className="py-16 text-center">
            <AlertTriangle className="w-12 h-12 text-ceramic-negative mx-auto mb-4" />
            <h2 className="text-xl font-bold text-ceramic-primary mb-2">Error Loading Dashboard</h2>
            <p className="text-ceramic-secondary">Failed to load dashboard data. Please try refreshing.</p>
          </div>
        </CeramicCallout>
      </div>
    );
  }

  const { stats, classes, upcomingHomework, recentActivity, needsAttention, recentBehaviorLogs } = dashboardData;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-ceramic-primary">Teacher Dashboard</h1>
        <p className="text-ceramic-secondary">Manage your classes and track student progress</p>
      </div>

      {/* Stats Grid - Ceramic Styled */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card variant="ceramic">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-ceramic-secondary flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-ceramic-primary">{stats.totalStudents}</div>
            <p className="text-xs text-ceramic-dimmed mt-1">Across all classes</p>
          </CardContent>
        </Card>

        <Card variant="ceramic">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-ceramic-secondary flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Active Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-ceramic-primary">{stats.activeClasses}</div>
            <p className="text-xs text-ceramic-dimmed mt-1">This academic year</p>
          </CardContent>
        </Card>

        <Card variant="ceramic">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-ceramic-secondary flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending Grading
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-ceramic-primary">{stats.pendingHomework}</div>
            <p className="text-xs text-ceramic-dimmed mt-1">Submissions to grade</p>
          </CardContent>
        </Card>

        <Card variant="ceramic">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-ceramic-secondary flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Avg Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-ceramic-primary">{stats.averageAttendance}%</div>
            <p className="text-xs text-ceramic-dimmed mt-1">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Section - Server Component wrapper */}
      <TeacherAIInsights dashboardData={dashboardData} />

      {/* Classes Overview - Ceramic Styled */}
      {classes && classes.length > 0 && (
        <Card variant="ceramic">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Your Classes</CardTitle>
              <Button variant="ceramic-ghost" size="sm" asChild>
                <Link href="/teacher/classes">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.slice(0, 6).map((cls) => (
                <Link key={cls.id} href={`/teacher/classes/${cls.id}`}>
                  <div className="p-4 rounded-lg border border-ceramic-border hover:border-ceramic-blue-300 hover:bg-ceramic-blue-50/50 transition-colors cursor-pointer group">
                    <div className="font-medium text-ceramic-primary group-hover:text-ceramic-blue-600">{cls.name}</div>
                    <div className="text-sm text-ceramic-secondary mt-1">
                      Grade {cls.grade} - {cls.section}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <Badge variant="ceramic-info">
                        {cls.studentCount} students
                      </Badge>
                      <div className="text-xs text-ceramic-dimmed">
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

      {/* Upcoming Homework to Grade - Ceramic Styled */}
      {upcomingHomework && upcomingHomework.length > 0 && (
        <Card variant="ceramic">
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
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-ceramic-gray-50 hover:bg-ceramic-gray-100 transition-colors dark:bg-ceramic-gray-800 dark:hover:bg-ceramic-gray-700">
                  <div className="flex-1">
                    <p className="font-medium text-ceramic-primary">{item.homeworkTitle}</p>
                    <p className="text-sm text-ceramic-secondary">
                      {item.studentName} • Submitted {item.submittedAt}
                    </p>
                  </div>
                  <Button size="sm" variant="ceramic-ghost" asChild>
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

      {/* Students Needing Attention - Ceramic Styled */}
      {needsAttention && needsAttention.length > 0 && (
        <CeramicCallout variant="ceramic-warning">
          <div className="space-y-3">
            {needsAttention.slice(0, 5).map((student) => (
              <div key={student.id} className="flex items-center justify-between p-3 rounded-lg bg-white border border-ceramic-orange-200">
                <div>
                  <p className="font-medium text-ceramic-primary">{student.name}</p>
                  <p className="text-sm text-ceramic-secondary">
                    {student.reason} • {student.className}
                  </p>
                </div>
                <Badge variant={
                  student.severity === "high" ? "ceramic-error" :
                  student.severity === "medium" ? "ceramic-warning" :
                  "ceramic-default"
                }>
                  {student.severity}
                </Badge>
              </div>
            ))}
          </div>
        </CeramicCallout>
      )}

      {/* Recent Behavior Logs - Ceramic Styled */}
      {recentBehaviorLogs && recentBehaviorLogs.length > 0 && (
        <Card variant="ceramic">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Recent Behavior Logs
              </CardTitle>
              <Button variant="ceramic-ghost" size="sm" asChild>
                <Link href="/teacher/behavior">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentBehaviorLogs.map((log) => (
                <div
                  key={log.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    log.type === "merit"
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {log.type === "merit" ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium text-ceramic-primary">{log.studentName}</p>
                      <p className="text-sm text-ceramic-secondary">{log.description}</p>
                    </div>
                  </div>
                  <Badge
                    variant={log.type === "merit" ? "ceramic-success" : "ceramic-error"}
                    className="text-xs"
                  >
                    {log.points > 0 ? "+" : ""}
                    {log.points}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions - Ceramic Styled */}
      <TeacherQuickActions />
    </div>
  );
}
