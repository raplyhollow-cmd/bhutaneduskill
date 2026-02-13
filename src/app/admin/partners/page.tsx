/**
 * PLATFORM ADMIN - PARTNERS MANAGEMENT
 *
 * Manage RUB college and industry partners for career workshops.
 * Partnerships help students explore career opportunities.
 */

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
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { partners } from "@/lib/db/schema";
import { desc, eq, count, sql, like, or } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export default async function AdminPartnersPage({
  searchParams,
}: {
  searchParams: { type?: string; status?: string; search?: string };
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Get filter values
  const typeFilter = searchParams.type || "all";
  const statusFilter = searchParams.status || "all";
  const searchQuery = searchParams.search || "";

  // Fetch all partners with filters
  let allPartners = await db
    .select({
      id: partners.id,
      name: partners.name,
      type: partners.type,
      email: partners.email,
      phone: partners.phone,
      address: partners.address,
      status: partners.status,
      partnershipDate: partners.partnershipDate,
      description: partners.description,
      createdAt: partners.createdAt,
    })
    .from(partners)
    .orderBy(desc(partners.createdAt));

  // Get stats
  const totalPartners = allPartners.length;
  const activePartners = allPartners.filter((p) => p.status === "active").length;
  const pendingPartners = allPartners.filter((p) => p.status === "pending").length;

  // Apply client-side filtering
  if (searchQuery) {
    allPartners = allPartners.filter(
      (partner) =>
        partner.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        partner.type?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  if (typeFilter !== "all") {
    allPartners = allPartners.filter((partner) => partner.type === typeFilter);
  }

  if (statusFilter !== "all") {
    allPartners = allPartners.filter((partner) => partner.status === statusFilter);
  }

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
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button
            style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
            className="text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Partner
          </Button>
        </div>
      </div>

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
            <div className="text-3xl font-bold text-gray-900">{totalPartners}</div>
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
            <div className="text-3xl font-bold text-green-600">{activePartners}</div>
            <p className="text-xs text-gray-500 mt-1">
              {((activePartners / totalPartners) * 100).toFixed(0)}% of total
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
            <div className="text-3xl font-bold text-yellow-600">{pendingPartners}</div>
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
              {allPartners.filter((p) => p.type === "rub_college").length}
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
                name="search"
                placeholder="Search partners by name, type..."
                defaultValue={searchQuery}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
              />
            </div>

            {/* Type Filter */}
            <div className="relative">
              <select
                name="type"
                defaultValue={typeFilter}
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
                name="status"
                defaultValue={statusFilter}
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
                Showing {allPartners.length} of {totalPartners} partners
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                {allPartners.length === 0 ? (
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
                  allPartners.map((partner) => {
                    const typeBadges = {
                      rub_college: { label: "RUB College", color: "bg-purple-100 text-purple-700 border-purple-200" },
                      industry: { label: "Industry", color: "bg-blue-100 text-blue-700 border-blue-200" },
                      ngo: { label: "NGO", color: "bg-green-100 text-green-700 border-green-200" },
                      government: { label: "Government", color: "bg-orange-100 text-orange-700 border-orange-200" },
                    };

                    const statusBadges = {
                      active: { label: "Active", color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle },
                      pending: { label: "Pending", color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: Clock },
                      inactive: { label: "Inactive", color: "bg-gray-50 text-gray-700 border-gray-200", icon: AlertCircle },
                    };

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
                                  color: typeBadge.color.replace("text-", "").replace("border-", "").replace("bg-", ""),
                                }}
                              >
                                {typeBadge.label}
                              </Badge>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-900">
                            {(partner as any).contactPerson && (
                              <>
                                <Users className="w-4 h-4 text-gray-400" />
                                {(partner as any).contactPerson}
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
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                              title="Delete partner"
                            >
                              <Trash2 className="w-4 h-4" />
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
                const count = allPartners.filter((p) => p.type === item.type).length;
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
                      asChild
                    >
                      <Link href={`/admin/partners?type=${item.type}`}>View All</Link>
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
              {allPartners
                .sort((a, b) => new Date(b.partnershipDate || b.createdAt).getTime() - new Date(a.partnershipDate || a.createdAt).getTime())
                .slice(0, 5)
                .map((partner) => {
                  const statusColors = {
                    active: "bg-green-50 border-green-200",
                    pending: "bg-yellow-50 border-yellow-200",
                    inactive: "bg-gray-50 border-gray-200",
                  };

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
                        className={statusColors[partner.status as keyof typeof statusColors] || "bg-green-50 border-green-200"}
                      >
                        {partner.status}
                      </Badge>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
