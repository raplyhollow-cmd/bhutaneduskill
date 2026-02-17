"use client";

import { logger } from "@/lib/logger";
/**
 * PARENT HOMEWORK PAGE
 *
 * Features:
 * - View all children's homework assignments
 * - Filter by child
 * - View submission status (pending, submitted, graded, overdue)
 * - View grades and feedback
 * - Multi-child support
 */


import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  Users,
  Filter,
  BookOpen,
  TrendingUp,
  Calendar,
  Paperclip,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface Child {
  id: string;
  firstName: string;
  lastName: string | null;
  classGrade: number | null;
  section: string | null;
  profileImage: string | null;
}

interface HomeworkChild {
  childId: string;
  childName: string;
  childFirstName: string;
  childLastName: string | null;
  childClassGrade: number | null;
  childSection: string | null;
  submissionStatus: "pending" | "submitted" | "graded" | "overdue";
  isOverdue: boolean;
  score: number | null;
  feedback: string | null;
  submittedAt: string | null;
  gradedAt: string | null;
  totalPoints: number;
  percentage: number | null;
}

interface Homework {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  assignedDate: string;
  totalPoints: number;
  passingScore: number;
  classId: string;
  className: string | null;
  subjectId: string | null;
  subjectName: string | null;
  attachments: Array<{ id: string; name: string; type: string; url: string }> | null;
  children: HomeworkChild[];
}

interface HomeworkResponse {
  children: Child[];
  homework: Homework[];
}

