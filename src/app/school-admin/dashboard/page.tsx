/**
 * SCHOOL ADMIN DASHBOARD
 *
 * Key features:
 * - Quick stats (students, teachers, classes)
 * - Pending actions
 * - Recent activities
 * - Quick access cards
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserCheck,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  BookOpen,
  FileText,
  CheckCircle2,
  Clock,
  Sparkles,
  GraduationCap,
} from "lucide-react";
import Link from "next/link";

export default function SchoolAdminDashboardPage() {
  // Mock data
  const schoolStats = {
    totalStudents: 487,
    totalTeachers: 34,
    totalClasses: 18,
    pendingAttendance: 5,
    pendingFees: 23,
    totalRevenue: 2850000, // BTN
  };

  const todayClasses = [
    {
      id: "1",
      name: "Class 10 A",
      teacher: "Tashi Dorji",
      subject: "Mathematics",
      time: "9:00 AM",
      attendanceStatus: "pending",
    },
    {
      id: "2",
      name: "Class 10 B",
      teacher: "Karma Wangmo",
      subject: "English",
      time: "10:30 AM",
      attendanceStatus: "completed",
    },
    {
      id: "3",
      name: "Class 9 A",
      teacher: "Pema Lhamo",
      subject: "Physics",
      time: "11:00 AM",
      attendanceStatus: "pending",
    },
  ];

  const pendingActions = [
    {
      id: "1",
      type: "attendance",
      title: "5 classes pending attendance",
      urgency: "high",
      action: "Mark Attendance",
      link: "/school-admin/attendance",
    },
    {
      id: "2",
      type: "fees",
      title: "23 students with pending fees",
      urgency: "medium",
      action: "View Details",
      link: "/school-admin/fees",
    },
    {
      id: "3",
      type: "homework",
      title: "12 homework submissions to grade",
      urgency: "low",
      action: "Grade Now",
      link: "/school-admin/homework",
    },
    {
      id: "4",
      type: "approval",
      title: "3 tutor verification requests",
      urgency: "medium",
      action: "Review",
      link: "/school-admin/tutors",
    },
  ];

  const recentActivities = [
    {
      id: "1",
      type: "enrollment",
      message: "5 new students enrolled",
      time: "2 hours ago",
      icon: UserCheck,
    },
    {
      id: "2",
      type: "homework",
      message: "Math homework assigned to Class 10A",
      time: "4 hours ago",
      icon: FileText,
    },
    {
      id: "3",
      type: "result",
      message: "Midterm results published for Class 12",
      time: "Yesterday",
      icon: CheckCircle2,
    },
    {
      id: "4",
      type: "fee",
      message: "45 students paid monthly fees",
      time: "Yesterday",
      icon: DollarSign,
    },
  ];

  const upcomingEvents = [
    {
      id: "1",
      title: "Parent-Teacher Meeting",
      date: "March 15, 2025",
      time: "10:00 AM - 2:00 PM",
      type: "meeting",
    },
    {
      id: "2",
      title: "Midterm Examinations",
      date: "March 20-25, 2025",
      time: "All Day",
      type: "exam",
    },
    {
      id: "3",
      title: "Career Counseling Session",
      date: "March 18, 2025",
      time: "2:00 PM - 4:00 PM",
      type: "counseling",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">School Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your school efficiently</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/school-admin/analytics">
              <TrendingUp className="w-4 h-4 mr-2" />
              Analytics
            </Link>
          </Button>
          <Button className="bg-violet-600 hover:bg-violet-700" asChild>
            <Link href="/school-admin/quick-actions">
              <Sparkles className="w-4 h-4 mr-2" />
              Quick Actions
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid - Bhutan Colors */}
      <div className="grid md:grid-cols-6 gap-4">
        <Card className="premium-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-2">
              <Users className="w-3 h-3" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-600">{schoolStats.totalStudents}</div>
            <p className="text-xs text-violet-600 mt-1">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              +12 this month
            </p>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-2">
              <GraduationCap className="w-3 h-3" />
              Teachers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{schoolStats.totalTeachers}</div>
            <p className="text-xs text-gray-500 mt-1">Active staff</p>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-2">
              <BookOpen className="w-3 h-3" />
              Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{schoolStats.totalClasses}</div>
            <p className="text-xs text-gray-500 mt-1">This semester</p>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-2">
              <Calendar className="w-3 h-3" />
              Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{schoolStats.pendingAttendance}</div>
            <p className="text-xs text-orange-600 mt-1">Pending today</p>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-2">
              <DollarSign className="w-3 h-3" />
              Fees Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{schoolStats.pendingFees}</div>
            <p className="text-xs text-orange-600 mt-1">Students</p>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-2">
              <DollarSign className="w-3 h-3" />
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-violet-600">
              Nu. {(schoolStats.totalRevenue / 1000).toFixed(0)}K
            </div>
            <p className="text-xs text-gray-500 mt-1">This month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's Classes & Attendance */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Today's Classes</CardTitle>
                  <CardDescription>Mark attendance for scheduled classes</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/school-admin/attendance">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todayClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-violet-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{cls.name}</p>
                        <p className="text-sm text-gray-500">
                          {cls.teacher} • {cls.subject}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{cls.time}</p>
                      <Badge
                        variant="outline"
                        className={
                          cls.attendanceStatus === "completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700"
                        }
                      >
                        {cls.attendanceStatus === "completed" ? "Completed" : "Pending"}
                      </Badge>
                    </div>
                    {cls.attendanceStatus === "pending" && (
                      <Button size="sm" className="ml-4">
                        Mark
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Actions */}
        <div>
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                Pending Actions
              </CardTitle>
              <CardDescription>Requires your attention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingActions.map((action) => (
                <div key={action.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{action.title}</p>
                      <Badge
                        variant="outline"
                        className={
                          action.urgency === "high"
                            ? "bg-red-100 text-red-700 mt-1"
                            : action.urgency === "medium"
                            ? "bg-yellow-100 text-yellow-700 mt-1"
                            : "bg-gray-100 text-gray-600 mt-1"
                        }
                      >
                        {action.urgency}
                      </Badge>
                    </div>
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={action.link}>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="premium-card hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/school-admin/students">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-medium">Manage Students</p>
                    <p className="text-xs text-gray-500">Add, edit, enroll</p>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="premium-card hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/school-admin/teachers">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Manage Teachers</p>
                    <p className="text-xs text-gray-500">Assign classes, subjects</p>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="premium-card hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/school-admin/classes">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium">Manage Classes</p>
                    <p className="text-xs text-gray-500">Create, schedule</p>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="premium-card hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-purple-50 to-pink-50">
            <Link href="/school-admin/counselors">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <UserCheck className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Counselors</p>
                    <p className="text-xs text-gray-500">Assign to students</p>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="premium-card hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/school-admin/attendance">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Attendance</p>
                    <p className="text-xs text-gray-500">Mark, view reports</p>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="premium-card hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/school-admin/fees">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium">Fee Management</p>
                    <p className="text-xs text-gray-500">Track, collect fees</p>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="premium-card hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/school-admin/results">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Exam Results</p>
                    <p className="text-xs text-gray-500">Record, publish</p>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="premium-card hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-blue-50 to-purple-50">
            <Link href="/school-admin/tuition">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Tuition Center</p>
                    <p className="text-xs text-gray-500">Manage tuition</p>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>
        </div>
      </div>

      {/* Recent Activity & Upcoming Events */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates in your school</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.type === "enrollment" ? "bg-green-100" :
                    activity.type === "homework" ? "bg-blue-100" :
                    activity.type === "result" ? "bg-purple-100" : "bg-yellow-100"
                  }`}>
                    <activity.icon className={`w-5 h-5 ${
                      activity.type === "enrollment" ? "text-green-600" :
                      activity.type === "homework" ? "text-blue-600" :
                      activity.type === "result" ? "text-purple-600" : "text-yellow-600"
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Important dates & activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white" style={{ background: 'linear-gradient(to bottom right, rgb(139 92 246), rgb(124 58 237))' }}>
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{event.title}</p>
                    <p className="text-sm text-gray-500">{event.date}</p>
                    <p className="text-xs text-gray-400">{event.time}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      event.type === "meeting" ? "bg-blue-100 text-blue-700" :
                      event.type === "exam" ? "bg-red-100 text-red-700" : "bg-purple-100 text-purple-700"
                    }
                  >
                    {event.type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
