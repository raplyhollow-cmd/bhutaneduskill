/**
 * TEACHER ASSESSMENT RESULTS PAGE
 *
 * View detailed results for a specific assessment
 * Shows individual student results, class analytics, and insights
 */

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Users,
  TrendingUp,
  BarChart3,
  Download,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  Target,
  Brain,
  Lightbulb,
} from "lucide-react";
import Link from "next/link";

interface StudentResult {
  id: string;
  studentId: string;
  studentName: string;
  completedAt: string;
  result: {
    type?: string; // MBTI
    hollandCode?: string; // RIASEC
    primaryType?: string; // DISC
    topValues?: string[]; // Work Values
    scores?: Record<string, number>;
  };
  careerMatches?: number;
  status: "completed" | "pending" | "not_started";
}

interface AssessmentResults {
  id: string;
  title: string;
  type: string;
  className: string;
  totalStudents: number;
  completedStudents: number;
  pendingStudents: number;
  notStartedStudents: number;
  averageScore?: number;
  students: StudentResult[];
  classInsights?: {
    topCareerClusters: string[];
    commonStrengths: string[];
    areasForImprovement: string[];
    atRiskStudents: number;
  };
}

export default function TeacherAssessmentResultsPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.id as string;

  const [results, setResults] = useState<AssessmentResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "students" | "analytics">("overview");
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "pending" | "not_started">("all");

  useEffect(() => {
    async function fetchResults() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/teacher/assessments/${assessmentId}/results`);
        if (response.ok) {
          const data = await response.json();
          setResults(data);
        } else {
          console.error("Failed to fetch assessment results");
        }
      } catch (error) {
        console.error("Error fetching results:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchResults();
  }, [assessmentId]);

  const getAssessmentIcon = (type: string) => {
    switch (type) {
      case "riasec":
        return <Target className="w-5 h-5 text-blue-600" />;
      case "mbti":
        return <Brain className="w-5 h-5 text-purple-600" />;
      case "disc":
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case "work-values":
        return <Lightbulb className="w-5 h-5 text-amber-600" />;
      default:
        return <BarChart3 className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStudentStatusBadge = (status: StudentResult["status"]) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-600 gap-1"><CheckCircle className="w-3 h-3" />Completed</Badge>;
      case "pending":
        return <Badge className="bg-amber-600 gap-1"><Clock className="w-3 h-3" />Pending</Badge>;
      case "not_started":
        return <Badge variant="outline" className="gap-1"><AlertTriangle className="w-3 h-3" />Not Started</Badge>;
    }
  };

  const filteredStudents = results?.students.filter((s) => {
    if (filterStatus === "all") return true;
    return s.status === filterStatus;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading assessment results...</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-2">Results Not Found</h2>
        <p className="text-gray-600 mb-4">Could not load assessment results</p>
        <Button asChild>
          <Link href="/teacher/assessments">Back to Assessments</Link>
        </Button>
      </div>
    );
  }

  const completionRate = Math.round((results.completedStudents / results.totalStudents) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/teacher/assessments">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            {getAssessmentIcon(results.type)}
            <h1 className="text-2xl font-bold">{results.title}</h1>
            <Badge variant="outline">{results.type.toUpperCase()}</Badge>
          </div>
          <p className="text-gray-600 mt-1">{results.className}</p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600">Total Students</p>
            <p className="text-2xl font-bold">{results.totalStudents}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-green-600">{results.completedStudents}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-amber-600">{results.pendingStudents}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600">Not Started</p>
            <p className="text-2xl font-bold text-gray-600">{results.notStartedStudents}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600">Completion Rate</p>
            <p className="text-2xl font-bold text-blue-600">{completionRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Class Insights */}
          {results.classInsights && (
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Top Career Clusters</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {results.classInsights.topCareerClusters.map((cluster, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-medium">
                          {i + 1}
                        </span>
                        {cluster}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Common Strengths</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {results.classInsights.commonStrengths.map((strength, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Attention Needed</CardTitle>
                </CardHeader>
                <CardContent>
                  {results.classInsights.atRiskStudents > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm text-red-600 font-medium">
                        {results.classInsights.atRiskStudents} students at risk
                      </p>
                      <ul className="space-y-1">
                        {results.classInsights.areasForImprovement.map((area, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            {area}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">All students are on track!</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Completion Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Completion Progress</CardTitle>
              <CardDescription>Track which students have completed the assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Completion Rate</span>
                  <span className="font-semibold">{completionRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-blue-600 to-blue-500"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{results.completedStudents} completed</span>
                  <span>{results.pendingStudents} in progress</span>
                  <span>{results.notStartedStudents} not started</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-4">
                <Filter className="w-4 h-4 text-gray-600" />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={filterStatus === "all" ? "default" : "outline"}
                    onClick={() => setFilterStatus("all")}
                  >
                    All ({results.students.length})
                  </Button>
                  <Button
                    size="sm"
                    variant={filterStatus === "completed" ? "default" : "outline"}
                    onClick={() => setFilterStatus("completed")}
                  >
                    Completed ({results.completedStudents})
                  </Button>
                  <Button
                    size="sm"
                    variant={filterStatus === "pending" ? "default" : "outline"}
                    onClick={() => setFilterStatus("pending")}
                  >
                    Pending ({results.pendingStudents})
                  </Button>
                  <Button
                    size="sm"
                    variant={filterStatus === "not_started" ? "default" : "outline"}
                    onClick={() => setFilterStatus("not_started")}
                  >
                    Not Started ({results.notStartedStudents})
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Student List */}
          <div className="grid gap-3">
            {filteredStudents.map((student) => (
              <Card key={student.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                        {student.studentName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{student.studentName}</p>
                        {student.status === "completed" && (
                          <p className="text-sm text-gray-600">
                            {student.result.type && `MBTI: ${student.result.type}`}
                            {student.result.hollandCode && `RIASEC: ${student.result.hollandCode}`}
                            {student.result.primaryType && `DISC: ${student.result.primaryType}`}
                            {student.result.topValues && `Values: ${student.result.topValues.slice(0, 2).join(", ")}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {student.careerMatches && student.careerMatches > 0 && (
                        <Badge variant="outline">{student.careerMatches} careers</Badge>
                      )}
                      {getStudentStatusBadge(student.status)}
                      {student.status === "completed" && (
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Class Analytics</CardTitle>
              <CardDescription>Detailed breakdown of assessment results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-12 text-center text-gray-500">
                <div>
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Detailed analytics charts coming soon</p>
                  <p className="text-sm mt-1">This will include visual breakdowns of results</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}