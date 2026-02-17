/**
 * TUITION CENTER - CLIENT COMPONENT
 *
 * Client-side component with interactivity for tuition course management.
 * Features:
 * - Course management (create, view, edit)
 * - Tutor management (assign, view)
 * - Enrollment management
 * - Fee collection tracking
 * - Revenue reports
 */

"use client";

import { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Users,
  GraduationCap,
  Star,
  DollarSign,
  Plus,
  Search,
  Calendar,
  Clock,
  MapPin,
  Video,
  UserPlus,
  Edit,
  Trash2,
  Eye,
  X,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Filter,
} from "lucide-react";
import { fetchTuitionCourses } from "../_actions";
import type { TuitionCourseData } from "@/lib/api/school-admin";
import { TuitionCourseForm } from "./components/tuition-course-form";
import { TutorAssignmentForm } from "./components/tutor-assignment-form";
import { EnrollmentManager } from "./components/enrollment-manager";
import { RevenueReport } from "./components/revenue-report";

type TabValue = "courses" | "tutors" | "enrollments" | "reports";

interface Course {
  id: string;
  title: string;
  tutor?: string;
  tutorName?: string;
  type: string;
  students?: number;
  enrollmentCount?: number;
  rating?: number;
  price?: number;
  discountPrice?: number;
  status: string;
  gradeLevel?: number;
  category?: string;
  description?: string;
  tutorId?: string;
}

interface Tutor {
  id: string;
  userId: string;
  name: string;
  bio?: string;
  subjects?: string[];
  gradeLevels?: number[];
  hourlyRate?: number;
  hourlyRateOnline?: number;
  averageRating?: number;
  totalStudents?: number;
  isActive?: boolean;
  teachingMode?: string;
}

interface Enrollment {
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
  tutorEarnings?: number;
}

interface RevenueStats {
  totalRevenue: number;
  tutorEarnings: number;
  platformFees: number;
  pendingPayments: number;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  courseRevenue: Array<{ courseId: string; courseTitle: string; revenue: number }>;
}

interface TuitionClientProps {
  initialCourses: Course[];
  initialTotal: number;
}

