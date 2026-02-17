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
 */


import { useState } from "react";
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
  effectiveDate: string; // Changed to string for form input compatibility
  status: PolicyStatus;
  scope: PolicyScope;
  attachment?: string;
  createdAt: string; // Changed to string for form compatibility
}

interface CurriculumStandard {
  id: string;
  subject: string;
  grade: string;
  hoursRequired: number;
  topics: Array<{ name: string; hours: number }>;
  practicalRatio: number;
  effectiveFrom: string; // Changed to string for form input compatibility
  effectiveTo?: string; // Changed to string for form input compatibility
  status: "active" | "draft";
  createdAt: string; // Changed to string for form compatibility
}

// ============================================================================
// MOCK DATA
// ============================================================================

const mockPolicies: Policy[] = [
  {
    id: "1",
    title: "BCSE Examination Guidelines 2026",
    category: "assessment",
    description: "Comprehensive guidelines for the Bhutan Certificate of Secondary Education examinations including assessment methods, grade scales, and administration protocols.",
    effectiveDate: "2026-02-01",
    status: "active",
    scope: "national",
    attachment: "bcse-guidelines-2026.pdf",
    createdAt: "2026-01-15",
  },
  {
    id: "2",
    title: "National Curriculum Framework - Mathematics",
    category: "curriculum",
    description: "Detailed curriculum framework for Mathematics across all middle school grades (PP-12) with learning outcomes and assessment criteria.",
    effectiveDate: "2026-01-01",
    status: "active",
    scope: "national",
    attachment: "math-curriculum-2026.pdf",
    createdAt: "2025-12-01",
  },
  {
    id: "3",
    title: "Academic Calendar 2026",
    category: "calendar",
    description: "National academic calendar for 2026 including term dates, holidays, examination periods, and breaks.",
    effectiveDate: "2026-02-15",
    status: "active",
    scope: "national",
    attachment: "academic-calendar-2026.pdf",
    createdAt: "2026-01-10",
  },
  {
    id: "4",
    title: "RIASEC Career Assessment Standards",
    category: "career",
    description: "Guidelines for administering and interpreting RIASEC career interest assessments in middle schools.",
    effectiveDate: "2026-01-01",
    status: "active",
    scope: "national",
    createdAt: "2025-11-20",
  },
  {
    id: "5",
    title: "Student Attendance Policy (Draft)",
    category: "other",
    description: "Draft policy on minimum attendance requirements for promotion to next grade.",
    effectiveDate: "2026-04-01",
    status: "draft",
    scope: "national",
    createdAt: "2026-02-01",
  },
  {
    id: "6",
    title: "Regional Assessment Variations - Thimphu",
    category: "assessment",
    description: "Specific assessment guidelines for schools in Thimphu region.",
    effectiveDate: "2026-01-01",
    status: "active",
    scope: "regional",
    createdAt: "2025-12-15",
  },
];

const mockCurriculumStandards: CurriculumStandard[] = [
  {
    id: "1",
    subject: "Mathematics",
    grade: "10",
    hoursRequired: 120,
    topics: [
      { name: "Algebra", hours: 30 },
      { name: "Geometry", hours: 25 },
      { name: "Trigonometry", hours: 20 },
      { name: "Statistics", hours: 20 },
      { name: "Calculus Basics", hours: 25 },
    ],
    practicalRatio: 40,
    effectiveFrom: "2026-01-01",
    effectiveTo: "2026-12-31",
    status: "active",
    createdAt: "2025-11-01",
  },
  {
    id: "2",
    subject: "English",
    grade: "10",
    hoursRequired: 100,
    topics: [
      { name: "Reading Comprehension", hours: 25 },
      { name: "Writing Skills", hours: 30 },
      { name: "Grammar", hours: 20 },
      { name: "Literature", hours: 25 },
    ],
    practicalRatio: 30,
    effectiveFrom: "2026-01-01",
    effectiveTo: "2026-12-31",
    status: "active",
    createdAt: "2025-11-01",
  },
  {
    id: "3",
    subject: "Dzongkha",
    grade: "8",
    hoursRequired: 80,
    topics: [
      { name: "Reading", hours: 20 },
      { name: "Writing", hours: 25 },
      { name: "Grammar", hours: 20 },
      { name: "Literature", hours: 15 },
    ],
    practicalRatio: 35,
    effectiveFrom: "2026-01-01",
    status: "active",
    createdAt: "2025-11-01",
  },
  {
    id: "4",
    subject: "Science",
    grade: "7",
    hoursRequired: 100,
    topics: [
      { name: "Physics", hours: 25 },
      { name: "Chemistry", hours: 25 },
      { name: "Biology", hours: 30 },
      { name: "Environmental Science", hours: 20 },
    ],
    practicalRatio: 60,
    effectiveFrom: "2026-01-01",
    status: "active",
    createdAt: "2025-11-01",
  },
];

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
// OLD TYPE DEFINITIONS (kept for compatibility during refactor)
// ============================================================================
interface PolicyOld {
  id: string;
  title: string;
  category: "assessment" | "curriculum" | "calendar" | "career" | "other";
  description: string;
  effectiveDate: string;
  status: "active" | "draft" | "archived";
  scope: "national" | "regional" | "school-level";
  createdAt: string;
}

