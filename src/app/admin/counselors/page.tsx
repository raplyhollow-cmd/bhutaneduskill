"use client";

import { logger } from "@/lib/logger";
/**
 * PLATFORM ADMIN - COUNSELORS MANAGEMENT (Client Component)
 *
 * Multi-tenant counselor management page for platform administrators.
 * View, verify, and manage all counselors across all schools.
 */


import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserCheck,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  GraduationCap,
  FileText,
  MessageSquare,
  Loader2,
  CheckCircle2,
  X,
  Plus,
} from "lucide-react";
import { AddCounselorModal } from "@/components/admin/add-counselor-modal";
import { EditCounselorModal } from "@/components/admin/edit-counselor-modal";
import {
  verifyCounselor,
  deleteCounselor,
} from "@/app/admin/counselors/actions";
import type { User } from "@/types";

interface CounselorAssignment {
  schoolId: string;
  schoolName: string;
  schoolCode: string;
}

interface CounselorStats {
  assignedSchools: number;
  totalNotes: number;
  activePlans: number;
}

interface CounselorData extends User {
  schoolName: string | null;
  stats: CounselorStats;
  assignments: CounselorAssignment[];
}

export default function AdminCounselorsPage() {
  const [loading, setLoading] = useState(true);
  const [counselors, setCounselors] = useState<CounselorData[]>([]);
  const [filteredCounselors, setFilteredCounselors] = useState<CounselorData[]>([]);
  const [uniqueSchools, setUniqueSchools] = useState<CounselorData[]>([]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCounselor, setEditingCounselor] = useState<CounselorData | null>(null);
  const [viewingCounselor, setViewingCounselor] = useState<CounselorData | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [deletingCounselor, setDeletingCounselor] = useState<CounselorData | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState<string | null>(null);

  // Fetch counselors on mount
  useEffect(() => {
    fetchCounselors();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...counselors];

    if (searchQuery) {
      filtered = filtered.filter(
        (counselor) =>
          counselor.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          counselor.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          counselor.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (schoolFilter !== "all") {
      filtered = filtered.filter((c) => c.schoolId === schoolFilter);
    }

    if (statusFilter === "verified") {
      filtered = filtered.filter((c) => c.emailVerified);
    } else if (statusFilter === "pending") {
      filtered = filtered.filter((c) => !c.emailVerified);
    }

    setFilteredCounselors(filtered);
  }, [counselors, searchQuery, schoolFilter, statusFilter]);

  const fetchCounselors = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/users?role=counselor&limit=200");
      if (!response.ok) throw new Error("Failed to fetch counselors");

      const data = await response.json();
      // API returns { success: true, data: { data: [...], pagination: {...} } }
      const counselorsData: CounselorData[] = data.data?.data || [];

      // Enrich with stats and assignments (for now using mock stats)
      const enriched = counselorsData.map((c: CounselorData) => ({
        ...c,
        stats: {
          assignedSchools: 0,
          totalNotes: 0,
          activePlans: 0,
        },
        assignments: [],
      }));

      setCounselors(enriched);
      setFilteredCounselors(enriched);

      // Get unique schools
      const uniqueSchoolsMap = new Map(
        enriched.filter((c: CounselorData) => c.schoolName).map((c: CounselorData) => [c.schoolId as string, c])
      );
      const schools = Array.from(uniqueSchoolsMap.values());
      setUniqueSchools(schools);
    } catch (error) {
      logger.error("Failed to fetch counselors:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCounselor = (counselor: CounselorData) => {
    setViewingCounselor(counselor);
    setIsViewDialogOpen(true);
  };

  const handleEditCounselor = (counselor: CounselorData) => {
    setEditingCounselor(counselor);
    setIsEditModalOpen(true);
  };

  const handleVerifyCounselor = async (counselor: CounselorData) => {
    setIsVerifying(counselor.id);
    try {
      await verifyCounselor(counselor.id);
      // Refresh counselors list
      await fetchCounselors();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to verify counselor");
    } finally {
      setIsVerifying(null);
    }
  };

  const handleDeleteCounselor = (counselor: CounselorData) => {
    setDeletingCounselor(counselor);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteCounselor = async () => {
    if (!deletingCounselor) return;

    try {
      await deleteCounselor(deletingCounselor.id);
      setIsDeleteDialogOpen(false);
      setDeletingCounselor(null);
      await fetchCounselors();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete counselor");
    }
  };

  // Calculate stats
  const totalCounselors = filteredCounselors.length;
  const verifiedCounselors = filteredCounselors.filter((c) => c.emailVerified).length;
  const pendingCounselors = filteredCounselors.filter((c) => !c.emailVerified).length;
  const totalActivePlans = filteredCounselors.reduce((sum, c) => sum + (c.stats?.activePlans || 0), 0);
  const totalNotes = filteredCounselors.reduce((sum, c) => sum + (c.stats?.totalNotes || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="ml-3 text-gray-600">Loading counselors...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Counselors Management</h1>
          <p className="text-gray-600">
            View and manage all counselors across the platform
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Advanced Filters
          </Button>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
            className="text-white"
          >
            <UserCheck className="w-4 h-4 mr-2" />
            Add Counselor
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Total Counselors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalCounselors}</div>
            <p className="text-xs text-gray-500 mt-1">Across all schools</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              Verified
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{verifiedCounselors}</div>
            <p className="text-xs text-gray-500">
              {((verifiedCounselors / totalCounselors) * 100).toFixed(1)}% verified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{pendingCounselors}</div>
            <p className="text-xs text-gray-500">Awaiting verification</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Active Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalActivePlans}</div>
            <p className="text-xs text-gray-500">Career plans active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Total Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalNotes}</div>
            <p className="text-xs text-gray-500">Counselor notes</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search counselors by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 min-h-[44px] rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
              />
            </div>
            <select
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
              className="px-4 py-3 min-h-[44px] rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none bg-white"
            >
              <option value="all">All Schools</option>
              {uniqueSchools.map((school) => (
                <option key={school.schoolId} value={school.schoolId}>
                  {school.schoolName}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 min-h-[44px] rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending Verification</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Counselors Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Counselors</CardTitle>
              <CardDescription>
                {filteredCounselors.length} counselors across {uniqueSchools.length} schools
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Counselor</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">School Assignments</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600 text-sm">Active Plans</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600 text-sm">Total Notes</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Last Login</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600 text-sm">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCounselors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                          <UserCheck className="w-8 h-8 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium">No counselors found</p>
                          <p className="text-gray-500 text-sm">Try adjusting your filters</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCounselors.map((counselor) => (
                    <tr key={counselor.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-start gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
                            style={{ background: "linear-gradient(135deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)" }}
                          >
                            {counselor.firstName?.[0]}
                            {counselor.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {counselor.firstName} {counselor.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{counselor.email || "No email"}</p>
                            {counselor.phone && (
                              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                <Phone className="w-3 h-3" />
                                {counselor.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-2">
                          {counselor.assignments && counselor.assignments.length > 0 ? (
                            counselor.assignments.map((assignment) => (
                              <div key={assignment.schoolId} className="flex items-center gap-2">
                                <Building2 className="w-3 h-3 text-gray-400" />
                                <span className="text-sm text-gray-700">{assignment.schoolName}</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-sm text-gray-400">No assignments</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-900">
                          <FileText className="w-4 h-4 text-purple-400" />
                          {counselor.stats.activePlans}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-900">
                          <MessageSquare className="w-4 h-4 text-gray-400" />
                          {counselor.stats.totalNotes}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {counselor.lastLogin ? (
                          <div className="text-sm text-gray-600">
                            {new Date(counselor.lastLogin).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Never</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {!counselor.emailVerified ? (
                          <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        ) : counselor.lastLogin ? (
                          <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-pink-50 hover:text-pink-600"
                            title="View details"
                            onClick={() => handleViewCounselor(counselor)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-pink-50 hover:text-pink-600"
                            title="Edit counselor"
                            onClick={() => handleEditCounselor(counselor)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-purple-50 hover:text-purple-600"
                            title="Manage assignments"
                          >
                            <Building2 className="w-4 h-4" />
                          </Button>
                          {!counselor.emailVerified && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-green-50 hover:text-green-600"
                              title="Verify counselor"
                              onClick={() => handleVerifyCounselor(counselor)}
                              disabled={isVerifying === counselor.id}
                            >
                              <ShieldCheck className={`w-4 h-4 ${isVerifying === counselor.id ? 'animate-spin' : ''}`} />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                            title="Delete counselor"
                            onClick={() => handleDeleteCounselor(counselor)}
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

      {/* Pending Verifications */}
      {pendingCounselors > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Pending Verifications
            </CardTitle>
            <CardDescription>
              {pendingCounselors} counselor(s) awaiting verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredCounselors
                .filter((c) => !c.emailVerified)
                .slice(0, 5)
                .map((counselor) => (
                  <div
                    key={counselor.id}
                    className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                        style={{ background: "linear-gradient(135deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)" }}
                      >
                        {counselor.firstName?.[0]}
                        {counselor.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {counselor.firstName} {counselor.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{counselor.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewCounselor(counselor)}
                      >
                        Review
                      </Button>
                      <Button
                        size="sm"
                        style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
                        onClick={() => handleVerifyCounselor(counselor)}
                        disabled={isVerifying === counselor.id}
                      >
                        <ShieldCheck className={`w-4 h-4 mr-2 ${isVerifying === counselor.id ? 'animate-spin' : ''}`} />
                        Verify
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* School Assignments Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            School Assignments Overview
          </CardTitle>
          <CardDescription>Counselor distribution across schools</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uniqueSchools.slice(0, 6).map((school) => {
              const schoolCounselors = filteredCounselors.filter((c) =>
                c.assignments?.some((a) => a.schoolId === school.schoolId)
              );
              return (
                <div key={school.schoolId} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{school.schoolName}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{
                        borderColor: "rgb(236 72 153)",
                        color: "rgb(219 39 119)",
                      }}
                    >
                      {schoolCounselors.length} counselor(s)
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {schoolCounselors.map((c) => (
                      <Badge key={c.id} variant="outline" className="text-xs bg-purple-50">
                        {c.firstName} {c.lastName?.[0]}.
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Counselors by Active Plans</CardTitle>
            <CardDescription>Counselors managing the most career plans</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredCounselors
                .sort((a, b) => (b.stats?.activePlans || 0) - (a.stats?.activePlans || 0))
                .filter((c) => c.stats?.activePlans > 0)
                .slice(0, 5)
                .map((counselor, index) => (
                  <div key={counselor.id} className="flex items-center gap-4">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0
                          ? "bg-yellow-100 text-yellow-700"
                          : index === 1
                          ? "bg-gray-100 text-gray-700"
                          : index === 2
                          ? "bg-orange-100 text-orange-700"
                          : "bg-gray-50 text-gray-600"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900">
                          {counselor.firstName} {counselor.lastName}
                        </span>
                        <span className="text-sm text-gray-500">{counselor.stats?.activePlans || 0} plans</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recently Added Counselors</CardTitle>
            <CardDescription>Latest counselors to join the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredCounselors
                .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                .slice(0, 5)
                .map((counselor) => (
                  <div key={counselor.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                      style={{ background: "linear-gradient(135deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)" }}
                    >
                      {counselor.firstName?.[0]}
                      {counselor.lastName?.[0]}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {counselor.firstName} {counselor.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {counselor.schoolName} • {counselor.stats?.assignedSchools || 0} school(s)
                      </p>
                    </div>
                    {!counselor.emailVerified ? (
                      <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    ) : (
                      <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Actions</CardTitle>
          <CardDescription>Perform actions on multiple counselors at once</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="min-h-[44px]">
              <Mail className="w-4 h-4 mr-2" />
              Send Email to Selected
            </Button>
            <Button variant="outline" className="min-h-[44px]">
              <Building2 className="w-4 h-4 mr-2" />
              Assign to Schools
            </Button>
            <Button variant="outline" className="min-h-[44px]">
              <ShieldCheck className="w-4 h-4 mr-2" />
              Verify Selected
            </Button>
            <Button variant="outline" className="min-h-[44px] text-red-600 hover:bg-red-50">
              <Trash2 className="w-4 h-4 mr-2" />
              Remove Selected
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Counselor Modal */}
      <AddCounselorModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchCounselors}
      />

      {/* Edit Counselor Modal */}
      <EditCounselorModal
        open={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingCounselor(null);
        }}
        onSuccess={fetchCounselors}
        counselor={editingCounselor}
      />

      {/* View Counselor Dialog */}
      {isViewDialogOpen && viewingCounselor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Counselor Details</h2>
              <button
                onClick={() => setIsViewDialogOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
                  style={{ background: "linear-gradient(135deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)" }}
                >
                  {viewingCounselor.firstName?.[0]}
                  {viewingCounselor.lastName?.[0]}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {viewingCounselor.firstName} {viewingCounselor.lastName}
                  </h3>
                  <p className="text-gray-500">{viewingCounselor.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {!viewingCounselor.emailVerified ? (
                      <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending Verification
                      </Badge>
                    ) : (
                      <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Mail className="w-4 h-4" />
                    Email
                  </div>
                  <p className="font-medium">{viewingCounselor.email}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Phone className="w-4 h-4" />
                    Phone
                  </div>
                  <p className="font-medium">{viewingCounselor.phone || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Building2 className="w-4 h-4" />
                    School
                  </div>
                  <p className="font-medium">{viewingCounselor.schoolName || "Unassigned"}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    Joined
                  </div>
                  <p className="font-medium">
                    {viewingCounselor.createdAt ? new Date(viewingCounselor.createdAt).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>

              {/* Assignments */}
              {viewingCounselor.assignments && viewingCounselor.assignments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">School Assignments</h4>
                  <div className="flex flex-wrap gap-2">
                    {viewingCounselor.assignments.map((assignment) => (
                      <Badge key={assignment.schoolId} variant="outline">
                        {assignment.schoolName}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
              <Button
                variant="outline"
                onClick={() => setIsViewDialogOpen(false)}
              >
                Close
              </Button>
              {!viewingCounselor.emailVerified && (
                <Button
                  style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
                  className="text-white"
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    handleVerifyCounselor(viewingCounselor);
                  }}
                  disabled={isVerifying === viewingCounselor.id}
                >
                  <ShieldCheck className={`w-4 h-4 mr-2 ${isVerifying === viewingCounselor.id ? 'animate-spin' : ''}`} />
                  Verify Counselor
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && deletingCounselor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete Counselor?</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete <strong>{deletingCounselor.firstName} {deletingCounselor.lastName}</strong>?
              This will remove the counselor from the system and all associated data.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setDeletingCounselor(null);
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={confirmDeleteCounselor}
              >
                Delete Counselor
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
