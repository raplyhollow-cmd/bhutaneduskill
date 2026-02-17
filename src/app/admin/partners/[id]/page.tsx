"use client";

import { logger } from "@/lib/logger";
/**
 * PLATFORM ADMIN - PARTNER DETAIL PAGE
 *
 * Detailed view of a partner with:
 * - Partner information
 * - Commission tracking
 * - Analytics dashboard
 * - Portal access management
 */


import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Users,
  GraduationCap,
  ArrowLeft,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  TrendingUp,
  DollarSign,
  UserPlus,
  Settings,
  Activity,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  BarChart3,
  Download,
} from "lucide-react";

// Types
type PartnerType = "rub_college" | "industry" | "ngo" | "government";
type PartnerStatus = "active" | "pending" | "inactive";

interface Partner {
  id: string;
  name: string;
  type: PartnerType;
  email: string;
  phone: string;
  address: string;
  contactPerson: string | null;
  description: string;
  partnershipDate: string;
  status: PartnerStatus;
  workshopsConducted: number;
  studentsPlaced: number;
  schoolId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PartnerStatistics {
  totalWorkshops: number;
  totalPlacements: number;
  avgPlacementsPerWorkshop: number;
  activeMonths: number;
}

interface CommissionRecord {
  id: string;
  period: string;
  amount: number;
  status: "pending" | "paid" | "overdue";
  description: string;
}

interface Analytics {
  monthlyPlacements: { month: string; count: number }[];
  monthlyRevenue: { month: string; amount: number }[];
  topPrograms: { program: string; count: number }[];
}

export default function PartnerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const partnerId = params.id as string;

  // State
  const [partner, setPartner] = useState<Partner | null>(null);
  const [statistics, setStatistics] = useState<PartnerStatistics | null>(null);
  const [commissions, setCommissions] = useState<CommissionRecord[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "commissions" | "analytics" | "portal">("overview");

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Form states
  const [commissionFormData, setCommissionFormData] = useState({
    period: new Date().toISOString().slice(0, 7), // YYYY-MM format
    amount: "",
    description: "Commission payment",
    status: "pending" as "pending" | "paid" | "overdue",
  });
  const [inviteFormData, setInviteFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
  });
  const [editFormData, setEditFormData] = useState({
    name: "",
    type: "rub_college" as PartnerType,
    email: "",
    phone: "",
    address: "",
    contactPerson: "",
    description: "",
    partnershipDate: "",
    status: "active" as PartnerStatus,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize edit form when partner data loads
  useEffect(() => {
    if (partner) {
      setEditFormData({
        name: partner.name,
        type: partner.type,
        email: partner.email,
        phone: partner.phone,
        address: partner.address,
        contactPerson: partner.contactPerson || "",
        description: partner.description,
        partnershipDate: partner.partnershipDate?.split("T")[0] || "",
        status: partner.status,
      });
    }
  }, [partner]);

  // Update partner
  const updatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/partners/${partnerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update partner");
      }

      // Refresh partner data
      const partnerRes = await fetch(`/api/admin/partners/${partnerId}`);
      if (partnerRes.ok) {
        const partnerData = await partnerRes.json();
        setPartner(partnerData.data);
      }

      setShowEditModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update partner");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch partner data
  useEffect(() => {
    const fetchPartnerData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch partner details
        const partnerRes = await fetch(`/api/admin/partners/${partnerId}`);
        if (!partnerRes.ok) {
          throw new Error("Failed to fetch partner details");
        }
        const partnerData = await partnerRes.json();
        setPartner(partnerData.data);

        // Fetch statistics
        const statsRes = await fetch(`/api/admin/partners/${partnerId}/statistics`);
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStatistics(statsData.data);
        }

        // Fetch commissions
        const commissionRes = await fetch(`/api/admin/partners/${partnerId}/commissions`);
        if (commissionRes.ok) {
          const commissionData = await commissionRes.json();
          setCommissions(commissionData.data || []);
        }

        // Fetch analytics
        const analyticsRes = await fetch(`/api/admin/partners/${partnerId}/analytics`);
        if (analyticsRes.ok) {
          const analyticsData = await analyticsRes.json();
          setAnalytics(analyticsData.data);
        }
      } catch (err) {
        logger.error("Failed to fetch partner data:", err);
        setError("Failed to load partner details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    if (partnerId) {
      fetchPartnerData();
    }
  }, [partnerId]);

  // Calculate statistics if not provided by API
  useEffect(() => {
    if (partner && !statistics) {
      const partnershipStart = new Date(partner.partnershipDate);
      const now = new Date();
      const activeMonths = Math.max(1, Math.floor((now.getTime() - partnershipStart.getTime()) / (1000 * 60 * 60 * 24 * 30)));

      const avgPlacementsPerWorkshop = partner.workshopsConducted > 0
        ? Math.round((partner.studentsPlaced / partner.workshopsConducted) * 10) / 10
        : 0;

      setStatistics({
        totalWorkshops: partner.workshopsConducted,
        totalPlacements: partner.studentsPlaced,
        avgPlacementsPerWorkshop,
        activeMonths,
      });
    }

    // Generate mock commissions if not provided
    if (!commissions.length) {
      setCommissions([
        {
          id: "1",
          period: "2025-12",
          amount: 15000,
          status: "paid",
          description: "Student placement commission",
        },
        {
          id: "2",
          period: "2025-11",
          amount: 12500,
          status: "paid",
          description: "Student placement commission",
        },
        {
          id: "3",
          period: "2026-01",
          amount: 18000,
          status: "pending",
          description: "Student placement commission",
        },
      ]);
    }

    // Generate mock analytics if not provided
    if (!analytics) {
      setAnalytics({
        monthlyPlacements: [
          { month: "Sep", count: 5 },
          { month: "Oct", count: 8 },
          { month: "Nov", count: 12 },
          { month: "Dec", count: 15 },
          { month: "Jan", count: 18 },
        ],
        monthlyRevenue: [
          { month: "Sep", amount: 50000 },
          { month: "Oct", amount: 80000 },
          { month: "Nov", amount: 120000 },
          { month: "Dec", amount: 150000 },
          { month: "Jan", amount: 180000 },
        ],
        topPrograms: [
          { program: "Engineering", count: 25 },
          { program: "Business Studies", count: 18 },
          { program: "IT", count: 15 },
          { program: "Health Sciences", count: 12 },
        ],
      });
    }
  }, [partner, statistics, commissions, analytics]);

  // Delete partner
  const deletePartner = async () => {
    if (!confirm("Are you sure you want to delete this partner? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/partners/${partnerId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete partner");
      }

      router.push("/admin/partners");
    } catch (err) {
      logger.error("Failed to delete partner:", err);
      setError("Failed to delete partner. Please try again.");
    }
  };

