"use client";

import { logger } from "@/lib/logger";
import { useState, useEffect, useCallback } from "react";
import {
  Briefcase,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Target,
  Building,
  Users,
  ArrowRight,
  Brain,
  GraduationCap,
  Loader2,
  RefreshCw,
  Lightbulb,
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

interface CareerPathway {
  career: string;
  studentInterest: number;
  nationalDemand: number;
  alignment: number;
  gap: number;
  projectedShortage: number;
  status: "surplus" | "balanced" | "shortage";
  recommendedAction: string;
}

interface SkillSector {
  sector: string;
  studentsInterested: number;
  nationalCapacity: number;
  alignmentRate: number;
  keyInstitutions: number;
  projectedNeeds: number;
  status: "over-capacity" | "at-capacity" | "under-capacity" | "critical";
}

interface NationalWorkforceGoal {
  goal: string;
  targetYear: number;
  currentProjection: number;
  target: number;
  onTrack: boolean;
  gap: number;
}

interface AlignmentInsight {
  type: "opportunity" | "warning" | "critical";
  title: string;
  description: string;
  impact: string;
  recommendation: string;
}

interface LaborMarketResponse {
  careerPathways: CareerPathway[];
  skillSectors: SkillSector[];
  nationalGoals: NationalWorkforceGoal[];
  alignmentInsights: AlignmentInsight[];
  totalStudentsAnalyzed: number;
  projectedWorkforceGap: number;
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

export default function LaborMarketPage() {
  const [timeRange, setTimeRange] = useState("all");
  const [marketData, setMarketData] = useState<LaborMarketResponse | null>(null);
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

  // Fetch labor market data
  const fetchMarketData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ministry/labor-market?timeRange=${timeRange}`);

      if (!response.ok) {
        const errorData = (await response.json()) as ApiErrorResponse;
        throw new Error(errorData.error || "Failed to fetch labor market data");
      }

      const result = (await response.json()) as ApiSuccess<LaborMarketResponse>;
      setMarketData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      logger.error("Labor Market fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  // Get status config
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "surplus":
      case "over-capacity":
      case "at-capacity":
        return { color: colors.success, icon: CheckCircle2, label: status.replace("-", " ") };
      case "balanced":
        return { color: colors.info, icon: Target, label: "Balanced" };
      case "shortage":
      case "under-capacity":
        return { color: colors.warning, icon: AlertTriangle, label: "Shortage" };
      case "critical":
        return { color: colors.danger, icon: AlertTriangle, label: "Critical" };
      default:
        return { color: "#6b7280", icon: AlertTriangle, label: "Unknown" };
    }
  };

  // Get insight icon
  const getInsightIcon = (type: string) => {
    switch (type) {
      case "opportunity":
        return <Lightbulb className="w-5 h-5 text-green-600" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case "critical":
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-600" />;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: colors.primary }} />
          <p className="text-gray-600">Loading Labor Market Analytics...</p>
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
            <Button onClick={fetchMarketData} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback data for demonstration
  const fallbackData: LaborMarketResponse = {
    careerPathways: [
      {
        career: "Hydropower Engineering",
        studentInterest: 1200,
        nationalDemand: 2500,
        alignment: 48,
        gap: -1300,
        projectedShortage: 1300,
        status: "shortage",
        recommendedAction: "Increase scholarships and promote through career counseling",
      },
      {
        career: "Civil Engineering",
        studentInterest: 1800,
        nationalDemand: 2000,
        alignment: 90,
        gap: -200,
        projectedShortage: 200,
        status: "balanced",
        recommendedAction: "Maintain current promotion levels",
      },
      {
        career: "Information Technology",
        studentInterest: 3500,
        nationalDemand: 1800,
        alignment: 194,
        gap: 1700,
        projectedShortage: 0,
        status: "surplus",
        recommendedAction: "Diversify into related fields: Data Science, Cybersecurity, AI",
      },
      {
        career: "Healthcare (Medicine/Nursing)",
        studentInterest: 900,
        nationalDemand: 1500,
        alignment: 60,
        gap: -600,
        projectedShortage: 600,
        status: "shortage",
        recommendedAction: "Expand medical scholarships and create awareness programs",
      },
      {
        career: "Agriculture & Forestry",
        studentInterest: 400,
        nationalDemand: 1200,
        alignment: 33,
        gap: -800,
        projectedShortage: 800,
        status: "shortage",
        recommendedAction: "Modernize curriculum and promote sustainable agriculture careers",
      },
      {
        career: "Tourism & Hospitality",
        studentInterest: 1500,
        nationalDemand: 1000,
        alignment: 150,
        gap: 500,
        projectedShortage: 0,
        status: "surplus",
        recommendedAction: "Focus on quality over quantity, specialize in eco-tourism",
      },
      {
        career: "Teaching/Education",
        studentInterest: 2000,
        nationalDemand: 2200,
        alignment: 91,
        gap: -200,
        projectedShortage: 200,
        status: "balanced",
        recommendedAction: "Maintain current levels, focus on STEM subject specialization",
      },
      {
        career: "Business/Entrepreneurship",
        studentInterest: 2800,
        nationalDemand: 1600,
        alignment: 175,
        gap: 1200,
        projectedShortage: 0,
        status: "surplus",
        recommendedAction: "Promote social entrepreneurship and startup ecosystem",
      },
    ],
    skillSectors: [
      {
        sector: "STEM (Science, Technology, Engineering, Math)",
        studentsInterested: 6500,
        nationalCapacity: 4500,
        alignmentRate: 144,
        keyInstitutions: 12,
        projectedNeeds: 8000,
        status: "over-capacity",
      },
      {
        sector: "Healthcare",
        studentsInterested: 900,
        nationalCapacity: 600,
        alignmentRate: 150,
        keyInstitutions: 3,
        projectedNeeds: 2000,
        status: "under-capacity",
      },
      {
        sector: "Agriculture & Natural Resources",
        studentsInterested: 400,
        nationalCapacity: 800,
        alignmentRate: 50,
        keyInstitutions: 5,
        projectedNeeds: 1500,
        status: "critical",
      },
      {
        sector: "Tourism & Hospitality",
        studentsInterested: 1500,
        nationalCapacity: 1000,
        alignmentRate: 150,
        keyInstitutions: 4,
        projectedNeeds: 1200,
        status: "over-capacity",
      },
      {
        sector: "Education",
        studentsInterested: 2000,
        nationalCapacity: 2200,
        alignmentRate: 91,
        keyInstitutions: 8,
        projectedNeeds: 2500,
        status: "at-capacity",
      },
      {
        sector: "Finance & Business",
        studentsInterested: 2800,
        nationalCapacity: 1600,
        alignmentRate: 175,
        keyInstitutions: 6,
        projectedNeeds: 2000,
        status: "over-capacity",
      },
    ],
    nationalGoals: [
      {
        goal: "Hydropower Engineers for 10,000MW Project",
        targetYear: 2030,
        currentProjection: 1200,
        target: 2500,
        onTrack: false,
        gap: 1300,
      },
      {
        goal: "Healthcare Workers (Doctors + Nurses)",
        targetYear: 2030,
        currentProjection: 900,
        target: 2000,
        onTrack: false,
        gap: 1100,
      },
      {
        goal: "Digital Economy Workforce",
        targetYear: 2030,
        currentProjection: 3500,
        target: 3000,
        onTrack: true,
        gap: -500,
      },
      {
        goal: "Modern Agriculture Technicians",
        targetYear: 2030,
        currentProjection: 400,
        target: 1500,
        onTrack: false,
        gap: 1100,
      },
    ],
    alignmentInsights: [
      {
        type: "critical",
        title: "Hydropower Workforce Gap",
        description: "Only 48% of required students are tracking toward Hydropower Engineering careers.",
        impact: "Bhutan's 10,000MW hydropower goal requires 2,500 engineers. Current trajectory shows only 1,200.",
        recommendation: "Launch national scholarship program for hydropower engineering. Partner with RUB for specialized curriculum.",
      },
      {
        type: "critical",
        title: "Healthcare Worker Shortage",
        description: "National healthcare system will face 600+ worker shortage by 2030.",
        impact: "Rural healthcare access will be severely impacted without immediate intervention.",
        recommendation: "Expand medical college seats. Create rural posting incentives. Fast-track nursing programs.",
      },
      {
        type: "opportunity",
        title: "Digital Workforce Surplus",
        description: "IT/Technology interest exceeds national capacity by 44%.",
        impact: "Opportunity to become regional tech hub. Excess talent can be exported or upskilled.",
        recommendation: "Develop IT export strategy. Create special economic zones for tech companies.",
      },
      {
        type: "warning",
        title: "Agriculture Sector at Risk",
        description: "Only 33% of required students interested in modern agriculture careers.",
        impact: "Food security and sustainable development goals at risk.",
        recommendation: "Modernize agriculture curriculum. Promote agri-entrepreneurship and smart farming.",
      },
    ],
    totalStudentsAnalyzed: 24500,
    projectedWorkforceGap: 4000,
    generatedAt: new Date().toISOString(),
  };

  const data = marketData || fallbackData;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Briefcase className="w-6 h-6" style={{ color: colors.primary }} />
            <h1 className="text-3xl font-bold text-gray-900">Labor Market Bridge</h1>
          </div>
          <p className="text-gray-600 mt-1">Comparing student career interests with National Skills Development Plan (SDP)</p>
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025">2025 Projection</SelectItem>
              <SelectItem value="2030">2030 Target</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchMarketData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="border-2" style={{ borderColor: colors.primary }}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: colors.bg }}>
                <Users className="w-6 h-6" style={{ color: colors.primary }} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Students Analyzed</p>
                <p className="text-2xl font-bold text-gray-900">{data.totalStudentsAnalyzed.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2" style={{ borderColor: colors.warning }}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-yellow-50">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Workforce Gap by 2030</p>
                <p className="text-2xl font-bold text-yellow-700">{data.projectedWorkforceGap.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2" style={{ borderColor: colors.info }}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-50">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">National Goals Tracking</p>
                <p className="text-2xl font-bold text-blue-700">
                  {data.nationalGoals.filter(g => g.onTrack).length}/{data.nationalGoals.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Alignment Insights */}
      <div className="grid md:grid-cols-2 gap-6">
        {data.alignmentInsights.map((insight, index) => (
          <Card
            key={index}
            className={`border-l-4 ${
              insight.type === "critical" ? "border-red-500" :
              insight.type === "warning" ? "border-yellow-500" :
              "border-green-500"
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${
                  insight.type === "critical" ? "bg-red-100" :
                  insight.type === "warning" ? "bg-yellow-100" :
                  "bg-green-100"
                }`}>
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      insight.type === "critical" ? "bg-red-100 text-red-700" :
                      insight.type === "warning" ? "bg-yellow-100 text-yellow-700" :
                      "bg-green-100 text-green-700"
                    }`}>
                      {insight.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{insight.description}</p>
                  <div className="p-3 bg-gray-50 rounded mb-3">
                    <p className="text-xs text-gray-600 mb-1">Impact:</p>
                    <p className="text-sm text-gray-800">{insight.impact}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-purple-700">{insight.recommendation}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* National Goals Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5" style={{ color: colors.primary }} />
            <CardTitle>National Workforce Goals (2030)</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {data.nationalGoals.map((goal, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {goal.onTrack ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    )}
                    <span className="font-medium text-gray-900">{goal.goal}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-600">
                      {goal.currentProjection.toLocaleString()} / {goal.target.toLocaleString()}
                    </span>
                    <span className={`font-medium ${goal.onTrack ? "text-green-600" : "text-red-600"}`}>
                      {goal.onTrack ? "On Track" : `${goal.gap.toLocaleString} shortfall`}
                    </span>
                  </div>
                </div>
                <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      goal.onTrack ? "bg-green-500" : "bg-red-500"
                    }`}
                    style={{ width: `${Math.min((goal.currentProjection / goal.target) * 100, 100)}%` }}
                  />
                  <div
                    className="absolute top-0 h-0.5 bg-gray-400"
                    style={{ left: "100%", width: "2px" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Career Pathway Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Career Pathways */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" style={{ color: colors.primary }} />
              <CardTitle>Career Pathway Alignment</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.careerPathways.map((pathway) => {
                const statusConfig = getStatusConfig(pathway.status);
                const alignmentColor = pathway.alignment > 120 ? colors.success :
                                     pathway.alignment > 80 ? colors.info :
                                     pathway.alignment > 50 ? colors.warning : colors.danger;

                return (
                  <div key={pathway.career} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{pathway.career}</h4>
                      <span
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{ background: `${statusConfig.color}20`, color: statusConfig.color }}
                      >
                        {statusConfig.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-gray-600">Student Interest</p>
                        <p className="font-medium text-gray-900">{pathway.studentInterest.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">National Demand</p>
                        <p className="font-medium text-gray-900">{pathway.nationalDemand.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Alignment</span>
                        <span className="font-medium" style={{ color: alignmentColor }}>
                          {pathway.alignment}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(pathway.alignment, 100)}%`,
                            background: alignmentColor,
                          }}
                        />
                      </div>
                    </div>

                    {pathway.recommendedAction && (
                      <div className="p-2 bg-purple-50 rounded border border-purple-200">
                        <p className="text-xs text-purple-800">{pathway.recommendedAction}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Skill Sector Analysis */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5" style={{ color: colors.primary }} />
              <CardTitle>Skill Sector Capacity</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.skillSectors.map((sector) => {
                const statusConfig = getStatusConfig(sector.status);
                const fillPercent = Math.min((sector.studentsInterested / sector.projectedNeeds) * 100, 100);

                return (
                  <div key={sector.sector} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">{sector.sector}</h4>
                      <span
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{ background: `${statusConfig.color}20`, color: statusConfig.color }}
                      >
                        {statusConfig.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                      <div>
                        <p className="text-gray-600">Interested</p>
                        <p className="font-medium text-gray-900">{sector.studentsInterested.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Capacity</p>
                        <p className="font-medium text-gray-900">{sector.nationalCapacity.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">2030 Need</p>
                        <p className="font-medium text-gray-900">{sector.projectedNeeds.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="mb-2">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Capacity Utilization</span>
                        <span className="font-medium">{sector.alignmentRate}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${fillPercent}%`,
                            background: statusConfig.color,
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{sector.keyInstitutions} institutions</span>
                      <span>
                        {sector.projectedNeeds - sector.studentsInterested > 0
                          ? `${(sector.projectedNeeds - sector.studentsInterested).toLocaleString()} shortfall`
                          : "On track"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ministry Action Summary */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-purple-100">
              <Brain className="w-6 h-6" style={{ color: colors.primary }} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-3">Recommended Strategic Actions</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-red-700">Critical Priorities:</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Launch 200-seat Hydropower Engineering scholarship program</li>
                    <li>• Expand medical college capacity by 50%</li>
                    <li>• Modernize agriculture curriculum with smart farming tech</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-green-700">Growth Opportunities:</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Leverage IT surplus for regional tech hub development</li>
                    <li>• Redirect excess Business students to social entrepreneurship</li>
                    <li>• Develop eco-tourism specialization programs</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
