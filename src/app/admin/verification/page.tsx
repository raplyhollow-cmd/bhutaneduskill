"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Building2,
  Users,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Download,
  Mail,
  Calendar,
  Eye,
  Check,
  X,
  Loader2,
  Globe,
  FileCheck,
  User,
  Shield,
} from "lucide-react";
import { logger } from "@/lib/logger";

type VerificationStatus = "pending" | "approved" | "rejected" | "needs_info";
type VerificationType = "ministry" | "school";

interface VerificationRequest {
  id: string;
  type: VerificationType;
  status: VerificationStatus;
  ministryData?: MinistryData;
  adminData?: AdminData;
  schoolData?: SchoolData;
  documents?: DocumentData;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  notes?: string;
  rejectionReason?: string;
}

interface MinistryData {
  name: string;
  level: "national" | "district" | "regional";
  country: string;
  region?: string;
  officialDomain: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
}

interface AdminData {
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  officialEmail: string;
  phone: string;
  employeeId: string;
}

interface SchoolData {
  name: string;
  code: string;
  type: string;
  level: string;
  address: string;
  city: string;
  phone: string;
  email: string;
}

interface DocumentData {
  governmentId: string;
  appointmentLetter: string;
  letterhead: string;
}

type ApiVerificationRequest = {
  id: string;
  type: VerificationType;
  status: VerificationStatus;
  ministryData?: MinistryData;
  adminData?: AdminData;
  schoolData?: SchoolData;
  documents?: DocumentData;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
  rejectionReason?: string;
};

