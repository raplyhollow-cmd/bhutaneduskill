/**
 * SCHOOL ADMIN - TEACHERS MANAGEMENT
 *
 * Features:
 * - List all teachers with filters
 * - Add new teacher
 * - Edit teacher details
 * - Assign classes and subjects
 * - Bulk upload via CSV
 * - View teacher profile
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Filter,
  Upload,
  Download,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  BookOpen,
  Users,
  Calendar,
  MapPin,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  GraduationCap,
  Award,
} from "lucide-react";
import Link from "next/link";

// Mock teacher data
const mockTeachers = [
  {
    id: "TCH001",
    name: "Tashi Dorji",
    email: "tashi.dorji@school.edu.bt",
    phone: "+975 17 11 11 11",
    employeeId: "EMP2021001",
    subjects: ["Mathematics", "Physics"],
    assignedClasses: ["Class 10 A", "Class 10 B", "Class 11 A"],
    qualification: "M.Sc. Mathematics",
    experience: 12,
    joiningDate: "2015-03-15",
    status: "active",
    totalStudents: 87,
  },
  {
    id: "TCH002",
    name: "Karma Wangmo",
    email: "karma.wangmo@school.edu.bt",
    phone: "+975 17 22 22 22",
    employeeId: "EMP2020005",
    subjects: ["English", "Literature"],
    assignedClasses: ["Class 9 A", "Class 9 B", "Class 10 A"],
    qualification: "M.A. English",
    experience: 8,
    joiningDate: "2017-07-01",
    status: "active",
    totalStudents: 92,
  },
  {
    id: "TCH003",
    name: "Pema Lhamo",
    email: "pema.lhamo@school.edu.bt",
    phone: "+975 17 33 33 33",
    employeeId: "EMP2018012",
    subjects: ["Chemistry", "Biology"],
    assignedClasses: ["Class 11 A", "Class 11 B", "Class 12 A"],
    qualification: "M.Sc. Chemistry",
    experience: 6,
    joiningDate: "2018-03-10",
    status: "active",
    totalStudents: 65,
  },
  {
    id: "TCH004",
    name: "Dorji Wangchuk",
    email: "dorji.wangchuk@school.edu.bt",
    phone: "+975 17 44 44 44",
    employeeId: "EMP2021008",
    subjects: ["Dzongkha", "History"],
    assignedClasses: ["Class 8 A", "Class 8 B", "Class 9 A", "Class 10 A"],
    qualification: "B.A. Dzongkha",
    experience: 5,
    joiningDate: "2019-03-05",
    status: "active",
    totalStudents: 118,
  },
  {
    id: "TCH005",
    name: "Sonam Yangdon",
    email: "sonam.yangdon@school.edu.bt",
    phone: "+975 17 55 55 55",
    employeeId: "EMP2022015",
    subjects: ["Computer Science"],
    assignedClasses: ["Class 9 A", "Class 10 A", "Class 11 A", "Class 12 A"],
    qualification: "B.E. Computer Science",
    experience: 3,
    joiningDate: "2022-03-20",
    status: "active",
    totalStudents: 95,
  },
  {
    id: "TCH006",
    name: "Karma Tshering",
    email: "karma.tshering@school.edu.bt",
    phone: "+975 17 66 66 66",
    employeeId: "EMP2019020",
    subjects: ["Geography", "Economics"],
    assignedClasses: ["Class 10 B", "Class 11 B"],
    qualification: "M.A. Geography",
    experience: 4,
    joiningDate: "2019-07-15",
    status: "on-leave",
    totalStudents: 45,
  },
];

const subjectOptions = [
  "All",
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
];
const statusOptions = ["All", "Active", "On Leave", "Inactive"];

export default function SchoolAdminTeachersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);

  // Filter teachers
  const filteredTeachers = mockTeachers.filter((teacher) => {
    const matchesSearch =
      teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.employeeId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSubject =
      selectedSubject === "All" || teacher.subjects.some((s) => s.toLowerCase() === selectedSubject.toLowerCase());
    const matchesStatus = selectedStatus === "All" || teacher.status.toLowerCase().includes(selectedStatus.toLowerCase());

    return matchesSearch && matchesSubject && matchesStatus;
  });

  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage);
  const paginatedTeachers = filteredTeachers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSelectAll = () => {
    if (selectedTeachers.length === paginatedTeachers.length) {
      setSelectedTeachers([]);
    } else {
      setSelectedTeachers(paginatedTeachers.map((t) => t.id));
    }
  };

  const handleSelectTeacher = (id: string) => {
    if (selectedTeachers.includes(id)) {
      setSelectedTeachers(selectedTeachers.filter((t) => t !== id));
    } else {
      setSelectedTeachers([...selectedTeachers, id]);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: "bg-green-100 text-green-700 border-green-200",
      "on-leave": "bg-yellow-100 text-yellow-700 border-yellow-200",
      inactive: "bg-gray-100 text-gray-700 border-gray-200",
    };
    return styles[status as keyof typeof styles] || styles.inactive;
  };

  const getSubjectColor = (subject: string) => {
    const colors: Record<string, string> = {
      Mathematics: "bg-blue-100 text-blue-700",
      Physics: "bg-purple-100 text-purple-700",
      Chemistry: "bg-green-100 text-green-700",
      Biology: "bg-lime-100 text-lime-700",
      English: "bg-orange-100 text-orange-700",
      Dzongkha: "bg-red-100 text-red-700",
      History: "bg-yellow-100 text-yellow-700",
      Geography: "bg-teal-100 text-teal-700",
      Economics: "bg-indigo-100 text-indigo-700",
      "Computer Science": "bg-pink-100 text-pink-700",
    };
    return colors[subject] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teachers Management</h1>
          <p className="text-gray-600 mt-1">
            {filteredTeachers.length} teacher{filteredTeachers.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/school-admin/teachers/templates">
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
            Add Teacher
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{mockTeachers.length}</p>
                <p className="text-sm text-gray-500">Total Teachers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {mockTeachers.filter((t) => t.status === "active").length}
                </p>
                <p className="text-sm text-gray-500">Active Now</p>
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
                <p className="text-2xl font-bold text-gray-900">
                  {mockTeachers.filter((t) => t.status === "on-leave").length}
                </p>
                <p className="text-sm text-gray-500">On Leave</p>
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
                  {mockTeachers.reduce((sum, t) => sum + t.totalStudents, 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">Students Taught</p>
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
                  placeholder="Search by name, email, or employee ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Subject Filter */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {subjectOptions.map((subject) => (
                <option key={subject} value={subject}>
                  {subject === "All" ? "All Subjects" : subject}
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

            {/* Bulk Actions */}
            {selectedTeachers.length > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-gray-600">{selectedTeachers.length} selected</span>
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

      {/* Teachers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Teacher List</CardTitle>
          <CardDescription>Manage all teachers in your school</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600 w-12">
                    <input
                      type="checkbox"
                      checked={selectedTeachers.length === paginatedTeachers.length && paginatedTeachers.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Teacher</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Employee ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Subjects</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Classes</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Experience</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Students</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTeachers.map((teacher) => (
                  <tr key={teacher.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedTeachers.includes(teacher.id)}
                        onChange={() => handleSelectTeacher(teacher.id)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-secondary-100 rounded-full flex items-center justify-center">
                          <span className="text-secondary-600 font-medium text-sm">
                            {teacher.name.split(" ").map((n) => n[0]).join("")}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{teacher.name}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Mail className="w-3 h-3" />
                            <span>{teacher.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-mono text-sm text-gray-900">{teacher.employeeId}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {teacher.subjects.map((subject) => (
                          <Badge key={subject} className={getSubjectColor(subject)} variant="outline">
                            {subject}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-gray-900">{teacher.assignedClasses.join(", ")}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <GraduationCap className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{teacher.experience} years</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{teacher.totalStudents}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getStatusBadge(teacher.status)} variant="outline">
                        {teacher.status === "on-leave" ? "On Leave" : teacher.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/school-admin/teachers/${teacher.id}`}>
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
                {Math.min(currentPage * itemsPerPage, filteredTeachers.length)} of {filteredTeachers.length}{" "}
                teachers
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Teacher Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Add New Teacher</h2>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <Input type="email" placeholder="teacher@school.edu.bt" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
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

              {/* Employment Information */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Employment Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID *</label>
                    <Input placeholder="EMP202XXXX" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date *</label>
                    <Input type="date" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                      <option>Permanent</option>
                      <option>Contract</option>
                      <option>Temporary</option>
                      <option>Substitute</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                      <option>Academic</option>
                      <option>Administration</option>
                      <option>Support Staff</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Qualification & Experience */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Qualification & Experience
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Highest Qualification *
                    </label>
                    <Input placeholder="e.g., M.Sc. Mathematics" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Years of Experience *
                    </label>
                    <Input type="number" placeholder="0" min="0" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Specializations
                    </label>
                    <Input placeholder="e.g., Mathematics, Physics" />
                  </div>
                </div>
              </div>

              {/* Subject Assignment */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Subject Assignment
                </h3>
                <div className="space-y-3">
                  {subjectOptions.filter((s) => s !== "All").map((subject) => (
                    <label key={subject} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                      <span className="flex-1">{subject}</span>
                    </label>
                  ))}
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
                Add Teacher
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
              <h2 className="text-xl font-bold">Bulk Upload Teachers</h2>
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
                  Your CSV file must include the following columns:
                </p>
                <code className="text-xs bg-blue-100 px-2 py-1 rounded block overflow-x-auto">
                  firstName, lastName, email, phone, employeeId, subjects, qualification, experience,
                  joiningDate, dateOfBirth, gender, address
                </code>
              </div>

              <Button variant="outline" size="sm" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
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
