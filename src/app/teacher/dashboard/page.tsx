/**
 * TEACHER DASHBOARD
 *
 * Key features:
 * - AI insights for class performance
 * - At-risk student alerts
 * - Teaching suggestions
 * - Quick actions
 * - Upcoming schedule
 */

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
  DollarSign,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { AIInsightCard } from "@/components/ai/ai-insight-card";

// Simulated data - replace with real API calls
const mockStats = {
  totalStudents: 156,
  averageAttendance: 78,
  homeworkCompletion: 65,
  upcomingClasses: 8,
};

const mockAtRiskStudents = [
  { id: "1", name: "Karma Wangmo", class: "10-A", risk: "attendance", value: "45%", trend: "down" },
  { id: "2", name: "Dorji Penjore", class: "10-A", risk: "homework", value: "3 missing", trend: "stable" },
  { id: "3", name: "Tashi Dema", class: "10-A", risk: "grades", value: "62% (failing)", trend: "down" },
];

const mockUpcomingClasses = [
  { id: "1", subject: "Mathematics", class: "10-A", time: "9:00 AM", room: "Room 101" },
  { id: "2", subject: "English", class: "10-B", time: "10:00 AM", room: "Room 102" },
  { id: "3", subject: "Physics", class: "10-A", time: "11:00 AM", room: "Lab 1" },
];

export default function TeacherDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your classes and track student progress</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Calendar className="w-4 h-4 mr-2" />
            Schedule
          </Button>
          <Button style={{ background: "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)" }}>
            <BookOpen className="w-4 h-4 mr-2" />
            Create Homework
          </Button>
        </div>
      </div>

      {/* AI Insights Section */}
      <div className="grid md:grid-cols-2 gap-4">
        <AIInsightCard
          type="warning"
          title="At-Risk Students Alert"
          message={`${mockAtRiskStudents.length} students need attention. ${mockAtRiskStudents.map((s) => s.name).join(", ")} are showing declining performance trends.`}
          actions={[
            { label: "View Details", href: "/teacher/students" },
            { label: "Send Alert", href: "/teacher/messages" },
          ]}
        />

        <AIInsightCard
          type="success"
          title="Class Performance Insight"
          message="Your class completion rate is 5% above school average. Consider introducing more interactive activities to maintain engagement."
          actions={[
            { label: "View Analytics", href: "/teacher/analytics" },
          ]}
        />

        <AIInsightCard
          type="tip"
          title="Teaching Suggestion"
          message="Students are responding well to visual learning materials. Try incorporating more videos and diagrams in your next Physics lesson."
          actions={[
            { label: "View Resources", href: "/teacher/resources" },
          ]}
        />
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{mockStats.totalStudents}</div>
            <p className="text-xs text-gray-500 mt-1">Across all classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Homework Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{mockStats.homeworkCompletion}%</div>
            <p className="text-xs text-gray-500 mt-1">Average rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{mockStats.averageAttendance}%</div>
            <p className="text-xs text-gray-500 mt-1">School average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Active Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{mockStats.upcomingClasses}</div>
            <p className="text-xs text-gray-500 mt-1">This semester</p>
          </CardContent>
        </Card>
      </div>

      {/* At-Risk Students Section */}
      <Card>
        <CardHeader>
          <CardTitle>Students Needing Attention</CardTitle>
          <CardDescription>Identified by AI analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockAtRiskStudents.map((student) => (
              <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{student.name}</p>
                    <p className="text-sm text-gray-500">Class {student.class}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={
                        student.trend === "up" ? "bg-green-100 text-green-700" :
                        student.trend === "stable" ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      }>
                        {student.risk === "attendance" ? `${student.value} attendance` :
                         student.risk === "homework" ? `${student.value} assignments` :
                         `${student.value} grades`}
                      </Badge>
                      <span className="text-xs text-gray-400 ml-2">
                        {student.trend === "up" ? "↑ Improving" :
                         student.trend === "stable" ? "→ Stable" :
                         "↓ Declining"}
                      </span>
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/teacher/students/${student.id}`}>
                    View Details
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Today's Schedule */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Today's Schedule
              <Button size="sm" variant="ghost" className="ml-auto" asChild>
                <Link href="/teacher/schedule">View All</Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockUpcomingClasses.map((cls) => (
                <div key={cls.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{cls.subject}</p>
                    <p className="text-sm text-gray-500">Class {cls.class}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-blue-600">{cls.time}</p>
                    <p className="text-xs text-gray-500">{cls.room}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="justify-start" asChild>
                <Users className="w-4 h-4 mr-2" />
                <div>
                  <p className="font-medium">My Students</p>
                  <p className="text-xs text-gray-500">View all students</p>
                </div>
              </Button>

              <Button variant="outline" className="justify-start" asChild>
                <BookOpen className="w-4 h-4 mr-2" />
                <div>
                  <p className="font-medium">Homework</p>
                  <p className="text-xs text-gray-500">Create assignments</p>
                </div>
              </Button>

              <Button variant="outline" className="justify-start" asChild>
                <DollarSign className="w-4 h-4 mr-2" />
                <div>
                  <p className="font-medium">Earnings</p>
                  <p className="text-xs text-gray-500">View tutor income</p>
                </div>
              </Button>

              <Button style={{ background: "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)" }} className="justify-start" asChild>
                <TrendingUp className="w-4 h-4 mr-2" />
                <div>
                  <p className="font-medium text-white">Reports</p>
                  <p className="text-xs text-blue-100">Class analytics</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
