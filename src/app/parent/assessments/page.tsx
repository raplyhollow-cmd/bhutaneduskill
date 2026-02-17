/**
 * PARENT ASSESSMENTS VIEW (FEAT-011)
 *
 * Displays child's assessment results including:
 * - RIASEC Career Assessment results
 * - MBTI Personality Test results
 * - DISC Workplace Assessment results
 * - Learning Styles Inventory results
 * - Work Values Inventory results
 * - Progress over time visualization
 * - Comparison with class averages (where available)
 *
 * Features:
 * - Multi-child selection
 * - Real database integration
 * - TypeScript with proper types (NO any)
 * - Parent portal gray theme
 */

"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChildSelector } from "@/components/parent/child-selector";
import type { Child } from "@/components/parent/child-selector";
import {
  ClipboardCheck,
  Brain,
  Users,
  TrendingUp,
  TrendingDown,
  Award,
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Eye,
  Download,
  User,
} from "lucide-react";

// ============================================================================
// TYPES - NO any types used
// ============================================================================

/** RIASEC Assessment Result */
interface RiasecResult {
  id: string;
  userId: string;
  scores: {
    realistic: number;
    investigative: number;
    artistic: number;
    social: number;
    enterprising: number;
    conventional: number;
  };
  hollandCode: string | null;
  primaryHollandCode: string;
  secondaryHollandCode: string;
  recommendedCareers: string[];
  traits: string[] | null;
  completedAt: Date | string | null;
  createdAt: Date | string;
}

/** MBTI Assessment Result */
interface MBTIResult {
  id: string;
  userId: string;
  personalityType: string;
  scores: {
    e: number;
    i: number;
    s: number;
    n: number;
    t: number;
    f: number;
    j: number;
    p: number;
  };
  description: string;
  strengths: string[];
  weaknesses: string[];
  recommendedCareers: string[];
  completedAt: Date | string | null;
  createdAt: Date | string;
}

/** DISC Assessment Result */
interface DiscResult {
  id: string;
  userId: string;
  dominantStyle: string;
  scores: {
    d: number;
    i: number;
    s: number;
    c: number;
  };
  description: string;
  strengths: string[];
  weaknesses: string[];
  recommendedCareers: string[];
  completedAt: Date | string | null;
  createdAt: Date | string;
}

/** Work Values Assessment Result */
interface WorkValuesResult {
  id: string;
  userId: string;
  topValues: Array<{
    value: string;
    score: number;
  }>;
  description: string;
  recommendedCareers: string[];
  completedAt: Date | string | null;
  createdAt: Date | string;
}

/** Learning Styles Assessment Result */
interface LearningStylesResult {
  id: string;
  userId: string;
  visualScore: number;
  auditoryScore: number;
  kinestheticScore: number;
  dominantStyle: string;
  recommendations: string[];
  completedAt: Date | string | null;
  createdAt: Date | string;
}

/** Generic Assessment display item */
interface AssessmentDisplay {
  id: string;
  type: "riasec" | "mbti" | "disc" | "work_values" | "learning_styles";
  typeLabel: string;
  completedAt: string;
  result: string;
  description: string;
  details: unknown;
  classComparison?: ClassComparisonData;
}

/** Class comparison data */
interface ClassComparisonData {
  classAverage: { [key: string]: number } | null;
  childScore: { [key: string]: number } | null;
}

/** Assessment summary statistics */
interface AssessmentStats {
  totalCompleted: number;
  lastAssessmentDate: string | null;
  topTrait: string | null;
  classInfo: {
    id: string;
    grade: number | null;
    classmatesCount: number;
  } | null;
}

/** API Response Types */
interface AssessmentsApiResponse {
  assessments: {
    riasec: {
      type: string;
      results: Array<RiasecResult & { scores: { realistic: number; investigative: number; artistic: number; social: number; enterprising: number; conventional: number } | null }>;
      classAverage: { realistic: number; investigative: number; artistic: number; social: number; enterprising: number; conventional: number } | null;
      totalCompleted: number;
    };
    mbti: {
      type: string;
      results: MBTIResult[];
      classDistribution: { [key: string]: number } | null;
      totalCompleted: number;
    };
    disc: {
      type: string;
      results: Array<DiscResult & { scores: { d: number; i: number; s: number; c: number } | null }>;
      classAverage: { d: number; i: number; s: number; c: number } | null;
      totalCompleted: number;
    };
    workValues: {
      type: string;
      results: WorkValuesResult[];
      totalCompleted: number;
    };
    learningStyles: {
      type: string;
      results: LearningStylesResult[];
      classAverage: { visual: number; auditory: number; kinesthetic: number } | null;
      totalCompleted: number;
    };
  };
  summary: {
    totalCompleted: number;
    lastAssessmentDate: string | null;
    classInfo: {
      id: string;
      grade: number | null;
      classmatesCount: number;
    } | null;
  };
}

