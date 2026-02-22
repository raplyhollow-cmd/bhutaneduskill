"use client";

import { logger } from "@/lib/logger";
import { useState, useEffect, useCallback } from "react";
import {
  GraduationCap,
  Users,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  MapPin,
  BookOpen,
  School,
  Loader2,
  RefreshCw,
  Download,
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

interface DzongkhagTeacherRatio {
  dzongkhag: string;
  districtCode: string;
  schoolCount: number;
  totalTeachers: number;
  totalStudents: number;
  teacherStudentRatio: number; // students per teacher
  optimalRatio: number;
  variance: number; // percentage difference from optimal
  status: "optimal" | "overstaffed" | "understaffed" | "critical";
  subjectGaps: SubjectGap[];
  recommendations: string[];
}

interface SubjectGap {
  subject: string;
  needed: number;
  available: number;
  gap: number;
  severity: "low" | "medium" | "high";
}

interface NationalTeacherSummary {
  totalTeachers: number;
  totalStudents: number;
  nationalRatio: number;
  optimalRatio: number;
  overstaffedDzongkhags: number;
  understaffedDzongkhags: number;
  criticalShortageAreas: number;
  redistributionOpportunities: number;
}

interface TeacherResourceResponse {
  nationalSummary: NationalTeacherSummary;
  dzongkhagRatios: DzongkhagTeacherRatio[];
  generatedAt: string;
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

export default function TeacherResourcesPage() {
  const [viewMode, setViewMode] = useState<"heatmap" | "table">("heatmap");
  const [resourceData, setResourceData] = useState<TeacherResourceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const colors = {
    primary: "rgb(168 85 247)",
    secondary: "rgb(147 51 234)",
    gradient: "linear-gradient(135deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)",
    bg: "rgb(249 250 251)",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    info: "#3b82f6",
  };

  // Fetch teacher resource data
  const fetchResourceData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ministry/teacher-resources");

      if (!response.ok) {
        const errorData = (await response.json()) as ApiErrorResponse;
        throw new Error(errorData.error || "Failed to fetch teacher resource data");
      }

      const result = (await response.json()) as ApiSuccess<TeacherResourceResponse>;
      setResourceData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      logger.error("Teacher Resources fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResourceData();
  }, [fetchResourceData]);

  // Get status color and icon
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "optimal":
        return { color: colors.success, icon: CheckCircle2, label: "Optimal" };
      case "overstaffed":
        return { color: colors.info, icon: TrendingDown, label: "Overstaffed" };
      case "understaffed":
        return { color: colors.warning, icon: AlertTriangle, label: "Understaffed" };
      case "critical":
        return { color: colors.danger, icon: AlertTriangle, label: "Critical Shortage" };
      default:
        return { color: "#6b7280", icon: AlertTriangle, label: "Unknown" };
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: colors.primary }} />
          <p className="text-gray-600">Loading Teacher Resource Analytics...</p>
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
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchResourceData} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback data for demonstration
  const fallbackData: TeacherResourceResponse = {
    nationalSummary: {
      totalTeachers: 8540,
      totalStudents: 245000,
      nationalRatio: 28.7,
      optimalRatio: 25,
      overstaffedDzongkhags: 3,
      understaffedDzongkhags: 8,
      criticalShortageAreas: 12,
      redistributionOpportunities: 145,
    },
    dzongkhagRatios: [
      {
        dzongkhag: "Thimphu",
        districtCode: "TH",
        schoolCount: 45,
        totalTeachers: 1850,
        totalStudents: 42000,
        teacherStudentRatio: 22.7,
        optimalRatio: 25,
        variance: -9.2,
        status: "overstaffed",
        subjectGaps: [
          { subject: "Mathematics", needed: 120, available: 150, gap: -30, severity: "low" },
          { subject: "English", needed: 140, available: 160, gap: -20, severity: "low" },
          { subject: "Dzongkha", needed: 100, available: 95, gap: 5, severity: "low" },
        ],
        recommendations: [
          "Consider transferring 30 teachers to understaffed dzongkhags",
          "Focus recruitment on STEM subjects for national balance",
        ],
      },
      {
        dzongkhag: "Paro",
        districtCode: "PR",
        schoolCount: 25,
        totalTeachers: 720,
        totalStudents: 16800,
        teacherStudentRatio: 23.3,
        optimalRatio: 25,
        variance: -6.8,
        status: "overstaffed",
        subjectGaps: [
          { subject: "Science", needed: 50, available: 65, gap: -15, severity: "low" },
          { subject: "ICT", needed: 25, available: 35, gap: -10, severity: "low" },
        ],
        recommendations: [
          "15 science teachers can support critical shortage areas",
        ],
      },
      {
        dzongkhag: "Punakha",
        districtCode: "PU",
        schoolCount: 18,
        totalTeachers: 450,
        totalStudents: 11250,
        teacherStudentRatio: 25,
        optimalRatio: 25,
        variance: 0,
        status: "optimal",
        subjectGaps: [],
        recommendations: [
          "Maintain current staffing levels",
        ],
      },
      {
        dzongkhag: "Wangdue",
        districtCode: "WD",
        schoolCount: 22,
        totalTeachers: 480,
        totalStudents: 13500,
        teacherStudentRatio: 28.1,
        optimalRatio: 25,
        variance: 12.4,
        status: "understaffed",
        subjectGaps: [
          { subject: "Mathematics", needed: 55, available: 40, gap: 15, severity: "medium" },
          { subject: "Science", needed: 50, available: 38, gap: 12, severity: "medium" },
        ],
        recommendations: [
          "Priority for new Mathematics and Science teacher deployments",
          "Consider incentive packages for remote school postings",
        ],
      },
      {
        dzongkhag: "Lhuntse",
        districtCode: "LH",
        schoolCount: 15,
        totalTeachers: 220,
        totalStudents: 7500,
        teacherStudentRatio: 34.1,
        optimalRatio: 25,
        variance: 36.4,
        status: "critical",
        subjectGaps: [
          { subject: "Mathematics", needed: 30, available: 15, gap: 15, severity: "high" },
          { subject: "English", needed: 28, available: 18, gap: 10, severity: "high" },
          { subject: "Science", needed: 25, available: 12, gap: 13, severity: "high" },
          { subject: "Dzongkha", needed: 25, available: 20, gap: 5, severity: "medium" },
        ],
        recommendations: [
          "URGENT: Deploy 35 teachers immediately across all subjects",
          "Implement hardship allowance for teachers in remote areas",
          "Consider distance learning support from Thimphu/Paro",
        ],
      },
      {
        dzongkhag: "Trashigang",
        districtCode: "TR",
        schoolCount: 28,
        totalTeachers: 580,
        totalStudents: 15400,
        teacherStudentRatio: 26.6,
        optimalRatio: 25,
        variance: 6.4,
        status: "understaffed",
        subjectGaps: [
          { subject: "ICT", needed: 20, available: 12, gap: 8, severity: "medium" },
          { subject: "Mathematics", needed: 60, available: 52, gap: 8, severity: "low" },
        ],
        recommendations: [
          "Priority for ICT teacher recruitment",
        ],
      },
      {
        dzongkhag: "Mongar",
        districtCode: "MG",
        schoolCount: 20,
        totalTeachers: 420,
        totalStudents: 11200,
        teacherStudentRatio: 26.7,
        optimalRatio: 25,
        variance: 6.8,
        status: "understaffed",
        subjectGaps: [
          { subject: "Science", needed: 40, available: 32, gap: 8, severity: "low" },
        ],
        recommendations: [],
      },
      {
        dzongkhag: "Samtse",
        districtCode: "ST",
        schoolCount: 24,
        totalTeachers: 560,
        totalStudents: 14000,
        teacherStudentRatio: 25,
        optimalRatio: 25,
        variance: 0,
        status: "optimal",
        subjectGaps: [],
        recommendations: [],
      },
      {
        dzongkhag: "Sarpang",
        districtCode: "SP",
        schoolCount: 19,
        totalTeachers: 380,
        totalStudents: 10500,
        teacherStudentRatio: 27.6,
        optimalRatio: 25,
        variance: 10.4,
        status: "understaffed",
        subjectGaps: [
          { subject: "English", needed: 45, available: 38, gap: 7, severity: "low" },
        ],
        recommendations: [],
      },
      {
        dzongkhag: "Chukha",
        districtCode: "CK",
        schoolCount: 26,
        totalTeachers: 620,
        totalStudents: 15500,
        teacherStudentRatio: 25,
        optimalRatio: 25,
        variance: 0,
        status: "optimal",
        subjectGaps: [],
        recommendations: [],
      },
      {
        dzongkhag: "Zhemgang",
        districtCode: "ZH",
        schoolCount: 14,
        totalTeachers: 240,
        totalStudents: 7200,
        teacherStudentRatio: 30,
        optimalRatio: 25,
        variance: 20,
        status: "understaffed",
        subjectGaps: [
          { subject: "Mathematics", needed: 25, available: 15, gap: 10, severity: "medium" },
          { subject: "Science", needed: 22, available: 14, gap: 8, severity: "medium" },
        ],
        recommendations: [
          "Deploy 18 teachers across core subjects",
        ],
      },
      {
        dzongkhag: "Trashiyangtse",
        districtCode: "TY",
        schoolCount: 12,
        totalTeachers: 180,
        totalStudents: 5400,
        teacherStudentRatio: 30,
        optimalRatio: 25,
        variance: 20,
        status: "understaffed",
        subjectGaps: [
          { subject: "English", needed: 20, available: 12, gap: 8, severity: "medium" },
        ],
        recommendations: [],
      },
    ],
    generatedAt: new Date().toISOString(),
  };

  const data = resourceData || fallbackData;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6" style={{ color: colors.primary }} />
            <h1 className="text-3xl font-bold text-gray-900">Teacher Resource Optimization</h1>
          </div>
          <p className="text-gray-600 mt-1">National teacher-to-student ratio analysis and redistribution opportunities</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <Button
              size="sm"
              variant={viewMode === "heatmap" ? "default" : "ghost"}
              onClick={() => setViewMode("heatmap")}
              style={viewMode === "heatmap" ? { background: colors.gradient } : {}}
              className="rounded-md"
            >
              Heatmap
            </Button>
            <Button
              size="sm"
              variant={viewMode === "table" ? "default" : "ghost"}
              onClick={() => setViewMode("table")}
              style={viewMode === "table" ? { background: colors.gradient } : {}}
              className="rounded-md"
            >
              Table
            </Button>
          </div>
          <Button variant="outline" onClick={fetchResourceData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* National Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">National Ratio</p>
                <p className="text-3xl font-bold text-gray-900">
                  {data.nationalSummary.nationalRatio.toFixed(1)}
                </p>
                <p className="text-xs text-gray-500 mt-1">students per teacher</p>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: colors.bg }}>
                <Users className="w-6 h-6" style={{ color: colors.primary }} />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Optimal:</span>
                <span className="text-xs font-medium text-gray-700">{data.nationalSummary.optimalRatio}:1</span>
                <span className={`text-xs font-medium ${data.nationalSummary.nationalRatio > data.nationalSummary.optimalRatio ? "text-red-600" : "text-green-600"}`}>
                  {data.nationalSummary.nationalRatio > data.nationalSummary.optimalRatio ? "Above" : "At"} target
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4" style={{ borderLeftColor: colors.info }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Overstaffed Areas</p>
                <p className="text-3xl font-bold text-blue-600">
                  {data.nationalSummary.overstaffedDzongkhags}
                </p>
                <p className="text-xs text-gray-500 mt-1">dzongkhags</p>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-50">
                <TrendingDown className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-3">
              Candidates for redistribution
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4" style={{ borderLeftColor: colors.warning }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Understaffed Areas</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {data.nationalSummary.understaffedDzongkhags}
                </p>
                <p className="text-xs text-gray-500 mt-1">dzongkhags</p>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-yellow-50">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-xs text-yellow-600 mt-3">
              Require teacher deployment
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4" style={{ borderLeftColor: colors.danger }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Critical Shortages</p>
                <p className="text-3xl font-bold text-red-600">
                  {data.nationalSummary.criticalShortageAreas}
                </p>
                <p className="text-xs text-gray-500 mt-1">subject areas</p>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-50">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <p className="text-xs text-red-600 mt-3">
              Immediate action required
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Redistribution Insights */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-purple-100">
              <RefreshCw className="w-6 h-6" style={{ color: colors.primary }} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">Redistribution Opportunity</h3>
              <p className="text-gray-700 mb-3">
                <span className="font-bold text-purple-700">{data.nationalSummary.redistributionOpportunities} teachers</span> can be
                redistributed from overstaffed to understaffed dzongkhags to achieve optimal national coverage.
              </p>
              <div className="flex flex-wrap gap-2">
                {data.dzongkhagRatios.filter(d => d.status === "overstaffed").map(d => (
                  <span key={d.districtCode} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    {d.districtCode} → {Math.round((d.teacherStudentRatio - d.optimalRatio) / d.optimalRatio * d.totalTeachers)} available
                  </span>
                ))}
                <ArrowRight className="w-5 h-5 text-gray-400 self-center" />
                {data.dzongkhagRatios.filter(d => d.status === "understaffed" || d.status === "critical").slice(0, 2).map(d => (
                  <span key={d.districtCode} className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                    {d.districtCode} needs {Math.round((d.teacherStudentRatio - d.optimalRatio) / d.optimalRatio * d.totalTeachers)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dzongkhag Heatmap */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" style={{ color: colors.primary }} />
              <CardTitle>Dzongkhag Teacher Ratio Heatmap</CardTitle>
            </div>
            <span className="text-sm text-gray-500">Students per Teacher vs Optimal (25:1)</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {data.dzongkhagRatios.map((dzongkhag) => {
              const statusConfig = getStatusConfig(dzongkhag.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={dzongkhag.districtCode}
                  className="relative group cursor-pointer p-4 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${statusConfig.color}15, transparent)`,
                    border: `2px solid ${statusConfig.color}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-500">{dzongkhag.districtCode}</span>
                    <StatusIcon className="w-4 h-4" style={{ color: statusConfig.color }} />
                  </div>
                  <p className="font-semibold text-gray-900 text-sm mb-1">{dzongkhag.dzongkhag}</p>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-2xl font-bold" style={{ color: statusConfig.color }}>
                      {dzongkhag.teacherStudentRatio.toFixed(1)}
                    </span>
                    <span className="text-xs text-gray-500">:1</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{dzongkhag.totalTeachers} teachers</span>
                    <span>{dzongkhag.schoolCount} schools</span>
                  </div>

                  {/* Variance indicator */}
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Variance:</span>
                      <span className={`font-medium ${dzongkhag.variance > 0 ? "text-red-600" : "text-green-600"}`}>
                        {dzongkhag.variance > 0 ? "+" : ""}{dzongkhag.variance.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Hover tooltip */}
                  {dzongkhag.subjectGaps.length > 0 && (
                    <div className="absolute inset-0 bg-white rounded-lg shadow-xl p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 -mt-2 border border-gray-200">
                      <p className="text-xs font-semibold text-gray-900 mb-2">Subject Gaps</p>
                      <div className="space-y-1">
                        {dzongkhag.subjectGaps.slice(0, 3).map((gap) => (
                          <div key={gap.subject} className="flex justify-between text-xs">
                            <span className="text-gray-600">{gap.subject}:</span>
                            <span className={`font-medium ${gap.gap > 0 ? "text-red-600" : "text-green-600"}`}>
                              {gap.gap > 0 ? `+${gap.gap} needed` : `${Math.abs(gap.gap)} excess`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ background: colors.success }} />
              <span className="text-sm text-gray-600">Optimal (±5%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ background: colors.info }} />
              <span className="text-sm text-gray-600">Overstaffed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ background: colors.warning }} />
              <span className="text-sm text-gray-600">Understaffed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ background: colors.danger }} />
              <span className="text-sm text-gray-600">Critical</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Areas Detail */}
      {data.dzongkhagRatios.some(d => d.status === "critical") && (
        <Card className="border-red-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <CardTitle className="text-red-900">Critical Shortage Areas</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.dzongkhagRatios.filter(d => d.status === "critical").map((dzongkhag) => (
                <div key={dzongkhag.districtCode} className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-red-900">{dzongkhag.dzongkhag} Dzongkhag</h4>
                      <p className="text-sm text-red-700">
                        {dzongkhag.totalStudents.toLocaleString()} students • {dzongkhag.totalTeachers} teachers
                        ({dzongkhag.teacherStudentRatio.toFixed(1)}:1 ratio)
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-red-600 text-white rounded-full text-sm font-medium">
                      {Math.round((dzongkhag.teacherStudentRatio - dzongkhag.optimalRatio) / dzongkhag.optimalRatio * dzongkhag.totalTeachers)} teachers needed
                    </span>
                  </div>

                  {/* Subject Gaps */}
                  <div className="mb-3">
                    <p className="text-sm font-medium text-red-800 mb-2">Subject Shortages:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {dzongkhag.subjectGaps.filter(g => g.severity === "high").map((gap) => (
                        <div key={gap.subject} className="p-2 bg-white rounded border border-red-200">
                          <p className="text-xs text-gray-600">{gap.subject}</p>
                          <p className="text-sm font-bold text-red-600">+{gap.gap} needed</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  {dzongkhag.recommendations.length > 0 && (
                    <div className="pt-3 border-t border-red-200">
                      <p className="text-sm font-medium text-red-800 mb-1">Recommendations:</p>
                      <ul className="text-sm text-red-700 space-y-1">
                        {dzongkhag.recommendations.map((rec, i) => (
                          <li key={i}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Table View */}
      {viewMode === "table" && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Analysis by Dzongkhag</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Dzongkhag</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Teachers</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Students</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Ratio</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Variance</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Subject Gaps</th>
                  </tr>
                </thead>
                <tbody>
                  {data.dzongkhagRatios.map((dzongkhag) => {
                    const statusConfig = getStatusConfig(dzongkhag.status);
                    return (
                      <tr key={dzongkhag.districtCode} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{dzongkhag.dzongkhag}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center text-gray-700">{dzongkhag.totalTeachers}</td>
                        <td className="py-3 px-4 text-center text-gray-700">{dzongkhag.totalStudents.toLocaleString()}</td>
                        <td className="py-3 px-4 text-center font-medium text-gray-900">{dzongkhag.teacherStudentRatio.toFixed(1)}:1</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`font-medium ${dzongkhag.variance > 0 ? "text-red-600" : "text-green-600"}`}>
                            {dzongkhag.variance > 0 ? "+" : ""}{dzongkhag.variance.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className="px-2 py-1 rounded text-xs font-medium"
                            style={{ background: `${statusConfig.color}20`, color: statusConfig.color }}
                          >
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {dzongkhag.subjectGaps.slice(0, 2).map((gap) => (
                              <span
                                key={gap.subject}
                                className={`px-2 py-1 rounded text-xs ${
                                  gap.severity === "high" ? "bg-red-100 text-red-700" :
                                  gap.severity === "medium" ? "bg-yellow-100 text-yellow-700" :
                                  "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {gap.subject} {gap.gap > 0 ? `(+${gap.gap})` : `(${gap.gap})`}
                              </span>
                            ))}
                            {dzongkhag.subjectGaps.length > 2 && (
                              <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
                                +{dzongkhag.subjectGaps.length - 2} more
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