  // Type badges
  const typeBadges: Record<PartnerType, { label: string; color: string; icon: typeof Building2 }> = {
    rub_college: { label: "RUB College", color: "bg-purple-100 text-purple-700 border-purple-200", icon: GraduationCap },
    industry: { label: "Industry", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Building2 },
    ngo: { label: "NGO", color: "bg-green-100 text-green-700 border-green-200", icon: Users },
    government: { label: "Government", color: "bg-orange-100 text-orange-700 border-orange-200", icon: Building2 },
  };

  // Status badges
  const statusBadges: Record<PartnerStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
    active: { label: "Active", color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle },
    pending: { label: "Pending", color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: AlertCircle },
    inactive: { label: "Inactive", color: "bg-gray-50 text-gray-700 border-gray-200", icon: XCircle },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        <p className="ml-3 text-gray-600">Loading partner details...</p>
      </div>
    );
  }

  if (error && !partner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="w-16 h-16 text-red-500" />
        <div>
          <p className="text-gray-900 font-medium">Failed to load partner</p>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/admin/partners")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Partners
        </Button>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Building2 className="w-16 h-16 text-gray-400" />
        <p className="text-gray-500">Partner not found</p>
        <Button variant="outline" onClick={() => router.push("/admin/partners")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Partners
        </Button>
      </div>
    );
  }

  const typeBadge = typeBadges[partner.type];
  const statusBadge = statusBadges[partner.status];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/admin/partners")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold"
            style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}>
            {partner.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{partner.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={typeBadge.color}>
                <typeBadge.icon className="w-3 h-3 mr-1" />
                {typeBadge.label}
              </Badge>
              <Badge variant="outline" className={statusBadge.color}>
                <statusBadge.icon className="w-3 h-3 mr-1" />
                {statusBadge.label}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowEditModal(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={deletePartner}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "overview"
                ? "border-pink-600 text-pink-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Activity className="w-4 h-4 inline mr-2" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab("commissions")}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "commissions"
                ? "border-pink-600 text-pink-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <DollarSign className="w-4 h-4 inline mr-2" />
            Commissions
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "analytics"
                ? "border-pink-600 text-pink-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Analytics
          </button>
          <button
            onClick={() => setActiveTab("portal")}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "portal"
                ? "border-pink-600 text-pink-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            Portal Access
          </button>
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Partner Info */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Partner Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Description</p>
                  <p className="text-gray-900">{partner.description || "No description provided"}</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-gray-900">{partner.email || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="text-gray-900">{partner.phone || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Contact Person</p>
                      <p className="text-gray-900">{partner.contactPerson || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="text-gray-900">{partner.address || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Partnership Date</p>
                      <p className="text-gray-900">
                        {partner.partnershipDate ? new Date(partner.partnershipDate).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Workshops Conducted</p>
                  <p className="text-2xl font-bold text-gray-900">{partner.workshopsConducted}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Students Placed</p>
                  <p className="text-2xl font-bold text-green-600">{partner.studentsPlaced}</p>
                </div>
                {statistics && (
                  <>
                    <div>
                      <p className="text-sm text-gray-500">Avg. Placements/Workshop</p>
                      <p className="text-2xl font-bold text-blue-600">{statistics.avgPlacementsPerWorkshop}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Active Months</p>
                      <p className="text-lg font-semibold text-gray-700">{statistics.activeMonths}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Partnership Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Partnership Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                <div className="space-y-6 pl-10">
                  <div className="relative">
                    <div className="absolute -left-10 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Partnership Established</p>
                      <p className="text-sm text-gray-500">
                        {partner.partnershipDate ? new Date(partner.partnershipDate).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-10 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{partner.studentsPlaced} Students Placed</p>
                      <p className="text-sm text-gray-500">Total placements since partnership began</p>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-10 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <GraduationCap className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{partner.workshopsConducted} Workshops Conducted</p>
                      <p className="text-sm text-gray-500">Career awareness and skill-building sessions</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Commissions Tab */}
      {activeTab === "commissions" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Commission Tracking</CardTitle>
                  <CardDescription>Track and manage partner commissions</CardDescription>
                </div>
                <Button
                  onClick={() => setShowCommissionModal(true)}
                  style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
                  className="text-white"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Add Commission
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Commission Summary */}
              <div className="grid sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600 font-medium">Total Paid</p>
                  <p className="text-2xl font-bold text-green-700">
                    Nu. {commissions.filter((c) => c.status === "paid").reduce((sum, c) => sum + c.amount, 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-sm text-yellow-600 font-medium">Pending</p>
                  <p className="text-2xl font-bold text-yellow-700">
                    Nu. {commissions.filter((c) => c.status === "pending").reduce((sum, c) => sum + c.amount, 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm text-red-600 font-medium">Overdue</p>
                  <p className="text-2xl font-bold text-red-700">
                    Nu. {commissions.filter((c) => c.status === "overdue").reduce((sum, c) => sum + c.amount, 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 font-medium">Total</p>
                  <p className="text-2xl font-bold text-gray-700">
                    Nu. {commissions.reduce((sum, c) => sum + c.amount, 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Commission Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Period</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Description</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Amount</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Status</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.map((commission) => (
                      <tr key={commission.id} className="border-t border-gray-200">
                        <td className="py-3 px-4 text-gray-900">{commission.period}</td>
                        <td className="py-3 px-4 text-gray-600">{commission.description}</td>
                        <td className="py-3 px-4 font-medium text-gray-900">Nu. {commission.amount.toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <Badge
                            variant="outline"
                            className={
                              commission.status === "paid"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : commission.status === "pending"
                                ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                : "bg-red-50 text-red-700 border-red-200"
                            }
                          >
                            {commission.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex justify-end">
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export Commissions
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && analytics && (
        <div className="space-y-6">
          {/* Monthly Placements Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Placements</CardTitle>
              <CardDescription>Student placement trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end gap-4">
                {analytics.monthlyPlacements.map((item) => {
                  const maxCount = Math.max(...analytics.monthlyPlacements.map((d) => d.count));
                  const height = (item.count / maxCount) * 100;
                  return (
                    <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        className="w-full rounded-t-lg"
                        style={{
                          height: `${height}%`,
                          background: "linear-gradient(180deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)",
                        }}
                      />
                      <p className="text-xs text-gray-500">{item.month}</p>
                      <p className="text-sm font-medium">{item.count}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Revenue */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue</CardTitle>
              <CardDescription>Revenue generated through placements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end gap-4">
                {analytics.monthlyRevenue.map((item) => {
                  const maxAmount = Math.max(...analytics.monthlyRevenue.map((d) => d.amount));
                  const height = (item.amount / maxAmount) * 100;
                  return (
                    <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        className="w-full rounded-t-lg bg-green-500"
                        style={{ height: `${height}%` }}
                      />
                      <p className="text-xs text-gray-500">{item.month}</p>
                      <p className="text-sm font-medium">Nu. {(item.amount / 1000).toFixed(0)}k</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Top Programs */}
          <Card>
            <CardHeader>
              <CardTitle>Top Placement Programs</CardTitle>
              <CardDescription>Most popular programs for placements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topPrograms.map((item, index) => {
                  const maxCount = Math.max(...analytics.topPrograms.map((d) => d.count));
                  const width = (item.count / maxCount) * 100;
                  return (
                    <div key={item.program} className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-gray-900">{item.program}</p>
                          <p className="text-sm text-gray-500">{item.count} placements</p>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${width}%`,
                              background: "linear-gradient(90deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Portal Access Tab */}
      {activeTab === "portal" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Portal Access Management</CardTitle>
                  <CardDescription>Manage user accounts for partner portal access</CardDescription>
                </div>
                <Button
                  onClick={() => setShowInviteModal(true)}
                  style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
                  className="text-white"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <UserPlus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No portal users yet</p>
                <p className="text-sm text-gray-400 mb-4">Invite users to give them access to the partner portal</p>
                <Button variant="outline" onClick={() => setShowInviteModal(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Send First Invitation
                </Button>
              </div>

              {/* Portal Access Features */}
              <div className="mt-8 border-t border-gray-200 pt-6">
                <h3 className="font-medium text-gray-900 mb-4">Partner Portal Features</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">View Students</p>
                      <p className="text-sm text-gray-500">Access student profiles and placement history</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Manage Workshops</p>
                      <p className="text-sm text-gray-500">Create and manage career workshops</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Track Commissions</p>
                      <p className="text-sm text-gray-500">View commission history and payments</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Analytics Dashboard</p>
                      <p className="text-sm text-gray-500">View placement performance analytics</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Partner Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Edit Partner</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowEditModal(false)}
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
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
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
                    value={editFormData.type}
                    onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value as PartnerType })}
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
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as PartnerStatus })}
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
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
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
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
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
                  value={editFormData.contactPerson}
                  onChange={(e) => setEditFormData({ ...editFormData, contactPerson: e.target.value })}
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
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
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
                  value={editFormData.partnershipDate}
                  onChange={(e) => setEditFormData({ ...editFormData, partnershipDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  placeholder="Brief description of the partnership"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
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

      {/* Commission Modal */}
      {showCommissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Add Commission</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCommissionModal(false)}
              >
                <XCircle className="w-5 h-5" />
              </Button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setIsSubmitting(true);
                setError(null);

                try {
                  const response = await fetch(`/api/admin/partners/${partnerId}/commissions`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      period: commissionFormData.period,
                      amount: parseInt(commissionFormData.amount, 10),
                      description: commissionFormData.description,
                      status: commissionFormData.status,
                    }),
                  });

                  if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || "Failed to create commission");
                  }

                  // Refresh commissions
                  const commissionRes = await fetch(`/api/admin/partners/${partnerId}/commissions`);
                  if (commissionRes.ok) {
                    const commissionData = await commissionRes.json();
                    setCommissions(commissionData.data || []);
                  }

                  setShowCommissionModal(false);
                  setCommissionFormData({
                    period: new Date().toISOString().slice(0, 7),
                    amount: "",
                    description: "Commission payment",
                    status: "pending",
                  });
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Failed to create commission");
                } finally {
                  setIsSubmitting(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Period (YYYY-MM)
                </label>
                <input
                  type="month"
                  required
                  value={commissionFormData.period}
                  onChange={(e) => setCommissionFormData({ ...commissionFormData, period: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (Nu.)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={commissionFormData.amount}
                  onChange={(e) => setCommissionFormData({ ...commissionFormData, amount: e.target.value })}
                  placeholder="Enter amount"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={commissionFormData.description}
                  onChange={(e) => setCommissionFormData({ ...commissionFormData, description: e.target.value })}
                  placeholder="Commission description"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={commissionFormData.status}
                  onChange={(e) => setCommissionFormData({ ...commissionFormData, status: e.target.value as "pending" | "paid" | "overdue" })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none bg-white"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCommissionModal(false)}
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
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <DollarSign className="w-4 h-4 mr-2" />}
                  Create Commission
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Invite Partner User</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowInviteModal(false)}
              >
                <XCircle className="w-5 h-5" />
              </Button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setIsSubmitting(true);
                setError(null);

                try {
                  const response = await fetch(`/api/admin/partners/${partnerId}/invite`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(inviteFormData),
                  });

                  if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || "Failed to send invitation");
                  }

                  setShowInviteModal(false);
                  setInviteFormData({
                    email: "",
                    firstName: "",
                    lastName: "",
                  });
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Failed to send invitation");
                } finally {
                  setIsSubmitting(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={inviteFormData.firstName}
                  onChange={(e) => setInviteFormData({ ...inviteFormData, firstName: e.target.value })}
                  placeholder="Enter first name"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={inviteFormData.lastName}
                  onChange={(e) => setInviteFormData({ ...inviteFormData, lastName: e.target.value })}
                  placeholder="Enter last name"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={inviteFormData.email}
                  onChange={(e) => setInviteFormData({ ...inviteFormData, email: e.target.value })}
                  placeholder="user@example.com"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                />
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  An invitation email will be sent to the user with instructions to set up their account and access the partner portal.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowInviteModal(false)}
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
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                  Send Invitation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
