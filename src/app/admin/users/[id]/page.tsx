/**
 * USER DETAIL PAGE
 *
 * Premium detail page for individual users
 * Features:
 * - Page transitions
 * - Premium card hover effects
 * - User info display
 * - Activity history
 * - Edit/Delete actions
 */

"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { PremiumCard } from "@/components/admin/premium-card";
import { PageWrapper } from "@/components/admin/page-wrapper";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Mail,
  Phone,
  Calendar,
  Building2,
  Shield,
  User,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface UserDetail {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  type: string;
  role?: string | null;
  schoolId?: string | null;
  school?: {
    id: string;
    name: string;
    code: string;
    city: string;
    state: string;
  } | null;
  isActive: boolean;
  emailVerified?: boolean;
  createdAt: string | Date;
  lastLogin?: string | null;
  clerkUserId: string;
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = params.id as string;
  const action = searchParams.get("action");

  const [user, setUser] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserDetail() {
      try {
        const res = await fetch(`/api/admin/users/${userId}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("User not found");
          } else {
            setError("Failed to load user details");
          }
          return;
        }
        const result = await res.json();
        // API returns { data: userDetails }
        const userData = result.data || result;
        setUser(userData);
      } catch (err) {
        setError("Failed to load user details");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    if (userId) {
      fetchUserDetail();
    }
  }, [userId]);

  // If action=edit, redirect to edit modal/page
  useEffect(() => {
    if (action === "edit" && user) {
      // For now, we'll show a prompt. In a full implementation, this would open an edit modal
      router.replace(`/admin/users/${userId}`);
    }
  }, [action, user, router]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete user");
      }

      router.push("/admin/users");
    } catch (err) {
      alert("Failed to delete user. Please try again.");
    }
  };

  const handleToggleActive = async () => {
    if (!user) return;

    const newStatus = !user.isActive;
    if (!confirm(`Are you sure you want to ${newStatus ? "activate" : "deactivate"} this user?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update user");
      }

      setUser({ ...user, isActive: newStatus });
    } catch (err) {
      alert("Failed to update user. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <PageWrapper>
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
        </div>
      </PageWrapper>
    );
  }

  if (error || !user) {
    return (
      <PageWrapper>
        <div className="text-center py-16">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error || "User Not Found"}
          </h2>
          <p className="text-gray-500 mb-6">
            The user you're looking for doesn't exist or has been deleted.
          </p>
          <Button onClick={() => router.push("/admin/users")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Button>
        </div>
      </PageWrapper>
    );
  }

  // Avatar with initials
  const initials = `${user.firstName || ""} ${(user.lastName || "")[0] || ""}`
    .trim()
    .toUpperCase()
    .slice(0, 2);

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
          Back to Users
        </Button>
      </div>

      {/* Header Section */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center text-white text-xl font-semibold shadow-lg">
            {initials}
          </div>

          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-semibold text-gray-900">{user.name}</h1>
              <Badge variant={user.isActive ? "default" : "secondary"}>
                {user.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-gray-500 capitalize">
              {user.type} {user.role && `• ${user.role}`}
              {user.school && ` • ${user.school.name}`}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleToggleActive}
            className={user.isActive ? "text-yellow-600 hover:bg-yellow-50" : "text-green-600 hover:bg-green-50"}
          >
            {user.isActive ? (
              <>
                <XCircle className="w-4 h-4 mr-2" />
                Deactivate
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Activate
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/users/${userId}?action=edit`)}
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

      {/* User Information */}
      <PremiumCard className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">User Information</h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="text-gray-900">{user.name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <a
                  href={`mailto:${user.email}`}
                  className="text-pink-600 hover:text-pink-700 transition-colors"
                >
                  {user.email}
                </a>
                {user.emailVerified !== undefined && (
                  <span className="ml-2">
                    {user.emailVerified ? (
                      <CheckCircle className="w-4 h-4 text-green-500 inline" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-400 inline" />
                    )}
                  </span>
                )}
              </div>
            </div>

            {user.phone && (
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <a
                    href={`tel:${user.phone}`}
                    className="text-gray-900 hover:text-pink-600 transition-colors"
                  >
                    {user.phone}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="text-gray-900 capitalize">{user.type}</p>
                {user.role && <p className="text-sm text-gray-500 capitalize">{user.role}</p>}
              </div>
            </div>

            {user.school && (
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">School</p>
                  <button
                    onClick={() => router.push(`/admin/schools/${user.school.id}`)}
                    className="text-pink-600 hover:text-pink-700 transition-colors"
                  >
                    {user.school.name}
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Joined</p>
                <p className="text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            {user.lastLogin && (
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Last Login</p>
                  <p className="text-gray-900">
                    {new Date(user.lastLogin).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </PremiumCard>

      {/* Account Details */}
      <PremiumCard>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">User ID</span>
            <code className="text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded">
              {user.id}
            </code>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Clerk User ID</span>
            <code className="text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded truncate max-w-xs">
              {user.clerkUserId}
            </code>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-gray-500">Status</span>
            <Badge variant={user.isActive ? "default" : "secondary"}>
              {user.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
      </PremiumCard>
    </PageWrapper>
  );
}
