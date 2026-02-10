/**
 * PARENT ASSESSMENTS PAGE
 *
 * Allows parents to view their child's assessment results, including:
 * - List of all assessments child has taken
 * - Results and scores
 * - Career matches from assessments
 * - Download assessment reports
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChildSelector, Child } from "@/components/parent/child-selector";
import {
  ClipboardList,
  Download,
  Star,
  TrendingUp,
  Briefcase,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  Award,
  Target,
  Brain,
  ChevronRight,
  Eye,
  Filter,
} from "lucide-react";
import Link from "next/link";

// Mock children data
const mockChildren: Child[] = [
  {
    id: "child1",
    name: "Tashi Dorji",
    firstName: "Tashi",
    lastName: "Dorji",
    grade: "Class 10",
    classGrade: 10,
    section: "A",
    school: "Yangchenphug HSS",
    assessmentCompleted: true,
    riasecCode: "AIR",
  },
  {
    id: "child2",
    name: "Pema Lhamo",
    firstName: "Pema",
    lastName: "Lhamo",
    grade: "Class 8",
    classGrade: 8,
    section: "B",
    school: "Motithang HSS",
    assessmentCompleted: true,
    riasecCode: "SCE",
  },
];

// Assessment types
const assessmentTypes = [
  {
    id: "riasec",
    name: "RIASEC Career Assessment",
    description: "Discover your career interests based on Holland's theory",
    icon: Target,
    color: "bg-blue-100 text-blue-700",
    duration: "15-20 min",
    questions: 60,
  },
  {
    id: "mbti",
    name: "MBTI Personality Test",
    description: "Understand your personality type",
    icon: Brain,
    color: "bg-purple-100 text-purple-700",
    duration: "10-15 min",
    questions: 50,
  },
  {
    id: "disc",
    name: "DISC Assessment",
    description: "Analyze your behavioral style",
    icon: TrendingUp,
    color: "bg-green-100 text-green-700",
    duration: "10-15 min",
    questions: 24,
  },
  {
    id: "spark",
    name: "SPARK Learning Assessment",
    description: "Identify your learning style preferences",
    icon: Star,
    color: "bg-yellow-100 text-yellow-700",
    duration: "10 min",
    questions: 20,
  },
  {
    id: "work-values",
    name: "Work Values Inventory",
    description: "Discover what matters most in your career",
    icon: Award,
    color: "bg-pink-100 text-pink-700",
    duration: "10-15 min",
    questions: 30,
  },
];

// Mock assessment results
const mockAssessmentResults: Record<string, Array<{
  id: string;
  type: string;
  typeName: string;
  date: string;
  status: "completed" | "in_progress" | "pending";
  result?: string;
  score?: number;
  careerMatches?: Array<{ career: string; matchScore: number }>;
  highlights?: string[];
}>> = {
  child1: [
    {
      id: "res1",
      type: "riasec",
      typeName: "RIASEC Career Assessment",
      date: "2025-01-15",
      status: "completed",
      result: "AIR - Artistic, Investigative, Realistic",
      score: 92,
      careerMatches: [
        { career: "Software Developer", matchScore: 92 },
        { career: "UX Designer", matchScore: 88 },
        { career: "Data Scientist", matchScore: 85 },
      ],
      highlights: [
        "Strong creative and analytical abilities",
        "Excellent fit for technology careers",
        "Good balance of technical and artistic interests",
      ],
    },
    {
      id: "res2",
      type: "mbti",
      typeName: "MBTI Personality Test",
      date: "2025-01-20",
      status: "completed",
      result: "INTJ - The Architect",
      score: null,
      highlights: [
        "Strategic and independent thinker",
        "Natural problem solver",
        "Prefers structured environments",
      ],
    },
    {
      id: "res3",
      type: "disc",
      typeName: "DISC Assessment",
      date: "2025-01-25",
      status: "completed",
      result: "Conscientiousness - High C",
      score: 85,
      highlights: [
        "Detail-oriented and analytical",
        "Values accuracy and quality",
        "Systematic approach to tasks",
      ],
    },
    {
      id: "res4",
      type: "spark",
      typeName: "SPARK Learning Assessment",
      date: "2025-02-01",
      status: "completed",
      result: "Visual Learner",
      highlights: [
        "Learns best through diagrams and charts",
        "Benefits from color-coded materials",
        "Prefers reading over listening",
      ],
    },
    {
      id: "res5",
      type: "work-values",
      typeName: "Work Values Inventory",
      date: "",
      status: "pending",
    },
  ],
  child2: [
    {
      id: "res6",
      type: "riasec",
      typeName: "RIASEC Career Assessment",
      date: "2025-01-18",
      status: "completed",
      result: "SCE - Social, Conventional, Enterprising",
      score: 88,
      careerMatches: [
        { career: "Teacher", matchScore: 90 },
        { career: "Counselor", matchScore: 85 },
        { career: "Nurse", matchScore: 82 },
      ],
      highlights: [
        "Strong interest in helping others",
        "Natural leadership abilities",
        "Well-suited for service careers",
      ],
    },
    {
      id: "res7",
      type: "mbti",
      typeName: "MBTI Personality Test",
      date: "",
      status: "pending",
    },
    {
      id: "res8",
      type: "disc",
      typeName: "DISC Assessment",
      date: "",
      status: "pending",
    },
  ],
};

type FilterType = "all" | "completed" | "pending" | "in_progress";
type ViewMode = "list" | "detail";

export default function ParentAssessmentsPage() {
  const [selectedChild, setSelectedChild] = useState<Child>(mockChildren[0]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedAssessment, setSelectedAssessment] = useState<string | null>(null);

  const assessmentResults = mockAssessmentResults[selectedChild.id] || [];

  const filteredResults = assessmentResults.filter((result) => {
    if (filter === "all") return true;
    return result.status === filter;
  });

  const completedCount = assessmentResults.filter((r) => r.status === "completed").length;
  const pendingCount = assessmentResults.filter((r) => r.status === "pending").length;
  const inProgressCount = assessmentResults.filter((r) => r.status === "in_progress").length;

  const parentPortalGradient = {
    background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)"
  };

  const getStatusBadge = (status: string) => {
    const config = {
      completed: { label: "Completed", color: "bg-green-100 text-green-700", icon: CheckCircle },
      pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700", icon: Clock },
      in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700", icon: TrendingUp },
    };
    const { label, color, icon: Icon } = config[status as keyof typeof config];
    return (
      <Badge className={color}>
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const getAssessmentIcon = (type: string) => {
    const found = assessmentTypes.find((t) => t.id === type);
    return found?.icon || ClipboardList;
  };

  const getAssessmentColor = (type: string) => {
    const found = assessmentTypes.find((t) => t.id === type);
    return found?.color || "bg-gray-100 text-gray-700";
  };

  const selectedResult = selectedAssessment
    ? assessmentResults.find((r) => r.id === selectedAssessment)
    : null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Assessment Results
          </h1>
          <p className="text-gray-600">
            View {selectedChild.name}&apos;s assessment results and career matches
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Download All Reports
          </Button>
        </div>
      </div>

      {/* Child Selector */}
      <ChildSelector
        children={mockChildren}
        selectedChildId={selectedChild.id}
        onChildChange={setSelectedChild}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <ClipboardList className="w-8 h-8 mx-auto mb-2" style={{ color: "rgb(107 114 128)" }} />
              <p className="text-2xl font-bold text-gray-900">{assessmentResults.length}</p>
              <p className="text-sm text-gray-500">Total Assessments</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold text-green-600">{completedCount}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
              <p className="text-sm text-gray-500">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["all", "completed", "pending", "in_progress"] as FilterType[]).map((filterType) => (
                <Button
                  key={filterType}
                  variant={filter === filterType ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(filterType)}
                  style={filter === filterType ? parentPortalGradient : {}}
                  className="min-h-[44px]"
                >
                  {filterType === "all" && "All"}
                  {filterType === "completed" && "Completed"}
                  {filterType === "pending" && "Pending"}
                  {filterType === "in_progress" && "In Progress"}
                  {filterType !== "all" && (
                    <span className="ml-1">
                      (
                      {filterType === "completed"
                        ? completedCount
                        : filterType === "pending"
                        ? pendingCount
                        : inProgressCount}
                      )
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Assessment List */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="font-semibold text-gray-900 mb-3">Assessments</h3>
          {filteredResults.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-8">
                <ClipboardList className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">No assessments found</p>
              </CardContent>
            </Card>
          ) : (
            filteredResults.map((result) => {
              const Icon = getAssessmentIcon(result.type);
              return (
                <Card
                  key={result.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedAssessment === result.id ? "ring-2" : ""
                  }`}
                  style={selectedAssessment === result.id ? { ringColor: "rgb(107 114 128)" } : {}}
                  onClick={() => setSelectedAssessment(result.id)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getAssessmentColor(result.type)}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{result.typeName}</h4>
                        {result.date && (
                          <p className="text-xs text-gray-500">
                            {new Date(result.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        )}
                        <div className="mt-1">{getStatusBadge(result.status)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Assessment Detail */}
        <div className="lg:col-span-2">
          {selectedResult ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle>{selectedResult.typeName}</CardTitle>
                      {getStatusBadge(selectedResult.status)}
                    </div>
                    {selectedResult.date && (
                      <CardDescription>
                        Completed on{" "}
                        {new Date(selectedResult.date).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </CardDescription>
                    )}
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    Download Report
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Result */}
                {selectedResult.result && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Result</h4>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-lg font-medium" style={{ color: "rgb(107 114 128)" }}>
                        {selectedResult.result}
                      </p>
                    </div>
                  </div>
                )}

                {/* Score */}
                {selectedResult.score !== undefined && selectedResult.score !== null && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Score</h4>
                    <div className="flex items-center gap-4">
                      <div className="text-4xl font-bold" style={{ color: "rgb(107 114 128)" }}>
                        {selectedResult.score}%
                      </div>
                      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${selectedResult.score}%`,
                            background: "linear-gradient(90deg, rgb(107 114 128), rgb(75 85 99))"
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Highlights */}
                {selectedResult.highlights && selectedResult.highlights.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Key Highlights</h4>
                    <div className="space-y-2">
                      {selectedResult.highlights.map((highlight, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <Star className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-gray-700">{highlight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Career Matches */}
                {selectedResult.careerMatches && selectedResult.careerMatches.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Top Career Matches from this Assessment
                    </h4>
                    <div className="space-y-3">
                      {selectedResult.careerMatches.map((match) => (
                        <div
                          key={match.career}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Briefcase className="w-5 h-5 text-gray-400" />
                            <span className="font-medium">{match.career}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-blue-100 text-blue-700">
                              {match.matchScore}% match
                            </Badge>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/dashboard/careers/${match.career.toLowerCase().replace(/\s+/g, "-")}`}>
                                <Eye className="w-4 h-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" className="flex-1" asChild>
                    <Link href={`/dashboard/assessment/${selectedResult.type}`}>
                      Retake Assessment
                    </Link>
                  </Button>
                  <Button variant="outline" className="flex-1 gap-2">
                    <Download className="w-4 h-4" />
                    Download PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-12 text-center">
                <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Select an Assessment
                </h3>
                <p className="text-gray-500 mb-6">
                  Choose an assessment from the list to view detailed results
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Available Assessments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" style={{ color: "rgb(107 114 128)" }} />
            Available Assessments
          </CardTitle>
          <CardDescription>
            Assessments {selectedChild.name} hasn&apos;t taken yet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assessmentTypes
              .filter((type) => !assessmentResults.some((r) => r.type === type.id && r.status === "completed"))
              .map((assessment) => {
                const Icon = assessment.icon;
                return (
                  <Card key={assessment.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3 mb-4">
                        <div className={`p-3 rounded-lg ${assessment.color}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{assessment.name}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {assessment.questions} questions · {assessment.duration}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">{assessment.description}</p>
                      <Button className="w-full" variant="outline" asChild>
                        <Link href={`/dashboard/assessment/${assessment.id}`}>
                          Start Assessment
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
          {assessmentTypes.filter((type) =>
            !assessmentResults.some((r) => r.type === type.id && r.status === "completed")
          ).length === 0 && (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-2" />
              <p className="text-gray-500">
                {selectedChild.name} has completed all available assessments!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Back Navigation */}
      <div className="pt-4">
        <Button variant="outline" asChild>
          <Link href="/parent">
            Back to Parent Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
