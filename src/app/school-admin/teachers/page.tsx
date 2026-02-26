/**
 * SCHOOL ADMIN - TEACHERS MANAGEMENT
 *
 * Features:
 * - Grid view with teacher cards showing photo placeholder, name, subjects, classes
 * - Add Teacher modal
 * - Quick Add Teacher with ExpressAddModal
 * - Filter by department
 * - Modern purple/indigo gradient theme
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Mail,
  Phone,
  GraduationCap,
  BookOpen,
  Users,
  Building2,
  Loader2,
  Sparkles,
} from "lucide-react";
import { AddTeacherModal } from "@/components/school-admin/add-teacher-modal";
import { ExpressAddModal, useExpressAdd } from "@/components/ui/express-add-modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Teacher {
  id: string;
  firstName: string | null;
  lastName: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  employeeId: string | null;
  subjects: string | null;
  department?: string;
  schoolId: string | null;
  schoolName?: string;
}

export default function SchoolAdminTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // ExpressAddModal hook for quick teacher add
  const quickAdd = useExpressAdd();

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/school-admin/teachers");
      if (response.ok) {
        const data = await response.json();
        setTeachers(data.teachers || []);
      }
    } catch (error) {
      console.error("Failed to fetch teachers:", error);
    } finally {
      setLoading(false);
    }
  };

  // Quick add teacher handler - creates with minimal info
  const handleQuickAddTeacher = async (name: string) => {
    try {
      const [firstName, ...lastNameParts] = name.trim().split(" ");
      const lastName = lastNameParts.join(" ") || "";

      const response = await fetch("/api/school-admin/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName: lastName || "Teacher",
          email: `${firstName.toLowerCase().replace(/\s/g, ".")}@school.edu`,
          phone: "",
          employeeId: `TCH${Date.now().toString().slice(-4)}`,
          department: "General",
          subjects: [],
        }),
      });

      if (response.ok) {
        await fetchTeachers();
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.error || "Failed to add teacher" };
      }
    } catch (error) {
      return { success: false, error: "Network error. Please try again." };
    }
  };

  const parseJsonArray = (jsonStr: string | null): string[] => {
    if (!jsonStr) return [];
    try {
      return JSON.parse(jsonStr);
    } catch {
      return [];
    }
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const first = firstName?.[0] || "";
    const last = lastName?.[0] || "";
    return (first + last).toUpperCase() || "T";
  };

  const departments = Array.from(
    new Set(teachers.map(t => t.department).filter(Boolean))
  );

  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch =
      searchQuery === "" ||
      teacher.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.employeeId?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDepartment =
      departmentFilter === "all" || teacher.department === departmentFilter;

    return matchesSearch && matchesDepartment;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
          <p className="text-gray-600">Loading teachers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teachers Management</h1>
          <p className="text-gray-600 mt-1">
            {teachers.length} {teachers.length === 1 ? "teacher" : "teachers"} in your school
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={quickAdd.open}
            className="shadow-sm hover:shadow-md transition-shadow"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Quick Add
          </Button>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="shadow-md hover:shadow-lg transition-shadow"
            style={{ background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)" }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Teacher
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-violet-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)' }}>
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{teachers.length}</p>
                <p className="text-sm text-gray-500">Total Teachers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{departments.length}</p>
                <p className="text-sm text-gray-500">Departments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {teachers.reduce((sum, t) => sum + parseJsonArray(t.subjects).length, 0)}
                </p>
                <p className="text-sm text-gray-500">Total Subjects</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search by name, email, or employee ID..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-gray-400" />
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept || ""}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teachers Grid */}
      {filteredTeachers.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-16">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-100 to-indigo-200 flex items-center justify-center mx-auto mb-4 shadow-inner">
                <GraduationCap className="w-10 h-10 text-violet-400" />
              </div>
              <p className="text-gray-900 font-semibold text-lg">
                {searchQuery || departmentFilter !== "all" ? "No teachers found" : "No teachers yet"}
              </p>
              <p className="text-gray-500 text-sm mt-1">
                {searchQuery || departmentFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Add your first teacher to get started"}
              </p>
              {!searchQuery && departmentFilter === "all" && (
                <Button
                  onClick={() => setIsAddModalOpen(true)}
                  className="mt-4"
                  style={{ background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)" }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Teacher
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeachers.map((teacher) => {
            const subjects = parseJsonArray(teacher.subjects);
            return (
              <Card
                key={teacher.id}
                className="overflow-hidden hover:shadow-xl transition-all duration-200 border-t-4 group"
                style={{ borderTopColor: 'rgb(139 92 246)' }}
              >
                <CardContent className="p-6">
                  {/* Teacher Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform"
                      style={{ background: 'linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)' }}
                    >
                      {getInitials(teacher.firstName, teacher.lastName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-lg truncate">
                        {teacher.name}
                      </h3>
                      {teacher.employeeId && (
                        <p className="text-sm text-gray-500 font-mono">
                          {teacher.employeeId}
                        </p>
                      )}
                      {teacher.department && (
                        <Badge className="mt-1.5 text-xs bg-violet-100 text-violet-700 hover:bg-violet-100">
                          {teacher.department}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 mb-4">
                    {teacher.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{teacher.email}</span>
                      </div>
                    )}
                    {teacher.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{teacher.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Subjects */}
                  {subjects.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        Subjects ({subjects.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {subjects.slice(0, 3).map((subject, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-xs border-gray-200 text-gray-700"
                          >
                            {subject}
                          </Badge>
                        ))}
                        {subjects.length > 3 && (
                          <Badge
                            variant="outline"
                            className="text-xs border-violet-200 text-violet-700 bg-violet-50"
                          >
                            +{subjects.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 hover:bg-violet-50 hover:border-violet-300 transition-colors"
                    >
                      <Users className="w-4 h-4 mr-1" />
                      Classes
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 hover:bg-violet-50 text-violet-600 hover:text-violet-700 transition-colors"
                    >
                      View Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Teacher Modal */}
      <AddTeacherModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          fetchTeachers();
          setIsAddModalOpen(false);
        }}
      />

      {/* Quick Add Teacher Modal */}
      <ExpressAddModal
        isOpen={quickAdd.isOpen}
        onClose={quickAdd.close}
        onSubmit={handleQuickAddTeacher}
        title="Quick Add Teacher"
        description="Enter teacher name (first and last)"
        placeholder="e.g., John Doe"
        successMessage="Teacher added successfully! You can edit details later."
        errorMessage="Failed to add teacher. Please try again."
        icon={GraduationCap}
        minLength={2}
        submitLabel="Press Enter to add teacher"
      />
    </div>
  );
}
