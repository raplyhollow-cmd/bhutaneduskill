"use client";

import { useState, useEffect, useCallback } from "react";
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
  Loader2,
  AlertCircle,
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

interface NationalStatistics {
  totalSchools: number;
  totalStudents: number;
  totalTeachers: number;
  totalCounselors: number;
  totalParents: number;
  totalDistricts: number;
  assessmentsCompleted: number;
  assessmentCompletionRate: number;
  activeSchools: number;
  newStudentsThisMonth: number;
  newSchoolsThisMonth: number;
}

interface DistrictMetrics {
  districtId: string;
  districtName: string;
  schoolCount: number;
  studentCount: number;
  teacherCount: number;
  assessmentCompletionRate: number;
  averagePerformance: number;
  growthRate: number;
}

interface SchoolPerformance {
  schoolId: string;
  schoolName: string;
  district: string;
  studentCount: number;
  averageGrade: number;
  passRate: number;
  assessmentCompletion: number;
  ranking: number;
}

interface TrendData {
  month: string;
  studentCount: number;
  teacherCount: number;
  schoolCount: number;
  assessmentsCompleted: number;
}

interface AssessmentByType {
  type: string;
  totalStarted: number;
  totalCompleted: number;
  completionRate: number;
  averageScore?: number;
}

interface CareerInterestData {
  career: string;
  count: number;
  percentage: number;
}

interface RegionalAnalysis {
  district: DistrictMetrics[];
  topPerformingDistricts: Array<{
    districtName: string;
    averageScore: number;
    completionRate: number;
  }>;
  bottomPerformingDistricts: Array<{
    districtName: string;
    averageScore: number;
    completionRate: number;
  }>;
}

