"use client";

import { logger } from "@/lib/logger";
/**
 * PLATFORM ADMIN - RUB PROGRAMS CONTENT MANAGEMENT
 *
 * RUB Programs management page for platform administrators.
 * CRUD operations for programs offered by RUB colleges.
 */


import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BookOpen,
  Search,
  Plus,
  Edit,
  Trash2,
  Clock,
  Users,
  GraduationCap,
  Building2,
  CheckCircle,
  XCircle,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Code,
} from "lucide-react";
import Link from "next/link";

// Types for program data
interface Program {
  id: string;
  name: string;
  code: string;
  collegeId: string;
  level: string;
  field: string;
  discipline?: string;
  duration: number;
  durationType: string;
  totalSeats: number;
  minPercentage: number;
  requiredSubjects: string[];
  eligibilityCriteria?: string;
  tuitionFee: number;
  hostelFee: number;
  otherFees: number;
  description?: string;
  careerProspects: string[];
  isActive: boolean;
  admissionOpen: boolean;
  college?: {
    id: string;
    name: string;
  };
}

interface College {
  id: string;
  name: string;
}

type ProgramLevel = "certificate" | "diploma" | "bachelor" | "master" | "phd";
type ProgramField = "engineering" | "arts" | "science" | "business" | "education" | "medicine";

