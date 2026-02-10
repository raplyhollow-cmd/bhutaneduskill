/**
 * PARENT HOMEWORK PAGE
 *
 * Allows parents to view their child's homework, including:
 * - Homework status (pending, submitted, graded)
 * - Upcoming deadlines
 * - Submission details
 * - Grades and feedback
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChildSelector, Child } from "@/components/parent/child-selector";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  BookOpen,
  Calendar,
  TrendingUp,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";

// Mock children data - will be replaced with real data from API
const mockChildren: Child[] = [
  {
    id: "child1",
    name: "Tashi Dorji",
    grade: "Class 10",
    school: "Yangchenphug HSS",
  },
  {
    id: "child2",
    name: "Pema Lhamo",
    grade: "Class 8",
    school: "Motithang HSS",
  },
];

// Mock homework data
const mockHomework = [
  {
    id: "hw1",
    title: "Quadratic Equations Practice",
    description: "Solve the following quadratic equations using the quadratic formula. Show all your work.",
    subject: "Mathematics",
    teacher: "Mr. Wangchuk",
    dueDate: "2025-02-15T23:59",
    totalPoints: 50,
    status: "submitted", // pending, submitted, graded
    submittedAt: "2025-02-14T18:30",
    grade: null,
    feedback: null,
  },
  {
    id: "hw2",
    title: "Essay: Environmental Conservation in Bhutan",
    description: "Write a 500-word essay about Bhutan's environmental conservation efforts and their significance globally.",
    subject: "English",
    teacher: "Ms. Tshering",
    dueDate: "2025-02-20T23:59",
    totalPoints: 100,
    status: "graded",
    submittedAt: "2025-02-18T20:15",
    grade: 85,
    feedback: "Excellent essay! You covered all the key points about Bhutan's conservation efforts. Your writing is clear and well-structured. Consider adding more specific examples next time.",
  },
  {
    id: "hw3",
    title: "Science Lab Report: Photosynthesis",
    description: "Complete the lab report based on our photosynthesis experiment. Include data tables, graphs, and conclusions.",
    subject: "Science",
    teacher: "Mrs. Dorji",
    dueDate: "2025-02-25T23:59",
    totalPoints: 75,
    status: "pending",
    submittedAt: null,
    grade: null,
    feedback: null,
  },
  {
    id: "hw4",
    title: "History: The Wangchuck Dynasty",
    description: "Research and create a timeline of the Wangchuck Dynasty monarchs and their key contributions to Bhutan.",
    subject: "History",
    teacher: "Mr. Penjor",
    dueDate: "2025-02-28T23:59",
    totalPoints: 60,
    status: "pending",
    submittedAt: null,
    grade: null,
    feedback: null,
  },
  {
    id: "hw5",
    title: "Dzongkha Reading Comprehension",
    description: "Read the assigned passage and answer the comprehension questions in complete Dzongkha sentences.",
    subject: "Dzongkha",
    teacher: "Lopen Karma",
    dueDate: "2025-02-10T23:59",
    totalPoints: 40,
    status: "graded",
    submittedAt: "2025-02-09T16:45",
    grade: 92,
    feedback: "Very good comprehension! Your Dzongkha writing is improving. Keep practicing the grammar rules we discussed.",
  },
];

type HomeworkStatus = "all" | "pending" | "submitted" | "graded";
type SortOrder = "dueDate" | "subject" | "status";

export default function ParentHomeworkPage() {
  const [selectedChild, setSelectedChild] = useState<Child>(mockChildren[0]);
  const [statusFilter, setStatusFilter] = useState<HomeworkStatus>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("dueDate");
  const [expandedHomework, setExpandedHomework] = useState<string | null>(null);

  const filteredHomework = mockHomework.filter((hw) => {
    if (statusFilter === "all") return true;
    return hw.status === statusFilter;
  });

  const sortedHomework = [...filteredHomework].sort((a, b) => {
    if (sortOrder === "dueDate") {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    } else if (sortOrder === "subject") {
      return a.subject.localeCompare(b.subject);
    } else {
      return a.status.localeCompare(b.status);
    }
  });

  const homeworkStats = {
    total: mockHomework.length,
    pending: mockHomework.filter((hw) => hw.status === "pending").length,
    submitted: mockHomework.filter((hw) => hw.status === "submitted").length,
    graded: mockHomework.filter((hw) => hw.status === "graded").length,
    averageGrade:
      mockHomework
        .filter((hw) => hw.grade !== null)
        .reduce((sum, hw) => sum + (hw.grade || 0), 0) /
        mockHomework.filter((hw) => hw.grade !== null).length || 0,
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700", icon: Clock },
      submitted: { label: "Submitted", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
      graded: { label: "Graded", color: "bg-green-100 text-green-700", icon: Star },
    };
    const { label, color, icon: Icon } = config[status as keyof typeof config];
    return (
      <Badge className={color}>
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const getDueDateDisplay = (dueDate: string, status: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const daysLeft = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (status === "graded" || status === "submitted") {
      return null;
    }

    if (daysLeft < 0) {
      return <span className="text-red-600 font-medium">Overdue by {Math.abs(daysLeft)} days</span>;
    } else if (daysLeft === 0) {
      return <span className="text-orange-600 font-medium">Due today</span>;
    } else if (daysLeft === 1) {
      return <span className="text-yellow-600 font-medium">Due tomorrow</span>;
    } else if (daysLeft <= 3) {
      return <span className="text-yellow-600 font-medium">Due in {daysLeft} days</span>;
    } else {
      return <span className="text-gray-600">Due in {daysLeft} days</span>;
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedHomework(expandedHomework === id ? null : id);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Homework Monitoring
        </h1>
        <p className="text-gray-600">
          Track {selectedChild.name}&apos;s homework assignments, submissions, and grades
        </p>
      </div>

      {/* Child Selector */}
      <ChildSelector
        children={mockChildren}
        selectedChildId={selectedChild.id}
        onChildChange={setSelectedChild}
      />

      {/* Homework Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="col-span-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Average Grade</p>
                <p className="text-3xl font-bold" style={{ color: "rgb(107 114 128)" }}>
                  {Math.round(homeworkStats.averageGrade)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Based on {mockHomework.filter((hw) => hw.grade !== null).length} graded assignments
                </p>
              </div>
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)" }}
              >
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-2xl font-bold text-yellow-600">{homeworkStats.pending}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold text-blue-600">{homeworkStats.submitted}</p>
              <p className="text-sm text-gray-500">Submitted</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Star className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold text-green-600">{homeworkStats.graded}</p>
              <p className="text-sm text-gray-500">Graded</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["all", "pending", "submitted", "graded"] as HomeworkStatus[]).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className={statusFilter === status ? "" : ""}
                  style={
                    statusFilter === status
                      ? { background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)" }
                      : {}
                  }
                >
                  {status === "all" && "All"}
                  {status === "pending" && "Pending"}
                  {status === "submitted" && "Submitted"}
                  {status === "graded" && "Graded"}
                  {status !== "all" && (
                    <span className="ml-1">
                      (
                      {status === "pending"
                        ? homeworkStats.pending
                        : status === "submitted"
                        ? homeworkStats.submitted
                        : homeworkStats.graded}
                      )
                    </span>
                  )}
                </Button>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-gray-500">Sort by:</span>
              <select
                className="border rounded-md px-3 py-1.5 text-sm"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              >
                <option value="dueDate">Due Date</option>
                <option value="subject">Subject</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Homework List */}
      <div className="space-y-4">
        {sortedHomework.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No homework found with the current filters.</p>
            </CardContent>
          </Card>
        ) : (
          sortedHomework.map((hw) => {
            const isExpanded = expandedHomework === hw.id;
            const dueDateDisplay = getDueDateDisplay(hw.dueDate, hw.status);

            return (
              <Card
                key={hw.id}
                className={`transition-all ${hw.status === "pending" && dueDateDisplay?.toString().includes("Overdue") ? "border-red-200" : ""}`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    {/* Subject Icon */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)" }}
                    >
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-lg">{hw.title}</h3>
                            {getStatusBadge(hw.status)}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{hw.description}</p>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                            <span className="font-medium" style={{ color: "rgb(107 114 128)" }}>
                              {hw.subject}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Due: {new Date(hw.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                            <span>•</span>
                            <span>{hw.totalPoints} points</span>
                          </div>
                          {dueDateDisplay && <div className="mt-2">{dueDateDisplay}</div>}
                        </div>

                        {/* Grade Display */}
                        {hw.status === "graded" && hw.grade !== null && (
                          <div className="text-center">
                            <div
                              className={`w-16 h-16 rounded-full flex items-center justify-center ${
                                hw.grade >= 80
                                  ? "bg-green-100"
                                  : hw.grade >= 60
                                  ? "bg-yellow-100"
                                  : "bg-red-100"
                              }`}
                            >
                              <span
                                className={`text-xl font-bold ${
                                  hw.grade >= 80
                                    ? "text-green-700"
                                    : hw.grade >= 60
                                    ? "text-yellow-700"
                                    : "text-red-700"
                                }`}
                              >
                                {hw.grade}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">/{hw.totalPoints}</p>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpand(hw.id)}
                          className="text-gray-600"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-4 h-4 mr-1" />
                              Hide Details
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4 mr-1" />
                              View Details
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
                          <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Teacher:</span>
                              <span className="ml-2 font-medium">{hw.teacher}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Subject:</span>
                              <span className="ml-2 font-medium">{hw.subject}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Due Date:</span>
                              <span className="ml-2 font-medium">
                                {new Date(hw.dueDate).toLocaleDateString("en-US", {
                                  month: "long",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Total Points:</span>
                              <span className="ml-2 font-medium">{hw.totalPoints}</span>
                            </div>
                            {hw.submittedAt && (
                              <div>
                                <span className="text-gray-500">Submitted:</span>
                                <span className="ml-2 font-medium">
                                  {new Date(hw.submittedAt).toLocaleDateString("en-US", {
                                    month: "long",
                                    day: "numeric",
                                    year: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Feedback */}
                          {hw.feedback && (
                            <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                              <div className="flex items-center gap-2 mb-2">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <span className="font-medium text-sm">Teacher Feedback</span>
                              </div>
                              <p className="text-sm text-gray-700">{hw.feedback}</p>
                            </div>
                          )}

                          {/* Grade Bar */}
                          {hw.grade !== null && (
                            <div className="mt-3">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-500">Score</span>
                                <span className="font-medium">
                                  {hw.grade} / {hw.totalPoints} ({Math.round((hw.grade / hw.totalPoints) * 100)}%)
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    hw.grade >= 80
                                      ? "bg-green-500"
                                      : hw.grade >= 60
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                                  }`}
                                  style={{ width: `${(hw.grade / hw.totalPoints) * 100}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Insights Card */}
      <Card
        className="border-2"
        style={{ borderColor: "rgb(107 114 128)", background: "linear-gradient(to right, rgb(249 250 251), rgb(243 244 246))" }}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: "rgb(55 65 81)" }}>
            <TrendingUp className="w-5 h-5" />
            Homework Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <Star className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Strong performance overall</p>
              <p className="text-sm text-gray-600">
                {selectedChild.name} has an average grade of {Math.round(homeworkStats.averageGrade)}%. Keep encouraging consistent effort!
              </p>
            </div>
          </div>
          {homeworkStats.pending > 0 && (
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-orange-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">{homeworkStats.pending} pending assignments</p>
                <p className="text-sm text-gray-600">
                  Help {selectedChild.name} prioritize upcoming deadlines to avoid last-minute stress.
                </p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Good submission rate</p>
              <p className="text-sm text-gray-600">
                Most assignments are being submitted on time. Continue supporting a consistent homework routine.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Back to Dashboard */}
      <div className="pt-4">
        <Button variant="outline" asChild>
          <Link href="/parent">
            ← Back to Parent Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
