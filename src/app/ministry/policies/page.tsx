"use client";

/**
 * MINISTRY OF EDUCATION - EDUCATION POLICIES PAGE
 *
 * Create and manage national education policies including:
 * - Assessment Standards
 * - Curriculum Guidelines
 * - Academic Calendar
 * - Career Education Standards
 * - Curriculum Standards (per subject/grade)
 *
 * Uses real API data - no mock data
 */

import { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Search,
  Filter,
  BookOpen,
  GraduationCap,
  Calendar,
  CheckCircle,
  Clock,
  Archive,
  Edit,
  Trash2,
  Eye,
  Download,
  X,
  Globe,
  Building2,
  Users,
  Award,
  TrendingUp,
  Upload,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FullScreenModal,
  FullScreenModalContent,
  FullScreenModalDescription,
  FullScreenModalFooter,
  FullScreenModalHeader,
  FullScreenModalTitle,
  FullScreenModalClose,
} from "@/components/ui/full-screen-modal";

// ============================================================================
// TYPES
// ============================================================================

type PolicyCategory = "all" | "assessment" | "curriculum" | "calendar" | "career" | "other";
type PolicyStatus = "active" | "draft" | "archived";
type PolicyScope = "national" | "regional" | "school";

interface Policy {
  id: string;
  title: string;
  category: PolicyCategory;
  description: string;
  effectiveDate: string;
  status: PolicyStatus;
  scope: PolicyScope;
  attachment?: string;
  createdAt: string;
}

interface CurriculumStandard {
  id: string;
  subject: string;
  grade: string;
  hoursRequired: number;
  topics: Array<{ name: string; hours: number }>;
  practicalRatio: number;
  effectiveFrom: string;
  effectiveTo?: string;
  status: "active" | "draft";
  createdAt: string;
}

const SUBJECTS = [
  "Mathematics",
  "English",
  "Dzongkha",
  "Science",
  "Social Studies",
  "Information Technology",
  "Physical Education",
  "Art & Craft",
  "Music",
];

