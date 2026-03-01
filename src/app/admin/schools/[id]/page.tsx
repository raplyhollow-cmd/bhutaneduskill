/**
 * SCHOOL DETAIL PAGE
 *
 * Premium detail page for individual schools
 * Features:
 * - Page transitions
 * - Premium card hover effects
 * - Stats cards with icons
 * - User list for this school
 * - Edit/Delete actions
 */

"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { PremiumCard } from "@/components/admin/premium-card";
import { PageWrapper } from "@/components/admin/page-wrapper";
import { LiveBadge } from "@/components/admin/live-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddSchoolSlideIn } from "@/components/admin/add-school-slide-in";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Users,
  GraduationCap,
  UserCheck,
  Building2,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  CreditCard,
} from "lucide-react";
import { TableSkeleton, ListItemSkeleton } from "@/components/admin/skeletons";
import { ApproveSchoolModal, type SchoolDetailForModal } from "./approve-school-modal";
import { BillingSection, type SchoolDetailForBilling } from "./billing-section";

interface SchoolDetail {
  id: string;
  name: string;
  code: string;
  schoolType: string;
  level: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  district: string;
  isActive: boolean;
  subscriptionStatus?: string;
  subscriptionTier?: string;
  activatedAt?: string | null;
  setupComplete?: boolean;
  setupCompletedAt?: string | null;
  principalName?: string;
  principalEmail?: string;
  principalPhone?: string;
  establishedYear?: number;
  accreditationStatus?: string;
  maxStudents?: number;
  campusSize?: string;
  facilities?: string[];
  board?: string;
  state: string;
  country: string;
  postalCode: string;
  counselorName?: string;
  counselorEmail?: string;
  counselorPhone?: string;
  vicePrincipalName?: string;
  logo?: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
  tenantName: string;
  stats: {
    students: number;
    teachers: number;
    counselors: number;
  };
  users?: Array<{
    id: string;
    name: string;
    email: string;
    type: string;
    role: string;
  }>;
}

