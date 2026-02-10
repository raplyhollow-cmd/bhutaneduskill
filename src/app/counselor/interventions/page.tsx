/**
 * COUNSELOR - STUDENT INTERVENTIONS
 *
 * Features:
 * - List of active interventions
 * - Create new intervention
 * - Track intervention progress
 * - Outcome recording
 * - Follow-up scheduling
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Plus,
  Search,
  Filter,
  Users,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  Target,
  MessageSquare,
  User,
  GraduationCap,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  MoreVertical,
} from "lucide-react";
import Link from "next/link";

// Mock intervention data
const mockInterventions = [
  {
    id: "INT001",
    studentId: "STU001",
    studentName: "Tashi Dorji",
    grade: 12,
    school: "Thimphu Higher Secondary School",
    type: "academic",
    category: "Grade Improvement",
    priority: "high",
    status: "active",
    startDate: "2024-02-01",
    targetDate: "2024-03-15",
    progress: 65,
    description: "Struggling with Mathematics - needs extra support in calculus and algebra",
    goals: [
      { id: 1, text: "Complete weekly math tutoring sessions", status: "completed" },
      { id: 2, text: "Submit all homework assignments on time", status: "in_progress" },
      { id: 3, text: "Achieve 70% or higher in next exam", status: "pending" },
    ],
    notes: "Student showing improvement in recent quizzes",
    followUpDate: "2024-02-15",
  },
  {
    id: "INT002",
    studentId: "STU002",
    studentName: "Karma Wangmo",
    grade: 10,
    school: "Yangchenphug Higher Secondary School",
    type: "behavioral",
    category: "Attendance Issues",
    priority: "medium",
    status: "active",
    startDate: "2024-01-28",
    targetDate: "2024-03-01",
    progress: 40,
    description: "Frequent absences - needs attendance monitoring and support",
    goals: [
      { id: 1, text: "Attend school for 2 consecutive weeks", status: "completed" },
      { id: 2, text: "Meet with counselor to discuss barriers", status: "completed" },
      { id: 3, text: "Maintain 90% attendance for one month", status: "in_progress" },
    ],
    notes: "Family issues identified - providing family counseling support",
    followUpDate: "2024-02-12",
  },
  {
    id: "INT003",
    studentId: "STU003",
    studentName: "Pema Lhamo",
    grade: 11,
    school: "Moiyul Goenpa HSS",
    type: "personal",
    category: "Social Adjustment",
    priority: "low",
    status: "monitoring",
    startDate: "2024-01-15",
    targetDate: "2024-02-28",
    progress: 80,
    description: "Difficulty adjusting to new school environment - peer connection support",
    goals: [
      { id: 1, text: "Join at least one extracurricular activity", status: "completed" },
      { id: 2, text: "Participate in group counseling sessions", status: "completed" },
      { id: 3, text: "Report improved social connections", status: "completed" },
    ],
    notes: "Significant improvement - student now has peer group",
    followUpDate: "2024-02-20",
  },
  {
    id: "INT004",
    studentId: "STU004",
    studentName: "Dorji Wangchuk",
    grade: 12,
    school: "Pelkhil HSS",
    type: "career",
    category: "Career Planning",
    priority: "high",
    status: "active",
    startDate: "2024-02-05",
    targetDate: "2024-03-30",
    progress: 25,
    description: "Undecided on career path - needs career exploration and assessment",
    goals: [
      { id: 1, text: "Complete RIASEC assessment", status: "completed" },
      { id: 2, text: "Research top 3 career matches", status: "in_progress" },
      { id: 3, text: "Create career action plan", status: "pending" },
    ],
    notes: "Student shows strong interest in engineering fields",
    followUpDate: "2024-02-18",
  },
  {
    id: "INT005",
    studentId: "STU005",
    studentName: "Sonam Yangdon",
    grade: 10,
    school: "Rigsum HSS",
    type: "academic",
    category: "Exam Preparation",
    priority: "high",
    status: "active",
    startDate: "2024-02-08",
    targetDate: "2024-03-15",
    progress: 30,
    description: "Preparing for board exams - needs study skills and time management support",
    goals: [
      { id: 1, text: "Create study schedule", status: "completed" },
      { id: 2, text: "Complete practice tests", status: "in_progress" },
      { id: 3, text: "Review weak subjects with teachers", status: "pending" },
    ],
    notes: "Student motivated and following schedule well",
    followUpDate: "2024-02-14",
  },
  {
    id: "INT006",
    studentId: "STU006",
    studentName: "Karma Tshering",
    grade: 11,
    school: "Thimphu HSS",
    type: "behavioral",
    category: "Motivation",
    priority: "medium",
    status: "completed",
    startDate: "2024-01-10",
    targetDate: "2024-02-10",
    progress: 100,
    description: "Low motivation and engagement - mentoring and goal-setting intervention",
    goals: [
      { id: 1, text: "Identify personal interests and strengths", status: "completed" },
      { id: 2, text: "Set academic and personal goals", status: "completed" },
      { id: 3, text: "Connect with peer mentor", status: "completed" },
    ],
    notes: "Successfully completed - student now engaged in school activities",
    followUpDate: "2024-02-10",
    outcome: "Successful - student showing sustained improvement",
  },
];

const typeOptions = ["All", "Academic", "Behavioral", "Personal", "Career"];
const priorityOptions = ["All", "High", "Medium", "Low"];
const statusOptions = ["All", "Active", "Monitoring", "Completed"];

export default function CounselorInterventionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedPriority, setSelectedPriority] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter interventions
  const filteredInterventions = mockInterventions.filter((intervention) => {
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

  const getTypeBadge = (type: string) => {
    const styles = {
      academic: "bg-blue-100 text-blue-700 border-blue-200",
      behavioral: "bg-orange-100 text-orange-700 border-orange-200",
      personal: "bg-purple-100 text-purple-700 border-purple-200",
      career: "bg-green-100 text-green-700 border-green-200",
    };
    return styles[type as keyof typeof styles] || styles.academic;
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      high: "bg-red-100 text-red-700 border-red-200",
      medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
      low: "bg-gray-100 text-gray-700 border-gray-200",
    };
    return styles[priority as keyof typeof styles] || styles.medium;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: "bg-green-100 text-green-700 border-green-200",
      monitoring: "bg-blue-100 text-blue-700 border-blue-200",
      completed: "bg-gray-100 text-gray-600 border-gray-200",
    };
    const labels = {
      active: "Active",
      monitoring: "Monitoring",
      completed: "Completed",
    };
    return { className: styles[status as keyof typeof styles] || styles.active, label: labels[status as keyof typeof labels] || status };
  };

  // Stats
  const activeInterventions = mockInterventions.filter((i) => i.status === "active").length;
  const completedThisMonth = mockInterventions.filter((i) => i.status === "completed").length;
  const highPriorityCount = mockInterventions.filter((i) => i.priority === "high" && i.status !== "completed").length;

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
        <Button
          className="gap-2"
          style={{ background: 'linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))' }}
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-4 h-4" />
          New Intervention
        </Button>
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
                <p className="text-2xl font-bold text-gray-900">{mockInterventions.length}</p>
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
                <p className="text-2xl font-bold text-gray-900">{activeInterventions}</p>
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
                <p className="text-2xl font-bold text-gray-900">{highPriorityCount}</p>
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
                <p className="text-2xl font-bold text-gray-900">{completedThisMonth}</p>
                <p className="text-sm text-gray-500">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
              {typeOptions.map((type) => (
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
              {priorityOptions.map((priority) => (
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
              {statusOptions.map((status) => (
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
                    <div className="flex items-center gap-3 mb-3">
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
                        <span>Grade {intervention.grade}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{intervention.school}</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-700 mb-2">
                        <span className="font-medium">Category:</span> {intervention.category}
                      </p>
                      <p className="text-sm text-gray-600">{intervention.description}</p>
                    </div>

                    {/* Progress Bar */}
                    {intervention.status !== "completed" && (
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
                    <div className="flex items-center gap-4 text-sm text-gray-500">
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
                      onClick={() => {
                        setSelectedIntervention(intervention);
                        setShowDetailModal(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {paginatedInterventions.length === 0 && (
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
              let pageNum;
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

      {/* Create Intervention Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Create New Intervention</CardTitle>
                  <CardDescription>Set up a new student intervention plan</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="">Select a student</option>
                  <option value="STU001">Tashi Dorji - Grade 12</option>
                  <option value="STU002">Karma Wangmo - Grade 10</option>
                  <option value="STU003">Pema Lhamo - Grade 11</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="">Select type</option>
                    <option value="academic">Academic</option>
                    <option value="behavioral">Behavioral</option>
                    <option value="personal">Personal</option>
                    <option value="career">Career</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <Input placeholder="e.g., Grade Improvement, Attendance Issues" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg min-h-[100px]"
                  placeholder="Describe the intervention needed..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <Input type="date" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Date *</label>
                  <Input type="date" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
                <Input type="date" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Initial Goals</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-gray-300 text-purple-600" />
                    <Input placeholder="Enter a goal..." />
                  </div>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Plus className="w-4 h-4" />
                    Add Goal
                  </Button>
                </div>
              </div>
            </CardContent>
            <div className="border-t px-6 py-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button
                style={{ background: 'linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))' }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Intervention
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedIntervention && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold" style={{ background: 'linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))' }}>
                    {selectedIntervention.studentName.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <CardTitle>{selectedIntervention.studentName}</CardTitle>
                    <CardDescription>{selectedIntervention.id}</CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowDetailModal(false)}>
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Badge className={getTypeBadge(selectedIntervention.type)} variant="outline">
                  {selectedIntervention.type}
                </Badge>
                <Badge className={getPriorityBadge(selectedIntervention.priority)} variant="outline">
                  {selectedIntervention.priority}
                </Badge>
                <Badge className={getStatusBadge(selectedIntervention.status).className} variant="outline">
                  {getStatusBadge(selectedIntervention.status).label}
                </Badge>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-1">Category</h4>
                <p className="text-gray-600">{selectedIntervention.category}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-1">Description</h4>
                <p className="text-gray-600">{selectedIntervention.description}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Goals</h4>
                <div className="space-y-2">
                  {selectedIntervention.goals.map((goal: any) => (
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
                </div>
              </div>

              {selectedIntervention.notes && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Notes</h4>
                  <p className="text-gray-600">{selectedIntervention.notes}</p>
                </div>
              )}

              {selectedIntervention.outcome && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Outcome</h4>
                  <p className="text-gray-600">{selectedIntervention.outcome}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Start Date</h4>
                  <p className="text-gray-600">{new Date(selectedIntervention.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Target Date</h4>
                  <p className="text-gray-600">{new Date(selectedIntervention.targetDate).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
            <div className="border-t px-6 py-4 flex justify-between">
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Update Progress
              </Button>
              <Button
                style={{ background: 'linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))' }}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Add Note
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function XCircle({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  );
}