type StatusFilter = "all" | "pending" | "submitted" | "graded" | "overdue";

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function ParentHomeworkPage() {
  const router = useRouter();
  const [data, setData] = useState<HomeworkResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedHomeworkId, setExpandedHomeworkId] = useState<string | null>(null);

  const hasFetched = useRef(false);

  // Fetch homework data
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchHomework = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/parent/homework");

        if (!response.ok) {
          throw new Error("Failed to fetch homework data");
        }

        const result: HomeworkResponse = await response.json();
        setData(result);

        // Auto-select first child if available
        if (result.children && result.children.length > 0 && !selectedChildId) {
          setSelectedChildId(result.children[0].id);
        }
      } catch (err) {
        logger.error("Error fetching homework:", err);
        setError("Failed to load homework data");
      } finally {
        setLoading(false);
      }
    };

    fetchHomework();
  }, [selectedChildId]);

  // Refetch when filters change
  useEffect(() => {
    const fetchFilteredHomework = async () => {
      try {
        setError(null);

        const params = new URLSearchParams();
        if (selectedChildId) {
          params.append("childId", selectedChildId);
        }
        if (statusFilter !== "all") {
          params.append("status", statusFilter);
        }

        const response = await fetch(`/api/parent/homework?${params.toString()}`);

        if (!response.ok) {
          throw new Error("Failed to fetch homework data");
        }

        const result: HomeworkResponse = await response.json();
        setData(result);
      } catch (err) {
        logger.error("Error fetching filtered homework:", err);
        setError("Failed to load homework data");
      }
    };

    if (hasFetched.current) {
      fetchFilteredHomework();
    }
  }, [selectedChildId, statusFilter]);

  // Computed values
  const selectedChild = useMemo(
    () => data?.children.find((c) => c.id === selectedChildId) || null,
    [data, selectedChildId]
  );

  const filteredHomework = useMemo(() => {
    if (!data) return [];

    let homework = data.homework;

    // Filter by selected child if applicable
    if (selectedChildId) {
      homework = homework.filter((hw) =>
        hw.children.some((c) => c.childId === selectedChildId)
      );
    }

    return homework;
  }, [data, selectedChildId]);

  // Status badge colors
  const getStatusBadge = (status: string, isOverdue: boolean) => {
    if (isOverdue) {
      return (
        <Badge className="bg-red-100 text-red-700">
          <AlertCircle className="w-3 h-3 mr-1" />
          Overdue
        </Badge>
      );
    }

    switch (status) {
      case "graded":
        return (
          <Badge className="bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            Graded
          </Badge>
        );
      case "submitted":
        return (
          <Badge className="bg-blue-100 text-blue-700">
            <Clock className="w-3 h-3 mr-1" />
            Submitted
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  // Get grade color
  const getGradeColor = (percentage: number | null) => {
    if (percentage === null) return "text-gray-500";

    if (percentage >= 90) return "text-green-600";
    if (percentage >= 75) return "text-blue-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
            <p className="ml-3 text-gray-600">Loading homework...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-16 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-900 mb-2">Error Loading Homework</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No children state
  if (!data || data.children.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Children Found</h2>
            <p className="text-gray-500 mb-6">
              You don't have any children linked to your account yet.
              Please contact school administration to link your children.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No homework state
  if (filteredHomework.length === 0) {
    return (
      <div className="space-y-6">
        {/* Child selector */}
        {data.children.length > 1 && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-4 overflow-x-auto pb-2">
                <span className="text-sm font-medium text-gray-600">Viewing homework for:</span>
                <div className="flex gap-2">
                  {data.children.map((child) => (
                    <Button
                      key={child.id}
                      variant={selectedChildId === child.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedChildId(child.id)}
                      className="whitespace-nowrap"
                      style={
                        selectedChildId === child.id
                          ? { background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)" }
                          : undefined
                      }
                    >
                      {child.firstName} {child.lastName || ""}
                    </Button>
                  ))}
                  <Button
                    variant={selectedChildId === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedChildId(null)}
                    className="whitespace-nowrap"
                    style={
                      selectedChildId === null
                        ? { background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)" }
                        : undefined
                    }
                  >
                    All Children
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Homework Found</h2>
            <p className="text-gray-500">
              {statusFilter !== "all"
                ? `No homework with status "${statusFilter}" found.`
                : "No homework assignments have been posted yet."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Homework</h1>
        <p className="text-gray-600">View your children's homework assignments, submissions, and grades.</p>
      </div>

      {/* Multi-child selector */}
      {data.children.length > 1 && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-4 overflow-x-auto pb-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-600">Viewing homework for:</span>
              <div className="flex gap-2">
                {data.children.map((child) => (
                  <Button
                    key={child.id}
                    variant={selectedChildId === child.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedChildId(child.id)}
                    className="whitespace-nowrap"
                    style={
                      selectedChildId === child.id
                        ? { background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)" }
                        : undefined
                    }
                  >
                    {child.firstName} {child.lastName || ""}
                  </Button>
                ))}
                <Button
                  variant={selectedChildId === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedChildId(null)}
                  className="whitespace-nowrap"
                  style={
                    selectedChildId === null
                      ? { background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)" }
                      : undefined
                  }
                >
                  All Children
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status filter */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-600">Filter by status:</span>
            <div className="flex gap-2">
              {(["all", "pending", "submitted", "graded", "overdue"] as const).map((filter) => (
                <Button
                  key={filter}
                  variant={statusFilter === filter ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(filter)}
                  className="whitespace-nowrap capitalize"
                  style={
                    statusFilter === filter
                      ? { background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)" }
                      : undefined
                  }
                >
                  {filter}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-2">
              <FileText className="w-3 h-3" />
              Total Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{filteredHomework.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-2">
              <Clock className="w-3 h-3" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {filteredHomework.filter((hw) =>
                hw.children.some((c) => c.submissionStatus === "pending")
              ).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-2">
              <CheckCircle className="w-3 h-3" />
              Submitted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {filteredHomework.filter((hw) =>
                hw.children.some((c) => c.submissionStatus === "submitted")
              ).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-2">
              <TrendingUp className="w-3 h-3" />
              Graded
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {filteredHomework.filter((hw) =>
                hw.children.some((c) => c.submissionStatus === "graded")
              ).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Homework list */}
      <div className="space-y-4">
        {filteredHomework.map((hw) => {
          const isExpanded = expandedHomeworkId === hw.id;
          const dueDate = new Date(hw.dueDate);
          const now = new Date();
          const isPastDue = dueDate < now;

          return (
            <Card key={hw.id} className="overflow-hidden">
              <CardHeader
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedHomeworkId(isExpanded ? null : hw.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg">{hw.title}</CardTitle>
                      {isPastDue && (
                        <Badge className="bg-red-100 text-red-700">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Past Due
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {hw.subjectName || hw.className || "General"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Due: {dueDate.toLocaleDateString()}
                      </span>
                      <span>Max Points: {hw.totalPoints}</span>
                      {hw.attachments && hw.attachments.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Paperclip className="w-4 h-4" />
                          {hw.attachments.length} attachment{hw.attachments.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm">
                    {isExpanded ? "▲" : "▼"}
                  </Button>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="border-t">
                  {hw.description && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                      <p className="text-sm text-gray-600">{hw.description}</p>
                    </div>
                  )}

                  {hw.attachments && hw.attachments.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Attachments</h4>
                      <div className="flex flex-wrap gap-2">
                        {hw.attachments.map((file) => (
                          <a
                            key={file.id}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                          >
                            <Paperclip className="w-4 h-4" />
                            {file.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Submission Status for {selectedChild ? selectedChild.firstName : "Children"}
                    </h4>

                    <div className="space-y-3">
                      {hw.children.map((childHw) => (
                        <div
                          key={childHw.childId}
                          className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium text-gray-900">{childHw.childName}</p>
                              <p className="text-sm text-gray-500">
                                Class {childHw.childClassGrade}
                                {childHw.childSection && ` - ${childHw.childSection}`}
                              </p>
                            </div>
                            {getStatusBadge(childHw.submissionStatus, childHw.isOverdue)}
                          </div>

                          <div className="grid md:grid-cols-3 gap-4 text-sm">
                            {/* Status */}
                            <div>
                              <span className="text-gray-500">Status:</span>
                              <span className="ml-2 font-medium">
                                {childHw.submissionStatus.charAt(0).toUpperCase() +
                                  childHw.submissionStatus.slice(1)}
                              </span>
                            </div>

                            {/* Grade/Score */}
                            {childHw.score !== null && (
                              <div>
                                <span className="text-gray-500">Score:</span>
                                <span className={`ml-2 font-bold ${getGradeColor(childHw.percentage)}`}>
                                  {childHw.score} / {childHw.totalPoints}
                                  {childHw.percentage !== null && ` (${childHw.percentage}%)`}
                                </span>
                              </div>
                            )}

                            {/* Submitted date */}
                            {childHw.submittedAt && (
                              <div>
                                <span className="text-gray-500">Submitted:</span>
                                <span className="ml-2">
                                  {new Date(childHw.submittedAt).toLocaleString()}
                                </span>
                              </div>
                            )}

                            {/* Graded date */}
                            {childHw.gradedAt && (
                              <div>
                                <span className="text-gray-500">Graded:</span>
                                <span className="ml-2">
                                  {new Date(childHw.gradedAt).toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Feedback */}
                          {childHw.feedback && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-sm font-medium text-blue-900 mb-1">Teacher Feedback:</p>
                              <p className="text-sm text-blue-800">{childHw.feedback}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