export default function SchoolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const schoolId = params.id as string;

  const [school, setSchool] = useState<SchoolDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isEditSlideInOpen, setIsEditSlideInOpen] = useState(false);

  useEffect(() => {
    async function fetchSchoolDetail() {
      try {
        const res = await fetch(`/api/admin/schools/${schoolId}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("School not found");
          } else {
            setError("Failed to load school details");
          }
          return;
        }
        const jsonData = await res.json();
        setSchool(jsonData.data || jsonData);
      } catch (err) {
        setError("Failed to load school details");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    if (schoolId) {
      fetchSchoolDetail();
    }
  }, [schoolId]);

  // Handle ?action=edit query parameter
  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "edit" && school && !isLoading) {
      setIsEditSlideInOpen(true);
      // Clear the query param without triggering a navigation
      router.replace(`/admin/schools/${schoolId}`, { scroll: false });
    }
  }, [searchParams, school, isLoading, schoolId, router]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this school? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/schools/${schoolId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete school");
      }

      router.push("/admin/schools");
    } catch (err) {
      alert("Failed to delete school. Please try again.");
    }
  };

  const handleApprove = async (tier: string = "standard") => {
    try {
      const res = await fetch(`/api/admin/schools/${schoolId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionTier: tier,
        }),
      });

      if (res.ok) {
        // Refresh school data
        const res2 = await fetch(`/api/admin/schools/${schoolId}`);
        if (res2.ok) {
          const jsonData = await res2.json();
          setSchool(jsonData.data || jsonData);
        }
        setIsApproveModalOpen(false);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to approve school");
      }
    } catch (err) {
      alert("Failed to approve school. Please try again.");
    }
  };

  const handleSuspend = async () => {
    if (!confirm("Are you sure you want to suspend this school?")) return;

    try {
      const res = await fetch(`/api/admin/schools/${schoolId}/suspend`, {
        method: "POST",
      });

      if (res.ok) {
        const res2 = await fetch(`/api/admin/schools/${schoolId}`);
        if (res2.ok) {
          const jsonData = await res2.json();
          setSchool(jsonData.data || jsonData);
        }
      } else {
        const data = await res.json();
        alert(data.error || "Failed to suspend school");
      }
    } catch (err) {
      alert("Failed to suspend school. Please try again.");
    }
  };

  const handleActivate = async () => {
    try {
      const res = await fetch(`/api/admin/schools/${schoolId}/activate`, {
        method: "POST",
      });

      if (res.ok) {
        const res2 = await fetch(`/api/admin/schools/${schoolId}`);
        if (res2.ok) {
          const jsonData = await res2.json();
          setSchool(jsonData.data || jsonData);
        }
      } else {
        const data = await res.json();
        alert(data.error || "Failed to activate school");
      }
    } catch (err) {
      alert("Failed to activate school. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-8 bg-gray-200 rounded w-64 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
          </div>
        </div>

        {/* Main card skeleton */}
        <div className="p-6 border border-gray-200 rounded-lg">
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 border border-gray-200 rounded-lg">
              <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse" />
              <div className="h-8 bg-gray-200 rounded w-16 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !school) {
    return (
      <PageWrapper>
        <div className="text-center py-16">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error || "School Not Found"}
          </h2>
          <p className="text-gray-500 mb-6">
            The school you're looking for doesn't exist or has been deleted.
          </p>
          <Button onClick={() => router.push("/admin/schools")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Schools
          </Button>
        </div>
      </PageWrapper>
    );
  }

  const statCards = [
    {
      label: "Students",
      value: school.stats?.students || 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Teachers",
      value: school.stats?.teachers || 0,
      icon: GraduationCap,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "Counselors",
      value: school.stats?.counselors || 0,
      icon: UserCheck,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      label: "Subscription",
      value: school.subscriptionStatus || "pending",
      icon: CreditCard,
      color: school.subscriptionStatus === "active" ? "text-green-600" : "text-yellow-600",
      bgColor: school.subscriptionStatus === "active" ? "bg-green-50" : "bg-yellow-50",
      isBadge: true,
    },
  ];

  const subscriptionStatuses = {
    pending_payment: { label: "Pending Payment", color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: AlertTriangle },
    active: { label: "Active", color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle },
    suspended: { label: "Suspended", color: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
    cancelled: { label: "Cancelled", color: "bg-gray-50 text-gray-700 border-gray-200", icon: XCircle },
  };

  const statusInfo = subscriptionStatuses[school.subscriptionStatus as keyof typeof subscriptionStatuses] || subscriptionStatuses.pending_payment;
  const StatusIcon = statusInfo.icon;

  return (
    <PageWrapper>
      {/* Breadcrumb-style back button */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-gray-500 hover:text-gray-900 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Schools
        </Button>
      </div>

      {/* Header Section */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-semibold text-gray-900">
              {school.name}
            </h1>
            <Badge variant={school.isActive ? "default" : "secondary"}>
              {school.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <p className="text-gray-500">
            Code: <span className="font-mono text-gray-700">{school.code}</span>
            {" • "}
            {school.schoolType}
            {" • "}
            {school.level}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {school.subscriptionStatus === "pending_payment" && (
            <Button
              onClick={() => setIsApproveModalOpen(true)}
              style={{ background: "linear-gradient(135deg, rgb(34 197 94) 0%, rgb(22 163 74) 100%)" }}
              className="text-white"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve School
            </Button>
          )}
          {school.subscriptionStatus === "active" && (
            <Button
              variant="outline"
              onClick={handleSuspend}
              className="text-red-600 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Suspend
            </Button>
          )}
          {school.subscriptionStatus === "suspended" && (
            <Button
              variant="outline"
              onClick={handleActivate}
              className="text-green-600 hover:bg-green-50"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Activate
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setIsEditSlideInOpen(true)}
            className="transition-all duration-150"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-150"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <PremiumCard key={stat.label} className="p-4" noPadding={false}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  {stat.isBadge ? (
                    <Badge className={stat.bgColor + " " + stat.color}>
                      {stat.value === "active" ? "Active" : stat.value}
                    </Badge>
                  ) : (
                    <p className="text-2xl font-semibold text-gray-900">
                      {stat.value}
                    </p>
                  )}
                </div>
              </div>
            </PremiumCard>
          );
        })}
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* School Information */}
      <PremiumCard className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">School Information</h2>
          <LiveBadge />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">School Name</p>
                <p className="text-gray-900">{school.name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="text-gray-900">{school.address || "N/A"}</p>
                {school.city && <p className="text-gray-600">{school.city}</p>}
                {school.district && (
                  <p className="text-sm text-gray-500">{school.district}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Tenant</p>
                <p className="text-gray-900">{school.tenantName || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Contact Email</p>
                <a
                  href={`mailto:${school.contactEmail}`}
                  className="text-pink-600 hover:text-pink-700 transition-colors"
                >
                  {school.contactEmail || "N/A"}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Contact Phone</p>
                <a
                  href={`tel:${school.contactPhone}`}
                  className="text-gray-900 hover:text-pink-600 transition-colors"
                >
                  {school.contactPhone || "N/A"}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="text-gray-900">
                  {new Date(school.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </PremiumCard>

      {/* Users at this school */}
      {school.users && school.users.length > 0 && (
        <PremiumCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Users</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/admin/users?school=${schoolId}`)}
            >
              View All Users
            </Button>
          </div>

          <div className="space-y-2">
            {school.users.slice(0, 5).map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                onClick={() => router.push(`/admin/users/${user.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center text-white text-sm font-medium">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                <Badge variant="outline" className="capitalize">
                  {user.type}
                </Badge>
              </div>
            ))}
          </div>

          {school.users.length > 5 && (
            <div className="mt-4 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/admin/users?school=${schoolId}`)}
              >
                View all {school.users.length} users →
              </Button>
            </div>
          )}
        </PremiumCard>
      )}
        </TabsContent>

        <TabsContent value="billing">
          <BillingSection school={school as SchoolDetailForBilling} onUpdate={() => {
            // Refresh school data
            fetch(`/api/admin/schools/${schoolId}`)
              .then(res => res.json())
              .then(jsonData => setSchool(jsonData.data || jsonData));
          }} />
        </TabsContent>

        <TabsContent value="settings">
          <PremiumCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">School Settings</h2>
              <LiveBadge />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="text-gray-900">Active Status</p>
                  <p className="text-sm text-gray-500">Enable or disable school access</p>
                </div>
                <Badge variant={school.isActive ? "default" : "secondary"}>
                  {school.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="text-gray-900">Maximum Students</p>
                  <p className="text-sm text-gray-500">Current enrollment limit</p>
                </div>
                <span className="text-gray-900">{school.maxStudents || "N/A"}</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="text-gray-900">Campus Size</p>
                  <p className="text-sm text-gray-500">Physical campus area</p>
                </div>
                <span className="text-gray-900">{school.campusSize || "N/A"}</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="text-gray-900">Setup Status</p>
                  <p className="text-sm text-gray-500">School admin setup completion</p>
                </div>
                {school.setupComplete ? (
                  <Badge className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Complete
                  </Badge>
                ) : (
                  <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    In Progress
                  </Badge>
                )}
              </div>

              {school.facilities && school.facilities.length > 0 && (
                <div>
                  <p className="text-gray-900 mb-2">Facilities</p>
                  <div className="flex flex-wrap gap-2">
                    {school.facilities.map((facility, index) => (
                      <Badge key={index} variant="outline">
                        {facility}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </PremiumCard>
        </TabsContent>
      </Tabs>

      {/* Approve School Modal */}
      <ApproveSchoolModal
        open={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        onApprove={handleApprove}
        school={school ? {
          id: school.id,
          name: school.name,
          code: school.code,
          schoolType: school.schoolType,
          level: school.level,
          contactEmail: school.contactEmail,
          contactPhone: school.contactPhone,
          address: school.address,
          city: school.city,
          maxStudents: school.maxStudents,
        } as SchoolDetailForModal : null}
      />

      {/* Edit School Slide-In */}
      <AddSchoolSlideIn
        isOpen={isEditSlideInOpen}
        onClose={() => setIsEditSlideInOpen(false)}
        onSuccess={() => {
          setIsEditSlideInOpen(false);
          // Refresh school data
          fetch(`/api/admin/schools/${schoolId}`)
            .then(res => res.json())
            .then(jsonData => setSchool(jsonData.data || jsonData));
        }}
        school={school ? {
          id: school.id,
          name: school.name,
          code: school.code,
          schoolType: school.schoolType,
          level: school.level,
          contactEmail: school.contactEmail,
          contactPhone: school.contactPhone,
          address: school.address,
          city: school.city,
          isActive: school.isActive,
          subscriptionTier: school.subscriptionTier,
          maxStudents: school.maxStudents,
        } : undefined}
      />
    </PageWrapper>
  );
}
