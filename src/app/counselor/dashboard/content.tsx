/**
 * COUNSELOR DASHBOARD PAGE (WITH AI INSIGHTS)
 *
 * Key features:
 * - Student overview with AI-powered insights
 * - Assessment analytics
 * - Students needing attention
 * - Quick actions
 */

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
import { fetchCounselorStats, type StudentInsight } from "../_actions";

// Server wrapper component
export default async function CounselorDashboardPage() {
  const stats = await fetchCounselorStats();

  // Mock recent students data (would come from database)
  const recentStudents: StudentInsight[] = [
    {
      id: "1",
      name: "Tashi Dorji",
      school: "Thimphu HSS",
      grade: "12",
      attendance: 82,
      lastActivity: "2 hours ago",
      assessmentStatus: "completed",
      topCareer: "Software Engineer",
      needsAttention: true,
    },
    {
      id: "2",
      name: "Karma Wangmo",
      school: "Yangchenphug HSS",
      grade: "10",
      attendance: 45,
      lastActivity: "1 day ago",
      assessmentStatus: "in_progress",
      topCareer: null,
      needsAttention: true,
    },
    {
      id: "3",
      name: "Pema Lhamo",
      school: "Moiyul Goenpa HSS",
      grade: "11",
      attendance: 78,
      lastActivity: "5 hours ago",
      assessmentStatus: "pending",
      topCareer: null,
      needsAttention: false,
    },
    {
      id: "4",
      name: "Dorji",
      school: "Rigsum HSS",
      grade: "11",
      attendance: 91,
      lastActivity: "3 days ago",
      assessmentStatus: "completed",
      topCareer: "Data Analyst",
      needsAttention: true,
    },
    {
      id: "5",
      name: "Dorji",
      school: "Pelkhil HSS",
      grade: "11",
      attendance: 68,
      lastActivity: "1 day ago",
      assessmentStatus: "completed",
      topCareer: "Nurse",
      needsAttention: false,
    },
  ];

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
        <AIInsightCard
          title="Students Needing Attention"
          message={`${recentStudents.filter(s => s.needsAttention).length} students require intervention based on low attendance or incomplete assessments.`}
          actions={[
            {
              label: "View Students",
              href: "/counselor/students?filter=needs-attention"
            }
          ]}
          type="warning"
        />
        <AIInsightCard
          title="Assessment Trends"
          message={`${Math.round(stats.assessmentsThisWeek / stats.totalStudents * 100)}% assessment completion rate this week. Students are responding well to career guidance.`}
          actions={[
            {
              label: "View Analytics",
              href: "/counselor/assessments"
            }
          ]}
          type="success"
        />
        <AIInsightCard
          title="AI Coaching Suggestions"
          message="Consider scheduling group sessions for students interested in similar career paths. Top interest: Technology (35%)"
          actions={[
            {
              label: "Schedule Session",
              href: "/counselor/schedule"
            }
          ]}
          type="info"
        />
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
            <p className="text-xs text-green-600 mt-2">+12% from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">AI Coach Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-gray-900">{stats.aiCoachUsage}%</div>
              <Sparkles className="w-8 h-8 text-purple-600 opacity-20" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Student engagement rate</p>
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
          <div className="space-y-4">
            {recentStudents.map((student) => (
              <div key={student.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-purple-700">
                      {student.name.split(" ").map(n => n[0]).join("")}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{student.name}</p>
                    <p className="text-sm text-gray-500">{student.school} • Class {student.grade}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={`text-sm font-medium ${student.attendance >= 75 ? 'text-green-600' : 'text-red-600'}`}>
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
                    <Badge variant="outline" className="flex items-center gap-1 text-green-600 border-green-600">
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
        </CardContent>
      </Card>
    </div>
  );
}