export default function AdminVerificationPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<VerificationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<VerificationStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<VerificationType | "all">("all");

  // Dialog states
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | "request_info">("approve");
  const [actionNotes, setActionNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    pending: 0,
    approvedToday: 0,
    rejectedThisWeek: 0,
    total: 0,
  });

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, searchQuery, statusFilter, typeFilter]);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/verification/ministry");

      if (response.ok) {
        const data = await response.json();
        const requestsData: VerificationRequest[] = data.data.map((req: ApiVerificationRequest) => ({
          ...req,
          submittedAt: new Date(req.submittedAt),
          reviewedAt: req.reviewedAt ? new Date(req.reviewedAt) : undefined,
        }));

        setRequests(requestsData);
        calculateStats(requestsData);
      }
    } catch (error) {
      logger.error("Failed to load verification requests", { error });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (data: VerificationRequest[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const pending = data.filter(r => r.status === "pending").length;
    const approvedToday = data.filter(
      r => r.status === "approved" && r.reviewedAt && r.reviewedAt >= today
    ).length;
    const rejectedThisWeek = data.filter(
      r => r.status === "rejected" && r.reviewedAt && r.reviewedAt >= weekAgo
    ).length;

    setStats({
      pending,
      approvedToday,
      rejectedThisWeek,
      total: data.length,
    });
  };

  const filterRequests = () => {
    let filtered = [...requests];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(req =>
        req.ministryData?.name.toLowerCase().includes(query) ||
        req.adminData?.officialEmail.toLowerCase().includes(query) ||
        req.id.toLowerCase().includes(query) ||
        req.schoolData?.name.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(req => req.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(req => req.type === typeFilter);
    }

    setFilteredRequests(filtered);
  };

  const handleAction = async () => {
    if (!selectedRequest) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/verification/ministry?id=${selectedRequest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationId: selectedRequest.id,
          action: actionType,
          notes: actionNotes,
        }),
      });

      if (response.ok) {
        // Update local state
        setRequests(prev =>
          prev.map(req =>
            req.id === selectedRequest.id
              ? { ...req, status: actionType === "approve" ? "approved" : actionType === "reject" ? "rejected" : "needs_info", reviewedAt: new Date(), notes: actionNotes }
              : req
          )
        );

        setActionDialogOpen(false);
        setActionNotes("");
        setSelectedRequest(null);
      }
    } catch (error) {
      logger.error("Failed to update verification request", { error });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: VerificationStatus) => {
    const variants = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
      needs_info: "outline",
    } as const;

    const icons = {
      pending: Clock,
      approved: CheckCircle,
      rejected: XCircle,
      needs_info: AlertCircle,
    };

    const Icon = icons[status];

    return (
      <Badge variant={variants[status]} className="gap-1.5">
        <Icon className="w-3 h-3" />
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  const getTypeBadge = (type: VerificationType) => {
    if (type === "ministry") {
      return (
        <Badge variant="outline" className="gap-1.5 text-purple-700 border-purple-200">
          <Building2 className="w-3 h-3" />
          Ministry
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="gap-1.5 text-blue-700 border-blue-200">
        <Users className="w-3 h-3" />
        School
      </Badge>
    );
  };

  const openViewDialog = (request: VerificationRequest) => {
    setSelectedRequest(request);
    setViewDialogOpen(true);
  };

  const openActionDialog = (request: VerificationRequest, action: typeof actionType) => {
    setSelectedRequest(request);
    setActionType(action);
    setActionDialogOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Verification Dashboard
          </h1>
          <p className="text-gray-600">
            Review and approve ministry and school verification requests
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Approved Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approvedToday}</div>
            <p className="text-xs text-gray-500 mt-1">Completed today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Rejected This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejectedThisWeek}</div>
            <p className="text-xs text-gray-500 mt-1">Past 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={(value: VerificationStatus | "all") => setStatusFilter(value)}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="needs_info">Needs Info</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(value: VerificationType | "all") => setTypeFilter(value)}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="ministry">Ministry</SelectItem>
                <SelectItem value="school">School</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
            <p className="ml-3 text-gray-600">Loading verification requests...</p>
          </CardContent>
        </Card>
      ) : filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No verification requests found</p>
              <p className="text-sm text-gray-500 mt-1">
                {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                  ? "Try adjusting your filters"
                  : "New requests will appear here"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {request.ministryData?.name || request.schoolData?.name}
                      </h3>
                      {getTypeBadge(request.type)}
                      {getStatusBadge(request.status)}
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        <span className="font-mono">{request.id}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{request.adminData?.officialEmail || request.schoolData?.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{request.submittedAt.toLocaleDateString()}</span>
                      </div>
                    </div>

                    {request.ministryData?.level && (
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 capitalize">{request.ministryData.level} Ministry</span>
                        {request.ministryData.region && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-600">{request.ministryData.region}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openViewDialog(request)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>

                    {request.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => openActionDialog(request, "approve")}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openActionDialog(request, "reject")}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </>
                    )}

                    {request.status === "needs_info" && (
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => openActionDialog(request, "approve")}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Verification Request Details</DialogTitle>
            <DialogDescription>
              Review all information before making a decision
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* Request Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getTypeBadge(selectedRequest.type)}
                  {getStatusBadge(selectedRequest.status)}
                </div>
                <div className="text-sm text-gray-500">
                  ID: <span className="font-mono">{selectedRequest.id}</span>
                </div>
              </div>

              {/* Ministry/School Details */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-orange-600" />
                  {selectedRequest.type === "ministry" ? "Ministry Information" : "School Information"}
                </h4>
                <dl className="grid md:grid-cols-2 gap-3 text-sm">
                  {selectedRequest.ministryData ? (
                    <>
                      <div>
                        <dt className="text-gray-500">Name</dt>
                        <dd className="font-medium text-gray-900">{selectedRequest.ministryData.name}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Level</dt>
                        <dd className="font-medium text-gray-900 capitalize">{selectedRequest.ministryData.level}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Official Domain</dt>
                        <dd className="font-medium text-gray-900">{selectedRequest.ministryData.officialDomain}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Phone</dt>
                        <dd className="font-medium text-gray-900">{selectedRequest.ministryData.phone}</dd>
                      </div>
                      <div className="md:col-span-2">
                        <dt className="text-gray-500">Address</dt>
                        <dd className="font-medium text-gray-900">
                          {selectedRequest.ministryData.address}, {selectedRequest.ministryData.city} {selectedRequest.ministryData.postalCode}
                        </dd>
                      </div>
                    </>
                  ) : selectedRequest.schoolData ? (
                    <>
                      <div>
                        <dt className="text-gray-500">School Name</dt>
                        <dd className="font-medium text-gray-900">{selectedRequest.schoolData.name}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">School Code</dt>
                        <dd className="font-medium text-gray-900">{selectedRequest.schoolData.code}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Type</dt>
                        <dd className="font-medium text-gray-900">{selectedRequest.schoolData.type}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Level</dt>
                        <dd className="font-medium text-gray-900">{selectedRequest.schoolData.level}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Email</dt>
                        <dd className="font-medium text-gray-900">{selectedRequest.schoolData.email}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Phone</dt>
                        <dd className="font-medium text-gray-900">{selectedRequest.schoolData.phone}</dd>
                      </div>
                    </>
                  ) : null}
                </dl>
              </div>

              {/* Administrator Details */}
              {selectedRequest.adminData && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Administrator Details
                  </h4>
                  <dl className="grid md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-gray-500">Name</dt>
                      <dd className="font-medium text-gray-900">
                        {selectedRequest.adminData.firstName} {selectedRequest.adminData.lastName}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Position</dt>
                      <dd className="font-medium text-gray-900">{selectedRequest.adminData.position}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Department</dt>
                      <dd className="font-medium text-gray-900">{selectedRequest.adminData.department}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Employee ID</dt>
                      <dd className="font-medium text-gray-900">{selectedRequest.adminData.employeeId}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Official Email</dt>
                      <dd className="font-medium text-gray-900">{selectedRequest.adminData.officialEmail}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Phone</dt>
                      <dd className="font-medium text-gray-900">{selectedRequest.adminData.phone}</dd>
                    </div>
                  </dl>
                </div>
              )}

              {/* Documents */}
              {selectedRequest.documents && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-purple-600" />
                    Uploaded Documents
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center justify-between">
                      <span className="text-gray-700">Government ID</span>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-gray-700">Appointment Letter</span>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-gray-700">Official Letterhead</span>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </li>
                  </ul>
                </div>
              )}

              {/* Notes */}
              {selectedRequest.notes && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Notes</h4>
                  <p className="text-sm text-gray-700">{selectedRequest.notes}</p>
                </div>
              )}

              {/* Timeline */}
              <div className="text-xs text-gray-500 space-y-1">
                <div>Submitted: {selectedRequest.submittedAt.toLocaleString()}</div>
                {selectedRequest.reviewedAt && (
                  <div>Reviewed: {selectedRequest.reviewedAt.toLocaleString()}</div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
            {selectedRequest?.status === "pending" && (
              <>
                <Button
                  variant="outline"
                  className="border-green-600 text-green-600 hover:bg-green-50"
                  onClick={() => {
                    setViewDialogOpen(false);
                    openActionDialog(selectedRequest, "approve");
                  }}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setViewDialogOpen(false);
                    openActionDialog(selectedRequest, "reject");
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve Request" : actionType === "reject" ? "Reject Request" : "Request Information"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "This will activate the ministry account and send a confirmation email."
                : actionType === "reject"
                ? "This will reject the verification request. Please provide a reason."
                : "Request additional information from the applicant."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-900">
                {selectedRequest?.ministryData?.name || selectedRequest?.schoolData?.name}
              </p>
              <p className="text-xs text-gray-500">{selectedRequest?.id}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">
                {actionType === "reject" ? "Rejection Reason *" : actionType === "request_info" ? "Information Requested *" : "Notes (Optional)"}
              </Label>
              <Textarea
                id="notes"
                placeholder={
                  actionType === "reject"
                    ? "e.g., Documents could not be verified..."
                    : actionType === "request_info"
                    ? "e.g., Please provide additional documentation..."
                    : "Add any notes for your records..."
                }
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                rows={4}
              />
            </div>

            {actionType === "approve" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex gap-3">
                <Mail className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900">Email Notification</p>
                  <p className="text-xs text-green-700 mt-1">
                    An approval email will be sent to {selectedRequest?.adminData?.officialEmail || selectedRequest?.schoolData?.email}
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={isSubmitting || (actionType === "reject" && !actionNotes.trim())}
              className={actionType === "approve" ? "bg-green-600 hover:bg-green-700" : actionType === "request_info" ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : actionType === "approve" ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Approve Request
                </>
              ) : actionType === "reject" ? (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Reject Request
                </>
              ) : (
                "Send Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