/** Progress over time data point */
interface ProgressDataPoint {
  date: string;
  value: number;
  label: string;
}

/** Progress over time by assessment type */
interface ProgressOverTime {
  riasec: ProgressDataPoint[];
  mbti: ProgressDataPoint[];
  disc: ProgressDataPoint[];
  workValues: ProgressDataPoint[];
  learningStyles: ProgressDataPoint[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ASSESSMENT_TYPE_LABELS: Record<string, string> = {
  riasec: "RIASEC Career Assessment",
  mbti: "MBTI Personality Test",
  disc: "DISC Workplace Assessment",
  work_values: "Work Values Inventory",
  learning_styles: "Learning Styles Inventory",
};

const RIASEC_LABELS: Record<string, string> = {
  R: "Realistic",
  I: "Investigative",
  A: "Artistic",
  S: "Social",
  E: "Enterprising",
  C: "Conventional",
};

const RIASEC_COLORS: Record<string, string> = {
  R: "bg-red-100 text-red-700 border-red-200",
  I: "bg-blue-100 text-blue-700 border-blue-200",
  A: "bg-purple-100 text-purple-700 border-purple-200",
  S: "bg-green-100 text-green-700 border-green-200",
  E: "bg-yellow-100 text-yellow-700 border-yellow-200",
  C: "bg-orange-100 text-orange-700 border-orange-200",
};

const MBTI_TYPE_DESCRIPTIONS: Record<string, string> = {
  INTJ: "The Architect - Strategic, imaginative, and determined.",
  INTP: "The Logician - Innovative, curious, and logical.",
  ENTJ: "The Commander - Bold, strategic, and confident.",
  ENTP: "The Debater - Smart, curious, and inventive.",
  INFJ: "The Advocate - Quiet, mystical, and idealistic.",
  INFP: "The Mediator - Poetic, kind, and altruistic.",
  ENFJ: "The Protagonist - Charismatic, inspiring, and patient.",
  ENFP: "The Campaigner - Enthusiastic, creative, and sociable.",
  ISTJ: "The Logistician - Practical, fact-minded, and reliable.",
  ISFJ: "The Defender - Warm, responsible, and conscientious.",
  ESTJ: "The Executive - Excellent, dedicated, and strong-willed.",
  ESFJ: "The Consul - Caring, social, and traditional.",
  ISTP: "The Virtuoso - Bold, practical, and experimental.",
  ISFP: "The Adventurer - Flexible, charming, and artistic.",
  ESTP: "The Entrepreneur - Smart, energetic, and perceptive.",
  ESFP: "The Entertainer - Spontaneous, energetic, and enthusiastic.",
};

const DISC_LABELS: Record<string, string> = {
  D: "Dominance - Direct, decisive, and determined.",
  I: "Influence - Optimistic, outgoing, and enthusiastic.",
  S: "Steadiness - Patient, reliable, and supportive.",
  C: "Conscientiousness - Analytical, precise, and private.",
};

const LEARNING_STYLE_LABELS: Record<string, string> = {
  visual: "Visual Learner - You learn best through seeing and observing.",
  auditory: "Auditory Learner - You learn best through listening and speaking.",
  kinesthetic: "Kinesthetic Learner - You learn best through doing and moving.",
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatDate(dateString: string | Date | null): string {
  if (!dateString) return "Unknown";
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getPercentageColor(value: number): string {
  if (value >= 80) return "text-green-600";
  if (value >= 60) return "text-blue-600";
  if (value >= 40) return "text-yellow-600";
  return "text-orange-600";
}

// ============================================================================
// PROGRESS OVER TIME COMPONENT
// ============================================================================

interface ProgressSectionProps {
  progressData: ProgressOverTime;
  assessments: AssessmentsApiResponse | null;
  selectedChild: Child | undefined;
}

function ProgressSection({ progressData, assessments, selectedChild }: ProgressSectionProps) {
  // Only show if there's actual progress data (multiple results)
  const hasProgress =
    progressData.riasec.length > 1 ||
    progressData.mbti.length > 1 ||
    progressData.disc.length > 1 ||
    progressData.workValues.length > 1 ||
    progressData.learningStyles.length > 1;

  if (!hasProgress) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Progress Over Time
        </CardTitle>
        <CardDescription>
          Track {selectedChild?.firstName || "your child's"} assessment progress across multiple attempts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {progressData.riasec.length > 1 && (
            <ProgressChart
              title="RIASEC Career Assessment"
              data={progressData.riasec}
              color="rgb(249 115 22)"
            />
          )}
          {progressData.mbti.length > 1 && (
            <ProgressChart
              title="MBTI Personality Test"
              data={progressData.mbti}
              color="rgb(168 85 247)"
            />
          )}
          {progressData.disc.length > 1 && (
            <ProgressChart
              title="DISC Workplace Assessment"
              data={progressData.disc}
              color="rgb(59 130 246)"
            />
          )}
          {progressData.workValues.length > 1 && (
            <ProgressChart
              title="Work Values Inventory"
              data={progressData.workValues}
              color="rgb(34 197 94)"
            />
          )}
          {progressData.learningStyles.length > 1 && (
            <ProgressChart
              title="Learning Styles Inventory"
              data={progressData.learningStyles}
              color="rgb(236 72 153)"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface ProgressChartProps {
  title: string;
  data: ProgressDataPoint[];
  color: string;
}

function ProgressChart({ title, data, color }: ProgressChartProps) {
  // Calculate trend
  const firstValue = data[0]?.value || 0;
  const lastValue = data[data.length - 1]?.value || 0;
  const trend = lastValue - firstValue;
  const trendUp = trend > 0;
  const trendDown = trend < 0;

  // Max value for scaling
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-gray-900">{title}</h4>
        <div className="flex items-center gap-1 text-sm">
          {trendUp ? (
            <TrendingUp className="w-4 h-4 text-green-600" />
          ) : trendDown ? (
            <TrendingDown className="w-4 h-4 text-red-600" />
          ) : null}
          <span className={trendUp ? "text-green-600" : trendDown ? "text-red-600" : "text-gray-500"}>
            {trend > 0 ? "+" : ""}{trend.toFixed(1)}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {data.map((point, index) => {
          const width = maxValue > 0 ? (point.value / maxValue) * 100 : 0;
          return (
            <div key={index} className="flex items-center gap-3">
              <div className="w-24 text-xs text-gray-500 flex-shrink-0">{point.date}</div>
              <div className="flex-1">
                <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full flex items-center justify-end pr-2 text-xs font-medium text-white"
                    style={{ width: `${width}%`, background: color }}
                  >
                    {point.label}
                  </div>
                </div>
              </div>
              <div className="w-12 text-xs text-gray-600 text-right flex-shrink-0">
                {point.value.toFixed(0)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// CLASS COMPARISON COMPONENT
// ============================================================================

interface ClassComparisonProps {
  childName: string;
  classAverage: { [key: string]: number } | null;
  childScore: { [key: string]: number } | null;
  labels: { [key: string]: string };
  colors?: { [key: string]: string };
}

function ClassComparisonBar({ childName, classAverage, childScore, labels, colors }: ClassComparisonProps) {
  if (!classAverage || !childScore) return null;

  const entries = Object.keys(childScore);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-900">Comparison with Class Average</h4>
      {entries.map((key) => {
        const childVal = childScore[key] || 0;
        const avgVal = classAverage[key] || 0;
        const maxVal = Math.max(childVal, avgVal, 1);
        const childPercent = (childVal / maxVal) * 100;
        const avgPercent = (avgVal / maxVal) * 100;
        const difference = childVal - avgVal;
        const isAbove = difference > 0;

        return (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">{labels[key] || key}</span>
              <span className={isAbove ? "text-green-600" : "text-orange-600"}>
                {isAbove ? "+" : ""}{difference.toFixed(1)} vs class avg
              </span>
            </div>
            <div className="flex h-4 rounded-full overflow-hidden">
              <div
                className={colors?.[key] || "bg-blue-500"}
                style={{ width: `${childPercent}%` }}
                title={`${childName}: ${childVal}`}
              />
              <div
                className="bg-gray-300"
                style={{ width: `${avgPercent}%` }}
                title={`Class Average: ${avgVal}`}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{childName}: {childVal.toFixed(0)}</span>
              <span>Class Avg: {avgVal.toFixed(0)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ParentAssessmentsPage() {
  // State
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assessments, setAssessments] = useState<AssessmentsApiResponse | null>(null);
  const [assessmentsLoading, setAssessmentsLoading] = useState(false);
  const [assessmentsError, setAssessmentsError] = useState<string | null>(null);
  const [stats, setStats] = useState<AssessmentStats | null>(null);
  const [progressData, setProgressData] = useState<ProgressOverTime | null>(null);

  // Refs to prevent duplicate fetches
  const hasFetched = useRef(false);
  const assessmentsFetchedRef = useRef<Set<string>>(new Set());

  // Computed: Selected child
  const selectedChild = useMemo(
    () => children.find((c) => c.id === selectedChildId),
    [children, selectedChildId]
  );

  // Fetch parent's children on mount
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchChildren = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/parent/children");
        if (!response.ok) {
          throw new Error("Failed to fetch children");
        }

        const data = await response.json();
        if (data.children && Array.isArray(data.children)) {
          setChildren(data.children);
          if (data.children.length > 0 && !selectedChildId) {
            setSelectedChildId(data.children[0].id);
          }
        } else {
          setChildren([]);
        }
      } catch (err) {
        console.error("Error fetching children:", err);
        setError("Failed to load children data");
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, []);

  // Fetch assessments when selected child changes
  useEffect(() => {
    if (!selectedChildId || !selectedChild) return;

    // Skip if already fetched for this child
    if (assessmentsFetchedRef.current.has(selectedChildId)) return;

    const fetchAssessments = async () => {
      try {
        setAssessmentsLoading(true);
        setAssessmentsError(null);

        const response = await fetch(`/api/parent/assessments?childId=${selectedChildId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch assessments");
        }

        const data: AssessmentsApiResponse = await response.json();
        setAssessments(data);

        // Set summary stats
        setStats({
          totalCompleted: data.summary.totalCompleted,
          lastAssessmentDate: data.summary.lastAssessmentDate,
          topTrait: null, // Will be computed below
          classInfo: data.summary.classInfo,
        });

        // Compute progress over time
        const progressOverTime: ProgressOverTime = {
          riasec: [],
          mbti: [],
          disc: [],
          workValues: [],
          learningStyles: [],
        };

        // RIASEC progress (using realistic score as proxy)
        data.assessments.riasec.results.forEach((result) => {
          if (result.scores) {
            const topTrait = Object.entries(result.scores).sort(([, a], [, b]) => b - a)[0];
            progressOverTime.riasec.push({
              date: formatDate(result.createdAt),
              value: topTrait[1],
              label: topTrait[0],
            });
          }
        });

        // MBTI progress (using E score as trend indicator)
        data.assessments.mbti.results.forEach((result) => {
          progressOverTime.mbti.push({
            date: formatDate(result.createdAt),
            value: result.scores?.e || 50,
            label: result.personalityType,
          });
        });

        // DISC progress (using D score as trend indicator)
        data.assessments.disc.results.forEach((result) => {
          if (result.scores) {
            const topStyle = Object.entries(result.scores).sort(([, a], [, b]) => b - a)[0];
            progressOverTime.disc.push({
              date: formatDate(result.createdAt),
              value: topStyle[1],
              label: topStyle[0].toUpperCase(),
            });
          }
        });

        // Work Values progress
        data.assessments.workValues.results.forEach((result) => {
          const topValue = result.topValues?.[0];
          progressOverTime.workValues.push({
            date: formatDate(result.createdAt),
            value: topValue?.score || 0,
            label: topValue?.value || "N/A",
          });
        });

        // Learning Styles progress
        data.assessments.learningStyles.results.forEach((result) => {
          progressOverTime.learningStyles.push({
            date: formatDate(result.createdAt),
            value: Math.max(result.visualScore, result.auditoryScore, result.kinestheticScore),
            label: result.dominantStyle,
          });
        });

        setProgressData(progressOverTime);

        // Find top trait from latest RIASEC result
        if (data.assessments.riasec.results.length > 0) {
          const latestRiasec = data.assessments.riasec.results[0];
          if (latestRiasec.scores && latestRiasec.hollandCode) {
            const codes = latestRiasec.hollandCode.split("");
            const topTrait = codes.map((c) => RIASEC_LABELS[c] || c).join(" - ");
            setStats((prev) => (prev ? { ...prev, topTrait } : null));
          }
        }

        assessmentsFetchedRef.current.add(selectedChildId);
      } catch (err) {
        console.error("Error fetching assessments:", err);
        setAssessmentsError("Failed to load assessment data");
      } finally {
        setAssessmentsLoading(false);
      }
    };

    fetchAssessments();
  }, [selectedChildId, selectedChild]);

  // Handle child change
  const handleChildChange = (child: Child) => {
    setSelectedChildId(child.id);
    setAssessments(null);
    setStats(null);
    setProgressData(null);
    setAssessmentsError(null);
    assessmentsFetchedRef.current.clear();
  };

  // Convert API data to display format
  const assessmentDisplayList = useMemo(() => {
    if (!assessments) return [];

    const list: AssessmentDisplay[] = [];

    // RIASEC
    assessments.assessments.riasec.results.forEach((result) => {
      list.push({
        id: result.id,
        type: "riasec",
        typeLabel: ASSESSMENT_TYPE_LABELS.riasec,
        completedAt: formatDate(result.completedAt),
        result: result.hollandCode || result.primaryHollandCode || "N/A",
        description: `Holland Code: ${result.hollandCode || result.primaryHollandCode}. Top traits: ${
          result.traits?.slice(0, 3).join(", ") || "N/A"
        }`,
        details: result,
        classComparison: {
          classAverage: assessments.assessments.riasec.classAverage,
          childScore: result.scores || undefined,
        },
      });
    });

    // MBTI
    assessments.assessments.mbti.results.forEach((result) => {
      list.push({
        id: result.id,
        type: "mbti",
        typeLabel: ASSESSMENT_TYPE_LABELS.mbti,
        completedAt: formatDate(result.completedAt),
        result: result.personalityType || "N/A",
        description: MBTI_TYPE_DESCRIPTIONS[result.personalityType] || result.description,
        details: result,
      });
    });

    // DISC
    assessments.assessments.disc.results.forEach((result) => {
      list.push({
        id: result.id,
        type: "disc",
        typeLabel: ASSESSMENT_TYPE_LABELS.disc,
        completedAt: formatDate(result.completedAt),
        result: result.dominantStyle || "N/A",
        description: DISC_LABELS[result.dominantStyle] || result.description,
        details: result,
        classComparison: {
          classAverage: assessments.assessments.disc.classAverage,
          childScore: result.scores || undefined,
        },
      });
    });

    // Work Values
    assessments.assessments.workValues.results.forEach((result) => {
      const topValues = result.topValues?.slice(0, 3).map((v) => v.value).join(", ") || "N/A";
      list.push({
        id: result.id,
        type: "work_values",
        typeLabel: ASSESSMENT_TYPE_LABELS.work_values,
        completedAt: formatDate(result.completedAt),
        result: topValues,
        description: result.description || "Values that matter most in career choice.",
        details: result,
      });
    });

    // Learning Styles
    assessments.assessments.learningStyles.results.forEach((result) => {
      list.push({
        id: result.id,
        type: "learning_styles",
        typeLabel: ASSESSMENT_TYPE_LABELS.learning_styles,
        completedAt: formatDate(result.completedAt),
        result: result.dominantStyle || "N/A",
        description: LEARNING_STYLE_LABELS[result.dominantStyle] || result.recommendations?.[0] || "",
        details: result,
        classComparison: {
          classAverage: assessments.assessments.learningStyles.classAverage,
          childScore: {
            visual: result.visualScore,
            auditory: result.auditoryScore,
            kinesthetic: result.kinestheticScore,
          },
        },
      });
    });

    // Sort by completion date (newest first)
    return list.sort((a, b) => {
      const dateA = new Date(a.completedAt).getTime();
      const dateB = new Date(b.completedAt).getTime();
      return dateB - dateA;
    });
  }, [assessments]);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
            <p className="ml-3 text-gray-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6 p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-16 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-900 mb-2">Error Loading Data</h2>
            <p className="text-red-700">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No children state
  if (children.length === 0) {
    return (
      <div className="space-y-6 p-6">
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Children Found</h2>
            <p className="text-gray-500 mb-6">
              You don&apos;t have any children linked to your account yet.
              Please contact school administration to link your children.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Assessment Results</h1>
        <p className="text-gray-600">
          View {selectedChild?.firstName || "your child's"} assessment results and progress over time.
        </p>
      </div>

      {/* Child Selector */}
      {children.length > 1 && (
        <Card>
          <CardContent className="pt-4">
            <ChildSelector
              children={children}
              selectedChildId={selectedChildId || undefined}
              onChildChange={handleChildChange}
              variant="dropdown"
              label="Select child to view assessments"
            />
          </CardContent>
        </Card>
      )}

      {/* Single Child Display */}
      {children.length === 1 && selectedChild && (
        <Card
          style={{
            background: "linear-gradient(to right, rgb(249 250 251) 0%, rgb(243 244 246) 100%)",
            borderColor: "rgb(229 231 235)",
          }}
          className="border"
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                style={{ background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)" }}
              >
                {selectedChild.firstName?.[0]}{(selectedChild.lastName || "")[0] || ""}
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {selectedChild.firstName} {selectedChild.lastName || ""}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedChild.classGrade ? `Class ${selectedChild.classGrade}` : ""}
                  {selectedChild.section && ` - ${selectedChild.section}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading Assessments */}
      {assessmentsLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
            <p className="ml-3 text-gray-600">Loading assessment results...</p>
          </CardContent>
        </Card>
      )}

      {/* Assessments Error */}
      {!assessmentsLoading && assessmentsError && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900">Could not load assessments</p>
                <p className="text-sm text-amber-700">{assessmentsError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setAssessmentsError(null);
                    assessmentsFetchedRef.current.delete(selectedChildId || "");
                    window.location.reload();
                  }}
                >
                  Retry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assessment Stats */}
      {!assessmentsLoading && stats && stats.totalCompleted > 0 && (
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-2">
                <ClipboardCheck className="w-3 h-3" />
                Assessments Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.totalCompleted}</div>
              <p className="text-xs text-gray-500">Out of 5 available</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                Last Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-gray-900">{stats.lastAssessmentDate || "N/A"}</div>
            </CardContent>
          </Card>

          {stats.topTrait && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-2">
                  <Award className="w-3 h-3" />
                  Top Career Trait
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-semibold text-gray-900">{stats.topTrait}</div>
              </CardContent>
            </Card>
          )}

          {stats.classInfo && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-2">
                  <Users className="w-3 h-3" />
                  Class Info
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-gray-900">
                  {stats.classInfo.grade ? `Class ${stats.classInfo.grade}` : "N/A"}
                </div>
                <p className="text-xs text-gray-500">
                  {stats.classInfo.classmatesCount} classmate{stats.classInfo.classmatesCount !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Progress Over Time */}
      {!assessmentsLoading && progressData && (
        <ProgressSection progressData={progressData} assessments={assessments} selectedChild={selectedChild} />
      )}

      {/* Assessment Results List */}
      {!assessmentsLoading && assessmentDisplayList.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Assessment Results</CardTitle>
                <CardDescription>
                  {selectedChild?.firstName}&apos;s completed assessments and outcomes
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assessmentDisplayList.map((assessment) => (
                <AssessmentCard key={assessment.id} assessment={assessment} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Assessments */}
      {!assessmentsLoading && assessmentDisplayList.length === 0 && !assessmentsError && (
        <Card>
          <CardContent className="py-16 text-center">
            <ClipboardCheck className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Assessment Results</h2>
            <p className="text-gray-500 mb-6">
              {selectedChild?.firstName} hasn&apos;t completed any assessments yet.
            </p>
            <p className="text-sm text-gray-400">
              Assessment results will appear here once completed.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Assessment Info Section */}
      <Card>
        <CardHeader>
          <CardTitle>About Assessments</CardTitle>
          <CardDescription>
            Understanding the different assessment types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">RIASEC Career Assessment</h3>
              <p className="text-sm text-gray-600">
                Identifies career interests based on Holland&apos;s six occupational themes:
                Realistic, Investigative, Artistic, Social, Enterprising, and Conventional.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">MBTI Personality Test</h3>
              <p className="text-sm text-gray-600">
                Determines personality type based on four dichotomies: Extraversion/Introversion,
                Sensing/Intuition, Thinking/Feeling, and Judging/Perceiving.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">DISC Workplace Assessment</h3>
              <p className="text-sm text-gray-600">
                Measures behavioral style across four dimensions: Dominance, Influence,
                Steadiness, and Conscientiousness.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Learning Styles Inventory</h3>
              <p className="text-sm text-gray-600">
                Determines preferred learning style: Visual, Auditory, or Kinesthetic.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface AssessmentCardProps {
  assessment: AssessmentDisplay;
}

function AssessmentCard({ assessment }: AssessmentCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const renderDetails = () => {
    switch (assessment.type) {
      case "riasec":
        return <RiasecDetails details={assessment.details as unknown as RiasecResult} classComparison={assessment.classComparison} />;
      case "mbti":
        return <MBTIDetails details={assessment.details as unknown as MBTIResult} />;
      case "disc":
        return <DiscDetails details={assessment.details as unknown as DiscResult} classComparison={assessment.classComparison} />;
      case "work_values":
        return <WorkValuesDetails details={assessment.details as unknown as WorkValuesResult} />;
      case "learning_styles":
        return <LearningStylesDetails details={assessment.details as unknown as LearningStylesResult} classComparison={assessment.classComparison} />;
      default:
        return null;
    }
  };

  return (
    <Card className={showDetails ? "ring-2 ring-gray-200" : ""}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardCheck className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">{assessment.typeLabel}</h3>
              <Badge variant="outline" className="text-xs">
                {assessment.type.toUpperCase()}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 mb-2">
              Completed: {assessment.completedAt}
            </p>
            <div
              className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-2"
            >
              <p className="font-medium text-gray-900">{assessment.result}</p>
            </div>
            <p className="text-sm text-gray-600">{assessment.description}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="ml-4"
          >
            {showDetails ? (
              <>Hide </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </>
            )}
          </Button>
        </div>

        {showDetails && (
          <div className="mt-4 pt-4 border-t">
            {renderDetails()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// ASSESSMENT DETAIL COMPONENTS
// ============================================================================

interface RiasecDetailsProps {
  details: RiasecResult;
  classComparison?: ClassComparisonData;
}

function RiasecDetails({ details, classComparison }: RiasecDetailsProps) {
  const scores = details.scores || {
    realistic: 0,
    investigative: 0,
    artistic: 0,
    social: 0,
    enterprising: 0,
    conventional: 0,
  };

  const maxScore = Math.max(...Object.values(scores));
  const traitEntries = Object.entries(scores).sort(([, a], [, b]) => b - a);

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Holland Code Scores</h4>
        <div className="space-y-2">
          {traitEntries.map(([trait, score]) => {
            const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
            const label = RIASEC_LABELS[trait] || trait;
            const colorClass = RIASEC_COLORS[trait] || "bg-gray-100 text-gray-700";

            return (
              <div key={trait} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Badge variant="outline" className={colorClass}>
                      {trait}
                    </Badge>
                    <span className="text-gray-700">{label}</span>
                  </span>
                  <span className={`font-medium ${getPercentageColor(percentage)}`}>
                    {score}
                  </span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })}
        </div>
      </div>

      {classComparison?.classAverage && classComparison?.childScore && (
        <ClassComparisonBar
          childName="Your child"
          classAverage={classComparison.classAverage}
          childScore={classComparison.childScore as { [key: string]: number }}
          labels={RIASEC_LABELS}
          colors={RIASEC_COLORS}
        />
      )}

      {details.recommendedCareers && details.recommendedCareers.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Recommended Careers</h4>
          <div className="flex flex-wrap gap-2">
            {details.recommendedCareers.slice(0, 6).map((career, index) => (
              <Badge key={index} variant="secondary" className="bg-blue-50 text-blue-700">
                {career}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {details.traits && details.traits.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Key Traits</h4>
          <div className="flex flex-wrap gap-2">
            {details.traits.map((trait, index) => (
              <Badge key={index} variant="outline" className="bg-gray-50 text-gray-700">
                {trait}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface MBTIDetailsProps {
  details: MBTIResult;
}

function MBTIDetails({ details }: MBTIDetailsProps) {
  const scores = details.scores || {
    e: 0, i: 0, s: 0, n: 0, t: 0, f: 0, j: 0, p: 0,
  };

  const dichotomies = [
    { label: "Extraversion", left: "E", right: "I" },
    { label: "Sensing", left: "S", right: "N" },
    { label: "Thinking", left: "T", right: "F" },
    { label: "Judging", left: "J", right: "P" },
  ];

  return (
    <div className="space-y-4">
      <div className="text-center p-4 bg-purple-50 rounded-lg">
        <div className="text-3xl font-bold text-purple-900 mb-1">
          {details.personalityType}
        </div>
        <p className="text-sm text-purple-700">{MBTI_TYPE_DESCRIPTIONS[details.personalityType] || ""}</p>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Preference Scores</h4>
        <div className="space-y-3">
          {dichotomies.map((dichotomy, index) => {
            const leftScore = scores[dichotomy.left.toLowerCase() as keyof typeof scores] || 0;
            const rightScore = scores[dichotomy.right.toLowerCase() as keyof typeof scores] || 0;
            const total = leftScore + rightScore;
            const leftPercent = total > 0 ? (leftScore / total) * 100 : 50;
            const rightPercent = total > 0 ? (rightScore / total) * 100 : 50;

            return (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{dichotomy.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs w-4">{dichotomy.left}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden flex">
                    <div
                      className="bg-blue-500"
                      style={{ width: `${leftPercent}%` }}
                    />
                    <div
                      className="bg-purple-500"
                      style={{ width: `${rightPercent}%` }}
                    />
                  </div>
                  <span className="text-xs w-4">{dichotomy.right}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{Math.round(leftPercent)}%</span>
                  <span>{Math.round(rightPercent)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {details.strengths && details.strengths.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Strengths</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {details.strengths.map((strength, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                {strength}
              </li>
            ))}
          </ul>
        </div>
      )}

      {details.recommendedCareers && details.recommendedCareers.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Career Suggestions</h4>
          <div className="flex flex-wrap gap-2">
            {details.recommendedCareers.slice(0, 6).map((career, index) => (
              <Badge key={index} variant="secondary" className="bg-purple-50 text-purple-700">
                {career}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface DiscDetailsProps {
  details: DiscResult;
  classComparison?: ClassComparisonData;
}

function DiscDetails({ details, classComparison }: DiscDetailsProps) {
  const scores = details.scores || { d: 0, i: 0, s: 0, c: 0 };
  const maxScore = Math.max(...Object.values(scores));

  return (
    <div className="space-y-4">
      <div className="text-center p-4 bg-blue-50 rounded-lg">
        <div className="text-2xl font-bold text-blue-900 mb-1">
          Dominant Style: {details.dominantStyle}
        </div>
        <p className="text-sm text-blue-700">{DISC_LABELS[details.dominantStyle] || details.description}</p>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">DISC Profile</h4>
        <div className="space-y-2">
          {(["D", "I", "S", "C"] as const).map((trait) => {
            const score = scores[trait.toLowerCase() as keyof typeof scores] || 0;
            const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
            const label = DISC_LABELS[trait]?.split(" - ")[0] || trait;

            return (
              <div key={trait} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{label}</span>
                  <span className={`font-medium ${getPercentageColor(percentage)}`}>
                    {score}
                  </span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })}
        </div>
      </div>

      {details.strengths && details.strengths.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Workplace Strengths</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {details.strengths.map((strength, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                {strength}
              </li>
            ))}
          </ul>
        </div>
      )}

      {classComparison?.classAverage && classComparison?.childScore && (
        <ClassComparisonBar
          childName="Your child"
          classAverage={classComparison.classAverage}
          childScore={classComparison.childScore as { [key: string]: number }}
          labels={{ d: "Dominance", i: "Influence", s: "Steadiness", c: "Conscientiousness" }}
        />
      )}
    </div>
  );
}

interface WorkValuesDetailsProps {
  details: WorkValuesResult;
}

function WorkValuesDetails({ details }: WorkValuesDetailsProps) {
  const topValues = details.topValues || [];
  const maxValue = topValues.length > 0 ? topValues[0].score : 1;

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Top Work Values</h4>
        <div className="space-y-2">
          {topValues.map((item, index) => {
            const percentage = maxValue > 0 ? (item.score / maxValue) * 100 : 0;

            return (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.value}</span>
                  <span className={`font-medium ${getPercentageColor(percentage)}`}>
                    {item.score}
                  </span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })}
        </div>
      </div>

      {details.recommendedCareers && details.recommendedCareers.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Careers Aligned with Values</h4>
          <div className="flex flex-wrap gap-2">
            {details.recommendedCareers.slice(0, 6).map((career, index) => (
              <Badge key={index} variant="secondary" className="bg-green-50 text-green-700">
                {career}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface LearningStylesDetailsProps {
  details: LearningStylesResult;
  classComparison?: ClassComparisonData;
}

function LearningStylesDetails({ details, classComparison }: LearningStylesDetailsProps) {
  const maxScore = Math.max(details.visualScore, details.auditoryScore, details.kinestheticScore);

  const styles = [
    { name: "Visual", score: details.visualScore, icon: "Eye" },
    { name: "Auditory", score: details.auditoryScore, icon: "Ear" },
    { name: "Kinesthetic", score: details.kinestheticScore, icon: "Activity" },
  ];

  return (
    <div className="space-y-4">
      <div className="text-center p-4 bg-green-50 rounded-lg">
        <div className="text-xl font-bold text-green-900 mb-1">
          Dominant Style: {details.dominantStyle?.replace("_", " ").toUpperCase()}
        </div>
        <p className="text-sm text-green-700">{LEARNING_STYLE_LABELS[details.dominantStyle || ""]}</p>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Learning Preferences</h4>
        <div className="space-y-2">
          {styles.map((style) => {
            const percentage = maxScore > 0 ? (style.score / maxScore) * 100 : 0;

            return (
              <div key={style.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{style.name} Learner</span>
                  <span className={`font-medium ${getPercentageColor(percentage)}`}>
                    {style.score}
                  </span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })}
        </div>
      </div>

      {details.recommendations && details.recommendations.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Learning Tips</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {details.recommendations.map((tip, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {classComparison?.classAverage && classComparison?.childScore && (
        <ClassComparisonBar
          childName="Your child"
          classAverage={classComparison.classAverage}
          childScore={classComparison.childScore as { [key: string]: number }}
          labels={{ visual: "Visual", auditory: "Auditory", kinesthetic: "Kinesthetic" }}
        />
      )}
    </div>
  );
}
