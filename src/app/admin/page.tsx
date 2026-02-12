import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Users,
  GraduationCap,
  TrendingUp,
  Activity,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Globe,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { AIInsightCard } from "@/components/ai/ai-insight-card";

export default function AdminDashboardPage() {
  // Mock data - will be replaced with real data from database
  const adminStats = {
    totalSchools: 12,
    totalStudents: 2456,
    totalTeachers: 89,
    totalAssessments: 1890,
    completionRate: 77,
    activeNow: 142,
  };

  const recentActivity = [
    { id: 1, type: "school", action: "Pelkhil School joined", time: "2 hours ago" },
    { id: 2, type: "user", action: "45 new students registered", time: "Today" },
    { id: 3, type: "assessment", action: "120 assessments completed", time: "Yesterday" },
    { id: 4, type: "system", action: "Database backup completed", time: "Yesterday" },
  ];

  const topSchools = [
    { name: "Pelkhil School", students: 342, completion: 92, change: 5 },
    { name: "Druk School", students: 298, completion: 88, change: 3 },
    { name: "Yangchenphug HSS", students: 456, completion: 85, change: -2 },
    { name: "Motithang HSS", students: 389, completion: 81, change: 4 },
    { name: "Rinchen HSS", students: 267, completion: 78, change: 1 },
  ];

  const careerInterests = [
    { career: "Software Developer", percentage: 18, trend: "up" },
    { career: "Doctor/Nurse", percentage: 15, trend: "down" },
    { career: "Engineer", percentage: 12, trend: "up" },
    { career: "Teacher", percentage: 10, trend: "stable" },
    { career: "Data Analyst", percentage: 8, trend: "up" },
  ];

  const alerts = [
    { type: "warning", message: "3 schools have low assessment completion rates" },
    { type: "info", message: "New RUB college programs added to database" },
    { type: "success", message: "Weekly backup completed successfully" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Platform-wide overview and management
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            Export Report
          </Button>
          <Button asChild>
            <Link href="/admin/schools">
              Manage Schools
            </Link>
          </Button>
        </div>
      </div>

      {/* AI Insights Section */}
      <div className="grid md:grid-cols-3 gap-4">
        <AIInsightCard
          type="warning"
          title="School Engagement Alert"
          message={`${alerts.filter(a => a.type === "warning").length > 0 ? "Some schools have low assessment completion rates. " : ""}${topSchools.filter(s => s.completion < 80).length} schools below 80% completion threshold.`}
          actions={[
            { label: "View Schools", href: "/admin/schools" },
            { label: "Send Alert", href: "/admin/notifications" },
          ]}
        />

        <AIInsightCard
          type="success"
          title="Platform Growth Positive"
          message={`${adminStats.totalStudents} students across ${adminStats.totalSchools} schools. 15% increase in new registrations this month. Career guidance adoption trending upward.`}
          actions={[
            { label: "View Analytics", href: "/admin/analytics" },
          ]}
        />

        <AIInsightCard
          type="tip"
          title="Popular Career Interests"
          message={`AI analysis shows ${careerInterests[0]?.career || "Technology"} and ${careerInterests[1]?.career || "Healthcare"} as top career interests. Consider partnering with relevant RUB colleges for workshops.`}
          actions={[
            { label: "View Content", href: "/admin/content" },
            { label: "Manage Partners", href: "/admin/partners" },
          ]}
        />
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg flex items-center gap-3 ${
                alert.type === "warning"
                  ? "bg-yellow-50 text-yellow-900 border border-yellow-200"
                  : alert.type === "success"
                  ? "bg-green-50 text-green-900 border border-green-200"
                  : "bg-blue-50 text-blue-900 border border-blue-200"
              }`}
            >
              <AlertCircle className="w-5 h-5" />
              <span className="flex-1">{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Schools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {adminStats.totalSchools}
            </div>
            <p className="text-xs text-green-600 mt-1">
              <ArrowUp className="w-3 h-3 inline" /> +2 this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {adminStats.totalStudents}
            </div>
            <p className="text-xs text-green-600 mt-1">
              <ArrowUp className="w-3 h-3 inline" /> +156 this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Teachers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {adminStats.totalTeachers}
            </div>
            <p className="text-xs text-green-600 mt-1">
              <ArrowUp className="w-3 h-3 inline" /> +8 this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {adminStats.totalAssessments}
            </div>
            <p className="text-xs text-gray-500 mt-1">Total completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {adminStats.completionRate}%
            </div>
            <p className="text-xs text-green-600 mt-1">
              <ArrowUp className="w-3 h-3 inline" /> +5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Active Now
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {adminStats.activeNow}
            </div>
            <p className="text-xs text-gray-500 mt-1">Currently online</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Top Schools */}
        <Card>
          <CardHeader>
            <CardTitle>Top Schools by Engagement</CardTitle>
            <CardDescription>Assessment completion rates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {topSchools.map((school, index) => (
              <div key={school.name} className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0 ? "bg-yellow-100 text-yellow-700" :
                  index === 1 ? "bg-gray-100 text-gray-700" :
                  index === 2 ? "bg-orange-100 text-orange-700" :
                  "bg-gray-50 text-gray-600"
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900">{school.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">{school.students} students</span>
                      <Badge variant="outline" className="text-xs">
                        {school.completion}%
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                      style={{ width: `${school.completion}%` }}
                    />
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  school.change > 0 ? "bg-green-100" : "bg-red-100"
                }`}>
                  {school.change > 0 ? (
                    <ArrowUp className="w-3 h-3 text-green-600" />
                  ) : (
                    <ArrowDown className="w-3 h-3 text-red-600" />
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Career Interests Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Career Interests Distribution</CardTitle>
            <CardDescription>Most popular career choices across all students</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {careerInterests.map((item) => (
              <div key={item.career} className="flex items-center gap-4">
                <div className="w-32 text-sm font-medium text-gray-900">
                  {item.career}
                </div>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full"
                      style={{ width: `${item.percentage * 4}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 w-20">
                  <span className="text-sm font-semibold text-gray-900">
                    {item.percentage}%
                  </span>
                  {item.trend === "up" && (
                    <ArrowUp className="w-4 h-4 text-green-500" />
                  )}
                  {item.trend === "down" && (
                    <ArrowDown className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Study Abroad Interest */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Study Abroad Interest
          </CardTitle>
          <CardDescription>Student interest by destination country</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-5 gap-6">
            {[
              { country: "🇦🇺 Australia", percentage: 35, students: 860 },
              { country: "🇳🇿 New Zealand", percentage: 25, students: 614 },
              { country: "🇺🇸 United States", percentage: 20, students: 491 },
              { country: "🇸🇬 Singapore", percentage: 12, students: 295 },
              { country: "🇪🇺 Europe", percentage: 8, students: 196 },
            ].map((item) => (
              <div key={item.country} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl mb-2">{item.country.split(" ")[0]}</div>
                <div className="text-2xl font-bold text-gray-900">{item.percentage}%</div>
                <div className="text-sm text-gray-500">{item.students} students</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${item.percentage * 2}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Platform Activity</CardTitle>
          <CardDescription>Latest updates across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  activity.type === "school" ? "bg-purple-100" :
                  activity.type === "user" ? "bg-blue-100" :
                  activity.type === "assessment" ? "bg-green-100" :
                  "bg-gray-100"
                }`}>
                  {activity.type === "school" && <Building2 className="w-5 h-5 text-purple-600" />}
                  {activity.type === "user" && <Users className="w-5 h-5 text-blue-600" />}
                  {activity.type === "assessment" && <FileText className="w-5 h-5 text-green-600" />}
                  {activity.type === "system" && <Activity className="w-5 h-5 text-gray-600" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{activity.action}</p>
                </div>
                <span className="text-sm text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
