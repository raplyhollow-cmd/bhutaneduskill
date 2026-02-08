/**
 * SCHOOL ADMIN - STUDENTS MANAGEMENT
 *
 * Features:
 * - List all students with filters
 * - Add new student
 * - Edit student details
 * - Bulk upload via CSV
 * - View student profile
 * - Enroll in classes
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Plus,
  Search,
  Filter,
  Upload,
  Download,
  Edit,
  Trash2,
  Eye,
  UserCheck,
  GraduationCap,
  Mail,
  Phone,
  Calendar,
  MapPin,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

// Mock student data
const mockStudents = [
  {
    id: "STU001",
    name: "Tashi Dorji",
    email: "tashi.dorji@school.edu.bt",
    phone: "+975 17 12 34 56",
    grade: 10,
    section: "A",
    rollNumber: 1,
    class: "Class 10 A",
    parentName: "Karma Dorji",
    parentPhone: "+975 17 23 45 67",
    admissionDate: "2021-03-15",
    status: "active",
    attendance: "92%",
    feeStatus: "paid",
  },
  {
    id: "STU002",
    name: "Karma Wangmo",
    email: "karma.wangmo@school.edu.bt",
    phone: "+975 17 23 45 78",
    grade: 10,
    section: "A",
    rollNumber: 2,
    class: "Class 10 A",
    parentName: "Pema Lhamo",
    parentPhone: "+975 17 34 56 78",
    admissionDate: "2021-03-15",
    status: "active",
    attendance: "88%",
    feeStatus: "pending",
  },
  {
    id: "STU003",
    name: "Pema Lhamo",
    email: "pema.lhamo@school.edu.bt",
    phone: "+975 17 34 56 89",
    grade: 11,
    section: "B",
    rollNumber: 1,
    class: "Class 11 B",
    parentName: "Dorji Wangchuk",
    parentPhone: "+975 17 45 67 89",
    admissionDate: "2020-03-10",
    status: "active",
    attendance: "95%",
    feeStatus: "paid",
  },
  {
    id: "STU004",
    name: "Dorji Wangchuk",
    email: "dorji.wangchuk@school.edu.bt",
    phone: "+975 17 45 67 90",
    grade: 9,
    section: "A",
    rollNumber: 5,
    class: "Class 9 A",
    parentName: "Sonam Yangdon",
    parentPhone: "+975 17 56 78 90",
    admissionDate: "2022-03-20",
    status: "active",
    attendance: "78%",
    feeStatus: "partial",
  },
  {
    id: "STU005",
    name: "Sonam Yangdon",
    email: "sonam.yangdon@school.edu.bt",
    phone: "+975 17 56 78 01",
    grade: 12,
    section: "A",
    rollNumber: 3,
    class: "Class 12 A",
    parentName: "Karma Tshering",
    parentPhone: "+975 17 67 89 01",
    admissionDate: "2019-03-05",
    status: "active",
    attendance: "91%",
    feeStatus: "paid",
  },
  {
    id: "STU006",
    name: "Karma Tshering",
    email: "karma.tshering@school.edu.bt",
    phone: "+975 17 67 89 12",
    grade: 10,
    section: "B",
    rollNumber: 1,
    class: "Class 10 B",
    parentName: "Tshering Yangdon",
    parentPhone: "+975 17 78 91 23",
    admissionDate: "2021-03-18",
    status: "inactive",
    attendance: "65%",
    feeStatus: "pending",
  },
  {
    id: "STU007",
    name: "Tshering Yangdon",
    email: "tshering.yangdon@school.edu.bt",
    phone: "+975 17 78 91 23",
    grade: 11,
    section: "A",
    rollNumber: 2,
    class: "Class 11 A",
    parentName: "Dorji Tshering",
    parentPhone: "+975 17 89 12 34",
    admissionDate: "2020-03-12",
    status: "active",
    attendance: "89%",
    feeStatus: "paid",
  },
  {
    id: "STU008",
    name: "Dorji Tshering",
    email: "dorji.tshering@school.edu.bt",
    phone: "+975 17 89 12 34",
    grade: 9,
    section: "B",
    rollNumber: 1,
    class: "Class 9 B",
    parentName: "Karma Dorji",
    parentPhone: "+975 17 91 23 45",
    admissionDate: "2022-03-22",
    status: "active",
    attendance: "94%",
    feeStatus: "paid",
  },
];

const gradeOptions = ["All", "PP", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const sectionOptions = ["All", "A", "B", "C", "D"];
const statusOptions = ["All", "Active", "Inactive"];
const feeStatusOptions = ["All", "Paid", "Partial", "Pending"];

export default function SchoolAdminStudentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("All");
  const [selectedSection, setSelectedSection] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedFeeStatus, setSelectedFeeStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // Filter students
  const filteredStudents = mockStudents.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGrade = selectedGrade === "All" || student.grade.toString() === selectedGrade;
    const matchesSection = selectedSection === "All" || student.section === selectedSection;
    const matchesStatus = selectedStatus === "All" || student.status.toLowerCase() === selectedStatus.toLowerCase();
    const matchesFeeStatus = selectedFeeStatus === "All" || student.feeStatus.toLowerCase() === selectedFeeStatus.toLowerCase();

    return matchesSearch && matchesGrade && matchesSection && matchesStatus && matchesFeeStatus;
  });

  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSelectAll = () => {
    if (selectedStudents.length === paginatedStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(paginatedStudents.map((s) => s.id));
    }
  };

  const handleSelectStudent = (id: string) => {
    if (selectedStudents.includes(id)) {
      setSelectedStudents(selectedStudents.filter((s) => s !== id));
    } else {
      setSelectedStudents([...selectedStudents, id]);
    }
  };

  const getFeeStatusBadge = (status: string) => {
    const styles = {
      paid: "bg-green-100 text-green-700 border-green-200",
      partial: "bg-yellow-100 text-yellow-700 border-yellow-200",
      pending: "bg-red-100 text-red-700 border-red-200",
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: "bg-green-100 text-green-700 border-green-200",
      inactive: "bg-gray-100 text-gray-700 border-gray-200",
    };
    return styles[status as keyof typeof styles] || styles.inactive;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students Management</h1>
          <p className="text-gray-600 mt-1">
            {filteredStudents.length} student{filteredStudents.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/school-admin/students/templates">
              <Download className="w-4 h-4 mr-2" />
              CSV Template
            </Link>
          </Button>
          <Button variant="outline" onClick={() => setShowBulkUploadModal(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Bulk Upload
          </Button>
          <Button className="bg-primary-600 hover:bg-primary-700" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{mockStudents.length}</p>
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
                  {mockStudents.filter((s) => s.status === "active").length}
                </p>
                <p className="text-sm text-gray-500">Active Students</p>
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
                  {mockStudents.filter((s) => s.feeStatus === "pending").length}
                </p>
                <p className="text-sm text-gray-500">Fee Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(mockStudents.map((s) => s.class)).size}
                </p>
                <p className="text-sm text-gray-500">Total Classes</p>
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
                  placeholder="Search by name, email, or ID..."
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

            {/* Fee Status Filter */}
            <select
              value={selectedFeeStatus}
              onChange={(e) => setSelectedFeeStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {feeStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === "All" ? "All Fee Status" : status}
                </option>
              ))}
            </select>

            {/* Bulk Actions */}
            {selectedStudents.length > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-gray-600">{selectedStudents.length} selected</span>
                <Button variant="outline" size="sm">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student List</CardTitle>
          <CardDescription>Manage all students enrolled in your school</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600 w-12">
                    <input
                      type="checkbox"
                      checked={selectedStudents.length === paginatedStudents.length && paginatedStudents.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Student</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Class</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Parent</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Attendance</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Fee Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStudents.map((student) => (
                  <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => handleSelectStudent(student.id)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-medium text-sm">
                            {student.name.split(" ").map((n) => n[0]).join("")}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{student.name}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{student.id}</span>
                            <span>•</span>
                            <span>{student.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">{student.class}</p>
                      <p className="text-sm text-gray-500">Roll No: {student.rollNumber}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-gray-900">{student.parentName}</p>
                      <p className="text-xs text-gray-500">{student.parentPhone}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-sm font-medium ${
                          parseInt(student.attendance) >= 90
                            ? "bg-green-100 text-green-700"
                            : parseInt(student.attendance) >= 75
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {student.attendance}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getFeeStatusBadge(student.feeStatus)} variant="outline">
                        {student.feeStatus}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getStatusBadge(student.status)} variant="outline">
                        {student.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/school-admin/students/${student.id}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of {filteredStudents.length}{" "}
                students
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
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .slice(
                    0,
                    totalPages > 7 ? 7 : totalPages
                  )
                  .map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={currentPage === page ? "bg-primary-600 hover:bg-primary-700" : ""}
                    >
                      {page}
                    </Button>
                  ))}
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
        </CardContent>
      </Card>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Add New Student</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6 space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <Input placeholder="Enter first name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <Input placeholder="Enter last name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <Input type="email" placeholder="student@school.edu.bt" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <Input placeholder="+975 17 XX XX XX" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <Input type="date" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                      <option>Select gender</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Academic Information</h3>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                    <Input type="number" placeholder="Auto-generated" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Admission Date *</label>
                    <Input type="date" />
                  </div>
                </div>
              </div>

              {/* Parent/Guardian Information */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Parent/Guardian Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Parent Name *</label>
                    <Input placeholder="Enter parent name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Relationship *</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                      <option>Select relationship</option>
                      <option>Father</option>
                      <option>Mother</option>
                      <option>Guardian</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Parent Phone *</label>
                    <Input placeholder="+975 17 XX XX XX" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Parent Email</label>
                    <Input type="email" placeholder="parent@email.com" />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Address</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      rows={2}
                      placeholder="Enter street address"
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                        <option>Select district</option>
                        <option>Thimphu</option>
                        <option>Paro</option>
                        <option>Punakha</option>
                        <option>Wangdue Phodrang</option>
                        <option>Gasa</option>
                        <option>Dagana</option>
                        <option>Tsirang</option>
                        <option>Sarpang</option>
                        <option>Zhemgang</option>
                        <option>Trongsa</option>
                        <option>Bumthang</option>
                        <option>Mongar</option>
                        <option>Lhuentse</option>
                        <option>Trashigang</option>
                        <option>Trashiyangtse</option>
                        <option>Samdrup Jongkhar</option>
                        <option>Pema Gatshel</option>
                        <option>Samtse</option>
                        <option>Chukha</option>
                        <option>Haa</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City/Town</label>
                      <Input placeholder="Enter city/town" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button className="bg-primary-600 hover:bg-primary-700">
                <Check className="w-4 h-4 mr-2" />
                Add Student
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Bulk Upload Students</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowBulkUploadModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">Drag and drop your CSV file here, or</p>
                <Button variant="outline" size="sm" className="mx-auto">
                  Browse Files
                </Button>
                <p className="text-xs text-gray-500 mt-2">Supported format: CSV (Max 5MB)</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">CSV Format Requirements</h4>
                <p className="text-sm text-blue-800 mb-2">
                  Your CSV file must include the following columns in order:
                </p>
                <code className="text-xs bg-blue-100 px-2 py-1 rounded block overflow-x-auto">
                  firstName, lastName, email, phone, grade, section, rollNumber, parentName, parentPhone,
                  parentEmail, dateOfBirth, gender, admissionDate, address
                </code>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Filter className="w-4 h-4 mr-2" />
                  View Sample Data
                </Button>
              </div>
            </div>
            <div className="border-t px-6 py-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowBulkUploadModal(false)}>
                Cancel
              </Button>
              <Button className="bg-primary-600 hover:bg-primary-700" disabled>
                Upload & Process
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
