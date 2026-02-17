"use client";

import { logger } from "@/lib/logger";
/**
 * PLATFORM ADMIN - PARTNERS MANAGEMENT
 *
 * Manage RUB college and industry partners for career workshops.
 * Partnerships help students explore career opportunities.
 */


import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Users,
  GraduationCap,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  MapPin,
  Handshake,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  XCircle,
} from "lucide-react";
import Link from "next/link";

type PartnerType = "rub_college" | "industry" | "ngo" | "government";
type PartnerStatus = "active" | "pending" | "inactive";

interface Partner {
  id: string;
  name: string;
  type: PartnerType;
  email: string;
  phone: string;
  address: string;
  contactPerson?: string;
  description?: string;
  partnershipDate: string;
  status: PartnerStatus;
  workshopsConducted: number;
  studentsPlaced: number;
  schoolId?: string | null;
  schoolName?: string;
  createdAt: string;
  updatedAt: string;
}

interface PartnerStatistics {
  byType: {
    rub_college: number;
    industry: number;
    ngo: number;
    government: number;
  };
  byStatus: {
    active: number;
    pending: number;
    inactive: number;
  };
  total: number;
}

interface PartnersResponse {
  success: boolean;
  data: Partner[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  statistics: PartnerStatistics;
}

export default function AdminPartnersPage() {
  // State
  const [partners, setPartners] = useState<Partner[]>([]);
  const [stats, setStats] = useState<PartnerStatistics>({
    byType: { rub_college: 0, industry: 0, ngo: 0, government: 0 },
    byStatus: { active: 0, pending: 0, inactive: 0 },
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    type: "rub_college" as PartnerType,
    email: "",
    phone: "",
    address: "",
    contactPerson: "",
    description: "",
    partnershipDate: new Date().toISOString().split("T")[0],
    status: "active" as PartnerStatus,
  });

  // Fetch partners
  const fetchPartners = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (searchQuery) params.set("search", searchQuery);
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const response = await fetch(`/api/admin/partners?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch partners");
      }

      const data: PartnersResponse = await response.json();
      setPartners(data.data || []);
      setPagination(data.pagination);
      setStats(data.statistics);
    } catch (err) {
      logger.error("Failed to fetch partners:", err);
      setError("Failed to load partners. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and when filters/pagination change
  useEffect(() => {
    fetchPartners();
  }, [pagination.page]);

  // Handle search (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination((prev) => ({ ...prev, page: 1 }));
      fetchPartners();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, typeFilter, statusFilter]);

  // Create partner
  const createPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      logger.debug("[PARTNERS] Creating partner with data:", formData);
      const response = await fetch("/api/admin/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      logger.debug("[PARTNERS] Response status:", response.status);
      const responseData = await response.json();
      logger.debug("[PARTNERS] Response data:", responseData);

      if (!response.ok) {
        throw new Error(responseData.error || responseData.details || "Failed to create partner");
      }

      // Reset form and close modal
      setFormData({
        name: "",
        type: "rub_college",
        email: "",
        phone: "",
        address: "",
        contactPerson: "",
        description: "",
        partnershipDate: new Date().toISOString().split("T")[0],
        status: "active",
      });
      setShowCreateModal(false);

      // Refresh the list
      await fetchPartners();
    } catch (err: any) {
      logger.error("[PARTNERS] Failed to create partner:", err);
      setError(err.message || "Failed to create partner. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update partner
  const updatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartner) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/partners/${selectedPartner.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update partner");
      }

      // Reset and close modal
      setShowEditModal(false);
      setSelectedPartner(null);

      // Refresh the list
      await fetchPartners();
    } catch (err: any) {
      logger.error("Failed to update partner:", err);
      setError(err.message || "Failed to update partner. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete partner
  const deletePartner = async (partnerId: string) => {
    if (!confirm("Are you sure you want to delete this partner? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(partnerId);
    setError(null);

    try {
      const response = await fetch(`/api/admin/partners/${partnerId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete partner");
      }

      // Refresh the partners list
      await fetchPartners();
    } catch (err) {
      logger.error("Failed to delete partner:", err);
      setError("Failed to delete partner. Please try again.");
    } finally {
      setIsDeleting(null);
    }
  };

