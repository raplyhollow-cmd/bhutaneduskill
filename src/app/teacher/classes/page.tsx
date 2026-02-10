/**
 * TEACHER CLASSES PAGE
 * View and manage all classes assigned to the teacher
 */

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  BookOpen,
  Calendar,
  Clock,
  TrendingUp,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

// Mock data - will be replaced with real data from database
const mockClasses = [
  {
    id: "class-1",
    name: "Class 10 A",
    subject: "Mathematics",
    grade: 10,
    section: "A",
    room: "Room 201",
    students: 42,
    schedule: "Mon, Wed, Fri - 10:00 AM",
    nextClass: "Tomorrow, 10:00 AM",
    attendanceRate: 92,
    homeworkCompletion: 78,
    averageScore: 76,
    topic: "Quadratic Equations",
    status: "active" as const,
  },
  {
    id: "class-2",
    name: "Class 10 B",
    subject: "Mathematics",
    grade: 10,
    section: "B",
    room: "Room 202",
    students: 38,
    schedule: "Tue, Thu - 2:00 PM",
    nextClass: "Today, 2:00 PM",
    attendanceRate: 88,
    homeworkCompletion: 72,
    averageScore: 71,
    topic: "Trigonometry",
    status: "active" as const,
  },
  {
    id: "class-3",
    name: "Class 9 A",
    subject: "Mathematics",
    grade: 9,
    section: "A",
    room: "Room 101",
    students: 40,
    schedule: "Mon, Wed, Fri - 9:00 AM",
    nextClass: "Wednesday, 9:00 AM",
    attendanceRate: 95,
    homeworkCompletion: 85,
    averageScore: 82,
    topic: "Linear Equations",
    status: "active" as const,
  },
  {
    id: "class-4",
    name: "Class 8 A",
    subject: "Mathematics",
    grade: 8,
    section: "A",
    room: "Room 103",
    students: 36,
    schedule: "Tue, Thu - 11:00 AM",
    nextClass: "Thursday, 11:00 AM",
    attendanceRate: 90,
    homeworkCompletion: 80,
    averageScore: 79,
    topic: "Algebra Basics",
    status: "active" as const,
  },
];

type FilterStatus = "all" | "active" | "archived";

export default function TeacherClassesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [sortBy, setSortBy] = useState<"name" | "students" | "schedule">("name");

  // Filter and sort classes
  const filteredClasses = mockClasses
    .filter((cls) => {
      const matchesSearch =
        cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.subject.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || cls.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "students") return b.students - a.students;
      if (sortBy === "schedule") return a.schedule.localeCompare(b.schedule);
      return 0;
    });

  const stats = {
    totalClasses: mockClasses.length,
    totalStudents: mockClasses.reduce((sum, cls) => sum + cls.students, 0),
    avgAttendance: Math.round(
      mockClasses.reduce((sum, cls) => sum + cls.attendanceRate, 0) / mockClasses.length
    ),
    avgCompletion: Math.round(
      mockClasses.reduce((sum, cls) => sum + cls.homeworkCompletion, 0) / mockClasses.length
    ),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Classes</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage your classes and track student progress
          </p>
        </div>
        <Button
          style={{ background: "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)" }}
        >
          <Calendar className="w-4 h-4 mr-2" />
          View Schedule
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Classes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalClasses}</div>
            <p className="text-xs text-gray-500 mt-1">Active this semester</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Students</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalStudents}</div>
            <p className="text-xs text-gray-500 mt-1">Across all classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Attendance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.avgAttendance}%</div>
            <p className="text-xs text-gray-500 mt-1">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Homework Completion</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.avgCompletion}%</div>
            <p className="text-xs text-gray-500 mt-1">This week</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search classes or subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v: FilterStatus) => setStatusFilter(v)}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v: "name" | "students" | "schedule") => setSortBy(v)}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="students">Students</SelectItem>
                <SelectItem value="schedule">Schedule</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Classes Grid */}
      {filteredClasses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No classes found</h3>
            <p className="text-sm text-gray-500">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "You don't have any classes assigned yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredClasses.map((cls) => (
            <Card
              key={cls.id}
              className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{cls.name}</CardTitle>
                    <CardDescription className="mt-1">{cls.subject}</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon-sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Class Info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{cls.students} students</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{cls.room}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 col-span-2">
                    <Clock className="w-4 h-4" />
                    <span>{cls.schedule}</span>
                  </div>
                </div>

                {/* Current Topic */}
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-blue-600 font-medium mb-1">Current Topic</p>
                  <p className="text-sm font-medium text-gray-900">{cls.topic}</p>
                </div>

                {/* Progress Bars */}
                <div className="space-y-2">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500">Attendance</span>
                      <span className="font-medium text-gray-700">{cls.attendanceRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-green-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${cls.attendanceRate}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500">Homework</span>
                      <span className="font-medium text-gray-700">{cls.homeworkCompletion}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${cls.homeworkCompletion}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/teacher/classes/${cls.id}`}>
                      View Details
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/teacher/homework/create?classId=${cls.id}`}>
                      <BookOpen className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/teacher/attendance`}>
                      <CheckCircle className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
