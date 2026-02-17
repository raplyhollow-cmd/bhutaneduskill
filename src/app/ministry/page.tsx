"use client";

import { logger } from "@/lib/logger";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AIInsightCard } from "@/components/ai/ai-insight-card";
import {
  Building2,
  Users,
  ClipboardCheck,
  GraduationCap,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Loader2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import Link from "next/link";

// ============================================================================
// TYPES
// ============================================================================

interface DashboardStats {
  totalSchools: number;
  totalStudents: number;
  totalTeachers: number;
  assessmentCompletion: number;
  newSchoolsThisMonth: number;
  activeTeachers: number;
  enrollmentGrowth: number;
}

interface TopSchool {
  id: string;
  name: string;
  district: string;
  completion: number;
  students: number;
  change: number;
}

interface CareerInterest {
  career: string;
  percentage: number;
  trend: string;
  count: number;
}

interface AIInsight {
  type: "warning" | "success" | "info" | "tip";
  title: string;
  message: string;
  actions?: Array<{ label: string; href: string }>;
}

export default function MinistryDashboard() {
  // Data state
  const [stats, setStats] = useState<DashboardStats>({
    totalSchools: 0,
    totalStudents: 0,
    totalTeachers: 0,
    assessmentCompletion: 0,
    newSchoolsThisMonth: 0,
    activeTeachers: 0,
    enrollmentGrowth: 0,
  });
  const [topSchools, setTopSchools] = useState<TopSchool[]>([]);
  const [careerInterests, setCareerInterests] = useState<CareerInterest[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingInsights, setIsLoadingInsights] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Purple/violet theme colors
  const colors = {
    primary: "rgb(168 85 247)",
    secondary: "rgb(147 51 234)",
    gradient: "linear-gradient(135deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)",
    bg: "rgb(250 245 255)",
  };

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Load AI insights after dashboard data is available
  useEffect(() => {
    if (!isLoading && stats && topSchools && careerInterests && stats.totalSchools > 0) {
      loadAIInsights();
    }
  }, [isLoading, stats, topSchools, careerInterests]);

  const loadDashboardData = async () => {
    try {
      const response = await fetch("/api/ministry/dashboard");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      const data = result.data as {
        stats: DashboardStats;
        topSchools: TopSchool[];
        careerInterests: CareerInterest[];
      };

      setStats(data.stats || stats);
      setTopSchools(data.topSchools || []);
      setCareerInterests(data.careerInterests || []);
    } catch (err) {
      logger.error("Failed to load ministry dashboard:", err);
      setError("Failed to load dashboard data");
      // Set default values to prevent UI errors
      setStats({
        totalSchools: 0,
        totalStudents: 0,
        totalTeachers: 0,
        assessmentCompletion: 0,
        newSchoolsThisMonth: 0,
        activeTeachers: 0,
        enrollmentGrowth: 0,
      });
      setTopSchools([]);
      setCareerInterests([]);
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
          userRole: "ministry",
          contextData: {
            stats,
            schools: topSchools,
            careerInterests,
          },
        }),
      });

      logger.debug("[Ministry Dashboard] AI Insights API status:", response.status);

      if (response.ok) {
        const data = await response.json();
        logger.debug("[Ministry Dashboard] AI Insights received:", data.insights?.length || 0, "insights");
        setAiInsights(data.insights || []);
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        logger.error("[Ministry Dashboard] AI Insights API error:", errorData);
        setAiInsights([]);
      }
    } catch (err) {
      logger.error("[Ministry Dashboard] Failed to load AI insights:", err);
      setAiInsights([]);
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
            <p className="ml-3 text-gray-600">Loading Ministry Dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            asChild
          >
            <Link href="/ministry/schools">
              <Building2 className="w-4 h-4 mr-2" />
              Add School
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
          // Fallback insights if API returns empty
          <>
            <AIInsightCard
              type="warning"
              title="Schools Requiring Attention"
              message={`${topSchools.filter(s => s.completion < 70).length} schools have assessment completion rates below 70%. Consider targeted support programs.`}
              actions={[
                { label: "View Schools", href: "/ministry/schools" },
                { label: "View Analytics", href: "/ministry/analytics" },
              ]}
            />

            <AIInsightCard
              type="success"
              title="National Education Growth Positive"
              message={`${stats.totalStudents.toLocaleString()} students across ${stats.totalSchools} schools. ${stats.enrollmentGrowth}% growth indicates positive education trends.`}
              actions={[
                { label: "View Analytics", href: "/ministry/analytics" },
                { label: "View Reports", href: "/ministry/reports" },
              ]}
            />

            <AIInsightCard
              type="tip"
              title="National Career Interest Trends"
              message={`Career interest analysis shows ${careerInterests[0]?.career || "Technology"} (${careerInterests[0]?.percentage || 0}%) and ${careerInterests[1]?.career || "Healthcare"} as top choices. Consider curriculum alignment.`}
              actions={[
                { label: "View Policies", href: "/ministry/policies" },
                { label: "View Analytics", href: "/ministry/analytics" },
              ]}
            />
          </>
        )}
      </div>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4" style={{ borderLeftColor: colors.primary }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Schools</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalSchools}</p>
                <p className="text-xs text-green-600 mt-1">
                  <ArrowUp className="w-3 h-3 inline" /> +{stats.newSchoolsThisMonth} this month
                </p>
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
                <p className="text-xs text-green-600 mt-1">
                  <ArrowUp className="w-3 h-3 inline" /> +{stats.enrollmentGrowth}% growth
                </p>
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
                <p className="text-xs text-green-600 mt-1">
                  <ArrowUp className="w-3 h-3 inline" /> National average
                </p>
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
                <p className="text-xs text-green-600 mt-1">
                  <ArrowUp className="w-3 h-3 inline" /> Nationwide
                </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Schools */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Schools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topSchools.length > 0 ? (
                topSchools.map((school, index) => (
                  <div key={school.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? "bg-yellow-100 text-yellow-700" :
                        index === 1 ? "bg-gray-100 text-gray-700" :
                        index === 2 ? "bg-orange-100 text-orange-700" :
                        "bg-gray-50 text-gray-600"
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{school.name}</p>
                        <p className="text-sm text-gray-500">{school.district}</p>
                      </div>
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
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No school data available</p>
              )}
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
              {careerInterests.length > 0 ? (
                careerInterests.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-gray-900">{item.career}</p>
                        <span className={`text-sm font-medium ${
                          item.trend.startsWith('+') ? 'text-green-600' :
                          item.trend.startsWith('-') ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
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
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No career interest data available</p>
              )}
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
