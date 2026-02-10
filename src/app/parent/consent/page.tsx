/**
 * PARENT CONSENT PAGE
 *
 * Allows parents to manage consent forms and permissions for their child, including:
 * - Field trip consent forms
 * - Photo/video permissions
 * - Data processing consents
 * - Signed consent history
 * - Uses consent_records table
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChildSelector, Child } from "@/components/parent/child-selector";
import {
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Calendar,
  Download,
  Eye,
  ExternalLink,
  Signature,
  Shield,
  Camera,
  Bus,
  Laptop,
  ChevronRight,
  Filter,
  Search,
  Info,
} from "lucide-react";
import Link from "next/link";

// Mock children data
const mockChildren: Child[] = [
  {
    id: "child1",
    name: "Tashi Dorji",
    firstName: "Tashi",
    lastName: "Dorji",
    grade: "Class 10",
    classGrade: 10,
    section: "A",
    school: "Yangchenphug HSS",
  },
  {
    id: "child2",
    name: "Pema Lhamo",
    firstName: "Pema",
    lastName: "Lhamo",
    grade: "Class 8",
    classGrade: 8,
    section: "B",
    school: "Motithang HSS",
  },
];

// Consent types
const consentTypes = [
  { type: "field_trip", name: "Field Trip", icon: Bus, color: "bg-blue-100 text-blue-700", description: "Permission for educational field trips" },
  { type: "photo_video", name: "Media", icon: Camera, color: "bg-purple-100 text-purple-700", description: "Photo and video usage permissions" },
  { type: "data_processing", name: "Data", icon: Shield, color: "bg-green-100 text-green-700", description: "Student data processing consent" },
  { type: "digital_learning", name: "Digital", icon: Laptop, color: "bg-orange-100 text-orange-700", description: "Online learning platform access" },
  { type: "medical", name: "Medical", icon: AlertCircle, color: "bg-red-100 text-red-700", description: "Medical treatment authorization" },
  { type: "extracurricular", name: "Activities", icon: FileText, color: "bg-yellow-100 text-yellow-700", description: "After-school activities participation" },
];

// Mock consent records
const mockConsentRecords: Record<string, Array<{
  id: string;
  type: string;
  title: string;
  description: string;
  status: "approved" | "pending" | "rejected" | "expired";
  createdAt: string;
  expiresAt?: string;
  consentedAt?: string;
  documents?: Array<{ name: string; url: string }>;
}>> = {
  child1: [
    {
      id: "consent1",
      type: "field_trip",
      title: "Punakha Dzongkhag Educational Tour",
      description: "Annual educational field trip to Punakha Dzong and surrounding areas. Includes transportation, meals, and guide services.",
      status: "approved",
      createdAt: "2025-01-15",
      consentedAt: "2025-01-16",
      expiresAt: "2025-03-01",
    },
    {
      id: "consent2",
      type: "photo_video",
      title: "School Photo and Video Consent",
      description: "Permission to use student's photograph and video in school publications, website, and promotional materials.",
      status: "approved",
      createdAt: "2025-01-10",
      consentedAt: "2025-01-12",
    },
    {
      id: "consent3",
      type: "digital_learning",
      title: "Career Compass Platform Access",
      description: "Permission for student to use the Career Compass online career guidance platform, including assessment tools and career exploration resources.",
      status: "approved",
      createdAt: "2025-02-01",
      consentedAt: "2025-02-02",
    },
    {
      id: "consent4",
      type: "field_trip",
      title: "Thimphu Tech Park Visit",
      description: "Visit to Thimphu Tech Park to learn about IT companies and career opportunities in technology sector.",
      status: "pending",
      createdAt: "2025-02-08",
      expiresAt: "2025-02-20",
    },
    {
      id: "consent5",
      type: "data_processing",
      title: "Student Data Processing Agreement",
      description: "Consent for processing student personal data for educational purposes, including attendance, assessments, and progress tracking.",
      status: "approved",
      createdAt: "2025-01-05",
      consentedAt: "2025-01-06",
    },
    {
      id: "consent6",
      type: "extracurricular",
      title: "Basketball Club Participation",
      description: "Permission to participate in after-school basketball club activities, including weekend practice sessions and inter-school competitions.",
      status: "pending",
      createdAt: "2025-02-05",
      expiresAt: "2025-02-28",
    },
  ],
  child2: [
    {
      id: "consent7",
      type: "photo_video",
      title: "School Photo and Video Consent",
      description: "Permission to use student's photograph and video in school publications, website, and promotional materials.",
      status: "approved",
      createdAt: "2025-01-10",
      consentedAt: "2025-01-15",
    },
    {
      id: "consent8",
      type: "medical",
      title: "Emergency Medical Treatment",
      description: "Authorization for school staff to seek emergency medical treatment for student when parents cannot be reached.",
      status: "approved",
      createdAt: "2025-01-08",
      consentedAt: "2025-01-09",
    },
    {
      id: "consent9",
      type: "field_trip",
      title: "National Museum Visit",
      description: "Educational visit to the National Museum of Bhutan in Paro.",
      status: "expired",
      createdAt: "2024-11-15",
      consentedAt: "2024-11-16",
      expiresAt: "2024-12-15",
    },
  ],
};

type FilterType = "all" | "pending" | "approved" | "rejected" | "expired";
type ViewDialog = { type: "view"; consent: typeof mockConsentRecords[keyof typeof mockConsentRecords][0] } | null;

export default function ParentConsentPage() {
  const [selectedChild, setSelectedChild] = useState<Child>(mockChildren[0]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [viewDialog, setViewDialog] = useState<ViewDialog>(null);

  const consentRecords = mockConsentRecords[selectedChild.id] || [];

  const filteredRecords = consentRecords.filter((record) => {
    if (filter === "all") return true;
    return record.status === filter;
  });

  const pendingCount = consentRecords.filter((r) => r.status === "pending").length;
  const approvedCount = consentRecords.filter((r) => r.status === "approved").length;
  const expiredCount = consentRecords.filter((r) => r.status === "expired").length;

  const parentPortalGradient = {
    background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)"
  };

  const getStatusBadge = (status: string) => {
    const config = {
      approved: { label: "Approved", color: "bg-green-100 text-green-700", icon: CheckCircle },
      pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700", icon: Clock },
      rejected: { label: "Declined", color: "bg-red-100 text-red-700", icon: XCircle },
      expired: { label: "Expired", color: "bg-gray-100 text-gray-700", icon: AlertCircle },
    };
    const { label, color, icon: Icon } = config[status as keyof typeof config];
    return (
      <Badge className={color}>
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const getConsentTypeConfig = (type: string) => {
    return consentTypes.find((t) => t.type === type) || consentTypes[0];
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const handleSignConsent = (consentId: string, action: "approve" | "reject") => {
    // Will be implemented with API call
    console.log(`${action} consent ${consentId}`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Forms & Permissions
          </h1>
          <p className="text-gray-600">
            Manage consent forms and permissions for {selectedChild.name}
          </p>
        </div>
      </div>

      {/* Child Selector */}
      <ChildSelector
        children={mockChildren}
        selectedChildId={selectedChild.id}
        onChildChange={setSelectedChild}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <FileText className="w-8 h-8 mx-auto mb-2" style={{ color: "rgb(107 114 128)" }} />
              <p className="text-2xl font-bold text-gray-900">{consentRecords.length}</p>
              <p className="text-sm text-gray-500">Total Forms</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
              <p className="text-sm text-gray-500">Approved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-2xl font-bold text-gray-600">{expiredCount}</p>
              <p className="text-sm text-gray-500">Expired</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Alerts */}
      {pendingCount > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-yellow-900">
                  You have {pendingCount} pending consent form{pendingCount > 1 ? "s" : ""} requiring your attention
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Please review and sign the forms below to avoid any disruption to {selectedChild.name}&apos;s activities.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                onClick={() => setFilter("pending")}
              >
                View Pending
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["all", "pending", "approved", "expired"] as FilterType[]).map((filterType) => (
                <Button
                  key={filterType}
                  variant={filter === filterType ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(filterType)}
                  style={filter === filterType ? parentPortalGradient : {}}
                  className="min-h-[44px]"
                >
                  {filterType === "all" && "All"}
                  {filterType === "pending" && "Pending"}
                  {filterType === "approved" && "Approved"}
                  {filterType === "expired" && "Expired"}
                  {filterType !== "all" && (
                    <span className="ml-1">
                      (
                      {filterType === "pending"
                        ? pendingCount
                        : filterType === "approved"
                        ? approvedCount
                        : expiredCount}
                      )
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Consent Records List */}
      <div className="space-y-4">
        {filteredRecords.length === 0 ? (
          <Card>
            <CardContent className="pt-12 text-center">
              <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No consent forms found</h3>
              <p className="text-gray-500">
                {filter === "all"
                  ? "No consent forms available at this time."
                  : `No ${filter} consent forms found.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRecords.map((record) => {
            const typeConfig = getConsentTypeConfig(record.type);
            const TypeIcon = typeConfig.icon;
            const expired = record.expiresAt && isExpired(record.expiresAt);

            return (
              <Card
                key={record.id}
                className={`hover:shadow-md transition-all ${
                  record.status === "pending" ? "border-yellow-300 bg-yellow-50/50" : ""
                } ${expired ? "border-gray-300 opacity-70" : ""}`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    {/* Type Icon */}
                    <div className={`p-3 rounded-lg ${typeConfig.color} flex-shrink-0`}>
                      <TypeIcon className="w-6 h-6" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-lg">{record.title}</h3>
                            {getStatusBadge(record.status)}
                            {expired && (
                              <Badge variant="outline" className="text-gray-500">
                                Expired
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{record.description}</p>
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Created: {new Date(record.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        {record.consentedAt && (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Signed: {new Date(record.consentedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        )}
                        {record.expiresAt && !expired && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Expires: {new Date(record.expiresAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewDialog({ type: "view", consent: record })}
                          className="min-h-[44px]"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>

                        {record.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              className="min-h-[44px]"
                              style={parentPortalGradient}
                              onClick={() => handleSignConsent(record.id, "approve")}
                            >
                              <Signature className="w-4 h-4 mr-1" />
                              Approve & Sign
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="min-h-[44px] text-red-600 border-red-300 hover:bg-red-50"
                              onClick={() => handleSignConsent(record.id, "reject")}
                            >
                              Decline
                            </Button>
                          </>
                        )}

                        {record.status === "approved" && (
                          <Button variant="outline" size="sm" className="min-h-[44px]">
                            <Download className="w-4 h-4 mr-1" />
                            Download Copy
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Consent Types Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" style={{ color: "rgb(107 114 128)" }} />
            Consent Types Explained
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {consentTypes.map((type) => {
              const Icon = type.icon;
              return (
                <div key={type.type} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`p-2 rounded ${type.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{type.name}</p>
                    <p className="text-xs text-gray-500">{type.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* View Dialog */}
      {viewDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {(() => {
                    const typeConfig = getConsentTypeConfig(viewDialog.consent.type);
                    const Icon = typeConfig.icon;
                    return (
                      <div className={`p-2 rounded-lg ${typeConfig.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    );
                  })()}
                  <div>
                    <CardTitle>{viewDialog.consent.title}</CardTitle>
                    <CardDescription>
                      {selectedChild.name} · {selectedChild.grade}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewDialog(null)}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Status:</span>
                {getStatusBadge(viewDialog.consent.status)}
              </div>

              {/* Description */}
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">Description</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {viewDialog.consent.description}
                </p>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-1">Created</h4>
                  <p className="text-sm text-gray-600">
                    {new Date(viewDialog.consent.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                {viewDialog.consent.consentedAt && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-1">Consented On</h4>
                    <p className="text-sm text-gray-600">
                      {new Date(viewDialog.consent.consentedAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                )}
                {viewDialog.consent.expiresAt && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-1">Expires</h4>
                    <p className="text-sm text-gray-600">
                      {new Date(viewDialog.consent.expiresAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* Legal Note */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">
                    By signing this consent form, you agree to the terms and conditions outlined above.
                    You may withdraw your consent at any time by contacting the school administration.
                  </p>
                </div>
              </div>

              {/* Actions */}
              {viewDialog.consent.status === "pending" && (
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 min-h-[44px] text-red-600 border-red-300 hover:bg-red-50"
                    onClick={() => {
                      handleSignConsent(viewDialog.consent.id, "reject");
                      setViewDialog(null);
                    }}
                  >
                    Decline
                  </Button>
                  <Button
                    className="flex-1 min-h-[44px]"
                    style={parentPortalGradient}
                    onClick={() => {
                      handleSignConsent(viewDialog.consent.id, "approve");
                      setViewDialog(null);
                    }}
                  >
                    <Signature className="w-4 h-4 mr-2" />
                    Approve & Sign
                  </Button>
                </div>
              )}

              {viewDialog.consent.status === "approved" && (
                <Button
                  variant="outline"
                  className="w-full min-h-[44px]"
                  onClick={() => setViewDialog(null)}
                >
                  Close
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Back Navigation */}
      <div className="pt-4">
        <Button variant="outline" asChild>
          <Link href="/parent">
            Back to Parent Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
