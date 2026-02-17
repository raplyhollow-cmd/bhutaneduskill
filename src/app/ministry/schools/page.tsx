"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  GraduationCap,
  Plus,
  Search,
  Filter,
  MapPin,
  Eye,
  Trash2,
  Power,
  PowerOff,
  Download,
  Check,
  X,
  AlertTriangle,
  MoreVertical,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AddSchoolModal } from "@/components/admin/add-school-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";

// ============================================================================
// TYPES
// ============================================================================

type SchoolStatus = "active" | "inactive" | "suspended";

interface School {
  id: string;
  name: string;
  code: string;
  state: string;
  city: string;
  schoolType: string | null;
  level: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  isActive: boolean;
  students?: number;
  teachers?: number;
  createdAt: string;
}

interface SchoolsResponse {
  data: {
    schools: School[];
    total: number;
    limit: number;
    offset: number;
  };
  status: number;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MinistrySchoolsPage() {
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSchools, setSelectedSchools] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [schoolToDelete, setSchoolToDelete] = useState<School | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const hasFetched = useRef(false);

  // Fetch schools from API
  const fetchSchools = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/ministry/schools");
      const data: SchoolsResponse = await response.json();

      if (response.ok && data.data?.schools) {
        setSchools(data.data.schools);
        setFilteredSchools(data.data.schools);
      } else {
        console.error("Failed to fetch schools:", data);
        // Fallback to empty array on error
        setSchools([]);
        setFilteredSchools([]);
      }
    } catch (error) {
      console.error("Error fetching schools:", error);
      setSchools([]);
      setFilteredSchools([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchSchools();
  }, []);

  // Filter schools
  useEffect(() => {
    let filtered = schools;

    if (searchTerm) {
      filtered = filtered.filter(
        (school) =>
          school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          school.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (districtFilter !== "all") {
      filtered = filtered.filter((school) => school.state === districtFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((school) => school.schoolType === typeFilter);
    }

    if (statusFilter === "active") {
      filtered = filtered.filter((school) => school.isActive);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((school) => !school.isActive);
    }

    setFilteredSchools(filtered);
  }, [searchTerm, districtFilter, typeFilter, statusFilter, schools]);

  // Districts and school types
  const districts = [
    "Thimphu",
    "Paro",
    "Punakha",
    "Wangdue",
    "Trongsa",
    "Bumthang",
    "Trashigang",
    "Mongar",
    "Samtse",
    "Sarpang",
  ];
  const schoolTypes = ["HSS", "MSS", "LSS", "Primary", "Private"];

  // Statistics
  const stats = {
    total: schools.length,
    active: schools.filter((s) => s.isActive).length,
    inactive: schools.filter((s) => !s.isActive).length,
    totalStudents: schools.reduce((sum, s) => sum + (s.students || 0), 0),
    totalTeachers: schools.reduce((sum, s) => sum + (s.teachers || 0), 0),
  };

  // Colors
  const colors = {
    primary: "rgb(168 85 247)",
    gradient: "linear-gradient(135deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)",
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSchools(new Set(filteredSchools.map((s) => s.id)));
    } else {
      setSelectedSchools(new Set());
    }
  };

  const handleSelectSchool = (schoolId: string, checked: boolean) => {
    const newSet = new Set(selectedSchools);
    if (checked) {
      newSet.add(schoolId);
    } else {
      newSet.delete(schoolId);
    }
    setSelectedSchools(newSet);
  };

  const isAllSelected =
    filteredSchools.length > 0 && selectedSchools.size === filteredSchools.length;
  const isSomeSelected = selectedSchools.size > 0 && !isAllSelected;

  const handleDeleteSchool = async () => {
    if (!schoolToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/ministry/schools/${schoolToDelete.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        // Remove from local state
        setSchools((prev) => prev.filter((s) => s.id !== schoolToDelete.id));
        setDeleteDialogOpen(false);
        setSchoolToDelete(null);
      } else {
        alert(data.error || "Failed to delete school");
      }
    } catch (error) {
      console.error("Error deleting school:", error);
      alert("Network error. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteDialog = (school: School) => {
    setSchoolToDelete(school);
    setDeleteDialogOpen(true);
  };

  const handleToggleStatus = async (schoolId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      const response = await fetch(`/api/ministry/schools/${schoolId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus ? "active" : "inactive" }),
      });

      if (response.ok) {
        // Update local state
        setSchools((prev) =>
          prev.map((s) => (s.id === schoolId ? { ...s, isActive: newStatus } : s))
        );
      } else {
        const data = await response.json();
        alert(data.error || "Failed to update school status");
      }
    } catch (error) {
      console.error("Error updating school status:", error);
      alert("Network error. Please try again.");
    }
  };

  const handleBulkStatusUpdate = async (status: SchoolStatus) => {
    if (selectedSchools.size === 0) return;

    setIsBulkUpdating(true);
    try {
      const response = await fetch("/api/ministry/schools", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolIds: Array.from(selectedSchools),
          status,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update local state
        const isActive = status === "active";
        setSchools((prev) =>
          prev.map((s) =>
            selectedSchools.has(s.id) ? { ...s, isActive } : s
          )
        );
        setSelectedSchools(new Set());
      } else {
        alert(data.error || "Failed to update school status");
      }
    } catch (error) {
      console.error("Error updating bulk status:", error);
      alert("Network error. Please try again.");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      // Create CSV content
      const headers = [
        "Name",
        "Code",
        "District",
        "City",
        "Type",
        "Level",
        "Contact Email",
        "Contact Phone",
        "Status",
        "Students",
        "Teachers",
        "Created Date",
      ];

      const rows = filteredSchools.map((school) => [
        `"${school.name}"`,
        `"${school.code}"`,
        `"${school.state}"`,
        `"${school.city}"`,
        `"${school.schoolType || ""}"`,
        `"${school.level || ""}"`,
        `"${school.contactEmail || ""}"`,
        `"${school.contactPhone || ""}"`,
        school.isActive ? "Active" : "Inactive",
        String(school.students || 0),
        String(school.teachers || 0),
        new Date(school.createdAt).toLocaleDateString(),
      ]);

      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join(
        "\n"
      );

      // Create download link
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `schools-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      alert("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Schools Management
          </h1>
          <p className="text-gray-600">Create and manage schools across Bhutan</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={isExporting || filteredSchools.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? "Exporting..." : "Export"}
          </Button>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            style={{ background: colors.gradient }}
            className="text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add School
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="border-l-4" style={{ borderLeftColor: colors.primary }}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div
                className="p-3 rounded-lg"
                style={{ background: "rgb(250 245 255)" }}
              >
                <Building2
                  className="w-6 h-6"
                  style={{ color: colors.primary }}
                />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Schools</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4" style={{ borderLeftColor: colors.primary }}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div
                className="p-3 rounded-lg"
                style={{ background: "rgb(250 245 255)" }}
              >
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4" style={{ borderLeftColor: colors.primary }}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div
                className="p-3 rounded-lg"
                style={{ background: "rgb(250 245 255)" }}
              >
                <X className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4" style={{ borderLeftColor: colors.primary }}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div
                className="p-3 rounded-lg"
                style={{ background: "rgb(250 245 255)" }}
              >
                <Users className="w-6 h-6" style={{ color: colors.primary }} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalStudents.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4" style={{ borderLeftColor: colors.primary }}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div
                className="p-3 rounded-lg"
                style={{ background: "rgb(250 245 255)" }}
              >
                <GraduationCap
                  className="w-6 h-6"
                  style={{ color: colors.primary }}
                />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Teachers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalTeachers.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search by school name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={districtFilter} onValueChange={setDistrictFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Districts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Districts</SelectItem>
                {districts.map((district) => (
                  <SelectItem key={district} value={district}>
                    {district}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {schoolTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedSchools.size > 0 && (
        <Card className="border-2" style={{ borderColor: colors.primary }}>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">{selectedSchools.size}</span>{" "}
                school{selectedSchools.size !== 1 ? "s" : ""} selected
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkStatusUpdate("active")}
                  disabled={isBulkUpdating}
                  className="text-green-600 hover:text-green-700"
                >
                  <Power className="w-4 h-4 mr-2" />
                  Activate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkStatusUpdate("inactive")}
                  disabled={isBulkUpdating}
                  className="text-red-600 hover:text-red-700"
                >
                  <PowerOff className="w-4 h-4 mr-2" />
                  Deactivate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSchools(new Set())}
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schools Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            All Schools ({filteredSchools.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-gray-500">
              Loading schools...
            </div>
          ) : filteredSchools.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              No schools found. Try adjusting your filters or add a new school.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-3 px-4 font-semibold text-gray-700 w-12">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all schools"
                      />
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      School
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Code
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      District
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Type
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Students
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Teachers
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSchools.map((school) => (
                    <tr
                      key={school.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 ${
                        !school.isActive ? "bg-gray-50" : ""
                      }`}
                    >
                      <td className="py-3 px-4">
                        <Checkbox
                          checked={selectedSchools.has(school.id)}
                          onCheckedChange={(checked) =>
                            handleSelectSchool(school.id, checked === true)
                          }
                          aria-label={`Select ${school.name}`}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {school.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {school.contactEmail}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {school.code}
                        </code>
                      </td>
                      <td className="py-3 px-4 text-gray-700">{school.state}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">{school.schoolType}</Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {school.students?.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {school.teachers?.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          className={
                            school.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {school.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleToggleStatus(school.id, school.isActive)
                            }
                            title={
                              school.isActive
                                ? "Deactivate school"
                                : "Activate school"
                            }
                          >
                            {school.isActive ? (
                              <PowerOff className="w-4 h-4 text-red-500" />
                            ) : (
                              <Power className="w-4 h-4 text-green-500" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(school)}
                            title="Delete school"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add School Modal */}
      <AddSchoolModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          fetchSchools();
          setIsAddModalOpen(false);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Delete School
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{schoolToDelete?.name}</span>?
              {schoolToDelete && (schoolToDelete.students || 0) > 0 && (
                <>
                  <br />
                  <br />
                  This school has{" "}
                  <span className="font-semibold">
                    {schoolToDelete.students} students
                  </span>{" "}
                  and{" "}
                  <span className="font-semibold">
                    {schoolToDelete.teachers || 0} teachers
                  </span>{" "}
                  associated with it. You may not be able to delete it if there
                  are active users.
                </>
              )}
              <br />
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSchool}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete School"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
