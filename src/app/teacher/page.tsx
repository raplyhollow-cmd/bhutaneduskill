import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  TrendingUp,
  BookOpen,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Target,
} from "lucide-react";
import Link from "next/link";

export default function TeacherDashboardPage() {
  // Mock data - will be replaced with real data from database
  const teacherStats = {
    totalStudents: 156,
    activeClasses: 4,
    pendingAssessments: 23,
    completedThisWeek: 45,
    aiInteractions: 89, // AI Career Coach questions this week
  };

  const classes = [
    {
      id: "class-1",
      name: "Class 10 A",
      grade: 10,
      section: "A",
      students: 42,
      assessmentCompletion: 68,
      nextClass: "Tomorrow, 10:00 AM",
    },
    {
      id: "class-2",
      name: "Class 10 B",
      grade: 10,
      section: "B",
      students: 38,
      assessmentCompletion: 45,
      nextClass: "Today, 2:00 PM",
    },
    {
      id: "class-3",
      name: "Class 9 A",
      grade: 9,
      section: "A",
      students: 40,
      assessmentCompletion: 82,
      nextClass: "Wednesday, 9:00 AM",
    },
    {
      id: "class-4",
      name: "Class 8 A",
      grade: 8,
      section: "A",
      students: 36,
      assessmentCompletion: 25,
      nextClass: "Thursday, 11:00 AM",
    },
  ];

  const recentActivity = [
    {
      id: 1,
      type: "assessment_completed",
      student: "Tashi Dorji",
      class: "Class 10 A",
      time: "2 hours ago",
      result: "AIR - Artistic, Investigative, Realistic",
    },
    {
      id: 2,
      type: "assessment_started",
      student: "Karma Wangmo",
      class: "Class 10 B",
      time: "3 hours ago",
      result: "In progress",
    },
    {
      id: 3,
      type: "career_explored",
      student: "Pema Lhamo",
      class: "Class 9 A",
      time: "5 hours ago",
      result: "Software Developer",
    },
    {
      id: 4,
      type: "assessment_completed",
      student: "Dorji Wangchuk",
      class: "Class 8 A",
      time: "Yesterday",
      result: "SIE - Social, Investigative, Enterprising",
    },
  ];

  const needsAttention = [
    {
      id: 1,
      student: "Sonam Choden",
      class: "Class 10 A",
      reason: "Not started assessment",
      daysSinceLogin: 7,
    },
    {
      id: 2,
      student: "Jigme Tenzin",
      class: "Class 9 A",
      reason: "Low engagement",
      daysSinceLogin: 5,
    },
    {
      id: 3,
      student: "Dechen Wangmo",
      class: "Class 10 B",
      reason: "Assessment abandoned",
      daysSinceLogin: 3,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Teacher Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor your students' career exploration journey
          </p>
        </div>
        <Button asChild>
          <Link href="/teacher/classes">
            Manage Classes
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>

      {/* Stats Grid - Using Bhutan Colors */}
      <div className="grid md:grid-cols-5 gap-6">
        <Card className="premium-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {teacherStats.totalStudents}
            </div>
            <p className="text-xs text-gray-500 mt-1">Across all classes</p>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Active Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-sky-600">
              {teacherStats.activeClasses}
            </div>
            <p className="text-xs text-gray-500 mt-1">This semester</p>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending Assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {teacherStats.pendingAssessments}
            </div>
            <p className="text-xs text-gray-500 mt-1">Awaiting completion</p>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Completed This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-600">
              {teacherStats.completedThisWeek}
            </div>
            <p className="text-xs text-blue-600 mt-1">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              +12% from last week
            </p>
          </CardContent>
        </Card>

        {/* AI Feature Card - NEW */}
        <Card
          className="premium-card border-purple-200"
          style={{ background: 'linear-gradient(to bottom right, rgb(250 245 255), rgb(219 234 254))' }}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              AI Coach Interactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {teacherStats.aiInteractions}
            </div>
            <p className="text-xs text-gray-500 mt-1">Questions asked this week</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Classes Overview */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>My Classes</CardTitle>
              <CardDescription>Assessment completion by class</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {cls.students} students
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Next: {cls.nextClass}</span>
                    </div>
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">
                          Assessment Completion
                        </span>
                        <span className="text-xs font-medium">
                          {cls.assessmentCompletion}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                          style={{ width: `${cls.assessmentCompletion}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost">
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Needs Attention */}
        <div>
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                Needs Attention
              </CardTitle>
              <CardDescription>Students who may need support</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {needsAttention.map((item) => (
                <div key={item.id} className="p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{item.student}</p>
                      <p className="text-sm text-gray-600">{item.class}</p>
                      <p className="text-xs text-gray-500 mt-1">{item.reason}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {item.daysSinceLogin}d
                    </Badge>
                  </div>
                  <Button size="sm" variant="outline" className="w-full mt-3">
                    Send Reminder
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest student activities across your classes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  activity.type === "assessment_completed"
                    ? "bg-green-100"
                    : activity.type === "assessment_started"
                    ? "bg-blue-100"
                    : "bg-purple-100"
                }`}>
                  {activity.type === "assessment_completed" && (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  )}
                  {activity.type === "assessment_started" && (
                    <Clock className="w-5 h-5 text-blue-600" />
                  )}
                  {activity.type === "career_explored" && (
                    <BookOpen className="w-5 h-5 text-purple-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{activity.student}</p>
                  <p className="text-sm text-gray-600">
                    {activity.class} • <span className="text-blue-600">{activity.result}</span>
                  </p>
                </div>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Career Interest Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Career Interest Distribution</CardTitle>
          <CardDescription>Top career interests across your students</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { career: "Software Developer", count: 28, percentage: 18 },
              { career: "Doctor/Nurse", count: 24, percentage: 15 },
              { career: "Teacher", count: 20, percentage: 13 },
              { career: "Engineer", count: 18, percentage: 12 },
              { career: "Data Analyst", count: 15, percentage: 10 },
              { career: "Designer", count: 12, percentage: 8 },
            ].map((item) => (
              <div key={item.career} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{item.career}</span>
                    <span className="text-sm text-gray-500">{item.count} students</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                      style={{ width: `${item.percentage * 5}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
