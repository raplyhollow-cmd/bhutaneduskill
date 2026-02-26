/**
 * PLATFORM ADMIN - GLOBAL SUBJECTS MANAGEMENT
 *
 * Global subject templates that schools can copy to their own catalog.
 * Global subjects have schoolId = NULL in the database.
 */

"use client";

import { useState, useEffect } from "react";
import { PremiumCard, PremiumCardHeader, PremiumCardTitle, PremiumCardDescription, PremiumCardContent } from "@/components/admin/premium-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Search,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Filter,
  GraduationCap,
  Code,
  Type,
} from "lucide-react";
import { AddSubjectModal } from "@/components/admin/add-subject-modal";
import { EditSubjectModal } from "@/components/admin/edit-subject-modal";
import { useQuickAddSubject } from "@/components/admin/quick-add-subject-modal";
import { useToast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

// Subject type definition
interface Subject {
  id: string;
  name: string;
  code: string;
  type: "core" | "elective" | "language" | "additional";
  description: string;
  grade?: number;
  applicableGrades?: string;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

type FilterStatus = "all" | "active" | "inactive";
type FilterType = "all" | "core" | "elective" | "language" | "additional";

export default function AdminSubjectsPage() {
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Subject | null>(null);

  // Fetch subjects on mount
  useEffect(() => {
    fetchSubjects();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...subjects];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (subject) =>
          subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          subject.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          subject.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter === "active") {
      filtered = filtered.filter((s) => s.isActive);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((s) => !s.isActive);
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((s) => s.type === typeFilter);
    }

    setFilteredSubjects(filtered);
  }, [subjects, searchQuery, statusFilter, typeFilter]);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/subjects");
      if (response.ok) {
        const data = await response.json();
        setSubjects(data.data.subjects || []);
        setFilteredSubjects(data.data.subjects || []);
      } else {
        toast({
          title: "Failed to fetch subjects",
          description: "Please try again later",
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Failed to fetch subjects:", error);
      toast({
        title: "Network error",
        description: "Could not connect to server",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (subject: Subject) => {
    setEditingSubject(subject);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingSubject(null);
  };

  const handleDeleteClick = (subject: Subject) => {
    setDeleteConfirm(subject);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    try {
      const response = await fetch(`/api/admin/subjects/${deleteConfirm.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Subject deleted",
          description: `"${deleteConfirm.name}" has been removed`,
          variant: "success",
        });
        setDeleteConfirm(null);
        fetchSubjects();
      } else {
        const data = await response.json();
        toast({
          title: "Failed to delete",
          description: data.error || "Unknown error",
          variant: "error",
        });
      }
    } catch (error) {
      toast({
        title: "Network error",
        description: "Please try again",
        variant: "error",
      });
    }
  };

  const handleModalSuccess = () => {
    fetchSubjects();
  };

  // Quick add modal hook
  // NOTE: Must be defined after handleModalSuccess since it uses it
  const quickAddSubject = useQuickAddSubject({ onSuccess: handleModalSuccess });

  // Get subject type color
  const getSubjectTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      core: "bg-blue-100 text-blue-700 border-blue-200",
      elective: "bg-purple-100 text-purple-700 border-purple-200",
      language: "bg-green-100 text-green-700 border-green-200",
      additional: "bg-orange-100 text-orange-700 border-orange-200",
    };
    return colors[type] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const getStatusBadge = (subject: Subject) => {
    if (!subject.isActive) {
      return (
        <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-50">
          <XCircle className="w-3 h-3 mr-1" />
          Inactive
        </Badge>
      );
    }
    return (
      <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-50">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </Badge>
    );
  };

  // Calculate stats
  const totalSubjects = subjects.length;
  const activeSubjects = subjects.filter((s) => s.isActive).length;
  const coreSubjects = subjects.filter((s) => s.type === "core").length;
  const electiveSubjects = subjects.filter((s) => s.type === "elective").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Global Subjects
          </h1>
          <p className="text-gray-600">
            Manage global subject templates that schools can copy
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={quickAddSubject.open}
            variant="outline"
            className="border-pink-200 text-pink-700 hover:bg-pink-50 hover:border-pink-300"
          >
            <Plus className="w-4 h-4 mr-2" />
            Quick Add
          </Button>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
            className="text-white shadow-lg shadow-pink-500/30 hover:shadow-xl hover:shadow-pink-500/40 transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Subject
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <PremiumCard className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-500/10 to-pink-600/5 rounded-bl-full" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">Total Subjects</span>
              <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-pink-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{totalSubjects}</div>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircle className="w-3 h-3" />
              <span>{activeSubjects} active</span>
            </div>
          </div>
        </PremiumCard>

        <PremiumCard className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-bl-full" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">Core Subjects</span>
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Type className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{coreSubjects}</div>
            <div className="text-xs text-gray-500">Required curriculum</div>
          </div>
        </PremiumCard>

        <PremiumCard className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-bl-full" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">Electives</span>
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <Code className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{electiveSubjects}</div>
            <div className="text-xs text-gray-500">Optional subjects</div>
          </div>
        </PremiumCard>

        <PremiumCard className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-bl-full" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">Languages</span>
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {subjects.filter((s) => s.type === "language").length}
            </div>
            <div className="text-xs text-gray-500">Language options</div>
          </div>
        </PremiumCard>
      </div>

      {/* Search and Filter Bar */}
      <PremiumCard>
        <PremiumCardContent className="pt-0">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search subjects by name, code, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as FilterType)}
              className="px-4 py-2.5 rounded-lg border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none bg-white transition-all"
            >
              <option value="all">All Types</option>
              <option value="core">Core</option>
              <option value="elective">Elective</option>
              <option value="language">Language</option>
              <option value="additional">Additional</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
              className="px-4 py-2.5 rounded-lg border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none bg-white transition-all"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setTypeFilter("all");
                setStatusFilter("all");
              }}
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </PremiumCardContent>
      </PremiumCard>

      {/* Subjects Table */}
      <PremiumCard>
        <PremiumCardHeader>
          <PremiumCardTitle>All Global Subjects</PremiumCardTitle>
          <PremiumCardDescription>
            {filteredSubjects.length} {filteredSubjects.length === 1 ? "subject" : "subjects"}
            {(statusFilter !== "all" || typeFilter !== "all") && " (filtered)"}
          </PremiumCardDescription>
        </PremiumCardHeader>
        <PremiumCardContent>
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block w-8 h-8 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
              <p className="text-gray-500 mt-4">Loading subjects...</p>
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-900 font-medium mb-1">No subjects found</p>
              <p className="text-gray-500 text-sm mb-4">
                {searchQuery || typeFilter !== "all" || statusFilter !== "all"
                  ? "Try adjusting your filters or search query"
                  : "Get started by adding your first global subject"}
              </p>
              {!searchQuery && typeFilter === "all" && statusFilter === "all" && (
                <Button
                  onClick={() => setIsAddModalOpen(true)}
                  style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
                  className="text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Subject
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Subject</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Code</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Grade</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">Status</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubjects.map((subject) => (
                    <tr
                      key={subject.id}
                      className="border-b border-gray-100 hover:bg-pink-50/50 transition-colors group"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-start gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold flex-shrink-0 shadow-sm"
                            style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
                          >
                            {subject.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{subject.name}</p>
                            <p className="text-sm text-gray-500 line-clamp-1 max-w-xs">{subject.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono text-gray-700">
                          {subject.code}
                        </code>
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          variant="outline"
                          className={cn("text-xs", getSubjectTypeColor(subject.type))}
                        >
                          {subject.type}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        {subject.grade ? (
                          <Badge variant="outline" className="text-xs">
                            Grade {subject.grade}
                          </Badge>
                        ) : (
                          <span className="text-sm text-gray-400">All</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {getStatusBadge(subject)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                            onClick={() => handleEditClick(subject)}
                            title="Edit subject"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-red-100 hover:text-red-600 transition-colors"
                            onClick={() => handleDeleteClick(subject)}
                            title="Delete subject"
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
        </PremiumCardContent>
      </PremiumCard>

      {/* Quick Add Subject Modal */}
      <quickAddSubject.Modal />

      {/* Add Subject Modal */}
      <AddSubjectModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleModalSuccess}
      />

      {/* Edit Subject Modal */}
      {editingSubject && (
        <EditSubjectModal
          open={isEditModalOpen}
          onClose={handleCloseEditModal}
          onSuccess={handleModalSuccess}
          subject={editingSubject}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full animate-in fade-in-0 zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Subject</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-900">
                  You are about to delete <strong>{deleteConfirm.name}</strong> ({deleteConfirm.code}).
                </p>
                <p className="text-sm text-red-700 mt-2">
                  This will not affect schools that have already copied this subject to their catalog.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  className="flex-1"
                >
                  Delete Subject
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
