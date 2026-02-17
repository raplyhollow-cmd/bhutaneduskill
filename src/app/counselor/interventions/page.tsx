"use client";

import { logger } from "@/lib/logger";
/**
 * COUNSELOR - STUDENT INTERVENTIONS
 *
 * Features:
 * - List of active interventions
 * - Create new intervention
 * - Track intervention progress
 * - Outcome recording
 * - Follow-up scheduling
 * - Progress notes
 */


import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  Plus,
  Search,
  Users,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  Target,
  MessageSquare,
  GraduationCap,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Loader2,
  X,
  Save,
  RefreshCw,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

type InterventionType = "academic" | "behavioral" | "personal" | "career" | "social";
type InterventionPriority = "low" | "medium" | "high" | "urgent";
type InterventionStatus = "planned" | "active" | "monitoring" | "completed" | "cancelled";
type OutcomeRating = "successful" | "partially_successful" | "unsuccessful";

interface InterventionGoal {
  id: string;
  text: string;
  status: "pending" | "in_progress" | "completed";
  targetDate?: string;
}

interface ProgressNote {
  id: string;
  content: string;
  createdBy: string;
  createdAt: string;
  progressUpdate?: number;
  statusChange?: string;
  milestoneReached?: boolean;
  milestoneDescription?: string;
}

interface Intervention {
  id: string;
  studentId: string;
  studentName: string;
  grade?: number | null;
  school: string;
  type: InterventionType;
  category: string;
  priority: InterventionPriority;
  status: InterventionStatus;
  startDate: string;
  targetDate: string;
  followUpDate?: string | null;
  progress: number;
  description: string;
  goals: InterventionGoal[];
  notes: ProgressNote[];
  outcome?: string | null;
  outcomeRating?: OutcomeRating | null;
  tags?: string[];
  counselorId: string;
}

interface InterventionStats {
  totalInterventions: number;
  activeInterventions: number;
  highPriorityCount: number;
  completedThisMonth: number;
}

interface Student {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  classGrade?: number | null;
  school?: string;
}

// ============================================================================
// COMPONENTS
// ============================================================================

