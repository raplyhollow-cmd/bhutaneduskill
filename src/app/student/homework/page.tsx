"use client";

import { logger } from "@/lib/logger";
/**
 * STUDENT HOMEWORK PAGE
 * View and submit homework assignments
 */

import { useState, useEffect, useCallback } from "react";
import { HomeworkSubmission, type HomeworkAnswer, type HomeworkSubmissionMetadata } from "@/components/homework";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, AlertCircle, Loader2, CheckCircle2, Filter, MessageSquare, Star } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// API response type
interface ApiHomework {
  id: string;
  title: string;
  description?: string;
  subject?: string;
  classId: string;
  dueDate: string;
  maxPoints?: number;
  totalPoints?: number;
  timeLimit?: number;
  questions: unknown[];
  isPublished: boolean;
  type?: string;
  shuffleQuestions?: boolean;
  showResults?: string;
  class?: {
    id: string;
    name: string;
  };
  status?: string;
  submission?: {
    id: string;
    status: string;
    score?: number;
    maxScore?: number;
    percentage?: number;
    feedback?: string;
    submittedAt?: string;
    gradedAt?: string;
    isLate?: boolean;
  };
  timeRemaining?: number;
}

type FilterStatus = "all" | "pending" | "submitted" | "overdue";
type FilterSubject = "all" | string;

