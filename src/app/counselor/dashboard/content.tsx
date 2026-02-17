/**
 * COUNSELOR DASHBOARD PAGE (WITH AI INSIGHTS)
 *
 * Key features:
 * - Real student data from /api/counselor/dashboard
 * - AI-powered insights from /api/ai/insights
 * - Assessment analytics
 * - Students needing attention
 * - Quick actions
 */

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  TrendingUp,
  FileText,
  Sparkles,
  Calendar,
  Target,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Download,
  ArrowRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { AIInsightCard } from "@/components/ai/ai-insight-card";
import { useEffect, useState } from "react";

// Types for API responses
interface CounselorStats {
  totalStudents: number;
  activeSchools: number;
  pendingReports: number;
  assessmentsThisWeek: number;
  aiCoachUsage: number;
}

interface StudentInsight {
  id: string;
  name: string;
  school: string;
  grade: string | number;
  attendance: number;
  lastActivity: string;
  assessmentStatus: "completed" | "in_progress" | "pending";
  topCareer: string | null;
  needsAttention: boolean;
}

interface DashboardResponse {
  stats: CounselorStats;
  recentStudents: StudentInsight[];
  schoolPerformance?: Array<{ name: string; students: number; completion: number }>;
}

interface AIInsight {
  type: "warning" | "success" | "info" | "tip";
  title: string;
  message: string;
  actions?: Array<{ label: string; href: string }>;
}

interface AIInsightsResponse {
  success: boolean;
  insights: AIInsight[];
  generatedAt?: string;
}

export function CounselorDashboardContent() {
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  useEffect(() => {
    async function fetchDashboard() {
      try {
        const response = await fetch("/api/counselor/dashboard");
        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }
        const data = await response.json();
        setDashboardData(data);
      } catch (err) {
        console.error("Error fetching dashboard:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  // Fetch AI insights based on dashboard data
  useEffect(() => {
    async function fetchAIInsights() {
      if (!dashboardData) return;

      try {
        setInsightsLoading(true);

        // Calculate trend (compare assessments to student count)
        const completionRate = dashboardData.stats.totalStudents > 0
          ? Math.round((dashboardData.stats.assessmentsThisWeek / dashboardData.stats.totalStudents) * 100)
          : 0;

        // Determine if trend is up or down (simple heuristic)
        const trend = completionRate > 10 ? "up" : "stable";

        const response = await fetch("/api/ai/insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userRole: "counselor",
            contextData: {
              stats: {
                needsIntervention: dashboardData.stats.pendingReports,
                completedThisWeek: dashboardData.stats.assessmentsThisWeek,
                trend,
                totalStudents: dashboardData.stats.totalStudents,
                completionRate,
              },
              students: dashboardData.recentStudents,
            },
          }),
        });

        if (response.ok) {
          const data: AIInsightsResponse = await response.json();
          if (data.success && data.insights) {
            setInsights(data.insights);
          }
        }
      } catch (err) {
        console.error("Error fetching AI insights:", err);
        // Set fallback insights on error
        setInsights(getFallbackInsights(dashboardData));
      } finally {
        setInsightsLoading(false);
      }
    }

    fetchAIInsights();
  }, [dashboardData]);

  // Fallback insights if API fails
  function getFallbackInsights(data: DashboardResponse): AIInsight[] {
    const needsAttention = data.recentStudents.filter(s => s.needsAttention).length;
    const completionRate = data.stats.totalStudents > 0
      ? Math.round((data.stats.assessmentsThisWeek / data.stats.totalStudents) * 100)
      : 0;

    return [
      {
        type: "warning",
        title: "Students Requiring Attention",
        message: `${needsAttention} students require intervention based on low attendance or incomplete assessments.`,
        actions: [
          { label: "View Students", href: "/counselor/students?filter=needs-attention" },
          { label: "Schedule Sessions", href: "/counselor/sessions" },
        ],
      },
      {
        type: "success",
        title: "Assessment Completion Trends",
        message: `${completionRate}% assessment completion rate this week. Students are responding well to career guidance.`,
        actions: [
          { label: "View Analytics", href: "/counselor/assessments" },
          { label: "Student Reports", href: "/counselor/reports" },
        ],
      },
      {
        type: "info",
        title: "Counseling Recommendations",
        message: "Consider scheduling group sessions for students interested in similar career paths. Review students needing individual attention.",
        actions: [
          { label: "Schedule Session", href: "/counselor/schedule" },
          { label: "View Resources", href: "/counselor/resources" },
        ],
      },
    ];
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const stats = dashboardData?.stats || {
    totalStudents: 0,
    activeSchools: 0,
    pendingReports: 0,
    assessmentsThisWeek: 0,
    aiCoachUsage: 0,
  };

  const recentStudents = dashboardData?.recentStudents || [];

  // Calculate insights to display
  const insightsToDisplay = insights.length > 0 ? insights : getFallbackInsights(dashboardData!);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Counselor Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your students and activities</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/counselor/reports">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Link>
          </Button>
          <Button className="bg-purple-600 hover:bg-purple-700" asChild>
            <Link href="/counselor/sessions">
              <Sparkles className="w-4 h-4 mr-2" />
              AI Coach
            </Link>
          </Button>
        </div>
      </div>

      {/* AI Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {insightsLoading ? (
          <>
            <Card className="h-32">
              <CardContent className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              </CardContent>
            </Card>
            <Card className="h-32">
              <CardContent className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              </CardContent>
            </Card>
            <Card className="h-32">
              <CardContent className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              </CardContent>
            </Card>
          </>
        ) : (
          insightsToDisplay.slice(0, 3).map((insight, index) => (
            <AIInsightCard
              key={`insight-${index}`}
              type={insight.type}
              title={insight.title}
              message={insight.message}
              actions={insight.actions?.map(a => ({
                label: a.label,
                href: a.href,
              }))}
            />
          ))
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-gray-900">{stats.totalStudents}</div>
              <Users className="w-8 h-8 text-purple-600 opacity-20" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Across {stats.activeSchools} schools</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-gray-900">{stats.pendingReports}</div>
              <FileText className="w-8 h-8 text-purple-600 opacity-20" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Assessments This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-gray-900">{stats.assessmentsThisWeek}</div>
              <TrendingUp className="w-8 h-8 text-purple-600 opacity-20" />
            </div>
            <p className="text-xs text-green-600 mt-2">
              {stats.totalStudents > 0
                ? `${Math.round((stats.assessmentsThisWeek / stats.totalStudents) * 100)}% completion rate`
                : "No students yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">AI Coach Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-gray-900">{stats.aiCoachUsage}</div>
              <Sparkles className="w-8 h-8 text-purple-600 opacity-20" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Student interactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Students */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Students</CardTitle>
          <CardDescription>Students who need your attention</CardDescription>
        </CardHeader>
        <CardContent>
          {recentStudents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No students assigned yet</p>
              <p className="text-sm mt-2">Students will appear here once they are assigned to your schools.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-purple-700">
                        {student.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-sm text-gray-500">
                        {student.school} • Class {student.grade}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p
                        className={`text-sm font-medium ${
                          student.attendance >= 75 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {student.attendance}% Attendance
                      </p>
                      <p className="text-xs text-gray-500">{student.lastActivity}</p>
                    </div>
                    {student.needsAttention && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Needs Attention
                      </Badge>
                    )}
                    {student.assessmentStatus === "completed" && !student.needsAttention && (
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1 text-green-600 border-green-600"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        On Track
                      </Badge>
                    )}
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/counselor/students/${student.id}`}>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Server component wrapper
export default function CounselorDashboardPage() {
  return <CounselorDashboardContent />;
}
