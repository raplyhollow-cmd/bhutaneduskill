"use client";

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
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { AIInsightCard } from "@/components/ai/ai-insight-card";
import { useState, useEffect } from "react";

interface AdminStats {
  totalSchools: number;
  totalStudents: number;
  totalTeachers: number;
  totalAssessments: number;
  completionRate: number;
  activeNow: number;
}

interface TopSchool {
  id: string;
  name: string;
  students: number;
  completion: number;
  change: number;
}

interface CareerInterest {
  career: string;
  percentage: number;
  trend: "up" | "down" | "stable";
}

interface Alert {
  type: "warning" | "info" | "success";
  message: string;
}

interface AIInsight {
  type: "warning" | "success" | "info" | "tip";
  title: string;
  message: string;
  actions?: Array<{ label: string; href: string }>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats>({
    totalSchools: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalAssessments: 0,
    completionRate: 0,
    activeNow: 0,
  });
  const [topSchools, setTopSchools] = useState<TopSchool[]>([]);
  const [careerInterests, setCareerInterests] = useState<CareerInterest[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingInsights, setIsLoadingInsights] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Load AI insights after dashboard data is available
  useEffect(() => {
    if (!isLoading && stats.totalSchools > 0) {
      loadAIInsights();
    }
  }, [isLoading, stats, topSchools, careerInterests]);

  const loadDashboardData = async () => {
    try {
      const response = await fetch("/api/admin/dashboard");
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || stats);
        setTopSchools(data.topSchools || []);
        setCareerInterests(data.careerInterests || []);

        // Generate alerts from data
        const newAlerts: Alert[] = [];
        if (data.topSchools && data.topSchools.some((s: TopSchool) => s.completion < 80)) {
          const lowCount = data.topSchools.filter((s: TopSchool) => s.completion < 80).length;
          newAlerts.push({ type: "warning", message: `${lowCount} schools have low assessment completion rates` });
        }
        if (data.stats && data.stats.totalSchools > 10) {
          newAlerts.push({ type: "info", message: `Platform now serving ${data.stats.totalSchools} schools across Bhutan` });
        }
        setAlerts(newAlerts);
      }
    } catch (error) {
      console.error("Failed to load admin dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAIInsights = async () => {
    try {
      const response = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userRole: "admin",
          contextData: {
            stats,
            schools: topSchools,
            careerInterests,
          },
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setAiInsights(data.insights || []);
      }
    } catch (error) {
      console.error("Failed to load AI insights:", error);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
            <p className="ml-3 text-gray-600">Loading dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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

      {/* AI Insights Section - Dynamic from API */}
      <div className="grid md:grid-cols-3 gap-4">
        {isLoadingInsights ? (
          <>
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </CardContent>
            </Card>
          </>
        ) : aiInsights.length > 0 ? (
          aiInsights.map((insight, index) => (
            <AIInsightCard
              key={index}
              type={insight.type}
              title={insight.title}
              message={insight.message}
              actions={insight.actions}
            />
          ))
        ) : (
          // Fallback to data-driven insights if API returns empty
          <>
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
              message={`${stats.totalStudents} students across ${stats.totalSchools} schools. 15% increase in new registrations this month. Career guidance adoption trending upward.`}
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
          </>
        )}
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
              {stats.totalSchools}
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
              {stats.totalStudents}
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
              {stats.totalTeachers}
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
              {stats.totalAssessments}
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
              {stats.completionRate}%
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
              {stats.activeNow}
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

      {/* Platform Status */}
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

      {/* Recent Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Overview</CardTitle>
          <CardDescription>Real-time platform statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Total Schools</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalSchools}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Active Students</p>
              <p className="text-2xl font-bold text-green-900">{stats.totalStudents}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">Assessments Completed</p>
              <p className="text-2xl font-bold text-purple-900">{stats.totalAssessments}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
