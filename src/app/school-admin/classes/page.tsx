/**
 * SCHOOL ADMIN - CLASSES MANAGEMENT
 *
 * Features:
 * - List all classes with filters
 * - Create new class
 * - Edit class details
 * - Assign teachers to classes
 * - Manage student enrollments
 * - Class schedule management
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Users,
  UserPlus,
  Calendar,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  GraduationCap,
  AlertCircle,
  UserCheck,
} from "lucide-react";
import Link from "next/link";

// Mock class data
const mockClasses = [
  {
    id: "CLS001",
    name: "Class 10 A",
    grade: 10,
    section: "A",
    classTeacher: "Tashi Dorji",
    classTeacherId: "TCH001",
    subjects: ["Mathematics", "Physics", "Chemistry", "English", "Dzongkha", "Computer Science"],
    room: "Room 201",
    floor: "2nd Floor",
    capacity: 40,
    enrolled: 35,
    academicYear: "2024-2025",
    status: "active",
    schedule: [
      { day: "Monday", startTime: "08:00", endTime: "14:00" },
      { day: "Tuesday", startTime: "08:00", endTime: "14:00" },
      { day: "Wednesday", startTime: "08:00", endTime: "14:00" },
      { day: "Thursday", startTime: "08:00", endTime: "14:00" },
      { day: "Friday", startTime: "08:00", endTime: "14:00" },
    ],
  },
  {
    id: "CLS002",
    name: "Class 10 B",
    grade: 10,
    section: "B",
    classTeacher: "Karma Wangmo",
    classTeacherId: "TCH002",
    subjects: ["Mathematics", "Physics", "Chemistry", "English", "Dzongkha", "Computer Science"],
    room: "Room 202",
    floor: "2nd Floor",
    capacity: 40,
    enrolled: 38,
    academicYear: "2024-2025",
    status: "active",
    schedule: [
      { day: "Monday", startTime: "08:00", endTime: "14:00" },
      { day: "Tuesday", startTime: "08:00", endTime: "14:00" },
      { day: "Wednesday", startTime: "08:00", endTime: "14:00" },
      { day: "Thursday", startTime: "08:00", endTime: "14:00" },
      { day: "Friday", startTime: "08:00", endTime: "14:00" },
    ],
  },
  {
    id: "CLS003",
    name: "Class 11 A",
    grade: 11,
    section: "A",
    classTeacher: "Pema Lhamo",
    classTeacherId: "TCH003",
    subjects: ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Dzongkha"],
    room: "Room 301",
    floor: "3rd Floor",
    capacity: 35,
    enrolled: 30,
    academicYear: "2024-2025",
    status: "active",
    schedule: [
      { day: "Monday", startTime: "08:30", endTime: "15:30" },
      { day: "Tuesday", startTime: "08:30", endTime: "15:30" },
      { day: "Wednesday", startTime: "08:30", endTime: "15:30" },
      { day: "Thursday", startTime: "08:30", endTime: "15:30" },
      { day: "Friday", startTime: "08:30", endTime: "15:30" },
    ],
  },
  {
    id: "CLS004",
    name: "Class 12 A",
    grade: 12,
    section: "A",
    classTeacher: "Dorji Wangchuk",
    classTeacherId: "TCH004",
    subjects: ["Mathematics", "Physics", "Chemistry", "English", "Dzongkha", "Computer Science"],
    room: "Room 302",
    floor: "3rd Floor",
    capacity: 35,
    enrolled: 32,
    academicYear: "2024-2025",
    status: "active",
    schedule: [
      { day: "Monday", startTime: "08:00", endTime: "16:00" },
      { day: "Tuesday", startTime: "08:00", endTime: "16:00" },
      { day: "Wednesday", startTime: "08:00", endTime: "16:00" },
      { day: "Thursday", startTime: "08:00", endTime: "16:00" },
      { day: "Friday", startTime: "08:00", endTime: "16:00" },
    ],
  },
  {
    id: "CLS005",
    name: "Class 9 A",
    grade: 9,
    section: "A",
    classTeacher: "Sonam Yangdon",
    classTeacherId: "TCH005",
    subjects: ["Mathematics", "Science", "English", "Dzongkha", "Social Studies", "Computer Science"],
    room: "Room 101",
    floor: "1st Floor",
    capacity: 40,
    enrolled: 40,
    academicYear: "2024-2025",
    status: "active",
    schedule: [
      { day: "Monday", startTime: "08:30", endTime: "14:30" },
      { day: "Tuesday", startTime: "08:30", endTime: "14:30" },
      { day: "Wednesday", startTime: "08:30", endTime: "14:30" },
      { day: "Thursday", startTime: "08:30", endTime: "14:30" },
      { day: "Friday", startTime: "08:30", endTime: "14:30" },
    ],
  },
];

const gradeOptions = ["All", "PP", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const sectionOptions = ["All", "A", "B", "C", "D"];
const statusOptions = ["All", "Active", "Inactive"];

const mockTeachers = [
  { id: "TCH001", name: "Tashi Dorji" },
  { id: "TCH002", name: "Karma Wangmo" },
  { id: "TCH003", name: "Pema Lhamo" },
  { id: "TCH004", name: "Dorji Wangchuk" },
  { id: "TCH005", name: "Sonam Yangdon" },
  { id: "TCH006", name: "Karma Tshering" },
];

export default function SchoolAdminClassesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("All");
  const [selectedSection, setSelectedSection] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);

  // Filter classes
  const filteredClasses = mockClasses.filter((cls) => {
    const matchesSearch =
      cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.classTeacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.room.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGrade = selectedGrade === "All" || cls.grade.toString() === selectedGrade;
    const matchesSection = selectedSection === "All" || cls.section === selectedSection;
    const matchesStatus = selectedStatus === "All" || cls.status.toLowerCase() === selectedStatus.toLowerCase();

    return matchesSearch && matchesGrade && matchesSection && matchesStatus;
  });

  // Pagination
  const itemsPerPage = 9;
  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);
  const paginatedClasses = filteredClasses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusBadge = (status: string) => {
    const styles = {
      active: "bg-green-100 text-green-700 border-green-200",
      inactive: "bg-gray-100 text-gray-700 border-gray-200",
    };
    return styles[status as keyof typeof styles] || styles.inactive;
  };

  const getCapacityColor = (enrolled: number, capacity: number) => {
    const percentage = (enrolled / capacity) * 100;
    if (percentage >= 90) return "text-red-600";
    if (percentage >= 75) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Classes Management</h1>
          <p className="text-gray-600 mt-1">
            {filteredClasses.length} class{filteredClasses.length !== 1 ? "es" : ""} found
          </p>
        </div>
        <Button className="bg-primary-600 hover:bg-primary-700" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Class
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{mockClasses.length}</p>
                <p className="text-sm text-gray-500">Total Classes</p>
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
                <p className="text-2xl font-bold text-gray-900">
                  {mockClasses.reduce((sum, cls) => sum + cls.enrolled, 0)}
                </p>
                <p className="text-sm text-gray-500">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(mockClasses.map((cls) => cls.classTeacherId)).size}
                </p>
                <p className="text-sm text-gray-500">Class Teachers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {mockClasses.filter((cls) => cls.enrolled >= cls.capacity).length}
                </p>
                <p className="text-sm text-gray-500">Full Capacity</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name, teacher, or room..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Grade Filter */}
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {gradeOptions.map((grade) => (
                <option key={grade} value={grade}>
                  Grade {grade}
                </option>
              ))}
            </select>

            {/* Section Filter */}
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {sectionOptions.map((section) => (
                <option key={section} value={section}>
                  Section {section}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === "All" ? "All Status" : status}
                </option>
              ))}
            </select>

            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Classes Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedClasses.map((cls) => (
          <Card key={cls.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{cls.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {cls.room}
                    </CardDescription>
                  </div>
                </div>
                <Badge className={getStatusBadge(cls.status)} variant="outline">
                  {cls.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Class Teacher */}
              <div>
                <p className="text-xs text-gray-500 mb-1">Class Teacher</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-secondary-100 rounded-full flex items-center justify-center">
                    <span className="text-secondary-600 text-xs font-medium">
                      {cls.classTeacher.split(" ").map((n) => n[0]).join("")}
                    </span>
                  </div>
                  <span className="text-sm font-medium">{cls.classTeacher}</span>
                </div>
              </div>

              {/* Subjects */}
              <div>
                <p className="text-xs text-gray-500 mb-1">Subjects ({cls.subjects.length})</p>
                <div className="flex flex-wrap gap-1">
                  {cls.subjects.slice(0, 3).map((subject) => (
                    <Badge key={subject} variant="outline" className="text-xs">
                      {subject}
                    </Badge>
                  ))}
                  {cls.subjects.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{cls.subjects.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* Enrollment */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500">Enrollment</p>
                  <p className={`text-sm font-medium ${getCapacityColor(cls.enrolled, cls.capacity)}`}>
                    {cls.enrolled}/{cls.capacity}
                  </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      (cls.enrolled / cls.capacity) * 100 >= 90
                        ? "bg-red-500"
                        : (cls.enrolled / cls.capacity) * 100 >= 75
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                    style={{ width: `${Math.min((cls.enrolled / cls.capacity) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Schedule */}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>{cls.schedule[0]?.startTime} - {cls.schedule[0]?.endTime}</span>
                <span>•</span>
                <span>{cls.floor}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link href={`/school-admin/classes/${cls.id}`}>
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link href={`/school-admin/classes/${cls.id}/students`}>
                    <Users className="w-4 h-4 mr-1" />
                    Students
                  </Link>
                </Button>
                <Button variant="ghost" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(pageNum)}
                className={currentPage === pageNum ? "bg-primary-600 hover:bg-primary-700" : ""}
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
      )}

      {/* Add Class Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Create New Class</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grade *</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                      <option>Select grade</option>
                      {gradeOptions.filter((g) => g !== "All").map((grade) => (
                        <option key={grade} value={grade}>
                          Grade {grade}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Section *</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                      <option>Select section</option>
                      {sectionOptions.filter((s) => s !== "All").map((section) => (
                        <option key={section} value={section}>
                          Section {section}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                      <option>2024-2025</option>
                      <option>2025-2026</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Capacity *</label>
                    <Input type="number" placeholder="40" min="1" />
                  </div>
                </div>
              </div>

              {/* Class Teacher Assignment */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  Class Teacher Assignment
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assign Class Teacher *
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option>Select teacher</option>
                    {mockTeachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Room Assignment */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Room Assignment
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Room Number *</label>
                    <Input placeholder="e.g., Room 201" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
                    <Input placeholder="e.g., 2nd Floor" />
                  </div>
                </div>
              </div>

              {/* Subjects */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Subjects
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    "Mathematics",
                    "Physics",
                    "Chemistry",
                    "Biology",
                    "English",
                    "Dzongkha",
                    "History",
                    "Geography",
                    "Economics",
                    "Computer Science",
                    "Physical Education",
                    "Art",
                    "Music",
                  ].map((subject) => (
                    <label key={subject} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                      <span>{subject}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Schedule */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Class Schedule
                </h3>
                <div className="space-y-3">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
                    <div key={day} className="flex items-center gap-3">
                      <div className="w-24">
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" className="w-4 h-4 rounded border-gray-300" defaultChecked />
                          {day}
                        </label>
                      </div>
                      <Input type="time" defaultValue="08:00" className="w-32" />
                      <span className="text-gray-500">to</span>
                      <Input type="time" defaultValue="14:00" className="w-32" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button className="bg-primary-600 hover:bg-primary-700">
                <Check className="w-4 h-4 mr-2" />
                Create Class
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