export function TuitionClient({ initialCourses, initialTotal }: TuitionClientProps) {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [total, setTotal] = useState(initialTotal);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabValue>("courses");

  // Modal states
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showTutorForm, setShowTutorForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Data states
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);

  // Filter states
  const [courseFilter, setCourseFilter] = useState<"all" | "online" | "physical" | "draft">("all");
  const [enrollmentFilter, setEnrollmentFilter] = useState<"all" | "active" | "completed" | "cancelled">("all");

  const [isPending, startTransition] = useTransition();

  // Fetch courses
  const loadCourses = async () => {
    setLoading(true);
    try {
      const data = await fetchTuitionCourses({ limit: 50, offset: 0 });
      setCourses(data.courses);
      setTotal(data.total);
    } catch (error) {
      console.error("Failed to load courses:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch tutors
  const loadTutors = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/tuition/tutors");
      if (response.ok) {
        const data = await response.json();
        setTutors(data.tutors || []);
      }
    } catch (error) {
      console.error("Failed to load tutors:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch enrollments
  const loadEnrollments = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/tuition/enrollments?type=all");
      if (response.ok) {
        const data = await response.json();
        setEnrollments(data.enrollments || []);
      }
    } catch (error) {
      console.error("Failed to load enrollments:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate revenue stats
  const calculateRevenueStats = () => {
    const totalRevenue = enrollments.reduce((sum, e) => sum + (e.amountPaid || 0), 0);
    const tutorEarnings = enrollments.reduce((sum, e) => sum + (e.tutorEarnings || 0), 0);
    const platformFees = totalRevenue - tutorEarnings;

    // Group by month (last 6 months)
    const monthlyRevenue: Array<{ month: string; revenue: number }> = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleString("default", { month: "short" });
      const monthEnrollments = enrollments.filter((e) => {
        const enrollmentDate = new Date(e.enrollmentDate);
        return enrollmentDate.getMonth() === date.getMonth() && enrollmentDate.getFullYear() === date.getFullYear();
      });
      monthlyRevenue.push({
        month: monthName,
        revenue: monthEnrollments.reduce((sum, e) => sum + (e.amountPaid || 0), 0),
      });
    }

    // Group by course
    const courseRevenueMap = new Map<string, number>();
    enrollments.forEach((e) => {
      const existing = courseRevenueMap.get(e.courseId) || 0;
      courseRevenueMap.set(e.courseId, existing + (e.amountPaid || 0));
    });

    const courseRevenue = Array.from(courseRevenueMap.entries()).map(([courseId, revenue]) => ({
      courseId,
      courseTitle: enrollments.find((e) => e.courseId === courseId)?.courseTitle || "Unknown",
      revenue,
    }));

    setRevenueStats({
      totalRevenue,
      tutorEarnings,
      platformFees,
      pendingPayments: 0, // Would come from payment_status field
      monthlyRevenue,
      courseRevenue,
    });
  };

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === "tutors" && tutors.length === 0) {
      loadTutors();
    } else if (activeTab === "enrollments" && enrollments.length === 0) {
      loadEnrollments();
    } else if (activeTab === "reports" && !revenueStats && enrollments.length > 0) {
      calculateRevenueStats();
    }
  }, [activeTab]);

  // Calculate stats
  const activeCourses = courses.filter((c) => c.status === "active" || c.status === "published");
  const totalEnrollments = courses.reduce((s, c) => s + (c.students || c.enrollmentCount || 0), 0);
  const avgRating = courses.length > 0 ? courses.reduce((s, c) => s + (c.rating || 0), 0) / courses.length : 0;
  const totalRevenue = courses.reduce((s, c) => s + (c.price || 0) * (c.students || c.enrollmentCount || 0), 0);

  const filteredCourses = courses.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      courseFilter === "all" ||
      (courseFilter === "online" && c.type?.startsWith("online")) ||
      (courseFilter === "physical" && c.type === "physical") ||
      (courseFilter === "draft" && c.status === "draft");
    return matchesSearch && matchesFilter;
  });

  const filteredEnrollments = enrollments.filter((e) => {
    const matchesSearch =
      e.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.courseTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = enrollmentFilter === "all" || e.status === enrollmentFilter;
    return matchesSearch && matchesFilter;
  });

  const getCourseTypeBadge = (type: string) => {
    const styles = {
      online_live: "bg-purple-100 text-purple-700",
      online_recorded: "bg-blue-100 text-blue-700",
      physical: "bg-green-100 text-green-700",
    };
    return styles[type as keyof typeof styles] || "bg-gray-100 text-gray-700";
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: "bg-green-100 text-green-700",
      published: "bg-green-100 text-green-700",
      draft: "bg-gray-100 text-gray-700",
      completed: "bg-blue-100 text-blue-700",
      cancelled: "bg-red-100 text-red-700",
      suspended: "bg-yellow-100 text-yellow-700",
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tuition Center</h1>
          <p className="text-gray-600">Manage tuition courses, tutors, and enrollments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadCourses} disabled={loading}>
            <Search className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {activeTab === "courses" && (
            <Button
              style={{
                background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)",
                color: "white",
              }}
              onClick={() => setShowCourseForm(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Course
            </Button>
          )}
          {activeTab === "tutors" && (
            <Button
              style={{
                background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)",
                color: "white",
              }}
              onClick={() => setShowTutorForm(true)}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Tutor
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCourses.length}</p>
                <p className="text-sm text-gray-500">Active Courses</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalEnrollments}</p>
                <p className="text-sm text-gray-500">Total Enrollments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgRating.toFixed(1)}</p>
                <p className="text-sm text-gray-500">Avg Rating</p>
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
                <p className="text-2xl font-bold">Nu. {totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {[
            { value: "courses", label: "Courses", icon: BookOpen },
            { value: "tutors", label: "Tutors", icon: GraduationCap },
            { value: "enrollments", label: "Enrollments", icon: Users },
            { value: "reports", label: "Revenue Reports", icon: TrendingUp },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value as TabValue)}
              className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-colors ${
                activeTab === tab.value
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "courses" && (
        <div className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search courses..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={courseFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCourseFilter("all")}
                  >
                    All
                  </Button>
                  <Button
                    variant={courseFilter === "online" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCourseFilter("online")}
                  >
                    <Video className="w-4 h-4 mr-1" />
                    Online
                  </Button>
                  <Button
                    variant={courseFilter === "physical" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCourseFilter("physical")}
                  >
                    <MapPin className="w-4 h-4 mr-1" />
                    Physical
                  </Button>
                  <Button
                    variant={courseFilter === "draft" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCourseFilter("draft")}
                  >
                    Draft
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Courses Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <Badge className={getCourseTypeBadge(course.type)}>
                      {course.type?.replace("_", " ") || "course"}
                    </Badge>
                    <Badge className={getStatusBadge(course.status)}>{course.status}</Badge>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
                  {course.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{course.description}</p>
                  )}
                  <p className="text-sm text-gray-600 mb-3">by {course.tutor || course.tutorName || "TBD"}</p>
                  {course.gradeLevel && (
                    <p className="text-xs text-gray-500 mb-2">Class {course.gradeLevel}</p>
                  )}
                  <div className="flex items-center gap-1 mb-3">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-medium">{course.rating || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {course.students || course.enrollmentCount || 0} students
                    </span>
                    <div className="text-right">
                      {course.discountPrice ? (
                        <div>
                          <span className="line-through text-gray-400 text-xs">Nu. {course.price}</span>
                          <span className="font-semibold text-orange-600 ml-1">
                            Nu. {course.discountPrice.toLocaleString()}
                          </span>
                        </div>
                      ) : (
                        <span className="font-semibold text-orange-600">Nu. {(course.price || 0).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <a href={`/school-admin/tuition/courses/${course.id}`}>View Details</a>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setEditingCourse(course)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCourses.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No courses found. Create your first course to get started.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "tutors" && (
        <div className="space-y-4">
          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search tutors by name or subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tutors Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tutors
              .filter((t) => {
                if (!searchQuery) return true;
                const query = searchQuery.toLowerCase();
                return (
                  t.name.toLowerCase().includes(query) ||
                  t.subjects?.some((s) => s.toLowerCase().includes(query)) ||
                  t.bio?.toLowerCase().includes(query)
                );
              })
              .map((tutor) => (
                <Card key={tutor.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-bold text-xl">
                          {tutor.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{tutor.name}</h3>
                        {tutor.teachingMode && (
                          <Badge className="mt-1" variant="outline">
                            {tutor.teachingMode === "both" ? "Online & In-Person" : tutor.teachingMode}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {tutor.bio && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{tutor.bio}</p>}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {tutor.subjects?.slice(0, 3).map((subject) => (
                        <Badge key={subject} variant="secondary" className="text-xs">
                          {subject}
                        </Badge>
                      ))}
                      {tutor.subjects && tutor.subjects.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{tutor.subjects.length - 3}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        {tutor.averageRating?.toFixed(1) || "New"}
                      </span>
                      <span className="text-gray-600">{tutor.totalStudents || 0} students</span>
                      <span className="font-semibold text-purple-600">
                        Nu. {tutor.hourlyRateOnline || tutor.hourlyRate || 0}/hr
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>

          {tutors.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <GraduationCap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No tutors found. Add tutors to get started.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "enrollments" && (
        <div className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
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
                    variant={enrollmentFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEnrollmentFilter("all")}
                  >
                    All
                  </Button>
                  <Button
                    variant={enrollmentFilter === "active" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEnrollmentFilter("active")}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Active
                  </Button>
                  <Button
                    variant={enrollmentFilter === "completed" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEnrollmentFilter("completed")}
                  >
                    Active
                  </Button>
                  <Button
                    variant={enrollmentFilter === "cancelled" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEnrollmentFilter("cancelled")}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Cancelled
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enrollments Table */}
          <Card>
            <CardHeader>
              <CardTitle>Enrollments</CardTitle>
              <CardDescription>Manage all tuition enrollments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Student</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Course</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Tutor</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Enrolled</th>
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
                        <td className="py-3 px-4">{enrollment.tutorName}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 font-semibold">Nu. {enrollment.amountPaid.toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusBadge(enrollment.status)}>{enrollment.status}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredEnrollments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No enrollments found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "reports" && (
        <RevenueReport
          revenueStats={revenueStats || {
            totalRevenue: 0,
            tutorEarnings: 0,
            platformFees: 0,
            pendingPayments: 0,
            monthlyRevenue: [],
            courseRevenue: [],
          }}
          onLoadData={async () => {
            await loadEnrollments();
            calculateRevenueStats();
          }}
        />
      )}

      {/* Course Form Modal */}
      {showCourseForm && (
        <TuitionCourseForm
          tutors={tutors}
          onClose={() => {
            setShowCourseForm(false);
            loadCourses();
          }}
          onSuccess={loadCourses}
        />
      )}

      {editingCourse && (
        <TuitionCourseForm
          course={editingCourse}
          tutors={tutors}
          onClose={() => {
            setEditingCourse(null);
            loadCourses();
          }}
          onSuccess={loadCourses}
        />
      )}

      {/* Tutor Assignment Form Modal */}
      {showTutorForm && (
        <TutorAssignmentForm
          onClose={() => {
            setShowTutorForm(false);
            loadTutors();
          }}
          onSuccess={loadTutors}
        />
      )}
    </div>
  );
}