  // Open edit modal
  const openEditModal = (partner: Partner) => {
    setSelectedPartner(partner);
    setFormData({
      name: partner.name,
      type: partner.type,
      email: partner.email,
      phone: partner.phone,
      address: partner.address,
      contactPerson: partner.contactPerson || "",
      description: partner.description || "",
      partnershipDate: partner.partnershipDate.split("T")[0],
      status: partner.status,
    });
    setShowEditModal(true);
  };

  // Type badges
  const typeBadges = {
    rub_college: { label: "RUB College", color: "bg-purple-100 text-purple-700 border-purple-200" },
    industry: { label: "Industry", color: "bg-blue-100 text-blue-700 border-blue-200" },
    ngo: { label: "NGO", color: "bg-green-100 text-green-700 border-green-200" },
    government: { label: "Government", color: "bg-orange-100 text-orange-700 border-orange-200" },
  };

  // Status badges
  const statusBadges = {
    active: { label: "Active", color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle },
    pending: { label: "Pending", color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: Clock },
    inactive: { label: "Inactive", color: "bg-gray-50 text-gray-700 border-gray-200", icon: AlertCircle },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Partners Management
          </h1>
          <p className="text-gray-600">
            Manage RUB colleges and industry partners for career programs
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchPartners} disabled={isLoading}>
            <Filter className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
            className="text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Partner
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto">
            <XCircle className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Total Partners
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{isLoading ? "-" : stats.total}</div>
            <p className="text-xs text-gray-500 mt-1">Registered partners</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{isLoading ? "-" : stats.byStatus.active}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.total > 0 ? ((stats.byStatus.active / stats.total) * 100).toFixed(0) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{isLoading ? "-" : stats.byStatus.pending}</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-purple-600" />
              RUB Colleges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {isLoading ? "-" : stats.byType.rub_college}
            </div>
            <p className="text-xs text-gray-500 mt-1">College partners</p>
          </CardContent>
        </Card>
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
                placeholder="Search partners by name, type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
              />
            </div>

