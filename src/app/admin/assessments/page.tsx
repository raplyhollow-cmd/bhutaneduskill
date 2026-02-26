"use client";

import { logger } from "@/lib/logger";
/**
 * PLATFORM ADMIN - ASSSSMENT MANAGEMENT
 *
 * Multi-section assessment management page for platform administrators.
 * Features: Assessment Types, Assessments, Results tabs with full CRUD operations.
 */


import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ClipboardList,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Users,
  BarChart3,
  ChevronDown,
  ArrowUpDown,
  Download,
  HelpCircle,
} from "lucide-react";

import type { DbAssessmentTypeEntity } from "@/types";

type AssessmentType = DbAssessmentTypeEntity;

import type { DbAssessmentResult, AssessmentStats } from "@/types";

type AssessmentResult = DbAssessmentResult;

import {
  getAssessmentTypes,
  getAssessments,
  getAssessmentResults,
  getAssessmentStats,
  deleteAssessmentType,
  deleteAssessment,
} from "@/app/admin/assessments/actions";
import { AddAssessmentTypeModal } from "@/components/admin/add-assessment-type-modal";
import { EditAssessmentTypeModal } from "@/components/admin/edit-assessment-type-modal";
import { QuestionsModal } from "@/components/admin/questions-modal";

type TabType = "types" | "assessments" | "results";

const categoryColors: Record<string, string> = {
  aptitude: "bg-blue-100 text-blue-700",
  personality: "bg-purple-100 text-purple-700",
  career_interest: "bg-green-100 text-green-700",
  skill: "bg-yellow-100 text-yellow-700",
  psychological: "bg-red-100 text-red-700",
  learning_style: "bg-indigo-100 text-indigo-700",
  work_values: "bg-pink-100 text-pink-700",
};

import type { LucideIcon } from "lucide-react";

