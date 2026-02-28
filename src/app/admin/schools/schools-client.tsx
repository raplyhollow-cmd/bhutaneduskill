"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PremiumCard, PremiumCardHeader, PremiumCardTitle, PremiumCardDescription, PremiumCardContent } from "@/components/admin/premium-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExpressAddModal, useExpressAdd } from "@/components/ui/express-add-modal";
import { TableSkeleton } from "@/components/ui/skeleton/table-skeleton";
import { StatCardSkeleton } from "@/components/ui/skeleton/card-skeleton";
import {
  Building2,
  Users,
  GraduationCap,
  Plus,
  Search,
  MapPin,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  TrendingUp,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { AddSchoolSlideIn } from "@/components/admin/add-school-slide-in";
import { EditSchoolModal } from "@/components/admin/edit-school-modal";
import { cn } from "@/lib/utils";

interface School {
  id: string;
  name: string;
  code: string;
  schoolType: string;
  level: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  createdAt: Date | string;
  tenantId: string;
  tenantName: string;
  districtId: string;
  districtName: string;
  isActive?: boolean;
  stats: {
    students: number;
    teachers: number;
    counselors: number;
  };
}

interface SchoolsClientProps {
  schoolsWithStats: School[];
  totalSchools: number;
  totalStudents: number;
  totalTeachers: number;
  totalCounselors: number;
  schoolTypes: Record<string, number>;
}

type FilterStatus = "all" | "active" | "pending" | "suspended";

export function SchoolsClient({
  schoolsWithStats,
  totalSchools,
  totalStudents,
  totalTeachers,
  totalCounselors,
  schoolTypes,
}: SchoolsClientProps) {
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<School | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [typeFilter, setTypeFilter] = useState("");

  // ExpressAddModal hook for quick school add
  const quickAdd = useExpressAdd();

  const handleModalSuccess = () => {
    router.refresh();
  };

  const handleEditClick = (school: School) => {
    setEditingSchool(school);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingSchool(null);
  };

  const handleDeleteClick = (school: School) => {
    setDeleteConfirm(school);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    try {
      const response = await fetch(`/api/schools/${deleteConfirm.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setDeleteConfirm(null);
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete school");
      }
    } catch (error) {
      alert("Network error. Please try again.");
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
  };

  // Quick add school handler - creates school with minimal info
  const handleQuickAddSchool = async (name: string): Promise<{ success: true; data?: unknown } | { success: false; error: string }> => {
    try {
      const response = await fetch("/api/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          code: name.substring(0, 3).toUpperCase() + Date.now().toString().slice(-3),
          schoolType: "MSS",
          level: "Middle Secondary",
          contactEmail: "contact@school.edu.bt",
          contactPhone: "+975",
          address: "Bhutan",
          districtId: null, // Will need to be set later
        }),
      });

      if (response.ok) {
        router.refresh();
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.error || "Failed to add school" };
      }
    } catch (error) {
      return { success: false, error: "Network error. Please try again." };
    }
  };

  // Filter schools
  const filteredSchools = schoolsWithStats.filter((school) => {
    const matchesSearch =
      school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.districtName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = !typeFilter || school.schoolType === typeFilter;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && school.isActive !== false) ||
      (statusFilter === "pending" && school.isActive === false) ||
      (statusFilter === "suspended" && school.isActive === false);

    return matchesSearch && matchesType && matchesStatus;
  });

  // Calculate stats for filters
  const activeSchools = schoolsWithStats.filter((s) => s.isActive !== false).length;
  const pendingSchools = schoolsWithStats.filter((s) => s.isActive === false).length;

  const filterChips: { key: FilterStatus; label: string; count: number; icon: LucideIcon }[] = [
    { key: "all", label: "All Schools", count: totalSchools, icon: Building2 },
    { key: "active", label: "Active", count: activeSchools, icon: CheckCircle },
    { key: "pending", label: "Pending", count: pendingSchools, icon: Clock },
    { key: "suspended", label: "Suspended", count: 0, icon: XCircle },
  ];

  const getSchoolTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      HSS: "bg-blue-100 text-blue-700 border-blue-200",
      MSS: "bg-green-100 text-green-700 border-green-200",
      LSS: "bg-purple-100 text-purple-700 border-purple-200",
      Primary: "bg-orange-100 text-orange-700 border-orange-200",
      Private: "bg-pink-100 text-pink-700 border-pink-200",
    };
    return colors[type] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const getStatusBadge = (school: School) => {
    if (school.isActive === false) {
      return (
        <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-50">
          <Clock className="w-3 h-3 mr-1" />
          Pending
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Schools Management
          </h1>
          <p className="text-gray-600">
            Manage all schools and tenants on the platform
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={quickAdd.open}
            className="shadow-sm hover:shadow-md transition-all"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Quick Add
          </Button>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
            className="text-white shadow-lg shadow-pink-500/30 hover:shadow-xl hover:shadow-pink-500/40 transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add School
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <PremiumCard className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-500/10 to-pink-600/5 rounded-bl-full" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">Total Schools</span>
              <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-pink-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{totalSchools}</div>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <TrendingUp className="w-3 h-3" />
              <span>{activeSchools} active</span>
            </div>
          </div>
        </PremiumCard>

        <PremiumCard className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-bl-full" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">Total Students</span>
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{totalStudents.toLocaleString()}</div>
            <div className="text-xs text-gray-500">Across all schools</div>
          </div>
        </PremiumCard>

        <PremiumCard className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-bl-full" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">Total Teachers</span>
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{totalTeachers.toLocaleString()}</div>
            <div className="text-xs text-gray-500">Across all schools</div>
          </div>
        </PremiumCard>

        <PremiumCard className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-bl-full" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">Counselors</span>
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <Users className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{totalCounselors}</div>
            <div className="text-xs text-gray-500">Assigned to schools</div>
          </div>
        </PremiumCard>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {filterChips.map((chip) => {
          const Icon = chip.icon;
          const isActive = statusFilter === chip.key;
          return (
            <button
              key={chip.key}
              onClick={() => setStatusFilter(chip.key)}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-pink-600 text-white shadow-md shadow-pink-500/30"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-pink-300 hover:bg-pink-50"
              )}
            >
              <Icon className="w-4 h-4" />
              {chip.label}
              <Badge
                variant="outline"
                className={cn(
                  "ml-1 text-xs",
                  isActive
                    ? "bg-white/20 text-white border-white/30"
                    : "bg-gray-100 text-gray-600 border-gray-200"
                )}
              >
                {chip.count}
              </Badge>
            </button>
          );
        })}
      </div>

      {/* Search and Filter Bar */}
      <PremiumCard>
        <PremiumCardContent className="pt-0">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search schools by name, code, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none bg-white transition-all"
            >
              <option value="">All School Types</option>
              <option value="HSS">Higher Secondary School</option>
              <option value="MSS">Middle Secondary School</option>
              <option value="LSS">Lower Secondary School</option>
              <option value="Primary">Primary School</option>
              <option value="Private">Private School</option>
            </select>
          </div>
        </PremiumCardContent>
      </PremiumCard>

      {/* Schools Table */}
      <PremiumCard>
        <PremiumCardHeader>
          <PremiumCardTitle>All Schools</PremiumCardTitle>
          <PremiumCardDescription>
            {filteredSchools.length} {filteredSchools.length === 1 ? "school" : "schools"}
            {statusFilter !== "all" && ` (${statusFilter})`}
          </PremiumCardDescription>
        </PremiumCardHeader>
        <PremiumCardContent>
          {filteredSchools.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-900 font-medium mb-1">No schools found</p>
              <p className="text-gray-500 text-sm mb-4">
                {searchQuery || typeFilter || statusFilter !== "all"
                  ? "Try adjusting your filters or search query"
                  : "Get started by adding your first school"}
              </p>
              {!searchQuery && !typeFilter && statusFilter === "all" && (
                <Button
                  onClick={() => setIsAddModalOpen(true)}
                  style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
                  className="text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add School
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">School</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Location</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">Students</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">Teachers</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">Status</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSchools.map((school) => (
                    <tr
                      key={school.id}
                      className="border-b border-gray-100 hover:bg-pink-50/50 transition-colors group"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-start gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold flex-shrink-0 shadow-sm"
                            style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
                          >
                            {school.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <a
                              href={`/admin/schools/${school.id}`}
                              className="font-semibold text-gray-900 hover:text-pink-600 transition-colors"
                            >
                              {school.name}
                            </a>
                            <p className="text-sm text-gray-500">Code: {school.code}</p>
                            {school.level && (
                              <Badge variant="outline" className="mt-1 text-xs border-gray-200">
                                {school.level}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          variant="outline"
                          className={cn("text-xs", getSchoolTypeColor(school.schoolType))}
                        >
                          {school.schoolType || "N/A"}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          {school.districtName && (
                            <div className="flex items-center gap-1 text-sm text-gray-700">
                              <MapPin className="w-3.5 h-3.5 text-gray-400" />
                              {school.districtName}
                            </div>
                          )}
                          {school.address && (
                            <p className="text-xs text-gray-500 truncate max-w-[200px]">
                              {school.address}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                          <Users className="w-4 h-4 text-gray-400" />
                          {school.stats.students}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                          <GraduationCap className="w-4 h-4 text-gray-400" />
                          {school.stats.teachers}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {getStatusBadge(school)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-pink-100 hover:text-pink-600 transition-colors"
                            onClick={() => router.push(`/admin/schools/${school.id}`)}
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                            onClick={() => handleEditClick(school)}
                            title="Edit school"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-red-100 hover:text-red-600 transition-colors"
                            onClick={() => handleDeleteClick(school)}
                            title="Delete school"
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

      {/* School Types Overview */}
      <PremiumCard>
        <PremiumCardHeader>
          <PremiumCardTitle>School Types Distribution</PremiumCardTitle>
          <PremiumCardDescription>Breakdown by school type</PremiumCardDescription>
        </PremiumCardHeader>
        <PremiumCardContent>
          <div className="flex flex-wrap gap-3">
            {Object.entries(schoolTypes).map(([type, count]: [string, number]) => (
              <Badge
                key={type}
                variant="outline"
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-all hover:shadow-md",
                  getSchoolTypeColor(type)
                )}
              >
                {type}: {count}
              </Badge>
            ))}
          </div>
        </PremiumCardContent>
      </PremiumCard>

      {/* Top Schools & Recent Additions */}
      <div className="grid lg:grid-cols-2 gap-6">
        <PremiumCard>
          <PremiumCardHeader>
            <PremiumCardTitle>Top Schools by Enrollment</PremiumCardTitle>
            <PremiumCardDescription>Highest student count</PremiumCardDescription>
          </PremiumCardHeader>
          <PremiumCardContent>
            <div className="space-y-4">
              {schoolsWithStats
                .sort((a, b) => b.stats.students - a.stats.students)
                .slice(0, 5)
                .map((school, index) => (
                  <div key={school.id} className="flex items-center gap-4">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
                        index === 0
                          ? "bg-gradient-to-br from-yellow-400 to-yellow-500 text-white"
                          : index === 1
                          ? "bg-gradient-to-br from-gray-300 to-gray-400 text-white"
                          : index === 2
                          ? "bg-gradient-to-br from-orange-400 to-orange-500 text-white"
                          : "bg-gray-100 text-gray-600"
                      )}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-medium text-gray-900 truncate">{school.name}</span>
                        <span className="text-sm text-gray-500 ml-2 flex-shrink-0">
                          {school.stats.students} students
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${(school.stats.students / (schoolsWithStats[0]?.stats.students || 1)) * 100}%`,
                            background: "linear-gradient(90deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </PremiumCardContent>
        </PremiumCard>

        <PremiumCard>
          <PremiumCardHeader>
            <PremiumCardTitle>Recently Added</PremiumCardTitle>
            <PremiumCardDescription>Latest schools to join platform</PremiumCardDescription>
          </PremiumCardHeader>
          <PremiumCardContent>
            <div className="space-y-3">
              {schoolsWithStats
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5)
                .map((school) => (
                  <div
                    key={school.id}
                    className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-pink-50/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/admin/schools/${school.id}`)}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold flex-shrink-0 shadow-sm"
                      style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
                    >
                      {school.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{school.name}</p>
                      <p className="text-sm text-gray-500">
                        {school.stats.students} students • {school.stats.teachers} teachers
                      </p>
                    </div>
                    {getStatusBadge(school)}
                  </div>
                ))}
            </div>
          </PremiumCardContent>
        </PremiumCard>
      </div>

      {/* Add School Slide-In Form */}
      <AddSchoolSlideIn
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleModalSuccess}
      />

      {/* Edit School Modal */}
      <EditSchoolModal
        open={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSuccess={handleModalSuccess}
        school={editingSchool}
      />

      {/* Quick Add School Modal */}
      <ExpressAddModal
        isOpen={quickAdd.isOpen}
        onClose={quickAdd.close}
        onSubmit={handleQuickAddSchool}
        title="Quick Add School"
        description="Enter school name (basic info will be auto-generated)"
        placeholder="e.g., Thimphu Middle Secondary School"
        successMessage="School added successfully! You can edit details later."
        errorMessage="Failed to add school. Please try again."
        icon={Building2}
        minLength={3}
        submitLabel="Press Enter to add school"
      />

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
                  <h3 className="text-lg font-semibold text-gray-900">Delete School</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-900">
                  You are about to delete <strong>{deleteConfirm.name}</strong>.
                </p>
                <p className="text-sm text-red-700 mt-2">
                  This will also remove all associated data including students, teachers, and assessments.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700">
                  <strong>Students:</strong> {deleteConfirm.stats.students} •
                  <strong> Teachers:</strong> {deleteConfirm.stats.teachers} •
                  <strong> Counselors:</strong> {deleteConfirm.stats.counselors}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleDeleteCancel}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  className="flex-1"
                >
                  Delete School
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
