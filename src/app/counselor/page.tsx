/**
 * COUNSELOR DASHBOARD PAGE
 *
 * Key features:
 * - Student overview
 * - Assessment analytics
 * - Quick actions
 * - Data insights access
 */

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

export default function CounselorDashboardPage() {
  // Mock data
  const counselorStats = {
    totalStudents: 342,
    activeSchools: 5,
    pendingReports: 12,
    assessmentsThisWeek: 87,
    aiCoachUsage: 234, // Number of AI interactions
  };

  const recentStudents = [
    {
      id: "1",
      name: "Tashi Dorji",
      school: "Thimphu Higher Secondary School",
      grade: "12",
      lastActivity: "2 hours ago",
      assessmentStatus: "completed",
      topCareer: "Software Engineer",
      needsAttention: false,
    },
    {
      id: "2",
      name: "Karma Wangmo",
      school: "Yangchenphug Higher Secondary School",
      grade: "10",
      lastActivity: "1 day ago",
      assessmentStatus: "in_progress",
      topCareer: "Nurse",
      needsAttention: true,
    },
    {
      id: "3",
      name: "Pema Lhamo",
      school: "Moiyul Goenpa HSS",
      grade: "11",
      lastActivity: "3 days ago",
      assessmentStatus: "pending",
      topCareer: null,
      needsAttention: true,
    },
  ];

  const schoolPerformance = [
    { name: "Thimphu HSS", students: 89, completion: 78 },
    { name: "Yangchenphug HSS", students: 76, completion: 65 },
    { name: "Moiyul Goenpa HSS", students: 54, completion: 82 },
    { name: "Pelkhil HSS", students: 67, completion: 71 },
    { name: "Rigsum HSS", students: 56, completion: 58 },
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
            <Link href="/counselor/data-export">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Link>
          </Button>
          <Button className="bg-hunter-green-600 hover:bg-hunter-green-700" asChild>
            <Link href="/counselor/students">
              <Users className="w-4 h-4 mr-2" />
              View All Students
            </Link>
          </Button>
        </div>
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
            <div className="text-2xl font-bold text-hunter-green-600">{counselorStats.totalStudents}</div>
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
            <div className="text-2xl font-bold text-powder-blue-600">{counselorStats.activeSchools}</div>
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
            <div className="text-2xl font-bold text-oxidized-iron-600">{counselorStats.pendingReports}</div>
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
            <div className="text-2xl font-bold text-ash-grey-600">{counselorStats.assessmentsThisWeek}</div>
            <p className="text-xs text-hunter-green-600">+15% this week</p>
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
            <div className="text-2xl font-bold text-purple-600">{counselorStats.aiCoachUsage}</div>
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
                {recentStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-hunter-green-100 rounded-full flex items-center justify-center">
                          <span className="text-hunter-green-700 font-medium">
                            {student.name.split(" ").map((n) => n[0]).join("")}
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
                      <p className="text-xs text-gray-400 mt-1">{student.lastActivity}</p>
                    </div>
                  </div>
                ))}
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
              {schoolPerformance.map((school) => (
                <div key={school.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate">{school.name}</span>
                    <span className="text-gray-500">{school.students} students</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-hunter-green-500 to-hunter-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${school.completion}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{school.completion}% completion</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="premium-card hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-hunter-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-hunter-green-600" />
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
              <div className="w-12 h-12 bg-powder-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-powder-blue-600" />
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
              <div className="w-12 h-12 bg-oxidized-iron-100 rounded-lg flex items-center justify-center">
                <Download className="w-6 h-6 text-oxidized-iron-600" />
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

      {/* Data Value Banner - Shows company the value of data */}
      <Card className="bg-gradient-to-r from-hunter-green-50 to-powder-blue-50 border-hunter-green-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-hunter-green-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-hunter-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Your Students' Data is Valuable</h3>
                <p className="text-sm text-gray-600">
                  {counselorStats.totalStudents} students • {counselorStats.assessmentsThisWeek} assessments this week •
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