interface CurriculumStandardOld {
  id: string;
  subject: string;
  grade: string;
  hoursRequired: number;
  topics: Array<{ name: string; hours: number }>;
  practicalRatio: number;
  effectiveFrom: string;
  status: "active" | "draft";
}

export default function MinistryPoliciesPage() {
  const [activeTab, setActiveTab] = useState<"policies" | "curriculum">("policies");
  const [policies, setPolicies] = useState<Policy[]>(mockPolicies);
  const [curriculumStandards, setCurriculumStandards] = useState<CurriculumStandard[]>(mockCurriculumStandards);

  // Policy filters
  const [policyCategory, setPolicyCategory] = useState<PolicyCategory>("all");
  const [policyStatus, setPolicyStatus] = useState<string>("all");
  const [policySearch, setPolicySearch] = useState("");

  // Curriculum filters
  const [curriculumSubject, setCurriculumSubject] = useState<string>("all");
  const [curriculumGrade, setCurriculumGrade] = useState<string>("all");

  // Modals
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

  // Colors
  const colors = {
    primary: "rgb(168 85 247)",
    gradient: "linear-gradient(135deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)",
  };

  // ============================================================================
  // FILTER LOGIC
  // ============================================================================

  const filteredPolicies = policies.filter((policy) => {
    const matchesCategory = policyCategory === "all" || policy.category === policyCategory;
    const matchesStatus = policyStatus === "all" || policy.status === policyStatus;
    const matchesSearch =
      !policySearch ||
      policy.title.toLowerCase().includes(policySearch.toLowerCase()) ||
      policy.description.toLowerCase().includes(policySearch.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  const filteredCurriculumStandards = curriculumStandards.filter((standard) => {
    const matchesSubject = curriculumSubject === "all" || standard.subject === curriculumSubject;
    const matchesGrade = curriculumGrade === "all" || standard.grade === curriculumGrade;
    return matchesSubject && matchesGrade;
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
      topics: [...standard.topics],
      practicalRatio: standard.practicalRatio,
      effectiveFrom: standard.effectiveFrom,
      effectiveTo: standard.effectiveTo || "",
    });
    setShowCurriculumModal(true);
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Education Policies</h1>
          <p className="text-gray-600">Create and manage national education policies</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowCurriculumModal(true)}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Add Curriculum Standard
          </Button>
          <Button
            onClick={() => setShowPolicyModal(true)}
            style={{ background: colors.gradient }}
            className="text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Policy
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Total Policies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{policyStats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{policyStats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Draft
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{policyStats.draft}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Archive className="w-4 h-4" />
              Archived
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{policyStats.archived}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{policyStats.effectiveThisMonth}</div>
            <p className="text-xs text-gray-500 mt-1">Effective</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {(["all", "assessment", "curriculum", "calendar", "career", "other"] as PolicyCategory[]).map((category) => (
          <button
            key={category}
            onClick={() => setPolicyCategory(category)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              policyCategory === category
                ? "bg-purple-100 text-purple-700 border-2 border-purple-300"
                : "bg-white text-gray-600 border-2 border-gray-200 hover:border-purple-200 hover:bg-purple-50"
            }`}
          >
            {category === "all" ? <Filter className="w-4 h-4 inline mr-1" /> : categoryIcons[category]}
            <span className="ml-1">{categoryLabels[category]}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search policies by title or description..."
                value={policySearch}
                onChange={(e) => setPolicySearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={policyStatus}
                onChange={(e) => setPolicyStatus(e.target.value)}
                className="appearance-none px-4 py-3 pr-10 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("policies")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "policies"
              ? "text-purple-600 border-b-2 border-purple-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Policies ({policies.length})
        </button>
        <button
          onClick={() => setActiveTab("curriculum")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "curriculum"
              ? "text-purple-600 border-b-2 border-purple-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Curriculum Standards ({curriculumStandards.length})
        </button>
      </div>

      {/* Policies Tab */}
      {activeTab === "policies" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Policies</CardTitle>
                <CardDescription>
                  Showing {filteredPolicies.length} of {policies.length} policies
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Policy</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Category</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Effective Date</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600 text-sm">Status</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600 text-sm">Scope</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPolicies.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                            <FileText className="w-8 h-8 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-gray-900 font-medium">No policies found</p>
                            <p className="text-gray-500 text-sm">Try adjusting your filters</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredPolicies.map((policy) => (
                      <tr key={policy.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{policy.title}</p>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2 max-w-md">{policy.description}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant="outline" className={categoryBadges[policy.category]}>
                            {categoryIcons[policy.category]}
                            <span className="ml-1">{categoryLabels[policy.category]}</span>
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-900">
                            {new Date(policy.effectiveDate).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant="outline" className={statusBadges[policy.status]}>
                            {statusIcons[policy.status]}
                            <span className="ml-1 capitalize">{policy.status}</span>
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant="outline" className={scopeBadges[policy.scope]}>
                            {policy.scope === "national" && <Globe className="w-3 h-3 inline mr-1" />}
                            {policy.scope === "regional" && <Building2 className="w-3 h-3 inline mr-1" />}
                            {policy.scope === "school" && <Users className="w-3 h-3 inline mr-1" />}
                            <span className="ml-1 capitalize">{policy.scope}</span>
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-purple-50 hover:text-purple-600"
                              title="View details"
                              onClick={() => setViewingPolicy(policy)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-purple-50 hover:text-purple-600"
                              title="Edit policy"
                              onClick={() => openEditPolicy(policy)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {policy.attachment && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-purple-50 hover:text-purple-600"
                                title="Download attachment"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            )}
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Curriculum Standards Tab */}
      {activeTab === "curriculum" && (
        <Card>
          <CardHeader>
            <CardTitle>Curriculum Standards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Subject</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Grade</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Hours/Week</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Practical</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Topics</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {curriculumStandards.map((standard) => (
                    <tr key={standard.id} className="border-b border-gray-100">
                      <td className="py-4 px-4 font-medium text-gray-900">{standard.subject}</td>
                      <td className="py-4 px-4">{standard.grade}</td>
                      <td className="py-4 px-4">{standard.hoursRequired}</td>
                      <td className="py-4 px-4">{standard.practicalRatio}%</td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {standard.topics.map(t => t.name).join(", ")}
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="outline" className={statusBadges[standard.status]}>
                          <span className="ml-1 capitalize">{standard.status}</span>
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-purple-50 hover:text-purple-600"
                            title="View details"
                            onClick={() => {}}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
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
          </CardContent>
        </Card>
      )}

      {/* Create Policy Modal */}
      {showPolicyModal && (
        <FullScreenModal open={showPolicyModal} onOpenChange={setShowPolicyModal}>
          <FullScreenModalContent>
            <FullScreenModalHeader>
              <FullScreenModalTitle>Create New Policy</FullScreenModalTitle>
              <FullScreenModalDescription>Add a new national education policy</FullScreenModalDescription>
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
              <Button
                variant="outline"
                onClick={() => setShowPolicyModal(false)}
              >
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
                        <SelectItem key={grade} value={grade}>{grade}</SelectItem>
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
