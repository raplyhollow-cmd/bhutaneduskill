"use client";

import { logger } from "@/lib/logger";
/**
 * PLATFORM ADMIN - COLLEGES CONTENT MANAGEMENT
 *
 * RUB Colleges management page for platform administrators.
 * CRUD operations for Royal University of Bhutan colleges.
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
  GraduationCap,
  Search,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Phone,
  Mail,
  Globe,
  CheckCircle,
  XCircle,
  Building2,
  Users,
  BookOpen,
  Wifi,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

export default function AdminCollegesPage() {
  const [colleges, setColleges] = useState<any[]>([]);
  const [filteredColleges, setFilteredColleges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dzongkhagFilter, setDzongkhagFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingCollege, setEditingCollege] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    type: "constituent",
    dzongkhag: "",
    location: "",
    website: "",
    email: "",
    phone: "",
    description: "",
    hasHostel: false,
    hasLibrary: true,
    hasLab: false,
    hasSports: false,
  });

  // Fetch colleges on mount
  useEffect(() => {
    fetchColleges();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...colleges];

    if (searchQuery) {
      filtered = filtered.filter(
        (college) =>
          college.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          college.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          college.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((college) => college.type === typeFilter);
    }

    if (dzongkhagFilter !== "all") {
      filtered = filtered.filter((college) => college.dzongkhag === dzongkhagFilter);
    }

    setFilteredColleges(filtered);
    setCurrentPage(1);
  }, [colleges, searchQuery, typeFilter, dzongkhagFilter]);

  const fetchColleges = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/content/colleges");
      if (!response.ok) throw new Error("Failed to fetch colleges");
      const data = await response.json();
      setColleges(data.colleges || []);
      setFilteredColleges(data.colleges || []);
    } catch (error) {
      logger.error("Failed to fetch colleges:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (isEdit: boolean) => {
    setIsSubmitting(true);
    try {
      const url = isEdit
        ? `/api/admin/content/colleges?id=${editingCollege?.id}`
        : "/api/admin/content/colleges";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to save college");

      if (isEdit) {
        setIsEditModalOpen(false);
        setEditingCollege(null);
      } else {
        setIsAddModalOpen(false);
      }

      resetForm();
      fetchColleges();
    } catch (error) {
      logger.error("Failed to save college:", error);
      alert("Failed to save college. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      const response = await fetch(`/api/admin/content/colleges?id=${deletingId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete college");

      setColleges(colleges.filter((c) => c.id !== deletingId));
      setShowDeleteDialog(false);
      setDeletingId(null);
    } catch (error) {
      logger.error("Failed to delete college:", error);
      alert("Failed to delete college. Please try again.");
    }
  };

  const openEditModal = (college: any) => {
    setEditingCollege(college);
    setFormData({
      name: college.name || "",
      code: college.code || "",
      type: college.type || "constituent",
      dzongkhag: college.dzongkhag || "",
      location: college.location || "",
      website: college.website || "",
      email: college.email || "",
      phone: college.phone || "",
      description: college.description || "",
      hasHostel: college.hasHostel || false,
      hasLibrary: college.hasLibrary ?? true,
      hasLab: college.hasLab || false,
      hasSports: college.hasSports || false,
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      type: "constituent",
      dzongkhag: "",
      location: "",
      website: "",
      email: "",
      phone: "",
      description: "",
      hasHostel: false,
      hasLibrary: true,
      hasLab: false,
      hasSports: false,
    });
  };

  // Get unique dzongkhags for filter
  const dzongkhags = Array.from(new Set(colleges.map((c) => c.dzongkhag))).filter(Boolean).sort();

  // Pagination
  const totalPages = Math.ceil(filteredColleges.length / itemsPerPage);
  const paginatedColleges = filteredColleges.slice(
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
              <h1 className="text-2xl font-bold text-gray-900">Colleges Management</h1>
              <p className="text-gray-600 text-sm">Manage RUB colleges and institutions</p>
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
          Add College
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{colleges.length}</p>
                <p className="text-sm text-gray-500">Total Colleges</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {colleges.filter((c) => c.type === "constituent").length}
                </p>
                <p className="text-sm text-gray-500">Constituent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {colleges.filter((c) => c.hasHostel).length}
                </p>
                <p className="text-sm text-gray-500">With Hostel</p>
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
                  {colleges.filter((c) => c.isActive).length}
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
                placeholder="Search colleges by name, code, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="College Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="constituent">Constituent</SelectItem>
                <SelectItem value="affiliated">Affiliated</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dzongkhagFilter} onValueChange={setDzongkhagFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Dzongkhag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dzongkhags</SelectItem>
                {dzongkhags.map((dz) => (
                  <SelectItem key={dz} value={dz}>
                    {dz}
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
          <CardTitle>Colleges ({filteredColleges.length})</CardTitle>
          <CardDescription>Royal University of Bhutan colleges</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-pink-600 border-r-transparent"></div>
            </div>
          ) : paginatedColleges.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No colleges found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">College</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Dzongkhag</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Facilities</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedColleges.map((college) => (
                      <tr key={college.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{college.name}</p>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <span className="font-mono text-xs">{college.code}</span>
                              {college.location && (
                                <>
                                  <span>•</span>
                                  <MapPin className="w-3 h-3" />
                                  <span>{college.location}</span>
                                </>
                              )}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant="outline"
                            className={
                              college.type === "constituent"
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }
                          >
                            {college.type === "constituent" ? "Constituent" : "Affiliated"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{college.dzongkhag || "-"}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1">
                            {college.hasHostel && <span title="Hostel"><Wifi className="w-4 h-4 text-blue-500" /></span>}
                            {college.hasLibrary && <span title="Library"><BookOpen className="w-4 h-4 text-green-500" /></span>}
                            {college.hasLab && <span title="Lab"><Users className="w-4 h-4 text-purple-500" /></span>}
                            {college.hasSports && <span title="Sports"><CheckCircle className="w-4 h-4 text-orange-500" /></span>}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {college.isActive ? (
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
                              onClick={() => openEditModal(college)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:bg-red-50"
                              onClick={() => {
                                setDeletingId(college.id);
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
                    {Math.min(currentPage * itemsPerPage, filteredColleges.length)} of {filteredColleges.length}
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

      {/* Add College Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add New College</h2>
              <p className="text-sm text-gray-600 mt-1">Add an RUB college to the database</p>
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
                  <Label htmlFor="name">College Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., College of Science and Technology"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="code">College Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., CST"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">College Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="constituent">Constituent</SelectItem>
                      <SelectItem value="affiliated">Affiliated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dzongkhag">Dzongkhag *</Label>
                  <Input
                    id="dzongkhag"
                    value={formData.dzongkhag}
                    onChange={(e) => setFormData({ ...formData, dzongkhag: e.target.value })}
                    placeholder="e.g., Thimphu"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Rinchending, Phuentsholing"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+975 2..."
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the college..."
                  rows={3}
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Facilities</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.hasHostel}
                      onChange={(e) => setFormData({ ...formData, hasHostel: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-pink-600"
                    />
                    <Wifi className="w-4 h-4 text-gray-500" />
                    <span>Hostel</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.hasLibrary}
                      onChange={(e) => setFormData({ ...formData, hasLibrary: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-pink-600"
                    />
                    <BookOpen className="w-4 h-4 text-gray-500" />
                    <span>Library</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.hasLab}
                      onChange={(e) => setFormData({ ...formData, hasLab: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-pink-600"
                    />
                    <Users className="w-4 h-4 text-gray-500" />
                    <span>Laboratory</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.hasSports}
                      onChange={(e) => setFormData({ ...formData, hasSports: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-pink-600"
                    />
                    <CheckCircle className="w-4 h-4 text-gray-500" />
                    <span>Sports</span>
                  </label>
                </div>
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
                  {isSubmitting ? "Creating..." : "Create College"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit College Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Edit College</h2>
              <p className="text-sm text-gray-600 mt-1">Update college information</p>
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
                  <Label htmlFor="edit-name">College Name *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-code">College Code *</Label>
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
                  <Label htmlFor="edit-type">College Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="constituent">Constituent</SelectItem>
                      <SelectItem value="affiliated">Affiliated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-dzongkhag">Dzongkhag *</Label>
                  <Input
                    id="edit-dzongkhag"
                    value={formData.dzongkhag}
                    onChange={(e) => setFormData({ ...formData, dzongkhag: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-location">Location *</Label>
                <Input
                  id="edit-location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-website">Website</Label>
                  <Input
                    id="edit-website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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

              <div>
                <Label className="text-sm font-medium">Facilities</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.hasHostel}
                      onChange={(e) => setFormData({ ...formData, hasHostel: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-pink-600"
                    />
                    <Wifi className="w-4 h-4 text-gray-500" />
                    <span>Hostel</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.hasLibrary}
                      onChange={(e) => setFormData({ ...formData, hasLibrary: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-pink-600"
                    />
                    <BookOpen className="w-4 h-4 text-gray-500" />
                    <span>Library</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.hasLab}
                      onChange={(e) => setFormData({ ...formData, hasLab: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-pink-600"
                    />
                    <Users className="w-4 h-4 text-gray-500" />
                    <span>Laboratory</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.hasSports}
                      onChange={(e) => setFormData({ ...formData, hasSports: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-pink-600"
                    />
                    <CheckCircle className="w-4 h-4 text-gray-500" />
                    <span>Sports</span>
                  </label>
                </div>
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
                  {isSubmitting ? "Updating..." : "Update College"}
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete College</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this college? This action cannot be undone.
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
                Delete College
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
