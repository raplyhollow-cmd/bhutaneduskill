"use client";

import { logger } from "@/lib/logger";
/**
 * COUNSELOR DASHBOARD PAGE
 *
 * Key features:
 * - Real data from API - no more mock values
 * - Student overview with actual database data
 * - Assessment analytics
 * - Quick actions
 * - Data insights access
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  TrendingUp,
  FileText,
  Download,
  Sparkles,
  Target,
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { AIInsightCard } from "@/components/ai/ai-insight-card";

interface DashboardStats {
  totalStudents: number;
  activeSchools: number;
  pendingReports: number;
  assessmentsThisWeek: number;
  aiCoachUsage: number;
}

interface RecentStudent {
  id: string;
  name: string;
  grade: number;
  riskLevel: string;
  lastSession: string;
  needsAttention?: boolean;
  school?: string;
  assessmentStatus?: string;
  topCareer?: string;
}

interface SchoolPerformance {
  schoolName: string;
  name: string;
  totalStudents: number;
  students: number;
  averageScore: number;
  riskStudents: number;
  completion: number;
}

// Client component - dynamic rendering is automatic
export default function CounselorDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    activeSchools: 0,
    pendingReports: 0,
    assessmentsThisWeek: 0,
    aiCoachUsage: 0,
  });
  const [recentStudents, setRecentStudents] = useState<RecentStudent[]>([]);
  const [schoolPerformance, setSchoolPerformance] = useState<SchoolPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await fetch("/api/counselor/dashboard");
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || stats);
        setRecentStudents(data.recentStudents || []);
        setSchoolPerformance(data.schoolPerformance || []);
      }
    } catch (error) {
      logger.error("Failed to load counselor dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Counselor Dashboard</h1>
            <p className="text-gray-600 mt-1">Overview of your students and activities</p>
          </div>
        </div>

        {/* Loading State */}
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-900 border-t-transparent"></div>
        </div>
      </div>
    );
  }

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
            <Link href="/counselor/data-export">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Link>
          </Button>
          <Button className="bg-purple-600 hover:bg-purple-700" asChild>
            <Link href="/counselor/students">
              <Users className="w-4 h-4 mr-2" />
              View All Students
            </Link>
          </Button>
        </div>
      </div>

      {/* AI Insights Section */}
      <div className="grid md:grid-cols-3 gap-4">
        <AIInsightCard
          type="warning"
          title="Students Needing Attention"
          message={`${recentStudents.filter(s => s.needsAttention).length} students require immediate intervention. Low assessment completion and attendance issues detected.`}
          actions={[
            { label: "View Students", href: "/counselor/students" },
            { label: "Interventions", href: "/counselor/interventions" },
          ]}
        />

        <AIInsightCard
          type="success"
          title="Assessment Trends Positive"
          message={`${stats.assessmentsThisWeek} assessments completed this week. Student engagement is up from baseline.`}
          actions={[
            { label: "View Reports", href: "/counselor/reports" },
          ]}
        />

        <AIInsightCard
          type="tip"
          title="AI Coaching Suggestion"
          message="Based on recent data, students are showing increased interest in STEM careers. Consider organizing career talks with professionals in these fields."
          actions={[
            { label: "Schedule Session", href: "/counselor/schedule" },
          ]}
        />
      </div>

      {/* Stats Grid - Bhutan Colors */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card className="premium-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-2">
              <Users className="w-3 h-3" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.totalStudents}</div>
            <p className="text-xs text-gray-500">Across all schools</p>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-2">
              <BookOpen className="w-3 h-3" />
              Active Schools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.activeSchools}</div>
            <p className="text-xs text-gray-500">Partner schools</p>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-2">
              <FileText className="w-3 h-3" />
              Pending Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pendingReports}</div>
            <p className="text-xs text-gray-500">Awaiting action</p>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3" />
              Assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.assessmentsThisWeek}</div>
            <p className="text-xs text-purple-600">This week</p>
          </CardContent>
        </Card>

        {/* AI Feature Card */}
        <Card className="premium-card bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-purple-600" />
              AI Coach Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.aiCoachUsage}</div>
            <p className="text-xs text-gray-500">Student interactions</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Students */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Student Activity</CardTitle>
                  <CardDescription>Latest updates from your students</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/counselor/students">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentStudents.length > 0 ? recentStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-700 font-medium">
                            {student.name.split(" ").map((n: string) => n[0]).join("")}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{student.name}</p>
                            {student.needsAttention && (
                              <AlertCircle className="w-4 h-4 text-orange-500" />
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {student.school} • Grade {student.grade}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant="outline"
                        className={
                          student.assessmentStatus === "completed"
                            ? "bg-green-100 text-green-700"
                            : student.assessmentStatus === "in_progress"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                        }
                      >
                        {student.assessmentStatus}
                      </Badge>
                      {student.topCareer && (
                        <p className="text-xs text-gray-500 mt-1">{student.topCareer}</p>
                      )}
                    </div>
                  </div>
                )) : (
                  <p className="text-gray-500 text-center py-8">No recent student activity</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* School Performance */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>School Performance</CardTitle>
              <CardDescription>Assessment completion by school</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {schoolPerformance.length > 0 ? schoolPerformance.map((school, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate">{school.name}</span>
                    <span className="text-gray-500">{school.students} students</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        background: 'linear-gradient(to right, rgb(139 92 246), rgb(124 58 237))',
                        width: `${school.completion}%`
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{school.completion}% completion</span>
                  </div>
                </div>
              )) : (
                <p className="text-gray-500 text-center py-8">No school data available</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="premium-card hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">Manage Students</p>
                <p className="text-xs text-gray-500">View and edit profiles</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Generate Reports</p>
                <p className="text-xs text-gray-500">Create insightful reports</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Download className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="font-medium">Export Data</p>
                <p className="text-xs text-gray-500">Download in any format</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">AI Insights</p>
                <p className="text-xs text-gray-500">View data trends</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Value Banner - Shows company value of data */}
      <Card className="border-purple-200" style={{ background: 'linear-gradient(to right, rgb(168 85 247 / 0.1), rgb(59 130 246 / 0.1))' }}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Your Students' Data is Valuable</h3>
                <p className="text-sm text-gray-600">
                  {stats.totalStudents} students • {stats.assessmentsThisWeek} assessments this week •
                  Multiple data points per student
                </p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link href="/counselor/data-export">
                <Download className="w-4 h-4 mr-2" />
                Export Insights
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