export default function StudentHomeworkPage() {
  const [homeworkList, setHomeworkList] = useState<ApiHomework[]>([]);
  const [selectedHomework, setSelectedHomework] = useState<ApiHomework | null>(null);
  const [viewSubmission, setViewSubmission] = useState<ApiHomework | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterSubject, setFilterSubject] = useState<FilterSubject>("all");
  const [subjects, setSubjects] = useState<string[]>([]);

  // Show notification
  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Fetch homework assignments
  const fetchHomework = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/student/homework");
      if (response.ok) {
        const result = await response.json();
        setHomeworkList(result.homework || []);

        // Extract unique subjects
        const uniqueSubjects = Array.from(
          new Set(
            result.homework
              ?.map((hw: ApiHomework) => hw.subject || hw.class?.name || "General")
              .filter(Boolean) || []
          )
        );
        setSubjects(uniqueSubjects as string[]);
      }
    } catch (error) {
      logger.error("Failed to fetch homework:", error);
      showNotification("error", "Failed to load homework assignments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHomework();
  }, [fetchHomework]);

  const handleSubmit = (answers: Record<string, HomeworkAnswer>, metadata: HomeworkSubmissionMetadata | null) => {
    if (!selectedHomework) return;

    setSubmitting(true);
    fetch(`/api/student/homework/${selectedHomework.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    })
      .then(async (response) => {
        if (response.ok) {
          showNotification("success", "Homework submitted successfully");
          setSelectedHomework(null);
          await fetchHomework();
        } else {
          const error = await response.json();
          throw new Error(error.error || "Failed to submit homework");
        }
      })
      .catch((error: unknown) => {
        logger.error("Failed to submit homework:", error);
        showNotification("error", error instanceof Error ? error.message : "Failed to submit homework");
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  const handleSaveDraft = (answers: Record<string, HomeworkAnswer>) => {
    if (!selectedHomework) return;

    fetch(`/api/student/homework/${selectedHomework.id}/draft`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    })
      .then(async (response) => {
        if (response.ok) {
          showNotification("success", "Draft saved successfully");
        } else {
          throw new Error("Failed to save draft");
        }
      })
      .catch((error: unknown) => {
        logger.error("Failed to save draft:", error);
        showNotification("error", error instanceof Error ? error.message : "Failed to save draft");
      });
  };

  // Filter homework based on selected filters
  const filteredHomework = homeworkList.filter((hw) => {
    // Status filter
    if (filterStatus !== "all") {
      if (filterStatus === "pending" && hw.submission) return false;
      if (filterStatus === "submitted" && !hw.submission) return false;
      if (filterStatus === "overdue") {
        const dueDate = hw.dueDate ? new Date(hw.dueDate) : null;
        if (!dueDate || dueDate >= new Date() || hw.submission) return false;
      }
    }

    // Subject filter
    if (filterSubject !== "all") {
      const hwSubject = hw.subject || hw.class?.name || "General";
      if (hwSubject !== filterSubject) return false;
    }

    return true;
  });

  // Get status badge for a homework item
  const getStatusBadge = (hw: ApiHomework) => {
    if (hw.submission) {
      const status = hw.submission.status;
      if (status === "graded") {
        return (
          <Badge className="bg-green-100 text-green-700">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Graded
          </Badge>
        );
      }
      return (
        <Badge className="bg-blue-100 text-blue-700">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Submitted
        </Badge>
      );
    }

    const dueDate = hw.dueDate ? new Date(hw.dueDate) : null;
    if (dueDate && dueDate < new Date()) {
      return (
        <Badge className="bg-red-100 text-red-700">
          <AlertCircle className="w-3 h-3 mr-1" />
          Overdue
        </Badge>
      );
    }

    return (
      <Badge className="bg-yellow-100 text-yellow-700">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </Badge>
    );
  };

  // View submission details
  const handleViewSubmission = (hw: ApiHomework) => {
    setViewSubmission(hw);
  };

  if (viewSubmission) {
    return (
      <div className="space-y-6">
        {notification && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 ${
            notification.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
          }`}>
            {notification.type === "success" ? "✓" : "✕"} {notification.message}
          </div>
        )}

        <div className="max-w-4xl">
          <div className="mb-4">
            <Button variant="outline" onClick={() => setViewSubmission(null)}>
              ← Back to Homework
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{viewSubmission.title}</CardTitle>
              <p className="text-gray-500">{viewSubmission.description}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Submission Info */}
              {viewSubmission.submission && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="font-semibold capitalize">{viewSubmission.submission.status}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Submitted</p>
                      <p className="font-semibold">
                        {viewSubmission.submission.submittedAt
                          ? new Date(viewSubmission.submission.submittedAt).toLocaleString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Grades */}
                  {viewSubmission.submission.status === "graded" && (
                    <>
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-500">Score</span>
                          <span className="text-2xl font-bold">
                            {viewSubmission.submission.score ?? 0}
                            <span className="text-gray-400 text-lg"> / {viewSubmission.submission.maxScore ?? viewSubmission.totalPoints ?? 0}</span>
                          </span>
                        </div>
                        {viewSubmission.submission.percentage !== undefined && (
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                viewSubmission.submission.percentage >= 80
                                  ? "bg-green-500"
                                  : viewSubmission.submission.percentage >= 60
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${Math.min(viewSubmission.submission.percentage, 100)}%` }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Feedback */}
                      {viewSubmission.submission.feedback && (
                        <div className="border-t pt-4">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="w-4 h-4 text-blue-500" />
                            <p className="text-sm font-medium">Teacher Feedback</p>
                          </div>
                          <p className="text-gray-700 bg-white rounded p-3 border">
                            {viewSubmission.submission.feedback}
                          </p>
                        </div>
                      )}

                      {/* Graded info */}
                      {viewSubmission.submission.gradedAt && (
                        <div className="border-t pt-4 text-sm text-gray-500">
                          Graded on {new Date(viewSubmission.submission.gradedAt).toLocaleString()}
                        </div>
                      )}
                    </>
                  )}

                  {/* Late submission warning */}
                  {viewSubmission.submission.isLate && (
                    <div className="border-t pt-4">
                      <Badge className="bg-orange-100 text-orange-700">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Submitted Late
                      </Badge>
                    </div>
                  )}
                </div>
              )}

              {/* Homework Details */}
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Subject</p>
                <p className="font-medium">{viewSubmission.subject || viewSubmission.class?.name || "General"}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-500">Due Date</p>
                <p className="font-medium">
                  {viewSubmission.dueDate ? new Date(viewSubmission.dueDate).toLocaleString() : "No due date"}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-500">Total Points</p>
                <p className="font-medium">{viewSubmission.maxPoints || viewSubmission.totalPoints || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (selectedHomework) {
    // Transform API data to component's expected format
    const componentHomework = {
      id: selectedHomework.id,
      title: selectedHomework.title,
      description: selectedHomework.description || "No description provided",
      subject: selectedHomework.subject || "General",
      dueDate: selectedHomework.dueDate,
      totalPoints: selectedHomework.totalPoints || selectedHomework.maxPoints || 0,
      questions: (selectedHomework.questions || []) as { id: string; type: string; question: string; points: number; options?: string[] }[],
    };

    return (
      <div className="space-y-6">
        {/* Notification */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 ${
            notification.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
          }`}>
            {notification.type === "success" ? "✓" : "✕"} {notification.message}
          </div>
        )}

        <div>
          <div className="mb-4">
            <Button variant="outline" onClick={() => setSelectedHomework(null)} disabled={submitting}>
              ← Back to Homework
            </Button>
          </div>

          {/* Show warning if already submitted */}
          {selectedHomework.submission && selectedHomework.submission.status !== "draft" && (
            <Card className="mb-4 border-yellow-200 bg-yellow-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-yellow-800">
                  <CheckCircle2 className="w-5 h-5" />
                  <p className="font-medium">
                    You have already submitted this homework.
                    {selectedHomework.submission.status === "graded" && " It has been graded."}
                  </p>
                </div>
                {selectedHomework.submission.score !== undefined && (
                  <p className="text-sm text-yellow-700 mt-1">
                    Score: {selectedHomework.submission.score} / {selectedHomework.submission.maxScore || selectedHomework.totalPoints || 0}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <HomeworkSubmission
            homework={componentHomework as never}
            onSaveDraft={handleSaveDraft}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Homework</h1>
        <p className="text-gray-600 mt-1">View and submit your homework assignments</p>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 ${
          notification.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
        }`}>
          {notification.type === "success" ? "✓" : "✕"} {notification.message}
        </div>
      )}

      <div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-500">Filter by:</span>
            </div>

            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as FilterStatus)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Summary stats */}
          <div className="flex gap-6 mt-4 text-sm">
            <span className="text-gray-500">
              Total: <span className="font-semibold text-gray-700">{homeworkList.length}</span>
            </span>
            <span className="text-gray-500">
              Pending: <span className="font-semibold text-yellow-600">{homeworkList.filter((hw) => !hw.submission).length}</span>
            </span>
            <span className="text-gray-500">
              Submitted: <span className="font-semibold text-blue-600">{homeworkList.filter((hw) => hw.submission).length}</span>
            </span>
            <span className="text-gray-500">
              Overdue: <span className="font-semibold text-red-600">
                {homeworkList.filter((hw) => {
                  const dueDate = hw.dueDate ? new Date(hw.dueDate) : null;
                  return dueDate && dueDate < new Date() && !hw.submission;
                }).length}
              </span>
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3">Loading homework...</span>
          </div>
        ) : filteredHomework.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {filterStatus !== "all" || filterSubject !== "all"
                  ? "No homework matches your filters"
                  : "No homework assigned yet"}
              </h3>
              <p className="text-muted-foreground">
                {filterStatus !== "all" || filterSubject !== "all"
                  ? "Try adjusting your filters to see more results"
                  : "Check back later for new assignments from your teachers"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filteredHomework.map((hw) => {
              const dueDate = hw.dueDate ? new Date(hw.dueDate) : null;
              const isOverdue = dueDate && dueDate < new Date();
              const daysLeft = dueDate ? Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

              return (
                <Card key={hw.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{hw.title}</h3>
                          {getStatusBadge(hw)}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{hw.description || "No description provided"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        {hw.subject || hw.class?.name || "General"}
                      </span>
                      {hw.submission?.status === "graded" && hw.submission.percentage !== undefined && hw.submission.percentage >= 80 && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          Excellent
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {!dueDate
                          ? "No due date"
                          : isOverdue
                          ? `Overdue by ${Math.abs(daysLeft)} days`
                          : daysLeft === 0
                          ? "Due today"
                          : daysLeft === 1
                          ? "Due tomorrow"
                          : `Due in ${daysLeft} days`}
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{hw.maxPoints || hw.totalPoints || 0} points</span>
                        {hw.submission?.score !== undefined && (
                          <span className="font-medium text-blue-600">
                            Score: {hw.submission.score} / {hw.submission.maxScore || hw.maxPoints || hw.totalPoints || 0}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      {!hw.submission || hw.submission.status === "draft" ? (
                        <Button
                          className="flex-1"
                          onClick={() => setSelectedHomework(hw)}
                          disabled={submitting}
                        >
                          {hw.submission?.status === "draft" ? "Continue Draft" : isOverdue ? "View Details" : "Start Homework"}
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleViewSubmission(hw)}
                          >
                            View Submission
                          </Button>
                          {hw.submission.status === "draft" && (
                            <Button
                              className="flex-1"
                              onClick={() => setSelectedHomework(hw)}
                              disabled={submitting}
                            >
                              Continue
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
  );
}
