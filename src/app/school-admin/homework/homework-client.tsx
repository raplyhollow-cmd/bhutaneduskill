/**
 * HOMEWORK CLIENT COMPONENT
 *
 * Client-side component for homework management with server actions.
 */

"use client";

import { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Plus,
  Search,
  Eye,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Users,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchHomework } from "../_actions";
import type { HomeworkData } from "@/lib/api/school-admin";

interface HomeworkClientProps {
  initialSearch: string;
  initialHomework: HomeworkData[];
  initialTotal: number;
}

export function HomeworkClient({
  initialSearch,
  initialHomework,
  initialTotal,
}: HomeworkClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [currentPage, setCurrentPage] = useState(1);

  const [isPending, startTransition] = useTransition();
  const [homeworkList, setHomeworkList] = useState<HomeworkData[]>(initialHomework);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);

  // School admin portal color (violet)
  const portalGradient = "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)";
  const portalColor = "rgb(139 92 246)";
  const portalColorLight = "rgb(139 92 246, 0.1)";

  // Fetch homework data
  const loadHomework = async () => {
    setLoading(true);
    try {
      const result = await fetchHomework({
        search: searchQuery,
        limit: 10,
        offset: (currentPage - 1) * 10,
      });
      setHomeworkList(result.homework);
      setTotal(result.total);
    } catch (error) {
      console.error("Failed to load homework:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHomework();
  }, [currentPage]);

  // Update URL when filters change
  const updateFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    router.push(`?${params.toString()}`);
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== initialSearch) {
        updateFilters({ search: searchQuery });
        setCurrentPage(1);
        loadHomework();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const totalPages = Math.ceil(total / 10);

  // Calculate stats from real data
  const totalSubmitted = homeworkList.reduce((sum, hw) => sum + hw.submitted, 0);
  const totalGraded = homeworkList.reduce((sum, hw) => sum + hw.graded, 0);
  const totalStudents = homeworkList.reduce((sum, hw) => sum + hw.total, 0);
  const pendingSubmissions = totalStudents - totalSubmitted;

  const getTypeBadgeVariant = (type: string) => {
    const variants: Record<string, string> = {
      assignment: "bg-blue-100 text-blue-700 border-blue-200",
      quiz: "bg-purple-100 text-purple-700 border-purple-200",
      project: "bg-green-100 text-green-700 border-green-200",
      essay: "bg-orange-100 text-orange-700 border-orange-200",
      reading: "bg-teal-100 text-teal-700 border-teal-200",
    };
    return variants[type] || variants.assignment;
  };

  const getDueDateStatus = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: "Overdue", className: "text-red-600 bg-red-50" };
    if (diffDays === 0) return { text: "Due Today", className: "text-orange-600 bg-orange-50" };
    if (diffDays <= 3) return { text: `Due in ${diffDays}d`, className: "text-yellow-600 bg-yellow-50" };
    return { text: dueDate, className: "text-gray-600" };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Homework Management</h1>
          <p className="text-gray-600 mt-1">
            {total} assignment{total !== 1 ? "s" : ""} found
          </p>
        </div>
        <Button asChild style={{ background: portalGradient }}>
          <Link href="/school-admin/homework/create">
            <Plus className="w-4 h-4 mr-2" />
            Create Homework
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: portalColorLight }}>
                <FileText className="w-6 h-6" style={{ color: portalColor }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{total}</p>
                <p className="text-sm text-gray-500">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalSubmitted}</p>
                <p className="text-sm text-gray-500">Submitted</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalGraded}</p>
                <p className="text-sm text-gray-500">Graded</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{pendingSubmissions}</p>
                <p className="text-sm text-gray-500">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Homework List Card */}
      <Card>
        <CardHeader>
          <CardTitle>All Assignments</CardTitle>
          <CardDescription>Manage and track all homework assignments</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by title or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Homework Table */}
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading homework...</div>
          ) : homeworkList.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No homework assignments found</p>
              <Button asChild style={{ background: portalGradient }}>
                <Link href="/school-admin/homework/create">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Assignment
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Title</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Class</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Subject</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Due Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Progress</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {homeworkList.map((hw) => {
                      const progress = hw.total > 0 ? Math.round((hw.submitted / hw.total) * 100) : 0;
                      const dueDateStatus = getDueDateStatus(hw.dueDate);

                      return (
                        <tr key={hw.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-gray-900">{hw.title}</p>
                              <Badge
                                variant="outline"
                                className={`mt-1 text-xs ${getTypeBadgeVariant(hw.type)}`}
                              >
                                {hw.type}
                              </Badge>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{hw.class}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center text-gray-600">
                              <BookOpen className="w-4 h-4 mr-1" />
                              {hw.subject}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-xs px-2 py-1 rounded ${dueDateStatus.className}`}>
                              {dueDateStatus.text}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full transition-all"
                                  style={{
                                    width: `${progress}%`,
                                    background: portalGradient,
                                  }}
                                />
                              </div>
                              <span className="text-sm text-gray-600">{hw.submitted}/{hw.total}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/school-admin/homework/${hw.id}`}>
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * 10 + 1} to{" "}
                    {Math.min(currentPage * 10, total)} of {total}{" "}
                    assignments
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 7) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 6 + i;
                      } else {
                        pageNum = currentPage - 3 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          style={
                            currentPage === pageNum
                              ? { background: portalGradient }
                              : undefined
                          }
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}