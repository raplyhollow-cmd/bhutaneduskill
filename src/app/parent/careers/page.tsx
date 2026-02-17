"use client";

import { logger } from "@/lib/logger";
/**
 * PARENT CAREERS VIEW PAGE
 *
 * Features:
 * - Child selection dropdown
 * - Child's career assessment results
 * - Recommended careers based on assessments
 * - Career plans and progress tracking
 * - RIASEC/MBTI results visualization
 * - Enhanced career details (skills, education, salary, demand)
 */


import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Briefcase,
  Brain,
  Target,
  TrendingUp,
  GraduationCap,
  Calendar,
  CheckCircle,
  Circle,
  AlertCircle,
  Loader2,
  Users,
  BookOpen,
  Award,
  ArrowRight,
  Sparkles,
  FileText,
  DollarSign,
  MapPin,
  Lightbulb,
} from "lucide-react";
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

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  classGrade: number | null;
  section: string | null;
  careerInterests?: string[];
}

interface EnrichedCareerMatch {
  id: string;
  studentId: string;
  careerId: string;
  careerTitle: string;
  matchScore: number;
  matchReason: string;
  recommendationText: string | null;
  isTopMatch: boolean;
  assessmentType: string;
  assessmentId: string | null;
  createdAt: string;
  // Enriched career details
  careerSlug?: string | null;
  careerDescription?: string | null;
  careerCategory?: string | null;
  careerIndustry?: string | null;
  careerRiasecCode?: string | null;
  careerHollandCodes?: string | null;
  careerEducationLevel?: string | null;
  careerTypicalSalary?: string | null;
  careerGrowthOutlook?: string | null;
  careerSkills?: string | null;
  careerSubjects?: string | null;
  careerWorkEnvironment?: string | null;
  careerBhutanSpecific?: string | null;
  careerBhutanDemand?: string | null;
  careerIcon?: string | null;
  careerColor?: string | null;
}

interface ClassAverage {
  realistic: number;
  investigative: number;
  artistic: number;
  social: number;
  enterprising: number;
  conventional: number;
}

interface RIASECData {
  type: "riasec";
  results: Array<{
    id: string;
    userId: string;
    scores: {
      realistic: number;
      investigative: number;
      artistic: number;
      social: number;
      enterprising: number;
      conventional: number;
    } | null;
    hollandCode: string | null;
    recommendedCareers: string[] | null;
    traits: string[] | null;
    completedAt: string;
    createdAt: string;
  }>;
  classAverage: ClassAverage | null;
  totalCompleted: number;
}

interface MBTIData {
  type: "mbti";
  results: Array<{
    id: string;
    userId: string;
    personalityType: string;
    traits: string[] | null;
    completedAt: string;
    createdAt: string;
  }>;
  classDistribution: Record<string, number> | null;
  totalCompleted: number;
}

interface DISCData {
  type: "disc";
  results: Array<{
    id: string;
    userId: string;
    scores: {
      d: number;
      i: number;
      s: number;
      c: number;
    } | null;
    discType: string | null;
    traits: string[] | null;
    completedAt: string;
    createdAt: string;
  }>;
  classAverage: {
    d: number;
    i: number;
    s: number;
    c: number;
  } | null;
  totalCompleted: number;
}

interface WorkValuesData {
  type: "work_values";
  results: Array<{
    id: string;
    userId: string;
    topValues: string[] | null;
    completedAt: string;
    createdAt: string;
  }>;
  totalCompleted: number;
}

interface LearningStylesData {
  type: "learning_styles";
  results: Array<{
    id: string;
    userId: string;
    visualScore: number;
    auditoryScore: number;
    kinestheticScore: number;
    dominantStyle: string | null;
    completedAt: string;
    createdAt: string;
  }>;
  classAverage: {
    visual: number;
    auditory: number;
    kinesthetic: number;
  } | null;
  totalCompleted: number;
}