const GRADES = ["PP", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MinistryPoliciesPage() {
  const [activeTab, setActiveTab] = useState<"policies" | "curriculum">("policies");
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [curriculumStandards, setCurriculumStandards] = useState<CurriculumStandard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [policiesRes, curriculumRes] = await Promise.all([
          fetch("/api/ministry/policies"),
          fetch("/api/ministry/curriculum-standards"),
        ]);

        if (policiesRes.ok) {
          const data = await policiesRes.json();
          setPolicies(data.policies || []);
        }

        if (curriculumRes.ok) {
          const data = await curriculumRes.json();
          setCurriculumStandards(data.standards || []);
        }

        if (!policiesRes.ok && !curriculumRes.ok) {
          setError("Failed to load policies and curriculum data");
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Policy filters
  const [policyCategory, setPolicyCategory] = useState<PolicyCategory>("all");
  const [policyStatus, setPolicyStatus] = useState<string>("all");
  const [policySearch, setPolicySearch] = useState("");

  // Curriculum filters
  const [curriculumSubject, setCurriculumSubject] = useState<string>("all");
  const [curriculumGrade, setCurriculumGrade] = useState<string>("all");

  // Modals - state for create/edit modals
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showCurriculumModal, setShowCurriculumModal] = useState(false);
  const [viewingPolicy, setViewingPolicy] = useState<Policy | null>(null);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [editingStandard, setEditingStandard] = useState<CurriculumStandard | null>(null);

  // New policy form state
  const [newPolicy, setNewPolicy] = useState({
    title: "",
    category: "assessment" as PolicyCategory,
    description: "",
    effectiveDate: "",
    status: "draft" as PolicyStatus,
    scope: "national" as PolicyScope,
  });

  // New curriculum standard form state
  const [newStandard, setNewStandard] = useState({
    subject: "Mathematics",
    grade: "10",
    hoursRequired: 40,
    topics: [{ name: "", hours: 1 }],
    practicalRatio: 50,
    effectiveFrom: "",
    effectiveTo: "",
  });

  // Category display labels and badges
  const categoryLabels: Record<PolicyCategory, string> = {
    all: "All Policies",
    assessment: "Assessment Standards",
    curriculum: "Curriculum Guidelines",
    calendar: "Academic Calendar",
    career: "Career Education",
    other: "Other",
  };

  const categoryBadges: Record<PolicyCategory, string> = {
    all: "bg-gray-50 text-gray-700 border-gray-200",
    assessment: "bg-blue-50 text-blue-700 border-blue-200",
    curriculum: "bg-green-50 text-green-700 border-green-200",
    calendar: "bg-purple-50 text-purple-700 border-purple-200",
    career: "bg-orange-50 text-orange-700 border-orange-200",
    other: "bg-gray-50 text-gray-700 border-gray-200",
  };

  const categoryIcons: Record<PolicyCategory, React.ReactNode> = {
    all: <FileText className="w-4 h-4" />,
    assessment: <Award className="w-4 h-4" />,
    curriculum: <BookOpen className="w-4 h-4" />,
    calendar: <Calendar className="w-4 h-4" />,
    career: <GraduationCap className="w-4 h-4" />,
    other: <FileText className="w-4 h-4" />,
  };

  const statusBadges: Record<PolicyStatus, string> = {
    active: "bg-green-50 text-green-700 border-green-200",
    draft: "bg-yellow-50 text-yellow-700 border-yellow-200",
    archived: "bg-gray-50 text-gray-700 border-gray-200",
  };

  const statusIcons: Record<PolicyStatus, React.ReactNode> = {
    active: <CheckCircle className="w-4 h-4" />,
    draft: <Clock className="w-4 h-4" />,
    archived: <Archive className="w-4 h-4" />,
  };

  const scopeBadges: Record<PolicyScope, string> = {
    national: "bg-indigo-50 text-indigo-700 border-indigo-200",
    regional: "bg-cyan-50 text-cyan-700 border-cyan-200",
    school: "bg-teal-50 text-teal-700 border-teal-200",
  };

  // Filter policies
  const filteredPolicies = policies.filter(policy => {
    if (policyCategory !== "all" && policy.category !== policyCategory) return false;
    if (policyStatus !== "all" && policy.status !== policyStatus) return false;
    if (policySearch && !policy.title.toLowerCase().includes(policySearch.toLowerCase())) return false;
    return true;
  });

  // Filter curriculum standards
  const filteredCurriculum = curriculumStandards.filter(standard => {
    if (curriculumSubject !== "all" && standard.subject !== curriculumSubject) return false;
    if (curriculumGrade !== "all" && standard.grade !== curriculumGrade) return false;
    return true;
  });

  // ============================================================================
  // STATS
  // ============================================================================

  const policyStats = {
    total: policies.length,
    active: policies.filter((p) => p.status === "active").length,
    draft: policies.filter((p) => p.status === "draft").length,
    archived: policies.filter((p) => p.status === "archived").length,
    effectiveThisMonth: policies.filter((p) => {
      const now = new Date();
      const policyDate = new Date(p.effectiveDate);
      return policyDate.getMonth() === now.getMonth() && policyDate.getFullYear() === now.getFullYear();
    }).length,
  };

  const curriculumStats = {
    total: curriculumStandards.length,
    active: curriculumStandards.filter((s) => s.status === "active").length,
    draft: curriculumStandards.filter((s) => s.status === "draft").length,
    subjects: new Set(curriculumStandards.map((s) => s.subject)).size,
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleCreatePolicy = () => {
    const policy: Policy = {
      id: Date.now().toString(),
      ...newPolicy,
      effectiveDate: newPolicy.effectiveDate,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setPolicies([policy, ...policies]);
    setNewPolicy({
      title: "",
      category: "assessment",
      description: "",
      effectiveDate: "",
      status: "draft",
      scope: "national",
    });
    setShowPolicyModal(false);
  };

  const handleUpdatePolicy = () => {
    if (editingPolicy) {
      setPolicies(policies.map((p) => (p.id === editingPolicy.id ? { ...editingPolicy, ...newPolicy, effectiveDate: newPolicy.effectiveDate } : p)));
      setEditingPolicy(null);
      setShowPolicyModal(false);
      setNewPolicy({
        title: "",
        category: "assessment",
        description: "",
        effectiveDate: "",
        status: "draft",
        scope: "national",
      });
    }
  };

  const handleDeletePolicy = (id: string) => {
    if (confirm("Are you sure you want to delete this policy?")) {
      setPolicies(policies.filter((p) => p.id !== id));
    }
  };

  const handleCreateCurriculumStandard = () => {
    const standard: CurriculumStandard = {
      id: Date.now().toString(),
      subject: newStandard.subject,
      grade: newStandard.grade,
      hoursRequired: newStandard.hoursRequired,
      topics: newStandard.topics.filter((t) => t.name.trim()),
      practicalRatio: newStandard.practicalRatio,
      effectiveFrom: newStandard.effectiveFrom,
      effectiveTo: newStandard.effectiveTo || undefined,
      status: "active",
      createdAt: new Date().toISOString().split("T")[0],
    };
    setCurriculumStandards([standard, ...curriculumStandards]);
    setNewStandard({
      subject: "Mathematics",
      grade: "10",
      hoursRequired: 40,
      topics: [{ name: "", hours: 1 }],
      practicalRatio: 50,
      effectiveFrom: "",
      effectiveTo: "",
    });
    setShowCurriculumModal(false);
  };

  const handleUpdateCurriculumStandard = () => {
    if (editingStandard) {
      setCurriculumStandards(
        curriculumStandards.map((s) =>
          s.id === editingStandard.id
            ? {
                ...editingStandard,
                ...newStandard,
                topics: newStandard.topics.filter((t) => t.name.trim()),
                effectiveFrom: newStandard.effectiveFrom,
                effectiveTo: newStandard.effectiveTo || undefined,
              }
            : s
        )
      );
      setEditingStandard(null);
      setShowCurriculumModal(false);
    }
  };

  const handleDeleteStandard = (id: string) => {
    if (confirm("Are you sure you want to delete this curriculum standard?")) {
      setCurriculumStandards(curriculumStandards.filter((s) => s.id !== id));
    }
  };

  const addTopic = () => {
    setNewStandard({
      ...newStandard,
      topics: [...newStandard.topics, { name: "", hours: 1 }],
    });
  };

  const updateTopic = (index: number, field: "name" | "hours", value: string | number) => {
    const updatedTopics = [...newStandard.topics];
    updatedTopics[index] = { ...updatedTopics[index], [field]: value };
    setNewStandard({ ...newStandard, topics: updatedTopics });
  };

  const removeTopic = (index: number) => {
    setNewStandard({
      ...newStandard,
      topics: newStandard.topics.filter((_, i) => i !== index),
    });
  };

  const openEditPolicy = (policy: Policy) => {
    setEditingPolicy(policy);
    setNewPolicy({
      title: policy.title,
      category: policy.category,
      description: policy.description,
      effectiveDate: policy.effectiveDate,
      status: policy.status,
      scope: policy.scope,
    });
    setShowPolicyModal(true);
  };

  const openEditStandard = (standard: CurriculumStandard) => {
    setEditingStandard(standard);
    setNewStandard({
      subject: standard.subject,
      grade: standard.grade,
      hoursRequired: standard.hoursRequired,
      topics: standard.topics,
      practicalRatio: standard.practicalRatio,
      effectiveFrom: standard.effectiveFrom,
      effectiveTo: standard.effectiveTo || "",
    });
    setShowCurriculumModal(true);
  };

  // Colors
  const colors = {
    primary: "rgb(168 85 247)",
    gradient: "linear-gradient(135deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)",
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Card className="max-w-md">
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 mr-3" />
            <p className="text-gray-600">Loading policies...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Card className="max-w-md border-red-200">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Education Policies</h1>
          <p className="text-gray-600 mt-1">Manage national education policies and curriculum standards</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={() => {
              setShowPolicyModal(true);
              setEditingPolicy(null);
              setNewPolicy({
                title: "",
                category: "assessment",
                description: "",
                effectiveDate: "",
                status: "draft",
                scope: "national",
              });
            }}
            style={{ background: colors.gradient }}
            className="text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Policy
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Policies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{policyStats.total}</div>
            <p className="text-xs text-gray-500 mt-1">{policyStats.active} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Draft Policies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{policyStats.draft}</div>
            <p className="text-xs text-gray-500 mt-1">Pending review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Effective This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{policyStats.effectiveThisMonth}</div>
            <p className="text-xs text-gray-500 mt-1">New policies</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Curriculum Standards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{curriculumStats.total}</div>
            <p className="text-xs text-gray-500 mt-1">{curriculumStats.subjects} subjects</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab("policies")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === "policies"
                    ? "bg-purple-100 text-purple-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Policies ({policyStats.total})
              </button>
              <button
                onClick={() => setActiveTab("curriculum")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === "curriculum"
                    ? "bg-purple-100 text-purple-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Curriculum Standards ({curriculumStats.total})
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {activeTab === "policies" ? (
            <>
              {/* Policies Filters */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search policies..."
                      value={policySearch}
                      onChange={(e) => setPolicySearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={policyCategory} onValueChange={(v: PolicyCategory) => setPolicyCategory(v)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="assessment">Assessment</SelectItem>
                    <SelectItem value="curriculum">Curriculum</SelectItem>
                    <SelectItem value="calendar">Calendar</SelectItem>
                    <SelectItem value="career">Career</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={policyStatus} onValueChange={setPolicyStatus}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Policies Table */}
              {filteredPolicies.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No policies found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {policies.length === 0
                      ? "Create your first policy to get started"
                      : "Try adjusting your filters"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Policy</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Category</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Scope</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Effective Date</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPolicies.map((policy) => (
                        <tr key={policy.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-gray-900">{policy.title}</p>
                              <p className="text-sm text-gray-500 truncate max-w-md">{policy.description}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={categoryBadges[policy.category]}>
                              {categoryIcons[policy.category]}
                              <span className="ml-1">{categoryLabels[policy.category]}</span>
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={statusBadges[policy.status]}>
                              {statusIcons[policy.status]}
                              <span className="ml-1 capitalize">{policy.status}</span>
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={`${scopeBadges[policy.scope]} capitalize`}>
                              {policy.scope}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {new Date(policy.effectiveDate).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-purple-50 hover:text-purple-600"
                                title="View policy"
                                onClick={() => setViewingPolicy(policy)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                                title="Edit policy"
                                onClick={() => openEditPolicy(policy)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                                title="Delete policy"
                                onClick={() => handleDeletePolicy(policy.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Curriculum Standards Filters */}
              <div className="flex flex-wrap gap-4 mb-6">
                <Select value={curriculumSubject} onValueChange={setCurriculumSubject}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {SUBJECTS.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={curriculumGrade} onValueChange={setCurriculumGrade}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    {GRADES.map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        Class {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => {
                    setShowCurriculumModal(true);
                    setEditingStandard(null);
                    setNewStandard({
                      subject: "Mathematics",
                      grade: "10",
                      hoursRequired: 40,
                      topics: [{ name: "", hours: 1 }],
                      practicalRatio: 50,
                      effectiveFrom: "",
                      effectiveTo: "",
                    });
                  }}
                  style={{ background: colors.gradient }}
                  className="text-white ml-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Standard
                </Button>
              </div>

              {/* Curriculum Standards Grid */}
              {filteredCurriculum.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No curriculum standards found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {curriculumStandards.length === 0
                      ? "Add your first curriculum standard to get started"
                      : "Try adjusting your filters"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Subject</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Grade</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Hours/Week</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Practical</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Effective</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCurriculum.map((standard) => (
                        <tr key={standard.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-purple-600" />
                              <span className="font-medium text-gray-900">{standard.subject}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">Class {standard.grade}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{standard.hoursRequired}h</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-purple-600"
                                  style={{ width: `${standard.practicalRatio}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-600">{standard.practicalRatio}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {new Date(standard.effectiveFrom).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              className={
                                standard.status === "active"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : "bg-yellow-50 text-yellow-700 border-yellow-200"
                              }
                            >
                              {standard.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-purple-50 hover:text-purple-600"
                                title="Edit standard"
                                onClick={() => openEditStandard(standard)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                                title="Delete standard"
                                onClick={() => handleDeleteStandard(standard.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Policy Modal */}
      {showPolicyModal && (
        <FullScreenModal open={showPolicyModal} onOpenChange={setShowPolicyModal}>
          <FullScreenModalContent>
            <FullScreenModalHeader>
              <FullScreenModalTitle>{editingPolicy ? "Edit" : "Create New"} Policy</FullScreenModalTitle>
              <FullScreenModalDescription>
                {editingPolicy ? "Update policy details" : "Add a new national education policy"}
              </FullScreenModalDescription>
            </FullScreenModalHeader>

            <div className="p-6 space-y-4">
              <div>
                <Label htmlFor="policy-title">Policy Title *</Label>
                <Input
                  id="policy-title"
                  value={newPolicy.title}
                  onChange={(e) => setNewPolicy({ ...newPolicy, title: e.target.value })}
                  placeholder="e.g., BCSE Examination Guidelines 2026"
                />
              </div>

              <div>
                <Label htmlFor="policy-category">Category *</Label>
                <Select value={newPolicy.category} onValueChange={(value: PolicyCategory) => setNewPolicy({ ...newPolicy, category: value })}>
                  <SelectTrigger id="policy-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assessment">Assessment Standards</SelectItem>
                    <SelectItem value="curriculum">Curriculum Guidelines</SelectItem>
                    <SelectItem value="calendar">Academic Calendar</SelectItem>
                    <SelectItem value="career">Career Education</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="policy-description">Description *</Label>
                <Textarea
                  id="policy-description"
                  value={newPolicy.description}
                  onChange={(e) => setNewPolicy({ ...newPolicy, description: e.target.value })}
                  placeholder="Full policy description"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="policy-effectiveDate">Effective Date *</Label>
                  <Input
                    id="policy-effectiveDate"
                    type="date"
                    value={newPolicy.effectiveDate}
                    onChange={(e) => setNewPolicy({ ...newPolicy, effectiveDate: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="policy-status">Status</Label>
                  <Select value={newPolicy.status} onValueChange={(value: PolicyStatus) => setNewPolicy({ ...newPolicy, status: value })}>
                    <SelectTrigger id="policy-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="policy-scope">Scope *</Label>
                <Select value={newPolicy.scope} onValueChange={(value: PolicyScope) => setNewPolicy({ ...newPolicy, scope: value })}>
                  <SelectTrigger id="policy-scope">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="national">National</SelectItem>
                    <SelectItem value="regional">Regional</SelectItem>
                    <SelectItem value="school">School-Level</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <FullScreenModalFooter>
              <Button variant="outline" onClick={() => setShowPolicyModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={editingPolicy ? handleUpdatePolicy : handleCreatePolicy}
                disabled={!newPolicy.title || !newPolicy.description}
                style={{ background: colors.gradient }}
                className="text-white"
              >
                {editingPolicy ? "Update Policy" : "Create Policy"}
              </Button>
            </FullScreenModalFooter>
          </FullScreenModalContent>
        </FullScreenModal>
      )}

      {/* View Policy Modal */}
      {viewingPolicy && (
        <FullScreenModal open={!!viewingPolicy} onOpenChange={(open) => !open && setViewingPolicy(null)}>
          <FullScreenModalContent>
            <FullScreenModalHeader>
              <FullScreenModalTitle>{viewingPolicy.title}</FullScreenModalTitle>
              <FullScreenModalDescription>Policy details</FullScreenModalDescription>
            </FullScreenModalHeader>

            <div className="p-6 space-y-4">
              <div>
                <Label>Category</Label>
                <p className="text-sm text-gray-900 mt-1 capitalize">{viewingPolicy.category}</p>
              </div>

              <div>
                <Label>Description</Label>
                <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{viewingPolicy.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Effective Date</Label>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(viewingPolicy.effectiveDate).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <Label>Status</Label>
                  <p className="text-sm text-gray-900 mt-1 capitalize">{viewingPolicy.status}</p>
                </div>
              </div>

              <div>
                <Label>Scope</Label>
                <p className="text-sm text-gray-900 mt-1 capitalize">{viewingPolicy.scope}</p>
              </div>

              {viewingPolicy.attachment && (
                <div>
                  <Label>Attachment</Label>
                  <p className="text-sm text-purple-600 mt-1">{viewingPolicy.attachment}</p>
                </div>
              )}
            </div>

            <FullScreenModalFooter>
              <Button onClick={() => setViewingPolicy(null)}>Close</Button>
            </FullScreenModalFooter>
          </FullScreenModalContent>
        </FullScreenModal>
      )}

      {/* Add/Edit Curriculum Standard Modal */}
      {showCurriculumModal && (
        <FullScreenModal open={showCurriculumModal} onOpenChange={setShowCurriculumModal}>
          <FullScreenModalContent>
            <FullScreenModalHeader>
              <FullScreenModalTitle>{editingStandard ? "Edit" : "Add"} Curriculum Standard</FullScreenModalTitle>
              <FullScreenModalDescription>Define subject requirements per grade</FullScreenModalDescription>
            </FullScreenModalHeader>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="standard-subject">Subject *</Label>
                  <Select value={newStandard.subject} onValueChange={(value) => setNewStandard({ ...newStandard, subject: value })}>
                    <SelectTrigger id="standard-subject">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map((subject) => (
                        <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="standard-grade">Grade *</Label>
                  <Select value={newStandard.grade} onValueChange={(value) => setNewStandard({ ...newStandard, grade: value })}>
                    <SelectTrigger id="standard-grade">
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADES.map((grade) => (
                        <SelectItem key={grade} value={grade}>Class {grade}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="standard-hours">Hours Required Per Week *</Label>
                <Input
                  id="standard-hours"
                  type="number"
                  value={newStandard.hoursRequired}
                  onChange={(e) => setNewStandard({ ...newStandard, hoursRequired: parseInt(e.target.value) || 0 })}
                  min={1}
                  max={50}
                />
              </div>

              <div>
                <Label htmlFor="standard-practical">Practical Ratio (%)</Label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    id="standard-practical"
                    min={0}
                    max={100}
                    value={newStandard.practicalRatio}
                    onChange={(e) => setNewStandard({ ...newStandard, practicalRatio: parseInt(e.target.value) || 0 })}
                    className="flex-1"
                  />
                  <span className="w-16 text-center font-medium">{newStandard.practicalRatio}%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="standard-effectiveFrom">Effective From *</Label>
                  <Input
                    id="standard-effectiveFrom"
                    type="date"
                    value={newStandard.effectiveFrom}
                    onChange={(e) => setNewStandard({ ...newStandard, effectiveFrom: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="standard-effectiveTo">Effective To</Label>
                  <Input
                    id="standard-effectiveTo"
                    type="date"
                    value={newStandard.effectiveTo}
                    onChange={(e) => setNewStandard({ ...newStandard, effectiveTo: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Topics</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addTopic}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Topic
                  </Button>
                </div>
                {newStandard.topics.map((topic, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      placeholder="Topic name"
                      value={topic.name}
                      onChange={(e) => updateTopic(index, "name", e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Hours"
                      value={topic.hours}
                      onChange={(e) => updateTopic(index, "hours", parseInt(e.target.value) || 0)}
                      className="w-24"
                    />
                    {newStandard.topics.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTopic(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <FullScreenModalFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCurriculumModal(false);
                  setEditingStandard(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={editingStandard ? handleUpdateCurriculumStandard : handleCreateCurriculumStandard}
                disabled={!newStandard.subject || !newStandard.grade}
                style={{ background: colors.gradient }}
                className="text-white"
              >
                {editingStandard ? "Update Standard" : "Add Standard"}
              </Button>
            </FullScreenModalFooter>
          </FullScreenModalContent>
        </FullScreenModal>
      )}
    </div>
  );
}