interface MinistryAnalyticsResponse {
  nationalStatistics: NationalStatistics;
  regionalAnalysis: RegionalAnalysis;
  schoolPerformance: SchoolPerformance[];
  trendAnalysis: TrendData[];
  assessmentsByType: AssessmentByType[];
  careerInterests: CareerInterestData[];
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

export default function MinistryAnalyticsPage() {
  const [timeRange, setTimeRange] = useState("all");
  const [analyticsData, setAnalyticsData] = useState<MinistryAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const colors = {
    primary: "rgb(168 85 247)",
    gradient: "linear-gradient(135deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)",
  };

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ministry/analytics?timeRange=${timeRange}`);

      if (!response.ok) {
        const errorData = (await response.json()) as ApiErrorResponse;
        throw new Error(errorData.error || "Failed to fetch analytics data");
      }

      const result = (await response.json()) as ApiSuccess<MinistryAnalyticsResponse>;
      setAnalyticsData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Handle export
  const handleExport = async (format: "csv" | "pdf") => {
    setIsExporting(true);

    try {
      const response = await fetch(`/api/ministry/analytics/export?format=${format}`);

      if (!response.ok) {
        throw new Error(`Failed to export as ${format.toUpperCase()}`);
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `ministry-analytics-${new Date().toISOString().slice(0, 10)}.${format}`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
      alert(`Failed to export as ${format.toUpperCase()}. Please try again.`);
    } finally {
      setIsExporting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: colors.primary }} />
          <p className="text-gray-600">Loading analytics data...</p>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Analytics</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchAnalytics} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No data state
  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
            <p className="text-gray-600">There is currently no analytics data to display.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { nationalStatistics, regionalAnalysis, schoolPerformance, trendAnalysis, assessmentsByType, careerInterests } = analyticsData;

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
          <Button variant="outline" onClick={() => handleExport("csv")} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Export CSV
          </Button>
          <Button
            onClick={() => handleExport("pdf")}
            disabled={isExporting}
            style={{ background: colors.gradient }}
            className="text-white"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
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
                <p className="text-2xl font-bold text-gray-900">{nationalStatistics.totalStudents.toLocaleString()}</p>
                <p className="text-xs text-green-600">+{nationalStatistics.newStudentsThisMonth} this month</p>
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
                <p className="text-2xl font-bold text-gray-900">{nationalStatistics.totalSchools}</p>
                <p className="text-xs text-green-600">+{nationalStatistics.activeSchools} active</p>
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
                <p className="text-2xl font-bold text-gray-900">{nationalStatistics.assessmentsCompleted.toLocaleString()}</p>
                <p className="text-xs text-green-600">{nationalStatistics.assessmentCompletionRate}% completion</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg" style={{ background: "rgb(250 245 255)" }}>
                <GraduationCap className="w-6 h-6" style={{ color: colors.primary }} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Teachers</p>
                <p className="text-2xl font-bold text-gray-900">{nationalStatistics.totalTeachers.toLocaleString()}</p>
                <p className="text-xs text-gray-600">{nationalStatistics.totalDistricts} districts</p>
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
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {regionalAnalysis.district.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No district data available</p>
              ) : (
                regionalAnalysis.district.map((district) => {
                  const maxStudents = Math.max(...regionalAnalysis.district.map((d) => d.studentCount), 1);
                  return (
                    <div key={district.districtId} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-gray-900">{district.districtName}</p>
                          <div className="text-right">
                            <span className="text-sm text-gray-600">{district.schoolCount} schools</span>
                            <span className="ml-2 text-xs text-green-600">+{district.growthRate}%</span>
                          </div>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(district.studentCount / maxStudents) * 100}%`,
                              background: colors.gradient,
                            }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {district.studentCount} students · {district.teacherCount} teachers
                        </p>
                      </div>
                    </div>
                  );
                })
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
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {careerInterests.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No career data available</p>
              ) : (
                careerInterests.map((interest) => (
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
                            background: colors.gradient,
                          }}
                        />
                      </div>
                    </div>
                    <span className="ml-4 text-sm font-medium text-gray-700 w-12 text-right">
                      {interest.percentage}%
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* School Performance Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>School Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          {schoolPerformance.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No school performance data available</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Rank</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">School</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">District</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Students</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Avg Grade</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Pass Rate</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Assessment</th>
                  </tr>
                </thead>
                <tbody>
                  {schoolPerformance.slice(0, 10).map((school) => (
                    <tr key={school.schoolId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-semibold text-sm">
                          {school.ranking}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">{school.schoolName}</td>
                      <td className="py-3 px-4 text-gray-600">{school.district}</td>
                      <td className="py-3 px-4 text-right text-gray-900">{school.studentCount}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={school.averageGrade >= 60 ? "text-green-600" : "text-orange-600"}>
                          {school.averageGrade}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900">{school.passRate}%</td>
                      <td className="py-3 px-4 text-right text-gray-900">{school.assessmentCompletion}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assessment Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>Assessment Completion by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assessmentsByType.map((assessment) => (
                <div key={assessment.type} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{assessment.type}</h3>
                    <ClipboardCheck className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Started</p>
                      <p className="font-medium text-gray-900">{assessment.totalStarted.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Completed</p>
                      <p className="font-medium text-gray-900">{assessment.totalCompleted.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Rate</p>
                      <p className="font-medium text-gray-900">{assessment.completionRate}%</p>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-3">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${assessment.completionRate}%`,
                        background: colors.gradient,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Trend Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {trendAnalysis.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No trend data available</p>
              ) : (
                trendAnalysis.slice(-6).reverse().map((trend) => {
                  const maxStudents = Math.max(...trendAnalysis.map((t) => t.studentCount), 1);
                  const date = new Date(trend.month + "-01");
                  const monthName = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

                  return (
                    <div key={trend.month} className="border-b border-gray-100 pb-3 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-gray-900">{monthName}</p>
                        <div className="flex gap-4 text-sm">
                          <span className="text-gray-600">{trend.studentCount} students</span>
                          <span className="text-gray-600">{trend.assessmentsCompleted} assessments</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {/* Students bar */}
                        <div
                          className="h-2 rounded-l-full"
                          style={{
                            width: `${(trend.studentCount / maxStudents) * 80}%`,
                            background: colors.gradient,
                          }}
                          title={`Students: ${trend.studentCount}`}
                        />
                        {/* Schools bar */}
                        <div
                          className="h-2 bg-blue-400"
                          style={{
                            width: `${Math.min((trend.schoolCount / 10) * 20, 20)}%`,
                          }}
                          title={`Schools: ${trend.schoolCount}`}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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