const statusConfig: Record<string, { icon: LucideIcon; color: string; bgColor: string; label: string }> = {
  pending: { icon: Clock, color: "text-yellow-600", bgColor: "bg-yellow-100", label: "Pending" },
  submitted: { icon: FileText, color: "text-blue-600", bgColor: "bg-blue-100", label: "Submitted" },
  graded: { icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-100", label: "Graded" },
  returned: { icon: CheckCircle, color: "text-purple-600", bgColor: "bg-purple-100", label: "Returned" },
  draft: { icon: FileText, color: "text-gray-600", bgColor: "bg-gray-100", label: "Draft" },
  published: { icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-100", label: "Published" },
  archived: { icon: XCircle, color: "text-red-600", bgColor: "bg-red-100", label: "Archived" },
};

export default function AdminAssessmentsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("types");

  // Assessment Types state
  const [assessmentTypes, setAssessmentTypes] = useState<AssessmentType[]>([]);
  const [filteredTypes, setFilteredTypes] = useState<AssessmentType[]>([]);
  const [typesLoading, setTypesLoading] = useState(true);
  const [typesSearchQuery, setTypesSearchQuery] = useState("");
  const [typesCategoryFilter, setTypesCategoryFilter] = useState("all");
  const [isAddTypeModalOpen, setIsAddTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<AssessmentType | null>(null);
  const [showEditTypeDialog, setShowEditTypeDialog] = useState(false);
  const [showDeleteTypeDialog, setShowDeleteTypeDialog] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<string | null>(null);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [selectedTypeForQuestions, setSelectedTypeForQuestions] = useState<AssessmentType | null>(null);

  // Assessments state
  const [assessments, setAssessments] = useState<AssessmentResult[]>([]);
  const [filteredAssessments, setFilteredAssessments] = useState<AssessmentResult[]>([]);
  const [assessmentsLoading, setAssessmentsLoading] = useState(true);
  const [assessmentsSearchQuery, setAssessmentsSearchQuery] = useState("");
  const [assessmentsStatusFilter, setAssessmentsStatusFilter] = useState("all");

  // Results state
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<AssessmentResult[]>([]);
  const [resultsLoading, setResultsLoading] = useState(true);
  const [resultsStatusFilter, setResultsStatusFilter] = useState("all");

  // Stats state
  const [stats, setStats] = useState<AssessmentStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Fetch data on mount
  useEffect(() => {
    fetchAssessmentTypes();
    fetchAssessments();
    fetchResults();
    fetchStats();
  }, []);

  // Filter assessment types
  useEffect(() => {
    let filtered = [...assessmentTypes];

    if (typesSearchQuery) {
      filtered = filtered.filter(
        (type) =>
          type.name?.toLowerCase().includes(typesSearchQuery.toLowerCase()) ||
          type.description?.toLowerCase().includes(typesSearchQuery.toLowerCase())
      );
    }

    if (typesCategoryFilter !== "all") {
      filtered = filtered.filter((type) => type.category === typesCategoryFilter);
    }

    setFilteredTypes(filtered);
  }, [assessmentTypes, typesSearchQuery, typesCategoryFilter]);

  // Filter assessments
  useEffect(() => {
    let filtered = [...assessments];

    if (assessmentsSearchQuery) {
      filtered = filtered.filter(
        (assessment) =>
          assessment.title?.toLowerCase().includes(assessmentsSearchQuery.toLowerCase()) ||
          assessment.description?.toLowerCase().includes(assessmentsSearchQuery.toLowerCase())
      );
    }

    if (assessmentsStatusFilter !== "all") {
      filtered = filtered.filter((assessment) => assessment.status === assessmentsStatusFilter);
    }

    setFilteredAssessments(filtered);
  }, [assessments, assessmentsSearchQuery, assessmentsStatusFilter]);

  // Filter results
  useEffect(() => {
    let filtered = [...results];

    if (resultsStatusFilter !== "all") {
      filtered = filtered.filter((result) => result.submission?.status === resultsStatusFilter);
    }

    setFilteredResults(filtered);
  }, [results, resultsStatusFilter]);

  const fetchAssessmentTypes = async () => {
    setTypesLoading(true);
    try {
      const data = await getAssessmentTypes();
      setAssessmentTypes(data);
      setFilteredTypes(data);
    } catch (error) {
      logger.error("Failed to fetch assessment types:", error);
    } finally {
      setTypesLoading(false);
    }
  };

  const fetchAssessments = async () => {
    setAssessmentsLoading(true);
    try {
      const data = await getAssessments();
      setAssessments(data);
      setFilteredAssessments(data);
    } catch (error) {
      logger.error("Failed to fetch assessments:", error);
    } finally {
      setAssessmentsLoading(false);
    }
  };

  const fetchResults = async () => {
    setResultsLoading(true);
    try {
      const data = await getAssessmentResults();
      setResults(data);
      setFilteredResults(data);
    } catch (error) {
      logger.error("Failed to fetch results:", error);
    } finally {
      setResultsLoading(false);
    }
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const data = await getAssessmentStats();
      setStats(data);
    } catch (error) {
      logger.error("Failed to fetch stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleDeleteType = async (id: string) => {
    try {
      await deleteAssessmentType(id);
      setAssessmentTypes(assessmentTypes.filter((t) => t.id !== id));
      setShowDeleteTypeDialog(false);
      setTypeToDelete(null);
      fetchStats();
    } catch (error) {
      logger.error("Failed to delete assessment type:", error);
      alert("Failed to delete assessment type. Please try again.");
    }
  };

  const handleDeleteAssessment = async (id: string) => {
    try {
      await deleteAssessment(id);
      setAssessments(assessments.filter((a) => a.id !== id));
      fetchStats();
    } catch (error) {
      logger.error("Failed to delete assessment:", error);
      alert("Failed to delete assessment. Please try again.");
    }
  };

  // Calculate category counts
  const categoryCounts = assessmentTypes.reduce((acc, type) => {
    const cat = type.category || "other";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Assessment Management</h1>
          <p className="text-gray-600">
            Manage assessment types, assessments, and view student results
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab("types")}
            className={`pb-4 px-2 border-b-2 transition-colors ${
              activeTab === "types"
                ? "border-pink-500 text-pink-600 font-medium"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Assessment Types
          </button>
          <button
            onClick={() => setActiveTab("assessments")}
            className={`pb-4 px-2 border-b-2 transition-colors ${
              activeTab === "assessments"
                ? "border-pink-500 text-pink-600 font-medium"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Assessments
          </button>
          <button
            onClick={() => setActiveTab("results")}
            className={`pb-4 px-2 border-b-2 transition-colors ${
              activeTab === "results"
                ? "border-pink-500 text-pink-600 font-medium"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Results
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Assessment Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {stats?.assessmentTypes?.total || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.assessmentTypes?.active || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {stats?.assessments?.total || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.assessments?.active || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {stats?.submissions?.total || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.submissions?.submitted || 0} submitted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Graded
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats?.submissions?.graded || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.submissions?.pending || 0} pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Assessment Types Tab */}
      {activeTab === "types" && (
        <>
          {/* Search and Filter */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search assessment types..."
                    value={typesSearchQuery}
                    onChange={(e) => setTypesSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 min-h-[44px] rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                  />
                </div>
                <select
                  value={typesCategoryFilter}
                  onChange={(e) => setTypesCategoryFilter(e.target.value)}
                  className="px-4 py-3 min-h-[44px] rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none bg-white"
                >
                  <option value="all">All Categories</option>
                  <option value="aptitude">Aptitude</option>
                  <option value="personality">Personality</option>
                  <option value="career_interest">Career Interest</option>
                  <option value="skill">Skill</option>
                  <option value="psychological">Psychological</option>
                  <option value="learning_style">Learning Style</option>
                  <option value="work_values">Work Values</option>
                </select>
                <Button
                  variant="outline"
                  className="min-h-[44px]"
                  onClick={() => {
                    setTypesSearchQuery("");
                    setTypesCategoryFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
                <Button
                  style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
                  className="text-white min-h-[44px]"
                  onClick={() => setIsAddTypeModalOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Type
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Assessment Types Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Assessment Types</CardTitle>
                  <CardDescription>
                    {filteredTypes.length} assessment types
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {typesLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block w-8 h-8 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
                  <p className="text-gray-500 mt-4">Loading assessment types...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Name</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Category</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Audience</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Grade</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Duration</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Questions</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Status</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTypes.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-12">
                            <div className="flex flex-col items-center gap-4">
                              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                                <ClipboardList className="w-8 h-8 text-gray-400" />
                              </div>
                              <div>
                                <p className="text-gray-900 font-medium">No assessment types found</p>
                                <p className="text-gray-500 text-sm">Try adjusting your filters or add a new assessment type</p>
                              </div>
                              <Button
                                style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
                                className="text-white"
                                onClick={() => setIsAddTypeModalOpen(true)}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add First Type
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredTypes.map((type) => (
                          <tr key={type.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-4 px-4">
                              <div>
                                <div className="font-medium text-gray-900">{type.name}</div>
                                <div className="text-sm text-gray-500 line-clamp-1 max-w-xs">
                                  {type.description}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              {type.category ? (
                                <Badge
                                  variant="outline"
                                  className={`${categoryColors[type.category] || "bg-gray-100 text-gray-700"} border-0 text-xs`}
                                >
                                  {type.category.replace("_", " ")}
                                </Badge>
                              ) : (
                                <span className="text-sm text-gray-400">N/A</span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-sm text-gray-600 capitalize">
                                {type.targetAudience || "All"}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-sm text-gray-600">
                                {type.targetGrade ? `Class ${type.targetGrade}` : "All"}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-sm text-gray-600">
                                {type.duration ? `${type.duration} min` : "N/A"}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-sm text-gray-600">
                                {type.totalQuestions || 0}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              {type.isActive ? (
                                <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">
                                  Active
                                </Badge>
                              ) : (
                                <Badge className="bg-gray-50 text-gray-600 border-gray-200 text-xs">
                                  Inactive
                                </Badge>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                                  title="Manage questions"
                                  onClick={() => {
                                    setSelectedTypeForQuestions(type);
                                    setShowQuestionsModal(true);
                                  }}
                                >
                                  <HelpCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-pink-50 hover:text-pink-600"
                                  title="Edit type"
                                  onClick={() => {
                                    setEditingType(type);
                                    setShowEditTypeDialog(true);
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                                  title="Delete type"
                                  onClick={() => {
                                    setTypeToDelete(type.id);
                                    setShowDeleteTypeDialog(true);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* By Category Stats */}
          <div className="grid lg:grid-cols-4 gap-4">
            {Object.entries(categoryCounts).map(([category, count]) => (
              <Card key={category}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 capitalize">
                      {category.replace("_", " ")}
                    </span>
                    <Badge
                      variant="outline"
                      className={`${categoryColors[category] || "bg-gray-100 text-gray-700"} border-0 text-xs`}
                    >
                      {String(count)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Assessments Tab */}
      {activeTab === "assessments" && (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search assessments..."
                    value={assessmentsSearchQuery}
                    onChange={(e) => setAssessmentsSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 min-h-[44px] rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                  />
                </div>
                <select
                  value={assessmentsStatusFilter}
                  onChange={(e) => setAssessmentsStatusFilter(e.target.value)}
                  className="px-4 py-3 min-h-[44px] rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
                <Button
                  variant="outline"
                  className="min-h-[44px]"
                  onClick={() => {
                    setAssessmentsSearchQuery("");
                    setAssessmentsStatusFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Assessments</CardTitle>
                  <CardDescription>
                    {filteredAssessments.length} assessments
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {assessmentsLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block w-8 h-8 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
                  <p className="text-gray-500 mt-4">Loading assessments...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Title</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Type</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Due Date</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Points</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Status</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAssessments.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-12">
                            <div className="flex flex-col items-center gap-4">
                              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                                <FileText className="w-8 h-8 text-gray-400" />
                              </div>
                              <div>
                                <p className="text-gray-900 font-medium">No assessments found</p>
                                <p className="text-gray-500 text-sm">Create your first assessment</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredAssessments.map((assessment) => {
                          const statusInfo = statusConfig[assessment.status] || statusConfig.draft;
                          const StatusIcon = statusInfo.icon;

                          return (
                            <tr key={assessment.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-4 px-4">
                                <div>
                                  <div className="font-medium text-gray-900">{assessment.title}</div>
                                  <div className="text-sm text-gray-500 line-clamp-1 max-w-xs">
                                    {assessment.description}
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <span className="text-sm text-gray-600 capitalize">
                                  {assessment.type || "N/A"}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <span className="text-sm text-gray-600">
                                  {assessment.dueDate ? new Date(assessment.dueDate).toLocaleDateString() : "N/A"}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <span className="text-sm text-gray-600">
                                  {assessment.totalPoints || 100} pts
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <Badge
                                  variant="outline"
                                  className={`${statusInfo.bgColor} ${statusInfo.color} border-0 text-xs`}
                                >
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {statusInfo.label}
                                </Badge>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                                    title="Delete assessment"
                                    onClick={() => handleDeleteAssessment(assessment.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Results Tab */}
      {activeTab === "results" && (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <select
                  value={resultsStatusFilter}
                  onChange={(e) => setResultsStatusFilter(e.target.value)}
                  className="px-4 py-3 min-h-[44px] rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="submitted">Submitted</option>
                  <option value="graded">Graded</option>
                  <option value="returned">Returned</option>
                </select>
                <Button
                  variant="outline"
                  className="min-h-[44px]"
                  onClick={() => setResultsStatusFilter("all")}
                >
                  Clear Filters
                </Button>
                <Button variant="outline" className="min-h-[44px]">
                  <Download className="w-4 h-4 mr-2" />
                  Export Results
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Student Submissions</CardTitle>
                  <CardDescription>
                    {filteredResults.length} submissions
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {resultsLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block w-8 h-8 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
                  <p className="text-gray-500 mt-4">Loading results...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Student</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Assessment</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Submitted</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Score</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Status</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredResults.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-12">
                            <div className="flex flex-col items-center gap-4">
                              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                                <BarChart3 className="w-8 h-8 text-gray-400" />
                              </div>
                              <div>
                                <p className="text-gray-900 font-medium">No submissions found</p>
                                <p className="text-gray-500 text-sm">Try adjusting your filters</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredResults.map((result) => {
                          const statusInfo = statusConfig[result.submission?.status] || statusConfig.pending;
                          const StatusIcon = statusInfo.icon;

                          return (
                            <tr key={result.submission?.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-4 px-4">
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {result.user?.firstName && result.user?.lastName
                                      ? `${result.user.firstName} ${result.user.lastName}`
                                      : result.user?.name || "Unknown"}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {result.user?.email || "No email"}
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <span className="text-sm text-gray-600">
                                  {result.assessment?.title || "N/A"}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <span className="text-sm text-gray-600">
                                  {result.submission?.submittedAt
                                    ? new Date(result.submission.submittedAt).toLocaleDateString()
                                    : "Not submitted"}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <span className="text-sm text-gray-600">
                                  {result.submission?.score !== null && result.submission?.score !== undefined
                                    ? `${result.submission.score}%`
                                    : "N/A"}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <Badge
                                  variant="outline"
                                  className={`${statusInfo.bgColor} ${statusInfo.color} border-0 text-xs`}
                                >
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {statusInfo.label}
                                </Badge>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-pink-50 hover:text-pink-600"
                                    title="View details"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteTypeDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Assessment Type</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this assessment type? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteTypeDialog(false);
                  setTypeToDelete(null);
                }}
                className="min-h-[44px]"
              >
                Cancel
              </Button>
              <Button
                style={{ background: "linear-gradient(135deg, rgb(239 68 68) 0%, rgb(220 38 38) 100%)" }}
                className="text-white min-h-[44px]"
                onClick={() => typeToDelete && handleDeleteType(typeToDelete)}
              >
                Delete Type
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Assessment Type Modal */}
      <AddAssessmentTypeModal
        open={isAddTypeModalOpen}
        onClose={() => setIsAddTypeModalOpen(false)}
        onSuccess={() => {
          fetchAssessmentTypes();
          fetchStats();
        }}
      />

      {/* Edit Assessment Type Modal */}
      <EditAssessmentTypeModal
        open={showEditTypeDialog}
        onClose={() => {
          setShowEditTypeDialog(false);
          setEditingType(null);
        }}
        onSuccess={() => {
          fetchAssessmentTypes();
          fetchStats();
        }}
        assessmentType={editingType}
      />

      {/* Questions Modal */}
      <QuestionsModal
        open={showQuestionsModal}
        onClose={() => {
          setShowQuestionsModal(false);
          setSelectedTypeForQuestions(null);
        }}
        assessmentType={selectedTypeForQuestions}
        onSuccess={() => {
          fetchAssessmentTypes();
          fetchStats();
        }}
      />
    </div>
  );
}
