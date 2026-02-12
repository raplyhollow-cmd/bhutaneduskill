/**
 * SCHOOL ADMIN - TEACHERS MANAGEMENT
 *
 * Features:
 * - List all teachers with filters
 * - Add new teacher
 * - Edit teacher details
 * - Assign classes and subjects
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Edit,
  Eye,
  Mail,
  Phone,
  GraduationCap,
  Check,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { users, schools } from "@/lib/db/schema";
import { desc, eq, sql, like, or, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export default async function SchoolAdminTeachersPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Fetch all teachers with their school info
  const allTeachers = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      phone: users.phone,
      employeeId: users.employeeId,
      subjects: users.subjects,
      schoolId: users.schoolId,
      schoolName: schools.name,
    })
    .from(users)
    .leftJoin(schools, eq(users.schoolId, schools.id))
    .where(eq(users.type, "teacher"))
    .orderBy(desc(users.createdAt));

  return (
    <div className="min-h-screen bg-gray-50 lg:ml-64">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Teachers</h1>
            <p className="text-gray-600 mt-1">
              Manage all teachers in your school ({allTeachers.length} total)
            </p>
          </div>
          <Link href="/school-admin/teachers/create">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Teacher
            </Button>
          </Link>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or employee ID..."
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teachers Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Teachers</CardTitle>
            <CardDescription>View and manage teacher information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Teacher</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Contact</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Department</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Subjects</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allTeachers.map((teacher) => (
                    <tr key={teacher.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {teacher.firstName} {teacher.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{teacher.employeeId || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1 text-sm">
                          {teacher.email && (
                            <div className="flex items-center gap-1 text-gray-600">
                              <Mail className="w-3 h-3" />
                              {teacher.email}
                            </div>
                          )}
                          {teacher.phone && (
                            <div className="flex items-center gap-1 text-gray-600">
                              <Phone className="w-3 h-3" />
                              {teacher.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">{teacher.department || '-'}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {teacher.subjects ? (JSON.parse(teacher.subjects as string) as string[]).map((subj, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {subj}
                            </Badge>
                          )) : '-'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={teacher.isActive ? "default" : "secondary"}
                          className={teacher.isActive ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}
                        >
                          {teacher.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Link href={`/school-admin/teachers/${teacher.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {allTeachers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-3">
                          <GraduationCap className="w-12 h-12 text-gray-300" />
                          <p>No teachers found</p>
                          <Link href="/school-admin/teachers/create">
                            <Button>Add your first teacher</Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
