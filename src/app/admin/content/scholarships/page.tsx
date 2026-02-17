/**
 * PLATFORM ADMIN - SCHOLARSHIPS CONTENT MANAGEMENT
 *
 * RUB Scholarships management page for platform administrators.
 * CRUD operations for scholarships available to students.
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Award,
  Search,
  Plus,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  Building2,
  CheckCircle,
  XCircle,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

export default function AdminScholarshipsPage() {
  const [scholarships, setScholarships] = useState<any[]>([]);
  const [filteredScholarships, setFilteredScholarships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingScholarship, setEditingScholarship] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    type: "merit",
    provider: "RUB",
    providerName: "",
    coveragePercentage: 100,
    coversTuition: true,
    coversHostel: false,
    coversBooks: false,
    coversLiving: false,
    minPercentage: 60,
    annualIncomeLimit: 0,
    duration: "program_duration",
    applicationOpenDate: "",
    applicationCloseDate: "",
    description: "",
    termsAndConditions: "",
    isActive: true,
  });

  // Fetch scholarships on mount
  useEffect(() => {
    fetchScholarships();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...scholarships];

    if (searchQuery) {
      filtered = filtered.filter(
        (s) =>
          s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.provider?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.code?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((s) => s.type === typeFilter);
    }

    if (providerFilter !== "all") {
      filtered = filtered.filter((s) => s.provider === providerFilter);
    }

    setFilteredScholarships(filtered);
    setCurrentPage(1);
  }, [scholarships, searchQuery, typeFilter, providerFilter]);

  const fetchScholarships = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/content/scholarships");
      if (!response.ok) throw new Error("Failed to fetch scholarships");
      const data = await response.json();
      setScholarships(data.scholarships || []);
      setFilteredScholarships(data.scholarships || []);
    } catch (error) {
      console.error("Failed to fetch scholarships:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (isEdit: boolean) => {
    setIsSubmitting(true);
    try {
      const url = isEdit
        ? `/api/admin/content/scholarships?id=${editingScholarship?.id}`
        : "/api/admin/content/scholarships";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to save scholarship");

      if (isEdit) {
        setIsEditModalOpen(false);
        setEditingScholarship(null);
      } else {
        setIsAddModalOpen(false);
      }

      resetForm();
      fetchScholarships();
    } catch (error) {
      console.error("Failed to save scholarship:", error);
      alert("Failed to save scholarship. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      const response = await fetch(`/api/admin/content/scholarships?id=${deletingId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete scholarship");

      setScholarships(scholarships.filter((s) => s.id !== deletingId));
      setShowDeleteDialog(false);
      setDeletingId(null);
    } catch (error) {
      console.error("Failed to delete scholarship:", error);
      alert("Failed to delete scholarship. Please try again.");
    }
  };

  const openEditModal = (scholarship: any) => {
    setEditingScholarship(scholarship);
    setFormData({
      name: scholarship.name || "",
      code: scholarship.code || "",
      type: scholarship.type || "merit",
      provider: scholarship.provider || "RUB",
      providerName: scholarship.providerName || "",
      coveragePercentage: scholarship.coveragePercentage || 100,
      coversTuition: scholarship.coversTuition ?? true,
      coversHostel: scholarship.coversHostel || false,
      coversBooks: scholarship.coversBooks || false,
      coversLiving: scholarship.coversLiving || false,
      minPercentage: scholarship.minPercentage || 60,
      annualIncomeLimit: scholarship.annualIncomeLimit || 0,
      duration: scholarship.duration || "program_duration",
      applicationOpenDate: scholarship.applicationOpenDate || "",
      applicationCloseDate: scholarship.applicationCloseDate || "",
      description: scholarship.description || "",
      termsAndConditions: scholarship.termsAndConditions || "",
      isActive: scholarship.isActive ?? true,
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      type: "merit",
      provider: "RUB",
      providerName: "",
      coveragePercentage: 100,
      coversTuition: true,
      coversHostel: false,
      coversBooks: false,
      coversLiving: false,
      minPercentage: 60,
      annualIncomeLimit: 0,
      duration: "program_duration",
      applicationOpenDate: "",
      applicationCloseDate: "",
      description: "",
      termsAndConditions: "",
      isActive: true,
    });
  };

  // Get unique providers for filter
  const providers = Array.from(new Set(scholarships.map((s) => s.provider))).filter(Boolean).sort();

  // Type badge colors
  const typeColors: Record<string, string> = {
    merit: "bg-blue-50 text-blue-700 border-blue-200",
    need_based: "bg-green-50 text-green-700 border-green-200",
    sports: "bg-orange-50 text-orange-700 border-orange-200",
    arts: "bg-purple-50 text-purple-700 border-purple-200",
    government: "bg-red-50 text-red-700 border-red-200",
    private: "bg-gray-50 text-gray-700 border-gray-200",
  };

  // Pagination
  const totalPages = Math.ceil(filteredScholarships.length / itemsPerPage);
  const paginatedScholarships = filteredScholarships.slice(
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
              <h1 className="text-2xl font-bold text-gray-900">Scholarships Management</h1>
              <p className="text-gray-600 text-sm">Manage scholarships and financial aid</p>
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
          Add Scholarship
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{scholarships.length}</p>
                <p className="text-sm text-gray-500">Total Scholarships</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {scholarships.filter((s) => s.type === "merit").length}
                </p>
                <p className="text-sm text-gray-500">Merit-Based</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {scholarships.filter((s) => s.provider === "Govt").length}
                </p>
                <p className="text-sm text-gray-500">Government</p>
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
                  {scholarships.filter((s) => s.isActive).length}
                </p>
                <p className="text-sm text-gray-500">Active</p>
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
                placeholder="Search scholarships by name, code, or provider..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Scholarship Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="merit">Merit-Based</SelectItem>
                <SelectItem value="need_based">Need-Based</SelectItem>
                <SelectItem value="sports">Sports</SelectItem>
                <SelectItem value="arts">Arts</SelectItem>
                <SelectItem value="government">Government</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Providers</SelectItem>
                {providers.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
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
          <CardTitle>Scholarships ({filteredScholarships.length})</CardTitle>
          <CardDescription>Available scholarships for students</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-pink-600 border-r-transparent"></div>
            </div>
          ) : paginatedScholarships.length === 0 ? (
            <div className="text-center py-12">
              <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No scholarships found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Scholarship</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Provider</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Coverage</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Deadline</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedScholarships.map((scholarship) => (
                      <tr key={scholarship.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{scholarship.name}</p>
                            <p className="text-sm text-gray-500 font-mono">{scholarship.code}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className={typeColors[scholarship.type] || "bg-gray-50"}>
                            {scholarship.type?.replace("_", " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{scholarship.provider}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 text-gray-700">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            {scholarship.coveragePercentage ? `${scholarship.coveragePercentage}%` : "Variable"}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {scholarship.applicationCloseDate ? (
                            <div className="flex items-center gap-1 text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span className="text-sm">
                                {new Date(scholarship.applicationCloseDate).toLocaleDateString()}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {scholarship.isActive ? (
                            <Badge className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-50 text-gray-700 border-gray-200">
                              <XCircle className="w-3 h-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditModal(scholarship)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:bg-red-50"
                              onClick={() => {
                                setDeletingId(scholarship.id);
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
                    {Math.min(currentPage * itemsPerPage, filteredScholarships.length)} of{" "}
                    {filteredScholarships.length}
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

      {/* Add Scholarship Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add New Scholarship</h2>
              <p className="text-sm text-gray-600 mt-1">Add a scholarship to the database</p>
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
                  <Label htmlFor="name">Scholarship Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Merit Scholarship Program"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., RUB-MERIT-2024"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Scholarship Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="merit">Merit-Based</SelectItem>
                      <SelectItem value="need_based">Need-Based</SelectItem>
                      <SelectItem value="sports">Sports</SelectItem>
                      <SelectItem value="arts">Arts</SelectItem>
                      <SelectItem value="government">Government</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="provider">Provider *</Label>
                  <Select
                    value={formData.provider}
                    onValueChange={(value) => setFormData({ ...formData, provider: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RUB">RUB</SelectItem>
                      <SelectItem value="Govt">Government</SelectItem>
                      <SelectItem value="Private">Private Organization</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="providerName">Provider Name</Label>
                <Input
                  id="providerName"
                  value={formData.providerName}
                  onChange={(e) => setFormData({ ...formData, providerName: e.target.value })}
                  placeholder="e.g., Ministry of Education"
                />
              </div>

              <div>
                <Label htmlFor="coveragePercentage">Coverage Percentage: {formData.coveragePercentage}%</Label>
                <input
                  type="range"
                  id="coveragePercentage"
                  min="0"
                  max="100"
                  value={formData.coveragePercentage}
                  onChange={(e) => setFormData({ ...formData, coveragePercentage: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Coverage Details</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.coversTuition}
                      onChange={(e) => setFormData({ ...formData, coversTuition: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-pink-600"
                    />
                    <GraduationCap className="w-4 h-4 text-gray-500" />
                    <span>Tuition Fee</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.coversHostel}
                      onChange={(e) => setFormData({ ...formData, coversHostel: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-pink-600"
                    />
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <span>Hostel</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.coversBooks}
                      onChange={(e) => setFormData({ ...formData, coversBooks: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-pink-600"
                    />
                    <span>Books & Materials</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.coversLiving}
                      onChange={(e) => setFormData({ ...formData, coversLiving: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-pink-600"
                    />
                    <span>Living Expenses</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minPercentage">Min Percentage Required</Label>
                  <Input
                    id="minPercentage"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.minPercentage}
                    onChange={(e) => setFormData({ ...formData, minPercentage: parseInt(e.target.value) || 0 })}
                    placeholder="e.g., 60"
                  />
                </div>
                <div>
                  <Label htmlFor="annualIncomeLimit">Annual Income Limit (Nu.)</Label>
                  <Input
                    id="annualIncomeLimit"
                    type="number"
                    min="0"
                    value={formData.annualIncomeLimit}
                    onChange={(e) => setFormData({ ...formData, annualIncomeLimit: parseInt(e.target.value) || 0 })}
                    placeholder="e.g., 300000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Duration</Label>
                  <Select
                    value={formData.duration}
                    onValueChange={(value) => setFormData({ ...formData, duration: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="program_duration">Program Duration</SelectItem>
                      <SelectItem value="1_year">1 Year</SelectItem>
                      <SelectItem value="renewable">Renewable</SelectItem>
                      <SelectItem value="semester">Per Semester</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="applicationCloseDate">Application Deadline</Label>
                  <Input
                    id="applicationCloseDate"
                    type="date"
                    value={formData.applicationCloseDate}
                    onChange={(e) => setFormData({ ...formData, applicationCloseDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the scholarship..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="terms">Terms & Conditions</Label>
                <Textarea
                  id="terms"
                  value={formData.termsAndConditions}
                  onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
                  placeholder="Terms and conditions for the scholarship..."
                  rows={2}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-pink-600"
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Scholarship is currently active
                </Label>
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
                  disabled={isSubmitting || !formData.name || !formData.code}
                  className="flex-1"
                  style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
                >
                  {isSubmitting ? "Creating..." : "Create Scholarship"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Scholarship Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Edit Scholarship</h2>
              <p className="text-sm text-gray-600 mt-1">Update scholarship information</p>
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
                  <Label htmlFor="edit-name">Scholarship Name *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-code">Code *</Label>
                  <Input
                    id="edit-code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-type">Scholarship Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="merit">Merit-Based</SelectItem>
                      <SelectItem value="need_based">Need-Based</SelectItem>
                      <SelectItem value="sports">Sports</SelectItem>
                      <SelectItem value="arts">Arts</SelectItem>
                      <SelectItem value="government">Government</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-provider">Provider *</Label>
                  <Select
                    value={formData.provider}
                    onValueChange={(value) => setFormData({ ...formData, provider: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RUB">RUB</SelectItem>
                      <SelectItem value="Govt">Government</SelectItem>
                      <SelectItem value="Private">Private Organization</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-providerName">Provider Name</Label>
                <Input
                  id="edit-providerName"
                  value={formData.providerName}
                  onChange={(e) => setFormData({ ...formData, providerName: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="edit-coveragePercentage">Coverage Percentage: {formData.coveragePercentage}%</Label>
                <input
                  type="range"
                  id="edit-coveragePercentage"
                  min="0"
                  max="100"
                  value={formData.coveragePercentage}
                  onChange={(e) => setFormData({ ...formData, coveragePercentage: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Coverage Details</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.coversTuition}
                      onChange={(e) => setFormData({ ...formData, coversTuition: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-pink-600"
                    />
                    <GraduationCap className="w-4 h-4 text-gray-500" />
                    <span>Tuition Fee</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.coversHostel}
                      onChange={(e) => setFormData({ ...formData, coversHostel: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-pink-600"
                    />
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <span>Hostel</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.coversBooks}
                      onChange={(e) => setFormData({ ...formData, coversBooks: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-pink-600"
                    />
                    <span>Books & Materials</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.coversLiving}
                      onChange={(e) => setFormData({ ...formData, coversLiving: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-pink-600"
                    />
                    <span>Living Expenses</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-minPercentage">Min Percentage Required</Label>
                  <Input
                    id="edit-minPercentage"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.minPercentage}
                    onChange={(e) => setFormData({ ...formData, minPercentage: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-applicationCloseDate">Application Deadline</Label>
                  <Input
                    id="edit-applicationCloseDate"
                    type="date"
                    value={formData.applicationCloseDate}
                    onChange={(e) => setFormData({ ...formData, applicationCloseDate: e.target.value })}
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

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-pink-600"
                />
                <Label htmlFor="edit-isActive" className="cursor-pointer">
                  Scholarship is currently active
                </Label>
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
                  {isSubmitting ? "Updating..." : "Update Scholarship"}
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Scholarship</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this scholarship? This action cannot be undone.
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
                Delete Scholarship
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
