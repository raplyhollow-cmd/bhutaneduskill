"use client";

import { logger } from "@/lib/logger";
/**
 * ENROLLMENT MANAGER COMPONENT
 *
 * Component for managing tuition enrollments.
 * Handles enrollment creation, status updates, and payment tracking.
 */


import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Plus, CheckCircle, XCircle, Clock, DollarSign, Search, Filter, RefreshCw, Eye, Edit, X, User, BookOpen, Calendar as CalendarIcon } from "lucide-react";
import type { TuitionEnrollment } from "@/lib/db/schema";

interface Student {
  id: string;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  email: string | null;
  classGrade: number | null;
  section: string | null;
}

interface Course {
  id: string;
  title: string;
  type: string;
  price: number | null;
  discountPrice: number | null;
  gradeLevel: number | null;
}

interface Tutor {
  id: string;
  userId: string;
  name: string;
  subjects: string[];
}

interface EnrollmentWithDetails {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseTitle: string;
  tutorId: string;
  tutorName: string;
  status: "active" | "completed" | "cancelled" | "suspended";
  enrollmentDate: string;
  amountPaid: number;
  totalPaid: number;
  tutorEarnings: number;
  sessionsCompleted: number;
}

interface EnrollmentManagerProps {
  onLoadData?: () => void;
}

export function EnrollmentManager({ onLoadData }: EnrollmentManagerProps) {
  const [enrollments, setEnrollments] = useState<EnrollmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed" | "cancelled">("all");
  const [showNewEnrollment, setShowNewEnrollment] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentWithDetails | null>(null);

  // Fetch enrollments on mount
  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/tuition/enrollments?type=all");
      if (response.ok) {
        const data = await response.json();

        // Transform enrollments with student and course details
        const transformedEnrollments: EnrollmentWithDetails[] = await Promise.all(
          (data.enrollments || []).map(async (enrollment: any) => {
            let studentName = "Unknown Student";
            let courseTitle = "Unknown Course";
            let tutorName = "Unknown Tutor";

            // Get student name
            if (enrollment.student) {
              const student = enrollment.student;
              studentName = student.name || `${student.firstName || ""} ${student.lastName || ""}`.trim() || "Unknown";
            } else if (enrollment.studentId) {
              // Fetch student details if not included
              try {
                const studentRes = await fetch(`/api/user/profile?userId=${enrollment.studentId}`);
                if (studentRes.ok) {
                  const studentData = await studentRes.json();
                  studentName = studentData.name || `${studentData.firstName || ""} ${studentData.lastName || ""}`.trim() || "Unknown";
                }
              } catch {
                // Use ID as fallback
              }
            }

            // Get course title
            if (enrollment.course) {
              courseTitle = enrollment.course.title || "Unknown Course";
            }

            // Get tutor name
            if (enrollment.tutor) {
              if (enrollment.tutor.user) {
                tutorName = `${enrollment.tutor.user.firstName || ""} ${enrollment.tutor.user.lastName || ""}`.trim() || "Unknown";
              }
            }

            return {
              id: enrollment.id,
              studentId: enrollment.studentId,
              studentName,
              courseId: enrollment.courseId,
              courseTitle,
              tutorId: enrollment.tutorId,
              tutorName,
              status: enrollment.status,
              enrollmentDate: enrollment.enrollmentDate || enrollment.enrolledAt || new Date().toISOString(),
              amountPaid: enrollment.amountPaid || enrollment.totalPaid || 0,
              totalPaid: enrollment.totalPaid || 0,
              tutorEarnings: enrollment.tutorEarnings || 0,
              sessionsCompleted: enrollment.sessionsCompleted || 0,
            };
          })
        );

        setEnrollments(transformedEnrollments);
      }
    } catch (error) {
      logger.error("Failed to fetch enrollments:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEnrollments = enrollments.filter((e) => {
    const matchesSearch =
      e.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.tutorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = statusFilter === "all" || e.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      active: "bg-green-100 text-green-700",
      completed: "bg-blue-100 text-blue-700",
      cancelled: "bg-red-100 text-red-700",
      suspended: "bg-yellow-100 text-yellow-700",
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-700";
  };

  const totalRevenue = enrollments.reduce((sum, e) => sum + (e.amountPaid || 0), 0);
  const totalTutorEarnings = enrollments.reduce((sum, e) => sum + (e.tutorEarnings || 0), 0);
  const platformFees = totalRevenue - totalTutorEarnings;
  const activeCount = enrollments.filter((e) => e.status === "active").length;

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-sm text-gray-500">Active Enrollments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">Nu. {totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Total Collected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">Nu. {totalTutorEarnings.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Tutor Earnings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">Nu. {platformFees.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Platform Fees</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enrollments Table Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Enrollment Management</CardTitle>
              <CardDescription>
                Manage student enrollments, track payments, and update enrollment status
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchEnrollments}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search enrollments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
              >
                All
              </Button>
              <Button
                variant={statusFilter === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("active")}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Active
              </Button>
              <Button
                variant={statusFilter === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("completed")}
              >
                Completed
              </Button>
              <Button
                variant={statusFilter === "cancelled" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("cancelled")}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Cancelled
              </Button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin" />
              <p>Loading enrollments...</p>
            </div>
          ) : filteredEnrollments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No enrollments found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Student</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Course</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Tutor</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Enrolled</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Sessions</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEnrollments.map((enrollment) => (
                    <tr key={enrollment.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-sm">
                              {enrollment.studentName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </span>
                          </div>
                          <span className="font-medium">{enrollment.studentName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{enrollment.courseTitle}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{enrollment.tutorName}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {enrollment.sessionsCompleted} sessions
                      </td>
                      <td className="py-3 px-4 font-semibold">
                        Nu. {enrollment.amountPaid.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusBadge(enrollment.status)}>
                          {enrollment.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedEnrollment(enrollment)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enrollment Details Modal */}
      {selectedEnrollment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Enrollment Details</h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedEnrollment(null)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold">{selectedEnrollment.studentName}</p>
                  <p className="text-sm text-gray-600">Student</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold">{selectedEnrollment.courseTitle}</p>
                  <p className="text-sm text-gray-600">Course</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Tutor</p>
                  <p className="font-medium">{selectedEnrollment.tutorName}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Enrolled Date</p>
                  <p className="font-medium flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" />
                    {new Date(selectedEnrollment.enrollmentDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-green-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">Nu. {selectedEnrollment.amountPaid.toLocaleString()}</p>
                  <p className="text-sm text-green-700">Amount Paid</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">Nu. {selectedEnrollment.tutorEarnings.toLocaleString()}</p>
                  <p className="text-sm text-blue-700">Tutor Earnings</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-orange-600">Nu. {(selectedEnrollment.amountPaid - selectedEnrollment.tutorEarnings).toLocaleString()}</p>
                  <p className="text-sm text-orange-700">Platform Fee</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Sessions Completed</p>
                  <p className="font-medium">{selectedEnrollment.sessionsCompleted}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge className={getStatusBadge(selectedEnrollment.status)}>
                    {selectedEnrollment.status}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="border-t px-6 py-4 flex justify-end">
              <Button onClick={() => setSelectedEnrollment(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
