/**
 * COUNSELOR - ASSESSMENT TOOLS
 *
 * Features:
 * - Administer career assessments
 * - View student assessment results
 * - Compare with peers
 * - Generate assessment reports
 * - Assessment history
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList,
  TrendingUp,
  Users,
  FileText,
  Download,
  Search,
  Filter,
  Eye,
  Plus,
  BarChart3,
  Target,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen,
  Brain,
  Lightbulb,
} from "lucide-react";
import Link from "next/link";

// Assessment types
const assessmentTypes = [
  {
    id: "riasec",
    name: "RIASEC Holland Code",
    description: "Discover career interests based on 6 personality types",
    duration: "15-20 min",
    icon: Target,
    color: "bg-purple-100 text-purple-600",
    questions: 60,
  },
  {
    id: "mbti",
    name: "MBTI Personality",
    description: "Understand personality type and career preferences",
    duration: "10-15 min",
    icon: Brain,
    color: "bg-blue-100 text-blue-600",
    questions: 50,
  },
  {
    id: "disc",
    name: "DISC Assessment",
    description: "Behavioral style and communication preferences",
    duration: "10-15 min",
    icon: Users,
    color: "bg-green-100 text-green-600",
    questions: 24,
  },
  {
    id: "work-values",
    name: "Work Values Inventory",
    description: "Identify what matters most in a career",
    duration: "10 min",
    icon: Lightbulb,
    color: "bg-yellow-100 text-yellow-600",
    questions: 30,
  },
  {
    id: "learning-style",
    name: "Learning Styles",
    description: "Discover preferred learning methods",
    duration: "5-10 min",
    icon: BookOpen,
    color: "bg-orange-100 text-orange-600",
    questions: 20,
  },
];

interface AssessmentResult {
  id: string;
  studentId: string;
  studentName: string;
  grade: number;
  school: string;
  assessmentType: string;
  assessmentName: string;
  completedAt: string;
  topResult: string;
  codes?: string[];
  scores?: Record<string, number>;
  status: string;
  topCareers?: string[] | null;
}

const typeOptions = ["All", "RIASEC", "MBTI", "DISC", "Work Values", "Learning Styles"];
const gradeOptions = ["All", "9", "10", "11", "12"];

export default function CounselorAssessmentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedGrade, setSelectedGrade] = useState("All");
  const [viewMode, setViewMode] = useState<"overview" | "results" | "compare">("overview");
  const [selectedResult, setSelectedResult] = useState<AssessmentResult | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCompleted: 0,
    completionRate: 0,
  });

  // Fetch assessment results from API
  useEffect(() => {
    async function loadResults() {
      try {
        const response = await fetch("/api/counselor/assessments/results");
        if (!response.ok) throw new Error("Failed to fetch assessment results");
        const data = await response.json();

        setResults(data.results || []);
        setStats({
          totalCompleted: data.totalCompleted || 0,
          completionRate: data.completionRate || 0,
        });
      } catch (error) {
        console.error("Error loading assessment results:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }

    loadResults();
  }, []);

  // Filter results
  const filteredResults = results.filter((result) => {
    const matchesSearch =
      result.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.assessmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.topResult.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      selectedType === "All" ||
      result.assessmentType.toLowerCase() === selectedType.toLowerCase();
    const matchesGrade =
      selectedGrade === "All" || result.grade.toString() === selectedGrade;

    return matchesSearch && matchesType && matchesGrade;
  });

  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
  const paginatedResults = filteredResults.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getAssessmentBadge = (type: string) => {
    const styles: Record<string, string> = {
      riasec: "bg-purple-100 text-purple-700 border-purple-200",
      mbti: "bg-blue-100 text-blue-700 border-blue-200",
      disc: "bg-green-100 text-green-700 border-green-200",
      "work-values": "bg-yellow-100 text-yellow-700 border-yellow-200",
      "learning-style": "bg-orange-100 text-orange-700 border-orange-200",
    };
    return styles[type] || styles.riasec;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assessment Tools</h1>
          <p className="text-gray-600 mt-1">
            Administer and review student career assessments
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export Data
          </Button>
          <Button
            className="gap-2"
            style={{
              background:
                "linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))",
            }}
            asChild
          >
            <Link href="/dashboard/assessment">
              <Plus className="w-4 h-4" />
              Administer Assessment
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, rgb(168 85 247 / 0.2), rgb(147 51 234 / 0.2))",
                }}
              >
                <ClipboardList
                  className="w-6 h-6"
                  style={{ color: "rgb(147 51 234)" }}
                />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {assessmentTypes.length}
                </p>
                <p className="text-sm text-gray-500">Assessment Types</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalCompleted}
                </p>
                <p className="text-sm text-gray-500">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.completionRate}%
                </p>
                <p className="text-sm text-gray-500">Completion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{results.length}</p>
                <p className="text-sm text-gray-500">Recent Results</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 border-b">
        <button
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            viewMode === "overview"
              ? "border-purple-500 text-purple-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setViewMode("overview")}
        >
          Assessment Types
        </button>
        <button
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            viewMode === "results"
              ? "border-purple-500 text-purple-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setViewMode("results")}
        >
          Student Results
        </button>
        <button
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            viewMode === "compare"
              ? "border-purple-500 text-purple-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setViewMode("compare")}
        >
          Compare & Analyze
        </button>
      </div>

      {/* Overview - Assessment Types */}
      {viewMode === "overview" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assessmentTypes.map((assessment) => {
            const Icon = assessment.icon;
            return (
              <Card key={assessment.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center ${assessment.color}`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{assessment.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {assessment.duration}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    {assessment.description}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {assessment.questions} questions
                    </span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={`/dashboard/assessment/${assessment.id}`}>View</Link>
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      style={{
                        background:
                          "linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))",
                      }}
                      asChild
                    >
                      <Link href={`/counselor/assessments?type=${assessment.id}`}>
                        Results
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Results View */}
      {viewMode === "results" && (
        <>
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search by student, assessment, or result..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  {typeOptions.map((type) => (
                    <option
                      key={type}
                      value={type.toLowerCase().replace(" ", "-")}
                    >
                      {type === "All" ? "All Assessments" : type}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  {gradeOptions.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade === "All" ? "All Grades" : `Grade ${grade}`}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Results List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-600 ml-2">Loading assessment results...</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ClipboardList className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Assessment Results Found
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery || selectedType !== "All" || selectedGrade !== "All"
                    ? "Try adjusting your filters to see more results."
                    : "Students haven't completed any assessments yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-3">
                {paginatedResults.map((result) => (
                  <Card
                    key={result.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedResult(result);
                      setShowDetailModal(true);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                          style={{
                            background:
                              "linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))",
                          }}
                        >
                          {result.studentName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">
                              {result.studentName}
                            </h3>
                            <span className="text-gray-500">
                              Grade {result.grade}
                            </span>
                            <Badge
                              className={getAssessmentBadge(result.assessmentType)}
                              variant="outline"
                            >
                              {result.assessmentName}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Target className="w-3 h-3" />
                              {result.topResult}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(result.completedAt).toLocaleDateString()}
                            </span>
                            {result.topCareers && result.topCareers[0] && (
                              <span className="flex items-center gap-1">
                                <Target className="w-3 h-3" />
                                {result.topCareers[0]}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(currentPage * itemsPerPage, filteredResults.length)} of{" "}
                    {filteredResults.length} results
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    {Array.from(
                      { length: Math.min(totalPages, 5) },
                      (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            style={
                              currentPage === pageNum
                                ? {
                                    background:
                                      "linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))",
                                  }
                                : {}
                            }
                          >
                            {pageNum}
                          </Button>
                        );
                      }
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Compare View */}
      {viewMode === "compare" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Analytics</CardTitle>
              <CardDescription>
                Compare results across students and assessment types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Analytics Coming Soon
                </h3>
                <p className="text-gray-600">
                  Comparative analytics and aggregate insights will be available once more
                  assessment data is collected.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Generate Report Card */}
          <Card
            className="border-purple-200"
            style={{
              background:
                "linear-gradient(to right, rgb(168 85 247 / 0.1), rgb(147 51 234 / 0.1))",
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Generate Assessment Report
                    </h3>
                    <p className="text-sm text-gray-600">
                      Create comprehensive reports for individual students or aggregate data
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    Student Report
                  </Button>
                  <Button
                    style={{
                      background:
                        "linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))",
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Aggregate Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Result Detail Modal */}
      {showDetailModal && selectedResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                    style={{
                      background:
                        "linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))",
                    }}
                  >
                    {selectedResult.studentName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <CardTitle>{selectedResult.studentName}</CardTitle>
                    <CardDescription>
                      Grade {selectedResult.grade} - {selectedResult.id}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetailModal(false)}
                >
                  <XIcon className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Badge
                  className={getAssessmentBadge(selectedResult.assessmentType)}
                  variant="outline"
                >
                  {selectedResult.assessmentName}
                </Badge>
                <Badge className="bg-green-100 text-green-700 border-green-200" variant="outline">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Completed
                </Badge>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-1">Top Result</h4>
                <p
                  className="text-lg font-semibold"
                  style={{ color: "rgb(147 51 234)" }}
                >
                  {selectedResult.topResult}
                </p>
              </div>

              {selectedResult.codes && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Codes</h4>
                  <div className="flex gap-2">
                    {selectedResult.codes.map((code, idx) => (
                      <Badge
                        key={idx}
                        className="bg-purple-100 text-purple-700 border-purple-200"
                        variant="outline"
                      >
                        {code}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedResult.scores && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    Detailed Scores
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(selectedResult.scores).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <span className="text-sm text-gray-600 capitalize">
                          {key.replace(/([A-Z])/g, " $1")}
                        </span>
                        <span
                          className="font-semibold"
                          style={{ color: "rgb(147 51 234)" }}
                        >
                          {value as number}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedResult.topCareers && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Recommended Careers
                  </h4>
                  <div className="space-y-2">
                    {selectedResult.topCareers.map(
                      (career, idx) =>
                        career && (
                          <div
                            key={idx}
                            className="flex items-center gap-2 p-2 border rounded-lg"
                          >
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${
                                idx === 0 ? "bg-purple-600" : "bg-gray-400"
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <span className="text-gray-700">{career}</span>
                          </div>
                        )
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">School</h4>
                  <p className="text-gray-600">{selectedResult.school}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Completed</h4>
                  <p className="text-gray-600">
                    {new Date(selectedResult.completedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
            <div className="border-t px-6 py-4 flex justify-between">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button
                style={{
                  background:
                    "linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))",
                }}
                asChild
              >
                <Link href={`/counselor/students/${selectedResult.studentId}`}>
                  <Users className="w-4 h-4 mr-2" />
                  View Student Profile
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
