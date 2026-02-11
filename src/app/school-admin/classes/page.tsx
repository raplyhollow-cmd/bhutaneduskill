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
 *
 * Now using real database data via server actions.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Plus,
  Search,
  Edit,
  Eye,
  Users,
  UserCheck,
  Calendar,
  MapPin,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { fetchClasses } from "../_actions";

const gradeOptions = ["All", "PP", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const sectionOptions = ["All", "A", "B", "C", "D"];
const statusOptions = ["All", "Active", "Inactive"];

export default async function SchoolAdminClassesPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string; grade?: string; section?: string; status?: string };
}) {
  const page = parseInt(searchParams.page || "1");
  const search = searchParams.search || "";
  const grade = searchParams.grade || "All";
  const section = searchParams.section || "All";
  const status = searchParams.status || "All";

  // Fetch classes from database
  const result = await fetchClasses({
    search,
    grade,
    section,
    status,
    limit: 9,
    offset: (page - 1) * 9,
  });

  const { classesList, total } = result;
  const totalPages = Math.ceil(total / 9);

  // Calculate stats
  const totalStudents = classesList.reduce((sum, cls) => sum + cls.enrolled, 0);
  const totalClassTeachers = new Set(classesList.map((cls) => cls.classTeacherId)).size;
  const fullCapacity = classesList.filter((cls) => cls.enrolled >= cls.capacity).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Classes Management</h1>
          <p className="text-gray-600 mt-1">
            {total} class{total !== 1 ? "es" : ""} found
          </p>
        </div>
        <Button className="bg-primary-600 hover:bg-primary-700" asChild>
          <Link href="/school-admin/classes/create">
            <Plus className="w-4 h-4 mr-2" />
            Create Class
          </Link>
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
                <p className="text-2xl font-bold text-gray-900">{total}</p>
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
                <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
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
                <p className="text-2xl font-bold text-gray-900">{totalClassTeachers}</p>
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
                <p className="text-2xl font-bold text-gray-900">{fullCapacity}</p>
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
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name, teacher, or room..."
                  defaultValue={search}
                  name="search"
                  className="pl-10"
                />
              </div>
            </div>

            <select name="grade" defaultValue={grade} className="px-3 py-2 border border-gray-300 rounded-lg bg-white">
              {gradeOptions.map((grade) => (
                <option key={grade} value={grade}>
                  Grade {grade}
                </option>
              ))}
            </select>

            <select name="section" defaultValue={section} className="px-3 py-2 border border-gray-300 rounded-lg bg-white">
              {sectionOptions.map((section) => (
                <option key={section} value={section}>
                  Section {section}
                </option>
              ))}
            </select>

            <select name="status" defaultValue={status} className="px-3 py-2 border border-gray-300 rounded-lg bg-white">
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === "All" ? "All Status" : status}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Classes Grid */}
      {classesList.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No classes found. Create your first class to get started.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classesList.map((cls) => (
              <Card key={cls.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{cls.name}</CardTitle>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {cls.room}
                        </p>
                      </div>
                    </div>
                    <Badge className={cls.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
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
                      {cls.subjects.length === 0 && (
                        <span className="text-xs text-gray-400">No subjects assigned</span>
                      )}
                    </div>
                  </div>

                  {/* Enrollment */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-gray-500">Enrollment</p>
                      <p
                        className={`text-sm font-medium ${
                          cls.enrolled >= cls.capacity
                            ? "text-red-600"
                            : cls.enrolled / cls.capacity >= 0.75
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        {cls.enrolled}/{cls.capacity}
                      </p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          cls.enrolled >= cls.capacity
                            ? "bg-red-500"
                            : cls.enrolled / cls.capacity >= 0.75
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                        style={{ width: `${Math.min((cls.enrolled / cls.capacity) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Schedule */}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>{cls.schedule[0]?.startTime || "TBD"} - {cls.schedule[0]?.endTime || "TBD"}</span>
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
                disabled={page === 1}
                asChild={page > 1}
                {...(page > 1 && { href: `?page=${page - 1}&search=${search}&grade=${grade}&section=${section}&status=${status}` })}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "default" : "outline"}
                    size="sm"
                    asChild={page !== pageNum}
                    {...(page !== pageNum && { href: `?page=${pageNum}&search=${search}&grade=${grade}&section=${section}&status=${status}` })}
                    className={page === pageNum ? "bg-primary-600 hover:bg-primary-700" : ""}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                href={`?page=${page + 1}&search=${search}&grade=${grade}&section=${section}&status=${status}`}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