interface AssessmentsResponse {
  assessments: {
    riasec: RIASECData;
    mbti: MBTIData;
    disc: DISCData;
    workValues: WorkValuesData;
    learningStyles: LearningStylesData;
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

interface CareerPlan {
  id: string;
  studentId: string;
  targetCareer: string;
  targetCareerId: string;
  currentPhase: string | null;
  status: string;
  shortTermGoals: string[] | null;
  longTermGoals: string[] | null;
  milestones: Array<{
    title: string;
    deadline: string;
    completed: boolean;
  }> | null;
  actionSteps: Array<{
    step: string;
    deadline: string;
    completed: boolean;
    completedAt: string;
  }> | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ParentCareersPage() {
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Career data for selected child
  const [careerMatches, setCareerMatches] = useState<EnrichedCareerMatch[]>([]);
  const [assessmentsData, setAssessmentsData] = useState<AssessmentsResponse | null>(null);
  const [careerPlan, setCareerPlan] = useState<CareerPlan | null>(null);
  const [careerDataLoading, setCareerDataLoading] = useState(false);

  const hasFetchedChildren = useRef(false);
  const hasFetchedCareerData = useRef<Set<string>>(new Set());

  // Selected child (memoized)
  const selectedChild = useMemo(
    () => children.find((c) => c.id === selectedChildId),
    [children, selectedChildId]
  );

  // Extract RIASEC result from assessments data
  const riasecResult = useMemo(() => {
    if (!assessmentsData?.assessments.riasec.results.length) {
      return null;
    }
    const result = assessmentsData.assessments.riasec.results[0];
    return {
      id: result.id,
      userId: result.userId,
      scores: result.scores || {
        realistic: 0,
        investigative: 0,
        artistic: 0,
        social: 0,
        enterprising: 0,
        conventional: 0,
      },
      hollandCode: result.hollandCode,
      recommendedCareers: result.recommendedCareers || [],
      traits: result.traits,
      completedAt: result.completedAt,
    };
  }, [assessmentsData]);

  // ============================================================================
  // FETCH CHILDREN
  // ============================================================================

  useEffect(() => {
    if (hasFetchedChildren.current) return;
    hasFetchedChildren.current = true;

    const fetchChildren = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/parent/dashboard");
        if (!response.ok) {
          throw new Error("Failed to fetch children");
        }

        const data = await response.json();

        if (data.children && Array.isArray(data.children)) {
          setChildren(data.children);
          if (data.children.length > 0) {
            setSelectedChildId(data.children[0].id);
          }
        }
      } catch (err) {
        logger.error("Error fetching children:", err);
        setError("Failed to load children data");
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, []);

  // ============================================================================
  // FETCH CAREER DATA FOR SELECTED CHILD
  // ============================================================================

  useEffect(() => {
    if (!selectedChildId) return;

    // Skip if already fetched
    if (hasFetchedCareerData.current.has(selectedChildId)) return;
    hasFetchedCareerData.current.add(selectedChildId);

    const fetchCareerData = async () => {
      try {
        setCareerDataLoading(true);

        // Fetch career matches, assessments, and career plan in parallel
        const [matchesRes, assessmentsRes, planRes] = await Promise.all([
          fetch(`/api/parent/career-matches?childId=${selectedChildId}`),
          fetch(`/api/parent/assessments?childId=${selectedChildId}`),
          fetch(`/api/parent/career-plan?childId=${selectedChildId}`),
        ]);

        // Handle career matches
        if (matchesRes.ok) {
          const matchesData = await matchesRes.json();
          setCareerMatches(matchesData.matches || []);
        } else {
          setCareerMatches([]);
        }

        // Handle assessment results - includes all assessment types
        if (assessmentsRes.ok) {
          const assessmentsResponseData: AssessmentsResponse = await assessmentsRes.json();
          setAssessmentsData(assessmentsResponseData);
        } else {
          setAssessmentsData(null);
        }

        // Handle career plan
        if (planRes.ok) {
          const planData = await planRes.json();
          if (planData.plan) {
            setCareerPlan(planData.plan);
          }
        }
      } catch (err) {
        logger.error("Error fetching career data:", err);
      } finally {
        setCareerDataLoading(false);
      }
    };

    fetchCareerData();
  }, [selectedChildId]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleChildChange = (childId: string) => {
    setSelectedChildId(childId);
    setCareerMatches([]);
    setAssessmentsData(null);
    setCareerPlan(null);
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const getMatchScoreColor = (score: number): string => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-blue-500";
    return "bg-gray-400";
  };

  const getMatchScoreBgColor = (score: number): string => {
    if (score >= 80) return "bg-green-100 text-green-700";
    if (score >= 60) return "bg-blue-100 text-blue-700";
    return "bg-gray-100 text-gray-700";
  };

  const getPhaseLabel = (phase: string | null | undefined): string => {
    if (!phase) return "Not Started";
    const phaseMap: Record<string, string> = {
      self_assessment: "Self Assessment",
      career_exploration: "Career Exploration",
      goal_setting: "Goal Setting",
      planning: "Planning",
      execution: "Execution",
      review: "Review",
    };
    return phaseMap[phase] || phase;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "achieved":
        return "bg-blue-100 text-blue-700";
      case "changed":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const calculateProgress = (plan: CareerPlan | null): number => {
    if (!plan) return 0;

    let total = 0;
    let completed = 0;

    if (plan.actionSteps && plan.actionSteps.length > 0) {
      total += plan.actionSteps.length;
      completed += plan.actionSteps.filter((step) => step.completed).length;
    }

    if (plan.milestones && plan.milestones.length > 0) {
      total += plan.milestones.length;
      completed += plan.milestones.filter((m) => m.completed).length;
    }

    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  // ============================================================================
  // LOADING STATES
  // ============================================================================

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
            <p className="ml-3 text-gray-600">Loading careers data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
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

  if (children.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Children Found</h2>
            <p className="text-gray-500">
              You don't have any children linked to your account yet.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  const progress = calculateProgress(careerPlan);
  const hasAssessments = Boolean(
    assessmentsData &&
      (assessmentsData.assessments.riasec.totalCompleted > 0 ||
        assessmentsData.assessments.mbti.totalCompleted > 0 ||
        assessmentsData.assessments.disc.totalCompleted > 0 ||
        assessmentsData.assessments.workValues.totalCompleted > 0 ||
        assessmentsData.assessments.learningStyles.totalCompleted > 0)
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Career Exploration</h1>
          <p className="text-gray-600">View your child's career recommendations and plans</p>
        </div>
      </div>

      {/* Child Selector */}
      {children.length > 1 && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Select Child:</label>
              <Select value={selectedChildId || ""} onValueChange={handleChildChange}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select a child" />
                </SelectTrigger>
                <SelectContent>
                  {children.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.firstName} {child.lastName} ({child.classGrade || "N/A"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Child Info Banner */}
      {selectedChild && (
        <Card
          style={{ background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)" }}
          className="text-white border-0"
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold mb-1">
                  {selectedChild.firstName} {selectedChild.lastName}
                </h2>
                <p className="text-gray-200">
                  Class {selectedChild.classGrade || "N/A"} {selectedChild.section ? `- ${selectedChild.section}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-3xl font-bold">{progress}%</p>
                  <p className="text-gray-200 text-sm">Career Plan Progress</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Target className="w-6 h-6" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {careerDataLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
            <p className="ml-3 text-gray-600">Loading career data...</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="min-h-[44px]">Overview</TabsTrigger>
            <TabsTrigger value="assessments" className="min-h-[44px]">Assessments</TabsTrigger>
            <TabsTrigger value="recommendations" className="min-h-[44px]">Careers</TabsTrigger>
            <TabsTrigger value="plan" className="min-h-[44px]">Plan</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Quick Stats */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Brain className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {hasAssessments ? "Completed" : "Pending"}
                      </p>
                      <p className="text-sm text-gray-600">Assessments</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Briefcase className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{careerMatches.length}</p>
                      <p className="text-sm text-gray-600">Career Matches</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <Target className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-orange-600">
                        {careerPlan ? getPhaseLabel(careerPlan.currentPhase) : "Not Started"}
                      </p>
                      <p className="text-sm text-gray-600">Current Phase</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-600">{progress}%</p>
                      <p className="text-sm text-gray-600">Overall Progress</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Career Matches */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Top Career Matches</CardTitle>
                    <CardDescription>
                      Based on {selectedChild?.firstName}'s assessment results
                    </CardDescription>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700">
                    {careerMatches.length} careers
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {careerMatches.length > 0 ? (
                  <div className="space-y-4">
                    {careerMatches.slice(0, 5).map((match) => (
                      <div
                        key={match.id}
                        className="flex items-center gap-4 p-4 rounded-lg border hover:border-gray-400 hover:bg-gray-50 transition-colors"
                      >
                        <div
                          className={`w-12 h-12 ${getMatchScoreColor(match.matchScore)} rounded-full flex items-center justify-center text-white font-bold`}
                        >
                          {match.matchScore}%
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{match.careerTitle}</h4>
                            {match.isTopMatch && (
                              <Badge className="bg-yellow-100 text-yellow-700">
                                <Sparkles className="w-3 h-3 mr-1" />
                                Top Match
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{match.matchReason}</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Briefcase className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p>No career matches yet</p>
                    <p className="text-sm">
                      Career matches will appear after {selectedChild?.firstName} completes assessments
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assessment Status */}
            <Card>
              <CardHeader>
                <CardTitle>Assessment Status</CardTitle>
                <CardDescription>Track assessment completion</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-5 gap-4">
                  {/* RIASEC */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">RIASEC</h4>
                      <Badge
                        className={
                          assessmentsData?.assessments.riasec.totalCompleted && assessmentsData.assessments.riasec.totalCompleted > 0
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }
                      >
                        {assessmentsData?.assessments.riasec.totalCompleted && assessmentsData.assessments.riasec.totalCompleted > 0
                          ? "Done"
                          : "Pending"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {assessmentsData?.assessments.riasec.totalCompleted && assessmentsData.assessments.riasec.totalCompleted > 0
                        ? `Holland Code: ${assessmentsData.assessments.riasec.results[0]?.hollandCode || "N/A"}`
                        : "Career interest assessment"}
                    </p>
                  </div>

                  {/* MBTI */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">MBTI</h4>
                      <Badge
                        className={
                          assessmentsData?.assessments.mbti.totalCompleted && assessmentsData.assessments.mbti.totalCompleted > 0
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }
                      >
                        {assessmentsData?.assessments.mbti.totalCompleted && assessmentsData.assessments.mbti.totalCompleted > 0
                          ? "Done"
                          : "Pending"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {assessmentsData?.assessments.mbti.totalCompleted && assessmentsData.assessments.mbti.totalCompleted > 0
                        ? `Type: ${assessmentsData.assessments.mbti.results[0]?.personalityType || "N/A"}`
                        : "Personality type assessment"}
                    </p>
                  </div>

                  {/* DISC */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">DISC</h4>
                      <Badge
                        className={
                          assessmentsData?.assessments.disc.totalCompleted && assessmentsData.assessments.disc.totalCompleted > 0
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }
                      >
                        {assessmentsData?.assessments.disc.totalCompleted && assessmentsData.assessments.disc.totalCompleted > 0
                          ? "Done"
                          : "Pending"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">Behavioral style assessment</p>
                  </div>

                  {/* Work Values */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Work Values</h4>
                      <Badge
                        className={
                          assessmentsData?.assessments.workValues.totalCompleted && assessmentsData.assessments.workValues.totalCompleted > 0
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }
                      >
                        {assessmentsData?.assessments.workValues.totalCompleted && assessmentsData.assessments.workValues.totalCompleted > 0
                          ? "Done"
                          : "Pending"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">Values and preferences assessment</p>
                  </div>

                  {/* Learning Styles */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Learning</h4>
                      <Badge
                        className={
                          assessmentsData?.assessments.learningStyles.totalCompleted && assessmentsData.assessments.learningStyles.totalCompleted > 0
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }
                      >
                        {assessmentsData?.assessments.learningStyles.totalCompleted && assessmentsData.assessments.learningStyles.totalCompleted > 0
                          ? "Done"
                          : "Pending"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">Learning style assessment</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assessments Tab */}
          <TabsContent value="assessments" className="space-y-6 mt-6">
            {/* RIASEC Assessment */}
            <Card className={assessmentsData?.assessments.riasec.totalCompleted && assessmentsData.assessments.riasec.totalCompleted > 0 ? "" : "opacity-60"}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>RIASEC Assessment</CardTitle>
                  <Badge
                    className={
                      assessmentsData?.assessments.riasec.totalCompleted && assessmentsData.assessments.riasec.totalCompleted > 0
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }
                  >
                    {assessmentsData?.assessments.riasec.totalCompleted && assessmentsData.assessments.riasec.totalCompleted > 0
                      ? "Completed"
                      : "Pending"}
                  </Badge>
                </div>
                {assessmentsData?.assessments.riasec.results[0]?.hollandCode && (
                  <CardDescription>Holland Code: {assessmentsData.assessments.riasec.results[0].hollandCode}</CardDescription>
                )}
              </CardHeader>
              {assessmentsData?.assessments.riasec.totalCompleted && assessmentsData.assessments.riasec.totalCompleted > 0 && assessmentsData.assessments.riasec.results[0] ? (
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {Object.entries(assessmentsData.assessments.riasec.results[0].scores || {}).map(([trait, score]) => (
                      <div key={trait} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{trait}</span>
                          <span>{typeof score === "number" ? `${score}/30` : "N/A"}</span>
                        </div>
                        <Progress value={typeof score === "number" ? (score / 30) * 100 : 0} className="h-2" />
                      </div>
                    ))}
                  </div>
                  {assessmentsData.assessments.riasec.results[0].traits && assessmentsData.assessments.riasec.results[0].traits.length > 0 && (
                    <div className="pt-3 border-t">
                      <p className="text-sm font-medium mb-2">Top Traits:</p>
                      <div className="flex flex-wrap gap-2">
                        {assessmentsData.assessments.riasec.results[0].traits.map((trait, idx) => (
                          <Badge key={idx} variant="secondary">
                            {trait}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {assessmentsData.assessments.riasec.results[0].recommendedCareers && assessmentsData.assessments.riasec.results[0].recommendedCareers.length > 0 && (
                    <div className="pt-3 border-t">
                      <p className="text-sm font-medium mb-2">Recommended Careers:</p>
                      <div className="flex flex-wrap gap-2">
                        {assessmentsData.assessments.riasec.results[0].recommendedCareers.slice(0, 5).map((career, idx) => (
                          <Badge key={idx} variant="outline" className="bg-blue-50 text-blue-700">
                            {career}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              ) : (
                <CardContent>
                  <p className="text-sm text-gray-500 text-center py-4">
                    {selectedChild?.firstName} hasn't completed the RIASEC assessment yet.
                  </p>
                </CardContent>
              )}
            </Card>

            {/* MBTI Assessment */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>MBTI Assessment</CardTitle>
                  <Badge
                    className={
                      assessmentsData?.assessments.mbti.totalCompleted && assessmentsData.assessments.mbti.totalCompleted > 0
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }
                  >
                    {assessmentsData?.assessments.mbti.totalCompleted && assessmentsData.assessments.mbti.totalCompleted > 0
                      ? "Completed"
                      : "Pending"}
                  </Badge>
                </div>
                {assessmentsData?.assessments.mbti.results[0]?.personalityType && (
                  <CardDescription>Personality Type: {assessmentsData.assessments.mbti.results[0].personalityType}</CardDescription>
                )}
              </CardHeader>
              {assessmentsData?.assessments.mbti.totalCompleted && assessmentsData.assessments.mbti.totalCompleted > 0 && assessmentsData.assessments.mbti.results[0] ? (
                <CardContent className="space-y-4">
                  {assessmentsData.assessments.mbti.results[0].traits && assessmentsData.assessments.mbti.results[0].traits.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Personality Traits:</p>
                      <div className="flex flex-wrap gap-2">
                        {assessmentsData.assessments.mbti.results[0].traits.map((trait, idx) => (
                          <Badge key={idx} variant="secondary">
                            {trait}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {assessmentsData.assessments.mbti.classDistribution && (
                    <div className="pt-3 border-t">
                      <p className="text-sm font-medium mb-2">Class Distribution:</p>
                      <div className="grid grid-cols-4 gap-2 text-sm">
                        {Object.entries(assessmentsData.assessments.mbti.classDistribution).map(([type, count]) => (
                          <div key={type} className="flex justify-between p-2 bg-gray-50 rounded">
                            <span>{type}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              ) : (
                <CardContent>
                  <p className="text-sm text-gray-500 text-center py-4">
                    {selectedChild?.firstName} hasn't completed the MBTI assessment yet.
                  </p>
                </CardContent>
              )}
            </Card>

            {/* DISC Assessment */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>DISC Assessment</CardTitle>
                  <Badge
                    className={
                      assessmentsData?.assessments.disc.totalCompleted && assessmentsData.assessments.disc.totalCompleted > 0
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }
                  >
                    {assessmentsData?.assessments.disc.totalCompleted && assessmentsData.assessments.disc.totalCompleted > 0
                      ? "Completed"
                      : "Pending"}
                  </Badge>
                </div>
                {assessmentsData?.assessments.disc.results[0]?.discType && (
                  <CardDescription>DISC Type: {assessmentsData.assessments.disc.results[0].discType}</CardDescription>
                )}
              </CardHeader>
              {assessmentsData?.assessments.disc.totalCompleted && assessmentsData.assessments.disc.totalCompleted > 0 && assessmentsData.assessments.disc.results[0] ? (
                <CardContent className="space-y-4">
                  {assessmentsData.assessments.disc.results[0].scores && (
                    <div className="grid grid-cols-4 gap-4">
                      {Object.entries(assessmentsData.assessments.disc.results[0].scores).map(([dimension, score]) => (
                        <div key={dimension} className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-2xl font-bold text-gray-900">{score}</p>
                          <p className="text-sm text-gray-600 uppercase">{dimension}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {assessmentsData.assessments.disc.results[0].traits && assessmentsData.assessments.disc.results[0].traits.length > 0 && (
                    <div className="pt-3 border-t">
                      <p className="text-sm font-medium mb-2">Behavioral Traits:</p>
                      <div className="flex flex-wrap gap-2">
                        {assessmentsData.assessments.disc.results[0].traits.map((trait, idx) => (
                          <Badge key={idx} variant="secondary">
                            {trait}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              ) : (
                <CardContent>
                  <p className="text-sm text-gray-500 text-center py-4">
                    {selectedChild?.firstName} hasn't completed the DISC assessment yet.
                  </p>
                </CardContent>
              )}
            </Card>

            {/* Work Values Assessment */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Work Values Assessment</CardTitle>
                  <Badge
                    className={
                      assessmentsData?.assessments.workValues.totalCompleted && assessmentsData.assessments.workValues.totalCompleted > 0
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }
                  >
                    {assessmentsData?.assessments.workValues.totalCompleted && assessmentsData.assessments.workValues.totalCompleted > 0
                      ? "Completed"
                      : "Pending"}
                  </Badge>
                </div>
              </CardHeader>
              {assessmentsData?.assessments.workValues.totalCompleted && assessmentsData.assessments.workValues.totalCompleted > 0 && assessmentsData.assessments.workValues.results[0] ? (
                <CardContent className="space-y-4">
                  {assessmentsData.assessments.workValues.results[0].topValues && assessmentsData.assessments.workValues.results[0].topValues.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Top Work Values:</p>
                      <div className="flex flex-wrap gap-2">
                        {assessmentsData.assessments.workValues.results[0].topValues.map((value, idx) => (
                          <Badge key={idx} variant="secondary">
                            {value}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              ) : (
                <CardContent>
                  <p className="text-sm text-gray-500 text-center py-4">
                    {selectedChild?.firstName} hasn't completed the Work Values assessment yet.
                  </p>
                </CardContent>
              )}
            </Card>

            {/* Learning Styles Assessment */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Learning Styles Assessment</CardTitle>
                  <Badge
                    className={
                      assessmentsData?.assessments.learningStyles.totalCompleted && assessmentsData.assessments.learningStyles.totalCompleted > 0
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }
                  >
                    {assessmentsData?.assessments.learningStyles.totalCompleted && assessmentsData.assessments.learningStyles.totalCompleted > 0
                      ? "Completed"
                      : "Pending"}
                  </Badge>
                </div>
                {assessmentsData?.assessments.learningStyles.results[0]?.dominantStyle && (
                  <CardDescription>Dominant Style: {assessmentsData.assessments.learningStyles.results[0].dominantStyle}</CardDescription>
                )}
              </CardHeader>
              {assessmentsData?.assessments.learningStyles.totalCompleted && assessmentsData.assessments.learningStyles.totalCompleted > 0 && assessmentsData.assessments.learningStyles.results[0] ? (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{assessmentsData.assessments.learningStyles.results[0].visualScore}</p>
                      <p className="text-sm text-gray-600">Visual</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{assessmentsData.assessments.learningStyles.results[0].auditoryScore}</p>
                      <p className="text-sm text-gray-600">Auditory</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{assessmentsData.assessments.learningStyles.results[0].kinestheticScore}</p>
                      <p className="text-sm text-gray-600">Kinesthetic</p>
                    </div>
                  </div>
                </CardContent>
              ) : (
                <CardContent>
                  <p className="text-sm text-gray-500 text-center py-4">
                    {selectedChild?.firstName} hasn't completed the Learning Styles assessment yet.
                  </p>
                </CardContent>
              )}
            </Card>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>All Career Matches</CardTitle>
                <CardDescription>
                  Complete list of careers recommended for {selectedChild?.firstName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {careerMatches.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {careerMatches.map((match) => (
                      <Card key={match.id} className="overflow-hidden hover:shadow-md transition-shadow">
                        <div className="p-4 border-b bg-gray-50">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-12 h-12 ${getMatchScoreColor(match.matchScore)} rounded-full flex items-center justify-center text-white font-bold`}
                              >
                                {match.matchScore}%
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{match.careerTitle}</h4>
                                {match.careerCategory && (
                                  <p className="text-xs text-gray-600">{match.careerCategory}</p>
                                )}
                              </div>
                            </div>
                            {match.isTopMatch && (
                              <Badge className="bg-yellow-100 text-yellow-700">
                                <Sparkles className="w-3 h-3 mr-1" />
                                Top Match
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{match.matchReason}</p>
                          {match.recommendationText && (
                            <p className="text-xs text-gray-500 mt-2 italic">{match.recommendationText}</p>
                          )}
                          <Badge className={getMatchScoreBgColor(match.matchScore)}>{match.assessmentType.toUpperCase()}</Badge>
                        </div>

                        {/* Career Details */}
                        <div className="p-4 space-y-3">
                          {/* Description */}
                          {match.careerDescription && (
                            <p className="text-sm text-gray-700 line-clamp-2">{match.careerDescription}</p>
                          )}

                          {/* Key Details Grid */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {match.careerEducationLevel && (
                              <div className="flex items-center gap-1">
                                <GraduationCap className="w-3 h-3 text-gray-500" />
                                <span className="text-gray-600">{match.careerEducationLevel}</span>
                              </div>
                            )}
                            {match.careerIndustry && (
                              <div className="flex items-center gap-1">
                                <Briefcase className="w-3 h-3 text-gray-500" />
                                <span className="text-gray-600">{match.careerIndustry}</span>
                              </div>
                            )}
                            {match.careerTypicalSalary && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3 text-gray-500" />
                                <span className="text-gray-600">{match.careerTypicalSalary}</span>
                              </div>
                            )}
                            {match.careerGrowthOutlook && (
                              <div className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3 text-gray-500" />
                                <span className="text-gray-600">{match.careerGrowthOutlook}</span>
                              </div>
                            )}
                          </div>

                          {/* Skills */}
                          {match.careerSkills && (
                            <div>
                              <p className="text-xs font-medium text-gray-700 mb-1">Required Skills:</p>
                              <div className="flex flex-wrap gap-1">
                                {match.careerSkills.split(",").slice(0, 4).map((skill, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {skill.trim()}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Bhutan Specific */}
                          {match.careerBhutanDemand && (
                            <div className="bg-orange-50 p-2 rounded text-xs">
                              <div className="flex items-center gap-1 font-medium text-orange-700 mb-1">
                                <MapPin className="w-3 h-3" />
                                Bhutan Demand
                              </div>
                              <p className="text-orange-600">{match.careerBhutanDemand}</p>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Briefcase className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="font-medium">No career matches found</p>
                    <p className="text-sm mt-1">
                      Career recommendations will appear after completing assessments
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Plan Tab */}
          <TabsContent value="plan" className="space-y-6 mt-6">
            {careerPlan ? (
              <>
                {/* Plan Overview */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Career Plan</CardTitle>
                        <CardDescription>Track {selectedChild?.firstName}'s career journey</CardDescription>
                      </div>
                      <Badge className={getStatusColor(careerPlan.status)}>
                        {careerPlan.status === "active" ? "Active" : careerPlan.status === "achieved" ? "Achieved" : "Changed"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Target Career</p>
                      <p className="text-xl font-bold text-gray-900">{careerPlan.targetCareer}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-1">Current Phase</p>
                      <Badge className="bg-orange-100 text-orange-700">
                        {getPhaseLabel(careerPlan.currentPhase)}
                      </Badge>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Overall Progress</span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-3" />
                    </div>
                  </CardContent>
                </Card>

                {/* Action Steps */}
                {careerPlan.actionSteps && careerPlan.actionSteps.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Action Steps</CardTitle>
                      <CardDescription>Tasks to achieve career goals</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {careerPlan.actionSteps.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 border rounded-lg">
                            {step.completed ? (
                              <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <p
                                className={step.completed ? "text-gray-500 line-through" : "text-gray-900"}
                              >
                                {step.step}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Deadline: {step.deadline ? new Date(step.deadline).toLocaleDateString() : "No deadline"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Milestones */}
                {careerPlan.milestones && careerPlan.milestones.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Milestones</CardTitle>
                      <CardDescription>Key achievements on the path to success</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {careerPlan.milestones.map((milestone, idx) => (
                          <div key={idx} className="flex items-center gap-4">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                milestone.completed ? "bg-green-500" : "bg-gray-300"
                              }`}
                            >
                              <Calendar className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <p
                                className={`font-medium ${milestone.completed ? "text-gray-500" : "text-gray-900"}`}
                              >
                                {milestone.title}
                              </p>
                              <p className="text-sm text-gray-500">
                                {milestone.deadline ? new Date(milestone.deadline).toLocaleDateString() : "No deadline"}
                              </p>
                            </div>
                            {milestone.completed && (
                              <Badge className="bg-green-100 text-green-700">Completed</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Goals */}
                <div className="grid md:grid-cols-2 gap-6">
                  {careerPlan.shortTermGoals && careerPlan.shortTermGoals.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Short-Term Goals</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {careerPlan.shortTermGoals.map((goal, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <ArrowRight className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                              <span className="text-sm text-gray-700">{goal}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {careerPlan.longTermGoals && careerPlan.longTermGoals.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Long-Term Goals</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {careerPlan.longTermGoals.map((goal, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <Target className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                              <span className="text-sm text-gray-700">{goal}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="py-16 text-center">
                  <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Career Plan Yet</h3>
                  <p className="text-gray-500 mb-6">
                    {selectedChild?.firstName} hasn't created a career plan yet.
                  </p>
                  <p className="text-sm text-gray-400">
                    A career counselor can help create a personalized career plan.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
