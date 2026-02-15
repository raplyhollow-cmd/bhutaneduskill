import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  Building2,
  Users,
  ClipboardCheck,
  GraduationCap,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function MinistryDashboard() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Purple/violet theme colors
  const colors = {
    primary: "rgb(168 85 247)",
    secondary: "rgb(147 51 234)",
    gradient: "linear-gradient(135deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)",
    bg: "rgb(250 245 255)",
  };

  // Mock data - replace with actual API calls
  const stats = {
    totalSchools: 127,
    totalStudents: 45230,
    assessmentCompletion: 78,
    activeTeachers: 3245,
    newSchoolsThisMonth: 8,
    revenueThisMonth: "BTN 2.4M",
  };

  const aiInsights = [
    {
      icon: AlertCircle,
      title: "Schools Needing Attention",
      description: "12 schools have assessment completion below 50% this month",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      icon: TrendingUp,
      title: "Enrollment Trend Positive",
      description: "Student enrollment increased by 8.5% compared to last month",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      icon: CheckCircle2,
      title: "Assessment Completion Rising",
      description: "RIASEC assessment completion rate up by 12% nationwide",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  const topSchools = [
    { name: "Royal High School", district: "Thimphu", completion: 94 },
    { name: "Yangchenphug HSS", district: "Thimphu", completion: 91 },
    { name: "Mongar HSS", district: "Mongar", completion: 89 },
    { name: "Punakha HSS", district: "Punakha", completion: 87 },
    { name: "Paro HSS", district: "Paro", completion: 85 },
  ];

  const careerInterests = [
    { career: "Software Engineering", percentage: 18, trend: "+3%" },
    { career: "Medicine/Healthcare", percentage: 15, trend: "+2%" },
    { career: "Civil Engineering", percentage: 12, trend: "+1%" },
    { career: "Business Management", percentage: 11, trend: "-1%" },
    { career: "Teaching/Education", percentage: 9, trend: "0%" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Ministry of Education Dashboard
          </h1>
          <p className="text-gray-600">National Education Overview</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            View Reports
          </Button>
          <Button
            style={{ background: colors.gradient }}
            className="text-white"
          >
            <Building2 className="w-4 h-4 mr-2" />
            Add School
          </Button>
        </div>
      </div>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4" style={{ borderLeftColor: colors.primary }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Schools</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalSchools}</p>
                <p className="text-xs text-green-600 mt-1">+{stats.newSchoolsThisMonth} this month</p>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: colors.bg }}
              >
                <Building2 className="w-6 h-6" style={{ color: colors.primary }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4" style={{ borderLeftColor: colors.primary }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Students</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalStudents.toLocaleString()}
                </p>
                <p className="text-xs text-green-600 mt-1">+8.5% growth</p>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: colors.bg }}
              >
                <Users className="w-6 h-6" style={{ color: colors.primary }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4" style={{ borderLeftColor: colors.primary }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Assessment Rate</p>
                <p className="text-3xl font-bold text-gray-900">{stats.assessmentCompletion}%</p>
                <p className="text-xs text-green-600 mt-1">+12% this month</p>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: colors.bg }}
              >
                <ClipboardCheck className="w-6 h-6" style={{ color: colors.primary }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4" style={{ borderLeftColor: colors.primary }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Teachers</p>
                <p className="text-3xl font-bold text-gray-900">{stats.activeTeachers.toLocaleString()}</p>
                <p className="text-xs text-green-600 mt-1">+45 new</p>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: colors.bg }}
              >
                <GraduationCap className="w-6 h-6" style={{ color: colors.primary }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {aiInsights.map((insight, index) => (
          <Card key={index} className={insight.bgColor}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${insight.bgColor}`}>
                  <insight.icon className={`w-6 h-6 ${insight.color}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{insight.title}</h3>
                  <p className="text-sm text-gray-600">{insight.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Schools */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Schools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topSchools.map((school, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{school.name}</p>
                    <p className="text-sm text-gray-500">{school.district}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${school.completion}%`,
                          background: colors.gradient,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {school.completion}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Career Interests */}
        <Card>
          <CardHeader>
            <CardTitle>National Career Interests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {careerInterests.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-900">{item.career}</p>
                      <span className={`text-sm font-medium ${item.trend.startsWith('+') ? 'text-green-600' : item.trend.startsWith('-') ? 'text-red-600' : 'text-gray-600'}`}>
                        {item.trend}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${item.percentage}%`,
                          background: colors.gradient,
                        }}
                      />
                    </div>
                  </div>
                  <span className="ml-4 text-sm font-medium text-gray-700 w-12 text-right">
                    {item.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/ministry/schools">
              <Button variant="outline" className="w-full justify-start">
                <Building2 className="w-4 h-4 mr-2" />
                Manage Schools
              </Button>
            </Link>
            <Link href="/ministry/notifications">
              <Button variant="outline" className="w-full justify-start">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Send Notification
              </Button>
            </Link>
            <Link href="/ministry/analytics">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