export default function AdminProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [filteredPrograms, setFilteredPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [fieldFilter, setFieldFilter] = useState<string>("all");
  const [collegeFilter, setCollegeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    collegeId: "",
    level: "bachelor",
    field: "engineering",
    discipline: "",
    duration: 4,
    durationType: "years",
    totalSeats: 40,
    minPercentage: 50,
    requiredSubjects: [] as string[],
    eligibilityCriteria: "",
    tuitionFee: 0,
    hostelFee: 0,
    otherFees: 0,
    description: "",
    careerProspects: [] as string[],
    isActive: true,
    admissionOpen: false,
  });

  // Fetch programs and colleges on mount
  useEffect(() => {
    Promise.all([fetchPrograms(), fetchColleges()]);
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...programs];

    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.college?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (levelFilter !== "all") {
      filtered = filtered.filter((p) => p.level === levelFilter);
    }

    if (fieldFilter !== "all") {
      filtered = filtered.filter((p) => p.field === fieldFilter);
    }

    if (collegeFilter !== "all") {
      filtered = filtered.filter((p) => p.collegeId === collegeFilter);
    }

    setFilteredPrograms(filtered);
    setCurrentPage(1);
  }, [programs, searchQuery, levelFilter, fieldFilter, collegeFilter]);

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/content/programs");
      if (!response.ok) throw new Error("Failed to fetch programs");
      const data = await response.json();
      setPrograms(data.programs || []);
      setFilteredPrograms(data.programs || []);
    } catch (error) {
      logger.error("Failed to fetch programs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchColleges = async () => {
    try {
      const response = await fetch("/api/admin/content/colleges");
      if (!response.ok) return;
      const data = await response.json();
      setColleges(data.colleges || []);
    } catch (error) {
      logger.error("Failed to fetch colleges:", error);
    }
  };

  const handleSubmit = async (isEdit: boolean) => {
    setIsSubmitting(true);
    try {
      const url = isEdit
        ? `/api/admin/content/programs?id=${editingProgram?.id}`
        : "/api/admin/content/programs";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to save program");

      if (isEdit) {
        setIsEditModalOpen(false);
        setEditingProgram(null);
      } else {
        setIsAddModalOpen(false);
      }

      resetForm();
      fetchPrograms();
    } catch (error) {
      logger.error("Failed to save program:", error);
      alert("Failed to save program. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      const response = await fetch(`/api/admin/content/programs?id=${deletingId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete program");

      setPrograms(programs.filter((p) => p.id !== deletingId));
      setShowDeleteDialog(false);
      setDeletingId(null);
    } catch (error) {
      logger.error("Failed to delete program:", error);
      alert("Failed to delete program. Please try again.");
    }
  };

  const openEditModal = (program: Program) => {
    setEditingProgram(program);
    setFormData({
      name: program.name || "",
      code: program.code || "",
      collegeId: program.collegeId || "",
      level: program.level || "bachelor",
      field: program.field || "engineering",
      discipline: program.discipline || "",
      duration: program.duration || 4,
      durationType: program.durationType || "years",
      totalSeats: program.totalSeats || 40,
      minPercentage: program.minPercentage || 50,
      requiredSubjects: program.requiredSubjects || [],
      eligibilityCriteria: program.eligibilityCriteria || "",
      tuitionFee: program.tuitionFee || 0,
      hostelFee: program.hostelFee || 0,
      otherFees: program.otherFees || 0,
      description: program.description || "",
      careerProspects: program.careerProspects || [],
      isActive: program.isActive ?? true,
      admissionOpen: program.admissionOpen || false,
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      collegeId: "",
      level: "bachelor",
      field: "engineering",
      discipline: "",
      duration: 4,
      durationType: "years",
      totalSeats: 40,
      minPercentage: 50,
      requiredSubjects: [],
      eligibilityCriteria: "",
      tuitionFee: 0,
      hostelFee: 0,
      otherFees: 0,
      description: "",
      careerProspects: [],
      isActive: true,
      admissionOpen: false,
    });
  };

  // Get unique values for filters
  const levels = Array.from(new Set(programs.map((p) => p.level))).filter(Boolean).sort();
  const fields = Array.from(new Set(programs.map((p) => p.field))).filter(Boolean).sort();

  // Level badge colors
  const levelColors: Record<string, string> = {
    certificate: "bg-gray-50 text-gray-700 border-gray-200",
    diploma: "bg-blue-50 text-blue-700 border-blue-200",
    bachelor: "bg-green-50 text-green-700 border-green-200",
    master: "bg-purple-50 text-purple-700 border-purple-200",
    phd: "bg-red-50 text-red-700 border-red-200",
  };

  // Pagination
  const totalPages = Math.ceil(filteredPrograms.length / itemsPerPage);
  const paginatedPrograms = filteredPrograms.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/admin/content">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Programs Management</h1>
              <p className="text-gray-600 text-sm">Manage RUB college programs</p>
            </div>
          </div>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
          style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
          className="text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Program
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{programs.length}</p>
                <p className="text-sm text-gray-500">Total Programs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {programs.filter((p) => p.level === "bachelor").length}
                </p>
                <p className="text-sm text-gray-500">Bachelor's</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {programs.reduce((sum, p) => sum + (p.totalSeats || 0), 0)}
                </p>
                <p className="text-sm text-gray-500">Total Seats</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-pink-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {programs.filter((p) => p.admissionOpen).length}
                </p>
                <p className="text-sm text-gray-500">Admissions Open</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search programs by name, code, or college..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="certificate">Certificate</SelectItem>
                <SelectItem value="diploma">Diploma</SelectItem>
                <SelectItem value="bachelor">Bachelor</SelectItem>
                <SelectItem value="master">Master</SelectItem>
                <SelectItem value="phd">PhD</SelectItem>
              </SelectContent>
            </Select>
            <Select value={fieldFilter} onValueChange={setFieldFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Field" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fields</SelectItem>
                <SelectItem value="engineering">Engineering</SelectItem>
                <SelectItem value="arts">Arts</SelectItem>
                <SelectItem value="science">Science</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="medicine">Medicine</SelectItem>
              </SelectContent>
            </Select>
            <Select value={collegeFilter} onValueChange={setCollegeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="College" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Colleges</SelectItem>
                {colleges.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Programs ({filteredPrograms.length})</CardTitle>
          <CardDescription>RUB college academic programs</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-pink-600 border-r-transparent"></div>
            </div>
          ) : paginatedPrograms.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No programs found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Program</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">College</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Level</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Duration</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Seats</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Min %</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPrograms.map((program) => (
                      <tr key={program.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{program.name}</p>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <Code className="w-3 h-3" />
                              <span className="font-mono">{program.code}</span>
                              {program.discipline && (
                                <>
                                  <span>•</span>
                                  <span>{program.discipline}</span>
                                </>
                              )}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {program.college?.name || "-"}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className={levelColors[program.level] || "bg-gray-50"}>
                            {program.level}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>
                              {program.duration} {program.durationType || "years"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Users className="w-4 h-4" />
                            <span>{program.totalSeats || "-"}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{program.minPercentage || "-"}%</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1">
                            {program.isActive ? (
                              <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-50 text-gray-700 border-gray-200 text-xs">
                                <XCircle className="w-3 h-3 mr-1" />
                                Inactive
                              </Badge>
                            )}
                            {program.admissionOpen && (
                              <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                                Admissions Open
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditModal(program)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:bg-red-50"
                              onClick={() => {
                                setDeletingId(program.id);
                                setShowDeleteDialog(true);
                              }}
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(currentPage * itemsPerPage, filteredPrograms.length)} of{" "}
                    {filteredPrograms.length}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Program Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add New Program</h2>
              <p className="text-sm text-gray-600 mt-1">Add a program to the database</p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(false);
              }}
              className="p-6 space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Program Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Bachelor of Computer Science"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="code">Program Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., BCS-2024"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="collegeId">College *</Label>
                <Select
                  value={formData.collegeId}
                  onValueChange={(value) => setFormData({ ...formData, collegeId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select college" />
                  </SelectTrigger>
                  <SelectContent>
                    {colleges.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="level">Level *</Label>
                  <Select
                    value={formData.level}
                    onValueChange={(value: ProgramLevel) => setFormData({ ...formData, level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="certificate">Certificate</SelectItem>
                      <SelectItem value="diploma">Diploma</SelectItem>
                      <SelectItem value="bachelor">Bachelor</SelectItem>
                      <SelectItem value="master">Master</SelectItem>
                      <SelectItem value="phd">PhD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="field">Field *</Label>
                  <Select
                    value={formData.field}
                    onValueChange={(value: ProgramField) => setFormData({ ...formData, field: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="engineering">Engineering</SelectItem>
                      <SelectItem value="arts">Arts & Humanities</SelectItem>
                      <SelectItem value="science">Science</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="medicine">Medicine</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="discipline">Discipline</Label>
                <Input
                  id="discipline"
                  value={formData.discipline}
                  onChange={(e) => setFormData({ ...formData, discipline: e.target.value })}
                  placeholder="e.g., Computer Science"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="duration">Duration *</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="durationType">Duration Type *</Label>
                  <Select
                    value={formData.durationType}
                    onValueChange={(value) => setFormData({ ...formData, durationType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="years">Years</SelectItem>
                      <SelectItem value="semesters">Semesters</SelectItem>
                      <SelectItem value="months">Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="totalSeats">Total Seats</Label>
                  <Input
                    id="totalSeats"
                    type="number"
                    min="1"
                    value={formData.totalSeats}
                    onChange={(e) => setFormData({ ...formData, totalSeats: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="minPercentage">Minimum Percentage Required (%)</Label>
                <Input
                  id="minPercentage"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.minPercentage}
                  onChange={(e) => setFormData({ ...formData, minPercentage: parseInt(e.target.value) || 0 })}
                  placeholder="e.g., 50"
                />
              </div>

              <div>
                <Label htmlFor="requiredSubjects">Required Subjects (comma-separated)</Label>
                <Input
                  id="requiredSubjects"
                  value={formData.requiredSubjects.join(", ")}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      requiredSubjects: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder="e.g., Mathematics, Physics, English"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="tuitionFee">Tuition Fee (Nu./sem)</Label>
                  <Input
                    id="tuitionFee"
                    type="number"
                    min="0"
                    value={formData.tuitionFee}
                    onChange={(e) => setFormData({ ...formData, tuitionFee: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="hostelFee">Hostel Fee (Nu./sem)</Label>
                  <Input
                    id="hostelFee"
                    type="number"
                    min="0"
                    value={formData.hostelFee}
                    onChange={(e) => setFormData({ ...formData, hostelFee: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="otherFees">Other Fees (Nu./sem)</Label>
                  <Input
                    id="otherFees"
                    type="number"
                    min="0"
                    value={formData.otherFees}
                    onChange={(e) => setFormData({ ...formData, otherFees: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the program..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="careerProspects">Career Prospects (comma-separated)</Label>
                <Input
                  id="careerProspects"
                  value={formData.careerProspects.join(", ")}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      careerProspects: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder="e.g., Software Engineer, Data Analyst, IT Consultant"
                />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-pink-600"
                  />
                  <span>Program is active</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.admissionOpen}
                    onChange={(e) => setFormData({ ...formData, admissionOpen: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-pink-600"
                  />
                  <span>Admissions open</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.name || !formData.code || !formData.collegeId}
                  className="flex-1"
                  style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
                >
                  {isSubmitting ? "Creating..." : "Create Program"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Program Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Edit Program</h2>
              <p className="text-sm text-gray-600 mt-1">Update program information</p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(true);
              }}
              className="p-6 space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Program Name *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-code">Program Code *</Label>
                  <Input
                    id="edit-code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-collegeId">College *</Label>
                <Select
                  value={formData.collegeId}
                  onValueChange={(value) => setFormData({ ...formData, collegeId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select college" />
                  </SelectTrigger>
                  <SelectContent>
                    {colleges.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-level">Level *</Label>
                  <Select
                    value={formData.level}
                    onValueChange={(value: ProgramLevel) => setFormData({ ...formData, level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="certificate">Certificate</SelectItem>
                      <SelectItem value="diploma">Diploma</SelectItem>
                      <SelectItem value="bachelor">Bachelor</SelectItem>
                      <SelectItem value="master">Master</SelectItem>
                      <SelectItem value="phd">PhD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-field">Field *</Label>
                  <Select
                    value={formData.field}
                    onValueChange={(value: ProgramField) => setFormData({ ...formData, field: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="engineering">Engineering</SelectItem>
                      <SelectItem value="arts">Arts & Humanities</SelectItem>
                      <SelectItem value="science">Science</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="medicine">Medicine</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-discipline">Discipline</Label>
                <Input
                  id="edit-discipline"
                  value={formData.discipline}
                  onChange={(e) => setFormData({ ...formData, discipline: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-duration">Duration *</Label>
                  <Input
                    id="edit-duration"
                    type="number"
                    min="1"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-durationType">Duration Type *</Label>
                  <Select
                    value={formData.durationType}
                    onValueChange={(value) => setFormData({ ...formData, durationType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="years">Years</SelectItem>
                      <SelectItem value="semesters">Semesters</SelectItem>
                      <SelectItem value="months">Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-totalSeats">Total Seats</Label>
                  <Input
                    id="edit-totalSeats"
                    type="number"
                    min="1"
                    value={formData.totalSeats}
                    onChange={(e) => setFormData({ ...formData, totalSeats: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-minPercentage">Minimum Percentage Required (%)</Label>
                <Input
                  id="edit-minPercentage"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.minPercentage}
                  onChange={(e) => setFormData({ ...formData, minPercentage: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-tuitionFee">Tuition Fee (Nu./sem)</Label>
                  <Input
                    id="edit-tuitionFee"
                    type="number"
                    min="0"
                    value={formData.tuitionFee}
                    onChange={(e) => setFormData({ ...formData, tuitionFee: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-hostelFee">Hostel Fee (Nu./sem)</Label>
                  <Input
                    id="edit-hostelFee"
                    type="number"
                    min="0"
                    value={formData.hostelFee}
                    onChange={(e) => setFormData({ ...formData, hostelFee: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-otherFees">Other Fees (Nu./sem)</Label>
                  <Input
                    id="edit-otherFees"
                    type="number"
                    min="0"
                    value={formData.otherFees}
                    onChange={(e) => setFormData({ ...formData, otherFees: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-pink-600"
                  />
                  <span>Program is active</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.admissionOpen}
                    onChange={(e) => setFormData({ ...formData, admissionOpen: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-pink-600"
                  />
                  <span>Admissions open</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                  style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
                >
                  {isSubmitting ? "Updating..." : "Update Program"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Program</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this program? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeletingId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                style={{ background: "linear-gradient(135deg, rgb(239 68 68) 0%, rgb(220 38 38) 100%)" }}
                className="text-white"
                onClick={handleDelete}
              >
                Delete Program
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