export default function CounselorInterventionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedPriority, setSelectedPriority] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showUpdateProgressModal, setShowUpdateProgressModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  // Data states
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [stats, setStats] = useState<InterventionStats | null>(null);
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
  const [students, setStudents] = useState<Student[]>([]);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const hasFetchedData = useRef(false);

  // Fetch data on mount
  useEffect(() => {
    if (hasFetchedData.current) return;
    hasFetchedData.current = true;
    fetchInterventionsData();
    fetchStudents();
  }, []);

  const fetchInterventionsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/counselor/interventions");
      if (!response.ok) {
        throw new Error("Failed to fetch interventions data");
      }

      const result = await response.json();
      if (result.success) {
        setInterventions(result.data.interventions || []);
        setStats(result.data.stats || null);
      } else {
        throw new Error(result.error || "Failed to fetch interventions");
      }
    } catch (err) {
      logger.error("Error fetching interventions:", err);
      setError("Failed to load interventions. Please try again.");
      setInterventions([]);
      setStats({
        totalInterventions: 0,
        activeInterventions: 0,
        completedThisMonth: 0,
        highPriorityCount: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch("/api/counselor/students");
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data?.students) {
          setStudents(result.data.students);
        }
      }
    } catch (err) {
      logger.error("Error fetching students:", err);
    }
  };

  // Filter interventions
  const filteredInterventions = interventions.filter((intervention) => {
    const matchesSearch =
      intervention.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      intervention.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      intervention.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === "All" || intervention.type.toLowerCase() === selectedType.toLowerCase();
    const matchesPriority = selectedPriority === "All" || intervention.priority.toLowerCase() === selectedPriority.toLowerCase();
    const matchesStatus = selectedStatus === "All" || intervention.status.toLowerCase() === selectedStatus.toLowerCase();

    return matchesSearch && matchesType && matchesPriority && matchesStatus;
  });

  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredInterventions.length / itemsPerPage);
  const paginatedInterventions = filteredInterventions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getTypeBadge = (type: InterventionType) => {
    const styles: Record<InterventionType, string> = {
      academic: "bg-blue-100 text-blue-700 border-blue-200",
      behavioral: "bg-orange-100 text-orange-700 border-orange-200",
      personal: "bg-purple-100 text-purple-700 border-purple-200",
      career: "bg-green-100 text-green-700 border-green-200",
      social: "bg-pink-100 text-pink-700 border-pink-200",
    };
    return styles[type] || styles.academic;
  };

  const getPriorityBadge = (priority: InterventionPriority) => {
    const styles: Record<InterventionPriority, string> = {
      high: "bg-red-100 text-red-700 border-red-200",
      medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
      low: "bg-gray-100 text-gray-700 border-gray-200",
      urgent: "bg-red-200 text-red-800 border-red-300",
    };
    return styles[priority] || styles.medium;
  };

  const getStatusBadge = (status: InterventionStatus) => {
    const styles: Record<InterventionStatus, string> = {
      active: "bg-green-100 text-green-700 border-green-200",
      monitoring: "bg-blue-100 text-blue-700 border-blue-200",
      completed: "bg-gray-100 text-gray-600 border-gray-200",
      planned: "bg-purple-100 text-purple-700 border-purple-200",
      cancelled: "bg-red-50 text-red-600 border-red-200",
    };
    const labels: Record<InterventionStatus, string> = {
      active: "Active",
      monitoring: "Monitoring",
      completed: "Completed",
      planned: "Planned",
      cancelled: "Cancelled",
    };
    return { className: styles[status], label: labels[status] };
  };

  const handleViewIntervention = (intervention: Intervention) => {
    setSelectedIntervention(intervention);
    setShowDetailModal(true);
  };

  const handleUpdateProgress = (intervention: Intervention) => {
    setSelectedIntervention(intervention);
    setShowUpdateProgressModal(true);
  };

  const handleCompleteIntervention = (intervention: Intervention) => {
    setSelectedIntervention(intervention);
    setShowCompleteModal(true);
  };

  const handleRefresh = useCallback(() => {
    hasFetchedData.current = false;
    fetchInterventionsData();
  }, []);

  const handleModalSuccess = useCallback(() => {
    hasFetchedData.current = false;
    fetchInterventionsData();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: "rgb(147 51 234)" }} />
          <p className="text-gray-600">Loading interventions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Interventions</h1>
          <p className="text-gray-600 mt-1">
            Track and manage student support interventions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            className="gap-2"
            style={{ background: 'linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))' }}
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4" />
            New Intervention
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgb(168 85 247 / 0.2), rgb(147 51 234 / 0.2))' }}>
                <AlertCircle className="w-6 h-6" style={{ color: 'rgb(147 51 234)' }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalInterventions ?? interventions.length}</p>
                <p className="text-sm text-gray-500">Total Interventions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats?.activeInterventions ?? 0}</p>
                <p className="text-sm text-gray-500">Active Cases</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats?.highPriorityCount ?? 0}</p>
                <p className="text-sm text-gray-500">High Priority</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats?.completedThisMonth ?? 0}</p>
                <p className="text-sm text-gray-500">Completed This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by student, description, or ID..."
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
              {["All", "Academic", "Behavioral", "Personal", "Career", "Social"].map((type) => (
                <option key={type} value={type}>
                  {type === "All" ? "All Types" : type}
                </option>
              ))}
            </select>

            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {["All", "High", "Medium", "Low", "Urgent"].map((priority) => (
                <option key={priority} value={priority}>
                  {priority === "All" ? "All Priorities" : priority}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {["All", "Active", "Monitoring", "Completed", "Planned"].map((status) => (
                <option key={status} value={status}>
                  {status === "All" ? "All Status" : status}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Interventions List */}
      <div className="space-y-4">
        {paginatedInterventions.map((intervention) => {
          const statusBadge = getStatusBadge(intervention.status);

          return (
            <Card key={intervention.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold" style={{ background: 'linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))' }}>
                        {intervention.studentName.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{intervention.studentName}</h3>
                        <p className="text-sm text-gray-500">{intervention.id}</p>
                      </div>
                      <Badge className={getTypeBadge(intervention.type)} variant="outline">
                        {intervention.type}
                      </Badge>
                      <Badge className={getPriorityBadge(intervention.priority)} variant="outline">
                        {intervention.priority}
                      </Badge>
                      <Badge className={statusBadge.className} variant="outline">
                        {statusBadge.label}
                      </Badge>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <GraduationCap className="w-4 h-4" />
                        <span>Grade {intervention.grade || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{intervention.school || "N/A"}</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-700 mb-2">
                        <span className="font-medium">Category:</span> {intervention.category}
                      </p>
                      <p className="text-sm text-gray-600">{intervention.description}</p>
                    </div>

                    {/* Progress Bar */}
                    {intervention.status !== "completed" && intervention.status !== "cancelled" && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{intervention.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              background: 'linear-gradient(to right, rgb(168 85 247), rgb(147 51 234))',
                              width: `${intervention.progress}%`
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Dates */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Started: {new Date(intervention.startDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        <span>Target: {new Date(intervention.targetDate).toLocaleDateString()}</span>
                      </div>
                      {intervention.followUpDate && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>Follow-up: {new Date(intervention.followUpDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewIntervention(intervention)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    {intervention.status !== "completed" && intervention.status !== "cancelled" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateProgress(intervention)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Update
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCompleteIntervention(intervention)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Complete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {paginatedInterventions.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No interventions found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your filters or create a new intervention</p>
            <Button variant="outline" onClick={() => {
              setSearchQuery("");
              setSelectedType("All");
              setSelectedPriority("All");
              setSelectedStatus("All");
            }}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredInterventions.length)} of {filteredInterventions.length}{" "}
            interventions
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
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
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
                  style={currentPage === pageNum ? { background: 'linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))' } : {}}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateInterventionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleModalSuccess}
        students={students}
      />

      <DetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        intervention={selectedIntervention}
        onUpdate={handleModalSuccess}
      />

      <UpdateProgressModal
        isOpen={showUpdateProgressModal}
        onClose={() => setShowUpdateProgressModal(false)}
        intervention={selectedIntervention}
        onSuccess={handleModalSuccess}
      />

      <CompleteInterventionModal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        intervention={selectedIntervention}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}

// ============================================================================
// CREATE INTERVENTION MODAL COMPONENT
// ============================================================================

interface CreateInterventionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  students: Student[];
}

function CreateInterventionModal({ isOpen, onClose, onSuccess, students }: CreateInterventionModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    studentId: "",
    type: "academic" as InterventionType,
    category: "",
    priority: "medium" as InterventionPriority,
    description: "",
    startDate: new Date().toISOString().split("T")[0],
    targetDate: "",
    followUpDate: "",
    goals: [] as Array<{ id: string; text: string; status: "pending" }>,
  });

  const [newGoalText, setNewGoalText] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/counselor/interventions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          goals: formData.goals.filter(g => g.text.trim()),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to create intervention");
      }

      onSuccess();
      onClose();
      // Reset form
      setFormData({
        studentId: "",
        type: "academic",
        category: "",
        priority: "medium",
        description: "",
        startDate: new Date().toISOString().split("T")[0],
        targetDate: "",
        followUpDate: "",
        goals: [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create intervention");
    } finally {
      setSubmitting(false);
    }
  };

  const addGoal = () => {
    if (newGoalText.trim()) {
      setFormData({
        ...formData,
        goals: [...formData.goals, { id: `goal_${Date.now()}`, text: newGoalText.trim(), status: "pending" as const }],
      });
      setNewGoalText("");
    }
  };

  const removeGoal = (goalId: string) => {
    setFormData({
      ...formData,
      goals: formData.goals.filter(g => g.id !== goalId),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Create New Intervention</CardTitle>
              <CardDescription>Set up a new student intervention plan</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div>
              <Label htmlFor="student">Student *</Label>
              <select
                id="student"
                required
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Select a student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} - Grade {student.classGrade || "N/A"}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type *</Label>
                <select
                  id="type"
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as InterventionType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="academic">Academic</option>
                  <option value="behavioral">Behavioral</option>
                  <option value="personal">Personal</option>
                  <option value="career">Career</option>
                  <option value="social">Social</option>
                </select>
              </div>
              <div>
                <Label htmlFor="priority">Priority *</Label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as InterventionPriority })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Input
                id="category"
                required
                placeholder="e.g., Grade Improvement, Attendance Issues"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                required
                placeholder="Describe the intervention needed..."
                className="min-h-[100px]"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="targetDate">Target Date *</Label>
                <Input
                  id="targetDate"
                  type="date"
                  required
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="followUpDate">Follow-up Date</Label>
              <Input
                id="followUpDate"
                type="date"
                value={formData.followUpDate}
                onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
              />
            </div>

            <div>
              <Label>Initial Goals</Label>
              <div className="space-y-2 mt-2">
                {formData.goals.map((goal) => (
                  <div key={goal.id} className="flex items-center gap-2 p-2 border rounded-lg">
                    <span className="flex-1 text-sm">{goal.text}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeGoal(goal.id)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Enter a goal..."
                    value={newGoalText}
                    onChange={(e) => setNewGoalText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addGoal())}
                  />
                  <Button type="button" variant="outline" onClick={addGoal}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
          <div className="border-t px-6 py-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              style={{ background: 'linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))' }}
            >
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Create Intervention
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

// ============================================================================
// DETAIL MODAL COMPONENT
// ============================================================================

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  intervention: Intervention | null;
  onUpdate: () => void;
}

function DetailModal({ isOpen, onClose, intervention, onUpdate }: DetailModalProps) {
  if (!isOpen || !intervention) return null;

  const statusBadge = (
    { status: intervention.status as InterventionStatus } as { status: InterventionStatus }
  );
  const getTypeBadge = (type: InterventionType) => {
    const styles: Record<InterventionType, string> = {
      academic: "bg-blue-100 text-blue-700 border-blue-200",
      behavioral: "bg-orange-100 text-orange-700 border-orange-200",
      personal: "bg-purple-100 text-purple-700 border-purple-200",
      career: "bg-green-100 text-green-700 border-green-200",
      social: "bg-pink-100 text-pink-700 border-pink-200",
    };
    return styles[type] || styles.academic;
  };
  const getPriorityBadge = (priority: InterventionPriority) => {
    const styles: Record<InterventionPriority, string> = {
      high: "bg-red-100 text-red-700 border-red-200",
      medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
      low: "bg-gray-100 text-gray-700 border-gray-200",
      urgent: "bg-red-200 text-red-800 border-red-300",
    };
    return styles[priority] || styles.medium;
  };
  const getStatusBadge = (status: InterventionStatus) => {
    const styles: Record<InterventionStatus, string> = {
      active: "bg-green-100 text-green-700 border-green-200",
      monitoring: "bg-blue-100 text-blue-700 border-blue-200",
      completed: "bg-gray-100 text-gray-600 border-gray-200",
      planned: "bg-purple-100 text-purple-700 border-purple-200",
      cancelled: "bg-red-50 text-red-600 border-red-200",
    };
    const labels: Record<InterventionStatus, string> = {
      active: "Active",
      monitoring: "Monitoring",
      completed: "Completed",
      planned: "Planned",
      cancelled: "Cancelled",
    };
    return { className: styles[status], label: labels[status] };
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold" style={{ background: 'linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))' }}>
                {intervention.studentName.split(" ").map((n: string) => n[0]).join("")}
              </div>
              <div>
                <CardTitle>{intervention.studentName}</CardTitle>
                <CardDescription>{intervention.id}</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Badge className={getTypeBadge(intervention.type)} variant="outline">
              {intervention.type}
            </Badge>
            <Badge className={getPriorityBadge(intervention.priority)} variant="outline">
              {intervention.priority}
            </Badge>
            <Badge className={getStatusBadge(intervention.status).className} variant="outline">
              {getStatusBadge(intervention.status).label}
            </Badge>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-1">Category</h4>
            <p className="text-gray-600">{intervention.category}</p>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-1">Description</h4>
            <p className="text-gray-600">{intervention.description}</p>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Goals</h4>
            <div className="space-y-2">
              {intervention.goals.map((goal) => (
                <div key={goal.id} className="flex items-start gap-2 p-3 border rounded-lg">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    goal.status === "completed" ? "bg-green-500" :
                    goal.status === "in_progress" ? "bg-blue-500" : "bg-gray-300"
                  }`}>
                    {goal.status === "completed" && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <span className={goal.status === "completed" ? "line-through text-gray-400" : "text-gray-700"}>
                    {goal.text}
                  </span>
                </div>
              ))}
              {intervention.goals.length === 0 && (
                <p className="text-sm text-gray-500">No goals set yet.</p>
              )}
            </div>
          </div>

          {intervention.notes && intervention.notes.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Progress Notes</h4>
              <div className="space-y-2">
                {intervention.notes.map((note) => (
                  <div key={note.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{note.content}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(note.createdAt).toLocaleDateString()} at {new Date(note.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {intervention.outcome && (
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Outcome</h4>
              <p className="text-gray-600">{intervention.outcome}</p>
              {intervention.outcomeRating && (
                <Badge className="mt-2" variant="outline">
                  {intervention.outcomeRating === "successful" ? "Successful" :
                   intervention.outcomeRating === "partially_successful" ? "Partially Successful" : "Unsuccessful"}
                </Badge>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Start Date</h4>
              <p className="text-gray-600">{new Date(intervention.startDate).toLocaleDateString()}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Target Date</h4>
              <p className="text-gray-600">{new Date(intervention.targetDate).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// UPDATE PROGRESS MODAL COMPONENT
// ============================================================================

interface UpdateProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  intervention: Intervention | null;
  onSuccess: () => void;
}

function UpdateProgressModal({ isOpen, onClose, intervention, onSuccess }: UpdateProgressModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    status: intervention?.status || "active",
    progress: intervention?.progress || 0,
    note: "",
    milestoneReached: false,
    milestoneDescription: "",
  });

  useEffect(() => {
    if (intervention) {
      setFormData({
        status: intervention.status,
        progress: intervention.progress,
        note: "",
        milestoneReached: false,
        milestoneDescription: "",
      });
    }
  }, [intervention]);

  if (!isOpen || !intervention) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Update intervention
      const updateResponse = await fetch(`/api/counselor/interventions/${intervention.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: formData.status,
          progress: formData.progress,
        }),
      });

      if (!updateResponse.ok) {
        throw new Error("Failed to update intervention");
      }

      // Add note if provided
      if (formData.note.trim()) {
        await fetch(`/api/counselor/interventions/${intervention.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: formData.note,
            progressUpdate: formData.progress,
            statusChange: formData.status !== intervention.status ? formData.status : undefined,
            milestoneReached: formData.milestoneReached,
            milestoneDescription: formData.milestoneDescription,
          }),
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update progress");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoalToggle = (goalId: string, currentStatus: string) => {
    const newStatus = currentStatus === "completed" ? "in_progress" : "completed";
    const updatedGoals = intervention.goals.map(g =>
      g.id === goalId ? { ...g, status: newStatus as "pending" | "in_progress" | "completed" } : g
    );

    // Calculate progress based on completed goals
    const completedGoals = updatedGoals.filter(g => g.status === "completed").length;
    const newProgress = updatedGoals.length > 0 ? Math.round((completedGoals / updatedGoals.length) * 100) : 0;

    setFormData({ ...formData, progress: newProgress });

    // Update intervention goals via PATCH
    fetch(`/api/counselor/interventions/${intervention.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goals: updatedGoals }),
    }).then(() => {
      // Update local intervention object
      intervention.goals = updatedGoals;
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Update Progress</CardTitle>
              <CardDescription>{intervention.studentName} - {intervention.category}</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Goals */}
            <div>
              <Label>Goals</Label>
              <div className="space-y-2 mt-2">
                {intervention.goals.map((goal) => (
                  <label key={goal.id} className="flex items-start gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={goal.status === "completed"}
                      onChange={() => handleGoalToggle(goal.id, goal.status)}
                      className="mt-1"
                    />
                    <span className={goal.status === "completed" ? "line-through text-gray-400" : "text-gray-700"}>
                      {goal.text}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="progress">Progress: {formData.progress}%</Label>
              <input
                id="progress"
                type="range"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as InterventionStatus })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="planned">Planned</option>
                <option value="active">Active</option>
                <option value="monitoring">Monitoring</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <Label htmlFor="note">Progress Note</Label>
              <Textarea
                id="note"
                placeholder="Add a progress note..."
                className="min-h-[80px]"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="milestone"
                checked={formData.milestoneReached}
                onChange={(e) => setFormData({ ...formData, milestoneReached: e.target.checked })}
              />
              <Label htmlFor="milestone">Milestone Reached</Label>
            </div>

            {formData.milestoneReached && (
              <div>
                <Label htmlFor="milestoneDesc">Milestone Description</Label>
                <Input
                  id="milestoneDesc"
                  placeholder="Describe the milestone..."
                  value={formData.milestoneDescription}
                  onChange={(e) => setFormData({ ...formData, milestoneDescription: e.target.value })}
                />
              </div>
            )}
          </CardContent>
          <div className="border-t px-6 py-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              style={{ background: 'linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))' }}
            >
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Update
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

// ============================================================================
// COMPLETE INTERVENTION MODAL COMPONENT
// ============================================================================

interface CompleteInterventionModalProps {
  isOpen: boolean;
  onClose: () => void;
  intervention: Intervention | null;
  onSuccess: () => void;
}

function CompleteInterventionModal({ isOpen, onClose, intervention, onSuccess }: CompleteInterventionModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    outcome: "",
    outcomeRating: "" as OutcomeRating | "",
  });

  useEffect(() => {
    if (intervention) {
      setFormData({
        outcome: intervention.outcome || "",
        outcomeRating: intervention.outcomeRating || "",
      });
    }
  }, [intervention]);

  if (!isOpen || !intervention) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/counselor/interventions/${intervention.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
          outcome: formData.outcome,
          outcomeRating: formData.outcomeRating,
          progress: 100,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to complete intervention");
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete intervention");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Complete Intervention</CardTitle>
              <CardDescription>{intervention.studentName} - {intervention.category}</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div>
              <Label htmlFor="outcomeRating">Outcome Rating *</Label>
              <select
                id="outcomeRating"
                required
                value={formData.outcomeRating}
                onChange={(e) => setFormData({ ...formData, outcomeRating: e.target.value as OutcomeRating })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Select rating...</option>
                <option value="successful">Successful</option>
                <option value="partially_successful">Partially Successful</option>
                <option value="unsuccessful">Unsuccessful</option>
              </select>
            </div>

            <div>
              <Label htmlFor="outcome">Outcome Description *</Label>
              <Textarea
                id="outcome"
                required
                placeholder="Describe the outcome of this intervention..."
                className="min-h-[120px]"
                value={formData.outcome}
                onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
              />
            </div>
          </CardContent>
          <div className="border-t px-6 py-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              style={{ background: 'linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))' }}
            >
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Complete Intervention
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

// ============================================================================
// EXPORT MODAL COMPONENTS FOR USE IN MAIN COMPONENT
// ============================================================================

export {
  CreateInterventionModal,
  DetailModal,
  UpdateProgressModal,
  CompleteInterventionModal,
};
