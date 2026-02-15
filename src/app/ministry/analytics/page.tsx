"use client";

import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  Building2,
  ClipboardCheck,
  GraduationCap,
  Download,
  Calendar,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MinistryAnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30d");

  const colors = {
    primary: "rgb(168 85 247)",
    gradient: "linear-gradient(135deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)",
  };

  // Mock data - replace with actual API calls
  const stats = {
    totalStudents: 45230,
    totalSchools: 127,
    assessmentsCompleted: 35280,
    completionRate: 78,
  };

  const districts = [
    { name: "Thimphu", schools: 32, students: 12450, growth: "+8.5%" },
    { name: "Paro", schools: 18, students: 6890, growth: "+6.2%" },
    { name: "Punakha", schools: 15, students: 5430, growth: "+7.8%" },
    { name: "Mongar", schools: 12, students: 4280, growth: "+9.1%" },
    { name: "Trashigang", schools: 14, students: 4980, growth: "+5.4%" },
    { name: "Samtse", schools: 10, students: 3620, growth: "+4.8%" },
    { name: "Bumthang", schools: 8, students: 2650, growth: "+6.9%" },
    { name: "Wangdue", schools: 10, students: 3340, growth: "+7.2%" },
    { name: "Trongsa", schools: 5, students: 1590, growth: "+5.1%" },
    { name: "Sarpang", schools: 6, students: 2340, growth: "+6.5%" },
  ];

  const careerInterests = [
    { career: "Software Engineering", count: 8141, percentage: 18, color: "rgb(99 102 241)" },
    { career: "Medicine/Healthcare", count: 6785, percentage: 15, color: "rgb(236 72 153)" },
    { career: "Civil Engineering", count: 5428, percentage: 12, color: "rgb(59 130 246)" },
    { career: "Business Management", count: 4975, percentage: 11, color: "rgb(245 158 11)" },
    { career: "Teaching/Education", count: 4071, percentage: 9, color: "rgb(16 185 129)" },
    { career: "Architecture", count: 3621, percentage: 8, color: "rgb(139 92 246)" },
    { career: "Agriculture", count: 3166, percentage: 7, color: "rgb(34 197 94)" },
    { career: "Journalism/Media", count: 2712, percentage: 6, color: "rgb(249 115 22)" },
  ];

  const assessmentData = [
    { type: "RIASEC", completed: 18540, rate: 82 },
    { type: "MBTI", completed: 10452, rate: 75 },
    { type: "DISC", completed: 6288, rate: 68 },
  ];

  const handleExport = (format: "csv" | "pdf") => {
    // Mock export functionality
    console.log(`Exporting as ${format}`);
    alert(`Report exported as ${format.toUpperCase()}`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">National Education Analytics</h1>
          <p className="text-gray-600">Platform-wide insights and trends</p>
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => handleExport("csv")}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => handleExport("pdf")} style={{ background: colors.gradient }} className="text-white">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg" style={{ background: "rgb(250 245 255)" }}>
                <Users className="w-6 h-6" style={{ color: colors.primary }} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStudents.toLocaleString()}</p>
                <p className="text-xs text-green-600">+8.5% vs last period</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg" style={{ background: "rgb(250 245 255)" }}>
                <Building2 className="w-6 h-6" style={{ color: colors.primary }} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Schools</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSchools}</p>
                <p className="text-xs text-green-600">+6 this month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg" style={{ background: "rgb(250 245 255)" }}>
                <ClipboardCheck className="w-6 h-6" style={{ color: colors.primary }} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Assessments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.assessmentsCompleted.toLocaleString()}</p>
                <p className="text-xs text-green-600">+12% this month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg" style={{ background: "rgb(250 245 255)" }}>
                <TrendingUp className="w-6 h-6" style={{ color: colors.primary }} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
                <p className="text-xs text-green-600">+5% improvement</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Schools by District */}
        <Card>
          <CardHeader>
            <CardTitle>Schools by District</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {districts.map((district) => (
                <div key={district.name} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-900">{district.name}</p>
                      <div className="text-right">
                        <span className="text-sm text-gray-600">{district.schools} schools</span>
                        <span className="ml-2 text-xs text-green-600">{district.growth}</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(district.students / 12450) * 100}%`,
                          background: colors.gradient,
                        }}
                      />
                    </div>
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
              {careerInterests.map((interest) => (
                <div key={interest.career} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-900">{interest.career}</p>
                      <span className="text-sm text-gray-600">{interest.count.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${interest.percentage}%`,
                          background: interest.color,
                        }}
                      />
                    </div>
                  </div>
                  <span className="ml-4 text-sm font-medium text-gray-700 w-12 text-right">
                    {interest.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assessment Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Completion by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {assessmentData.map((assessment) => (
              <div key={assessment.type} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">{assessment.type}</h3>
                  <ClipboardCheck className="w-5 h-5 text-gray-400" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Completed</span>
                    <span className="font-medium text-gray-900">{assessment.completed.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${assessment.rate}%`,
                        background: colors.gradient,
                      }}
                    />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Rate</span>
                    <span className="font-medium text-gray-900">{assessment.rate}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* View Only Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">View-Only Access</p>
              <p className="text-sm text-blue-700">Ministry users have read-only access to analytics data. Use Export buttons to download reports.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