            {/* Type Filter */}
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="appearance-none px-4 py-3 pr-10 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none bg-white"
              >
                <option value="all">All Types</option>
                <option value="rub_college">RUB College</option>
                <option value="industry">Industry Partner</option>
                <option value="ngo">NGO</option>
                <option value="government">Government</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none px-4 py-3 pr-10 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Partners Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Partners</CardTitle>
              <CardDescription>
                Showing {partners.length} of {pagination.total} partners
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              <p className="ml-3 text-gray-600">Loading partners...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Partner</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Contact</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Partnership Date</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {partners.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                            <Handshake className="w-8 h-8 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-gray-900 font-medium">No partners found</p>
                            <p className="text-gray-500 text-sm">Add RUB colleges or industry partners to get started</p>
                          </div>
                          <Button
                            onClick={() => setShowCreateModal(true)}
                            style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
                            className="text-white"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Partner
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    partners.map((partner) => {
                      const badge = statusBadges[partner.status as keyof typeof statusBadges] || statusBadges.active;
                      const typeBadge = typeBadges[partner.type as keyof typeof typeBadges] || typeBadges.industry;

                      return (
                        <tr key={partner.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold flex-shrink-0"
                                style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
                              >
                                {partner.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <Link
                                  href={`/admin/partners/${partner.id}`}
                                  className="font-medium text-gray-900 hover:text-pink-600 transition-colors"
                                >
                                  {partner.name}
                                </Link>
                                <Badge
                                  variant="outline"
                                  className="mt-1 text-xs"
                                  style={{
                                    borderColor: typeBadge.color,
                                    color: typeBadge.color,
                                  }}
                                >
                                  {typeBadge.label}
                                </Badge>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-900">
                              {partner.contactPerson && (
                                <>
                                  <Users className="w-4 h-4 text-gray-400" />
                                  {partner.contactPerson}
                                </>
                              )}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              {partner.email && (
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <Mail className="w-3 h-3 text-gray-400" />
                                  {partner.email}
                                </div>
                              )}
                              {partner.phone && (
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <Phone className="w-3 h-3 text-gray-400" />
                                  {partner.phone}
                                </div>
                              )}
                              {partner.address && (
                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                  <MapPin className="w-3 h-3 text-gray-400" />
                                  {partner.address}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <Badge
                              variant="outline"
                              className={badge.color}
                            >
                              {badge.icon && <badge.icon className="w-3 h-3 mr-1" />}
                              {badge.label}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-sm text-gray-900">
                              {partner.partnershipDate
                                ? new Date(partner.partnershipDate).toLocaleDateString()
                                : "N/A"}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-pink-50 hover:text-pink-600"
                                title="View details"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-pink-50 hover:text-pink-600"
                                title="Edit partner"
                                onClick={() => openEditModal(partner)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                                title="Delete partner"
                                onClick={() => deletePartner(partner.id)}
                                disabled={isDeleting === partner.id}
                              >
                                {isDeleting === partner.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {partners.length > 0 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Showing {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} partners
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1 || isLoading}
                >
                  Previous
                </Button>
                <div className="flex items-center">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.page === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPagination((prev) => ({ ...prev, page: pageNum }))}
                        disabled={isLoading}
                        style={
                          pagination.page === pageNum
                            ? { background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)", color: "white", border: "none" }
                            : {}
                        }
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.totalPages || isLoading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats by Type */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Partners by Type</CardTitle>
            <CardDescription>Distribution of partner categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { type: "rub_college", label: "RUB Colleges", icon: GraduationCap, color: "bg-purple-100 text-purple-700" },
                { type: "industry", label: "Industry Partners", icon: Building2, color: "bg-blue-100 text-blue-700" },
                { type: "ngo", label: "NGOs", icon: Users, color: "bg-green-100 text-green-700" },
                { type: "government", label: "Government", icon: AlertCircle, color: "bg-orange-100 text-orange-700" },
              ].map((item) => {
                const count = stats.byType[item.type as keyof typeof stats.byType];
                return (
                  <div key={item.type} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${item.color}`}
                      >
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.label}</p>
                        <p className="text-sm text-gray-500">{count} partners</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTypeFilter(item.type)}
                    >
                      View All
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Partnerships</CardTitle>
            <CardDescription>Latest partner registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {partners.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No partners yet</p>
              ) : (
                partners
                  .sort((a, b) => new Date(b.partnershipDate || b.createdAt).getTime() - new Date(a.partnershipDate || a.createdAt).getTime())
                  .slice(0, 5)
                  .map((partner) => {
                    return (
                      <div key={partner.id} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                          style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
                        >
                          {partner.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{partner.name}</p>
                          <p className="text-sm text-gray-500">
                            {partner.type === "rub_college"
                              ? `RUB College - Partnered ${partner.partnershipDate ? new Date(partner.partnershipDate).toLocaleDateString() : ""}`
                              : `Industry Partner - Since ${partner.createdAt ? new Date(partner.createdAt).toLocaleDateString() : ""}`}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            partner.status === "active"
                              ? "bg-green-50 border-green-200 text-green-700"
                              : partner.status === "pending"
                              ? "bg-yellow-50 border-yellow-200 text-yellow-700"
                              : "bg-gray-50 border-gray-200 text-gray-700"
                          }
                        >
                          {partner.status}
                        </Badge>
                      </div>
                    );
                  })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Partner Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Create New Partner</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCreateModal(false)}
              >
                <XCircle className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={createPartner} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Partner Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter partner name"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Partner Type *
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as PartnerType })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none bg-white"
                  >
                    <option value="rub_college">RUB College</option>
                    <option value="industry">Industry Partner</option>
                    <option value="ngo">NGO</option>
                    <option value="government">Government</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as PartnerStatus })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="partner@example.com"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+975 1XXXXX"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="Name of contact person"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Partner address"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Partnership Date
                </label>
                <input
                  type="date"
                  value={formData.partnershipDate}
                  onChange={(e) => setFormData({ ...formData, partnershipDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the partnership"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
                  className="text-white"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Create Partner
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Partner Modal */}
      {showEditModal && selectedPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Edit Partner</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedPartner(null);
                }}
              >
                <XCircle className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={updatePartner} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Partner Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter partner name"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Partner Type *
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as PartnerType })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none bg-white"
                  >
                    <option value="rub_college">RUB College</option>
                    <option value="industry">Industry Partner</option>
                    <option value="ngo">NGO</option>
                    <option value="government">Government</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as PartnerStatus })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="partner@example.com"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+975 1XXXXX"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="Name of contact person"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Partner address"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Partnership Date
                </label>
                <input
                  type="date"
                  value={formData.partnershipDate}
                  onChange={(e) => setFormData({ ...formData, partnershipDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the partnership"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedPartner(null);
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
                  className="text-white"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Edit className="w-4 h-4 mr-2" />}
                  Update Partner
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
