"use client";

import { logger } from "@/lib/logger";
import { useState, useEffect, useCallback } from "react";
import {
  HeartPulse,
  TrendingUp,
  Users,
  Brain,
  Home,
  AlertCircle,
  CheckCircle2,
  MapPin,
  BarChart3,
  Loader2,
  Sparkles,
  Shield,
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

// ============================================================================
// TYPES
// ============================================================================

interface DzongkhagMetrics {
  dzongkhag: string;
  districtCode: string;
  schoolCount: number;
  studentCount: number;
  wellbeingScore: number; // 0-100 GNH score
  mentalHealthIndex: number;
  attendanceRate: number;
  academicPerformance: number;
  socialCooperation: number;
  emotionalStability: number;
  riskLevel: "low" | "medium" | "high";
  trend: "improving" | "stable" | "declining";
}

interface GNHIndicator {
  name: string;
  nationalAverage: number;
  change: number;
  status: "on-track" | "concern" | "critical";
  description: string;
}

interface InterventionSummary {
  type: string;
  count: number;
  change: number;
  mostCommon: string;
}

interface GNHResponse {
  dzongkhagMetrics: DzongkhagMetrics[];
  gnhIndicators: GNHIndicator[];
  interventionSummary: InterventionSummary[];
  nationalWellbeingScore: number;
  studentsAtRisk: number;
  timestamp: string;
}

interface ApiSuccess<T> {
  data: T;
  status: number;
}

interface ApiErrorResponse {
  error: string;
  status: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function GNHDashboardPage() {
  const [timeRange, setTimeRange] = useState("all");
  const [gnhData, setGnhData] = useState<GNHResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const colors = {
    primary: "rgb(168 85 247)",
    secondary: "rgb(147 51 234)",
    gradient: "linear-gradient(135deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    bg: "rgb(250 245 255)",
  };

  // Fetch GNH data
  const fetchGNHData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ministry/gnh?timeRange=${timeRange}`);

      if (!response.ok) {
        const errorData = (await response.json()) as ApiErrorResponse;
        throw new Error(errorData.error || "Failed to fetch GNH data");
      }

      const result = (await response.json()) as ApiSuccess<GNHResponse>;
      setGnhData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      logger.error("GNH Dashboard fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchGNHData();
  }, [fetchGNHData]);

  // Get risk level color
  const getRiskColor = (level: string) => {
    switch (level) {
      case "low":
        return colors.success;
      case "medium":
        return colors.warning;
      case "high":
        return colors.danger;
      default:
        return "#6b7280";
    }
  };

  // Get trend icon
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "declining":
        return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />;
      default:
        return <TrendingUp className="w-4 h-4 text-gray-400 rotate-90" />;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: colors.primary }} />
          <p className="text-gray-600">Loading GNH Analytics...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading GNH Data</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchGNHData} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback data if API returns empty
  const fallbackData: GNHResponse = {
    dzongkhagMetrics: [
      {
        dzongkhag: "Thimphu",
        districtCode: "TH",
        schoolCount: 45,
        studentCount: 12500,
        wellbeingScore: 78,
        mentalHealthIndex: 75,
        attendanceRate: 92,
        academicPerformance: 72,
        socialCooperation: 80,
        emotionalStability: 76,
        riskLevel: "low",
        trend: "improving",
      },
      {
        dzongkhag: "Paro",
        districtCode: "PR",
        schoolCount: 25,
        studentCount: 6200,
        wellbeingScore: 75,
        mentalHealthIndex: 73,
        attendanceRate: 90,
        academicPerformance: 70,
        socialCooperation: 78,
        emotionalStability: 74,
        riskLevel: "low",
        trend: "stable",
      },
      {
        dzongkhag: "Punakha",
        districtCode: "PU",
        schoolCount: 18,
        studentCount: 4100,
        wellbeingScore: 72,
        mentalHealthIndex: 70,
        attendanceRate: 88,
        academicPerformance: 68,
        socialCooperation: 75,
        emotionalStability: 72,
        riskLevel: "low",
        trend: "improving",
      },
      {
        dzongkhag: "Wangdue",
        districtCode: "WD",
        schoolCount: 22,
        studentCount: 4800,
        wellbeingScore: 68,
        mentalHealthIndex: 65,
        attendanceRate: 85,
        academicPerformance: 65,
        socialCooperation: 70,
        emotionalStability: 68,
        riskLevel: "medium",
        trend: "stable",
      },
      {
        dzongkhag: "Lhuntse",
        districtCode: "LH",
        schoolCount: 15,
        studentCount: 2200,
        wellbeingScore: 62,
        mentalHealthIndex: 58,
        attendanceRate: 78,
        academicPerformance: 60,
        socialCooperation: 65,
        emotionalStability: 62,
        riskLevel: "high",
        trend: "declining",
      },
      {
        dzongkhag: "Trashigang",
        districtCode: "TR",
        schoolCount: 28,
        studentCount: 5600,
        wellbeingScore: 70,
        mentalHealthIndex: 68,
        attendanceRate: 86,
        academicPerformance: 67,
        socialCooperation: 72,
        emotionalStability: 70,
        riskLevel: "medium",
        trend: "stable",
      },
      {
        dzongkhag: "Mongar",
        districtCode: "MG",
        schoolCount: 20,
        studentCount: 3800,
        wellbeingScore: 69,
        mentalHealthIndex: 66,
        attendanceRate: 84,
        academicPerformance: 65,
        socialCooperation: 71,
        emotionalStability: 68,
        riskLevel: "medium",
        trend: "improving",
      },
      {
        dzongkhag: "Samtse",
        districtCode: "ST",
        schoolCount: 24,
        studentCount: 5200,
        wellbeingScore: 71,
        mentalHealthIndex: 69,
        attendanceRate: 87,
        academicPerformance: 68,
        socialCooperation: 73,
        emotionalStability: 71,
        riskLevel: "low",
        trend: "stable",
      },
      {
        dzongkhag: "Sarpang",
        districtCode: "SP",
        schoolCount: 19,
        studentCount: 3400,
        wellbeingScore: 67,
        mentalHealthIndex: 64,
        attendanceRate: 83,
        academicPerformance: 64,
        socialCooperation: 69,
        emotionalStability: 67,
        riskLevel: "medium",
        trend: "declining",
      },
      {
        dzongkhag: "Chukha",
        districtCode: "CK",
        schoolCount: 26,
        studentCount: 5800,
        wellbeingScore: 73,
        mentalHealthIndex: 71,
        attendanceRate: 89,
        academicPerformance: 69,
        socialCooperation: 76,
        emotionalStability: 73,
        riskLevel: "low",
        trend: "improving",
      },
    ],
    gnhIndicators: [
      {
        name: "Psychological Wellbeing",
        nationalAverage: 72,
        change: 2.5,
        status: "on-track",
        description: "Students report positive mental health and life satisfaction",
      },
      {
        name: "Social Connection",
        nationalAverage: 76,
        change: 1.8,
        status: "on-track",
        description: "Strong peer relationships and community involvement",
      },
      {
        name: "Emotional Resilience",
        nationalAverage: 68,
        change: -0.5,
        status: "concern",
        description: "Ability to cope with stress and setbacks",
      },
      {
        name: "Academic Engagement",
        nationalAverage: 74,
        change: 3.2,
        status: "on-track",
        description: "Active participation and motivation in learning",
      },
    ],
    interventionSummary: [
      {
        type: "Counseling Sessions",
        count: 2450,
        change: 12,
        mostCommon: "Academic Stress",
      },
      {
        type: "Mental Health Screenings",
        count: 8900,
        change: 8,
        mostCommon: "Anxiety Assessment",
      },
      {
        type: "Wellness Workshops",
        count: 156,
        change: 15,
        mostCommon: "Mindfulness & Stress Management",
      },
      {
        type: "Crisis Interventions",
        count: 89,
        change: -5,
        mostCommon: "Family Issues",
      },
    ],
    nationalWellbeingScore: 72,
    studentsAtRisk: 890,
    timestamp: new Date().toISOString(),
  };

  const data = gnhData || fallbackData;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6" style={{ color: colors.primary }} />
            <h1 className="text-3xl font-bold text-gray-900">GNH National Dashboard</h1>
          </div>
          <p className="text-gray-600 mt-1">Gross National Happiness Analytics - Student Wellbeing Monitoring</p>
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last Quarter</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={fetchGNHData}
            variant="outline"
          >
            <Loader2 className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* National GNH Score Card */}
      <Card className="border-2" style={{ borderColor: colors.primary }}>
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">National GNH Wellbeing Score</h2>
              <div className="flex items-baseline gap-4">
                <span className="text-6xl font-bold" style={{ color: colors.primary }}>
                  {data.nationalWellbeingScore}
                </span>
                <span className="text-2xl text-gray-500">/100</span>
              </div>
              <p className="text-gray-600 mt-2">
                Based on anonymized data from {data.dzongkhagMetrics.reduce((sum, d) => sum + d.studentCount, 0).toLocaleString()} students
                across {data.dzongkhagMetrics.length} dzongkhags
              </p>
            </div>
            <div className="flex gap-4">
              <div className="text-center px-6 py-4 bg-green-50 rounded-lg">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold text-green-700">{data.dzongkhagMetrics.filter(d => d.riskLevel === "low").length}</p>
                <p className="text-sm text-green-600">Low Risk</p>
              </div>
              <div className="text-center px-6 py-4 bg-yellow-50 rounded-lg">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
                <p className="text-2xl font-bold text-yellow-700">{data.dzongkhagMetrics.filter(d => d.riskLevel === "medium").length}</p>
                <p className="text-sm text-yellow-600">Medium Risk</p>
              </div>
              <div className="text-center px-6 py-4 bg-red-50 rounded-lg">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-600" />
                <p className="text-2xl font-bold text-red-700">{data.dzongkhagMetrics.filter(d => d.riskLevel === "high").length}</p>
                <p className="text-sm text-red-600">High Risk</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GNH Indicators Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {data.gnhIndicators.map((indicator) => (
          <Card key={indicator.name} className="border-l-4" style={{
            borderLeftColor: indicator.status === "on-track" ? colors.success :
                               indicator.status === "concern" ? colors.warning : colors.danger
          }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <Brain className="w-5 h-5" style={{ color: colors.primary }} />
                <span className={`text-xs font-medium px-2 py-1 rounded ${
                  indicator.status === "on-track" ? "bg-green-100 text-green-700" :
                  indicator.status === "concern" ? "bg-yellow-100 text-yellow-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {indicator.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-1">{indicator.name}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-gray-900">{indicator.nationalAverage}</p>
                <span className={`text-sm font-medium ${indicator.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {indicator.change >= 0 ? "+" : ""}{indicator.change}%
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">{indicator.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* National Heatmap - Dzongkhag Performance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" style={{ color: colors.primary }} />
                <CardTitle>National Dzongkhag Heatmap</CardTitle>
              </div>
              <span className="text-sm text-gray-500">Real-time wellbeing by district</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {data.dzongkhagMetrics.map((dzongkhag) => (
                <div
                  key={dzongkhag.districtCode}
                  className="relative group cursor-pointer"
                  title={`${dzongkhag.dzongkhag}: ${dzongkhag.wellbeingScore}/100`}
                >
                  <div
                    className="p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105 hover:shadow-lg"
                    style={{
                      borderColor: getRiskColor(dzongkhag.riskLevel),
                      background: `linear-gradient(135deg, ${dzongkhag.wellbeingScore > 70 ? "rgba(16, 185, 129, 0.1)" : dzongkhag.wellbeingScore > 60 ? "rgba(245, 158, 11, 0.1)" : "rgba(239, 68, 68, 0.1)"}, transparent)`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-500">{dzongkhag.districtCode}</span>
                      {getTrendIcon(dzongkhag.trend)}
                    </div>
                    <p className="font-semibold text-gray-900 text-sm mb-1">{dzongkhag.dzongkhag}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold" style={{ color: colors.primary }}>
                        {dzongkhag.wellbeingScore}
                      </span>
                      <span className="text-xs text-gray-500">{dzongkhag.schoolCount} schools</span>
                    </div>
                    {/* Risk indicator bar */}
                    <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${dzongkhag.wellbeingScore}%`,
                          background: getRiskColor(dzongkhag.riskLevel),
                        }}
                      />
                    </div>
                  </div>

                  {/* Hover tooltip */}
                  <div className="absolute inset-0 bg-white rounded-lg shadow-xl p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 -mt-2 border border-gray-200">
                    <p className="text-xs font-semibold text-gray-900 mb-1">{dzongkhag.dzongkhag}</p>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <span className="text-gray-600">Students:</span>
                      <span className="font-medium">{dzongkhag.studentCount.toLocaleString()}</span>
                      <span className="text-gray-600">Mental Health:</span>
                      <span className="font-medium">{dzongkhag.mentalHealthIndex}</span>
                      <span className="text-gray-600">Attendance:</span>
                      <span className="font-medium">{dzongkhag.attendanceRate}%</span>
                      <span className="text-gray-600">Academic:</span>
                      <span className="font-medium">{dzongkhag.academicPerformance}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Heatmap Legend */}
            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ background: colors.success }} />
                <span className="text-sm text-gray-600">Low Risk (70+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ background: colors.warning }} />
                <span className="text-sm text-gray-600">Medium Risk (60-69)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ background: colors.danger }} />
                <span className="text-sm text-gray-600">High Risk (&lt;60)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Intervention Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <HeartPulse className="w-5 h-5" style={{ color: colors.primary }} />
              <CardTitle>Counseling Activity</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.interventionSummary.map((item) => (
                <div key={item.type} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900 text-sm">{item.type}</p>
                    <span className={`text-xs font-medium ${item.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {item.change >= 0 ? "+" : ""}{item.change}%
                    </span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: colors.primary }}>
                    {item.count.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Most common: {item.mostCommon}</p>
                </div>
              ))}
            </div>

            {/* Students at Risk Alert */}
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <p className="font-semibold text-red-900 text-sm">Students At Risk</p>
              </div>
              <p className="text-2xl font-bold text-red-700">{data.studentsAtRisk.toLocaleString()}</p>
              <p className="text-xs text-red-600 mt-1">Require immediate intervention</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Dzongkhag Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" style={{ color: colors.primary }} />
            <CardTitle>Detailed District Analysis</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Dzongkhag</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">GNH Score</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Mental Health</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Attendance</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Academic</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Social</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Risk Level</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Trend</th>
                </tr>
              </thead>
              <tbody>
                {data.dzongkhagMetrics
                  .sort((a, b) => a.wellbeingScore - b.wellbeingScore)
                  .map((dzongkhag) => (
                    <tr key={dzongkhag.districtCode} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{dzongkhag.dzongkhag}</span>
                        </div>
                        <p className="text-xs text-gray-500 ml-6">{dzongkhag.studentCount.toLocaleString()} students</p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-bold ${
                          dzongkhag.wellbeingScore >= 70 ? "text-green-600" :
                          dzongkhag.wellbeingScore >= 60 ? "text-yellow-600" :
                          "text-red-600"
                        }`}>
                          {dzongkhag.wellbeingScore}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-gray-700">{dzongkhag.mentalHealthIndex}</td>
                      <td className="py-3 px-4 text-center text-gray-700">{dzongkhag.attendanceRate}%</td>
                      <td className="py-3 px-4 text-center text-gray-700">{dzongkhag.academicPerformance}%</td>
                      <td className="py-3 px-4 text-center text-gray-700">{dzongkhag.socialCooperation}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          dzongkhag.riskLevel === "low" ? "bg-green-100 text-green-700" :
                          dzongkhag.riskLevel === "medium" ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {dzongkhag.riskLevel}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {getTrendIcon(dzongkhag.trend)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Data Privacy Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">Student Privacy Protected</p>
              <p className="text-sm text-blue-700 mt-1">
                All GNH metrics are derived from anonymized and aggregated data. No individual student can be identified from this dashboard.
                Data is compiled from counselor interventions, wellness assessments, and attendance records.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
