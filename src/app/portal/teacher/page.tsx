"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  TrendingUp,
  BookOpen,
  Target,
  Calendar,
  Award,
  Settings,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Sparkles,
  BarChart3,
  ClipboardCheck,
  MessageSquare,
  Bell,
  Eye,
  Download,
  Plus,
  Lightbulb,
} from "lucide-react";
import Link from "next/link";

export default function TeacherPortalPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState("10A");

  // Mock data
  const [classes] = useState([
    { id: "10A", name: "Class 10 A", students: 32, avgProgress: 72 },
    { id: "10B", name: "Class 10 B", students: 28, avgProgress: 68 },
    { id: "9A", name: "Class 9 A", students: 30, avgProgress: 65 },
  ]);

  const [students] = useState([
    {
      id: 1,
      name: "Tashi Dorji",
      assessmentStatus: "completed",
      topCareer: "Software Developer",
      matchScore: 87,
      engagement: "high",
      streak: 12,
      xp: 2450,
    },
    {
      id: 2,
      name: "Karma Wangmo",
      assessmentStatus: "completed",
      topCareer: "UX Designer",
      matchScore: 82,
      engagement: "medium",
      streak: 5,
      xp: 1800,
    },
    {
      id: 3,
      name: "Dorji Penjor",
      assessmentStatus: "pending",
      topCareer: null,
      matchScore: null,
      engagement: "low",
      streak: 0,
      xp: 500,
    },
    {
      id: 4,
      name: "Dechen Choden",
      assessmentStatus: "completed",
      topCareer: "Data Analyst",
      matchScore: 78,
      engagement: "high",
      streak: 18,
      xp: 3200,
    },
    {
      id: 5,
      name: "Sonam Tobgay",
      assessmentStatus: "in_progress",
      topCareer: null,
      matchScore: null,
      engagement: "medium",
      streak: 3,
      xp: 900,
    },
  ]);

  const [careerDistribution] = useState([
    { career: "Software Developer", count: 8 },
    { career: "Healthcare", count: 6 },
    { career: "Business", count: 5 },
    { career: "Engineering", count: 4 },
    { career: "Arts & Design", count: 3 },
    { career: "Education", count: 3 },
    { career: "Other", count: 3 },
  ]);

  const [atRiskStudents, setAtRiskStudents] = useState([
    { id: 3, name: "Dorji Penjor", reason: "Assessment pending - 2 weeks overdue" },
    { id: 5, name: "Sonam Tobgay", reason: "Low engagement - inactive for 7 days" },
  ]);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading class data...</p>
        </div>
      </div>
    );
  }

  const getEngagementColor = (engagement: string) => {
    switch (engagement) {
      case "high": return "bg-green-100 text-green-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getAssessmentBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case "pending":
        return <Badge className="bg-red-100 text-red-800">Pending</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 via-teal-600 to-cyan-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Teacher Portal</h1>
                <p className="text-green-100">Class analytics and student insights</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Button variant="secondary" size="sm" asChild>
                <Link href="/dashboard/settings">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Class Selector */}
        <div className="mb-8">
          <label className="text-sm font-medium text-gray-700 mb-2 block">Select Class</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-white min-w-[200px]"
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} ({cls.students} students)
              </option>
            ))}
          </select>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Students</p>
                  <p className="text-2xl font-bold">{classes.find(c => c.id === selectedClass)?.students || 32}</p>
                </div>
                <Users className="w-10 h-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Assessments Done</p>
                  <p className="text-2xl font-bold">{students.filter(s => s.assessmentStatus === "completed").length}</p>
                </div>
                <ClipboardCheck className="w-10 h-10 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Avg Progress</p>
                  <p className="text-2xl font-bold">{classes.find(c => c.id === selectedClass)?.avgProgress || 72}%</p>
                </div>
                <TrendingUp className="w-10 h-10 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">High Engagement</p>
                  <p className="text-2xl font-bold">{students.filter(s => s.engagement === "high").length}</p>
                </div>
                <Sparkles className="w-10 h-10 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700">Needs Attention</p>
                  <p className="text-2xl font-bold text-red-600">{atRiskStudents.length}</p>
                </div>
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Student List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Student Progress Overview</CardTitle>
                  <Button size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Observation
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Student</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-500">Assessment</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-500">Top Career</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-500">Match</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-500">Engagement</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-500">XP</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr key={student.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{student.name}</td>
                          <td className="text-center py-3 px-4">
                            {getAssessmentBadge(student.assessmentStatus)}
                          </td>
                          <td className="text-center py-3 px-4 text-sm">
                            {student.topCareer || "-"}
                          </td>
                          <td className="text-center py-3 px-4">
                            {student.matchScore ? (
                              <Badge className={student.matchScore >= 80 ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
                                {student.matchScore}%
                              </Badge>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="text-center py-3 px-4">
                            <Badge className={getEngagementColor(student.engagement)}>
                              {student.engagement}
                            </Badge>
                          </td>
                          <td className="text-center py-3 px-4 font-medium">{student.xp}</td>
                          <td className="text-center py-3 px-4">
                            <Button size="sm" variant="ghost">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Career Interest Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Career Interest Distribution
                </CardTitle>
                <CardDescription>What students in your class are interested in</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {careerDistribution.map((item) => (
                    <div key={item.career}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{item.career}</span>
                        <span className="text-gray-500">{item.count} students</span>
                      </div>
                      <Progress value={(item.count / 32) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Alerts */}
            {atRiskStudents.length > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-red-800 flex items-center gap-2 text-lg">
                    <AlertCircle className="w-5 h-5" />
                    Needs Attention
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {atRiskStudents.map((student) => (
                    <div key={student.id} className="p-3 bg-white rounded-lg">
                      <p className="font-medium text-sm">{student.name}</p>
                      <p className="text-xs text-gray-500">{student.reason}</p>
                      <Button size="sm" variant="outline" className="mt-2 w-full">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Send Reminder
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link href="/dashboard/assessment">
                    <Target className="w-4 h-4 mr-2" />
                    View All Assessments
                  </Link>
                </Button>
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link href="/dashboard/careers">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Career Database
                  </Link>
                </Button>
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link href="/dashboard/skills">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Learning Resources
                  </Link>
                </Button>
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link href="/contact">
                    <Bell className="w-4 h-4 mr-2" />
                    Request Counselor
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Teaching Tips */}
            <Card className="bg-gradient-to-br from-green-50 to-teal-50 border-2 border-green-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-green-600" />
                  Teaching Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-white rounded-lg">
                  <p className="font-medium text-sm mb-1">Encourage Career Conversations</p>
                  <p className="text-xs text-gray-600">
                    Dedicate 5 minutes each week for students to share their career goals
                  </p>
                </div>
                <div className="p-3 bg-white rounded-lg">
                  <p className="font-medium text-sm mb-1">Connect Subjects to Careers</p>
                  <p className="text-xs text-gray-600">
                    Show how math skills are used in engineering, science in healthcare, etc.
                  </p>
                </div>
                <div className="p-3 bg-white rounded-lg">
                  <p className="font-medium text-sm mb-1">Invite Guest Speakers</p>
                  <p className="text-xs text-gray-600">
                    Bring in professionals from different fields to share their experiences
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="font-medium text-sm">Career Fair</p>
                  <p className="text-xs text-gray-500">March 15, 2026</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="font-medium text-sm">Parent-Teacher Meeting</p>
                  <p className="text-xs text-gray-500">March 20, 2026</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="font-medium text-sm">Study Abroad Info Session</p>
                  <p className="text-xs text-gray-500">April 5, 2026</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
