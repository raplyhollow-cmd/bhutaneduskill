"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Users,
  GraduationCap,
  Plus,
  Search,
  Filter,
  MapPin,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
} from "lucide-react";
import { AddSchoolModal } from "@/components/admin/add-school-modal";

interface School {
  id: string;
  name: string;
  code: string;
  schoolType: string;
  level: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  createdAt: Date | string;
  tenantId: string;
  tenantName: string;
  districtId: string;
  districtName: string;
  stats: {
    students: number;
    teachers: number;
    counselors: number;
  };
}

interface SchoolsClientProps {
  schoolsWithStats: School[];
  totalSchools: number;
  totalStudents: number;
  totalTeachers: number;
  totalCounselors: number;
  schoolTypes: Record<string, number>;
}

export function SchoolsClient({
  schoolsWithStats,
  totalSchools,
  totalStudents,
  totalTeachers,
  totalCounselors,
  schoolTypes,
}: SchoolsClientProps) {
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleModalSuccess = () => {
    // Refresh the page to show the new school
    router.refresh();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Schools Management
          </h1>
          <p className="text-gray-600">
            Manage all schools and tenants on the platform
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
            className="text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add School
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Total Schools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalSchools}</div>
            <p className="text-xs text-green-600 mt-1">
              <CheckCircle className="w-3 h-3 inline" /> All active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalStudents}</div>
            <p className="text-xs text-gray-500 mt-1">Across all schools</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Total Teachers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalTeachers}</div>
            <p className="text-xs text-gray-500 mt-1">Across all schools</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Counselors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalCounselors}</div>
            <p className="text-xs text-gray-500 mt-1">Assigned to schools</p>
          </CardContent>
        </Card>
      </div>

      {/* School Types Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>School Types Distribution</CardTitle>
          <CardDescription>Breakdown by school type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {Object.entries(schoolTypes).map(([type, count]: [string, number]) => (
              <Badge
                key={type}
                variant="outline"
                className="px-4 py-2 text-sm"
                style={{
                  borderColor: "rgb(236 72 153)",
                  color: "rgb(219 39 119)",
                }}
              >
                {type}: {count}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search schools by name, code, or location..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
              />
            </div>
            <select className="px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none">
              <option value="">All School Types</option>
              <option value="HSS">Higher Secondary School</option>
              <option value="MSS">Middle Secondary School</option>
              <option value="LSS">Lower Secondary School</option>
              <option value="Primary">Primary School</option>
              <option value="Private">Private School</option>
            </select>
            <select className="px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none">
              <option value="">All Districts</option>
              <option value="TH">Thimphu</option>
              <option value="PU">Punakha</option>
              <option value="PA">Paro</option>
              <option value="WT">Wangdue</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Schools Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Schools</CardTitle>
          <CardDescription>
            {totalSchools} schools registered on platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">School</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Location</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600 text-sm">Students</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600 text-sm">Teachers</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600 text-sm">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {schoolsWithStats.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                          <Building2 className="w-8 h-8 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium">No schools found</p>
                          <p className="text-gray-500 text-sm">Get started by adding your first school</p>
                        </div>
                        <Button
                          onClick={() => setIsAddModalOpen(true)}
                          style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
                          className="text-white"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add School
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  schoolsWithStats.map((school) => (
                    <tr key={school.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-start gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold flex-shrink-0"
                            style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
                          >
                            {school.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <a
                              href={`/admin/schools/${school.id}`}
                              className="font-medium text-gray-900 hover:text-pink-600 transition-colors"
                            >
                              {school.name}
                            </a>
                            <p className="text-sm text-gray-500">Code: {school.code}</p>
                            {school.level && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                {school.level}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          variant="outline"
                          className="text-xs"
                          style={{
                            borderColor: "rgb(236 72 153)",
                            color: "rgb(219 39 119)",
                          }}
                        >
                          {school.schoolType || "N/A"}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          {school.districtName && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <MapPin className="w-3 h-3" />
                              {school.districtName}
                            </div>
                          )}
                          {school.address && (
                            <p className="text-xs text-gray-500 truncate max-w-[200px]">
                              {school.address}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-900">
                          <Users className="w-4 h-4 text-gray-400" />
                          {school.stats.students}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-900">
                          <GraduationCap className="w-4 h-4 text-gray-400" />
                          {school.stats.teachers}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-pink-50 hover:text-pink-600"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-pink-50 hover:text-pink-600"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats by District */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Schools by Student Count</CardTitle>
            <CardDescription>Schools with highest enrollment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {schoolsWithStats
                .sort((a, b) => b.stats.students - a.stats.students)
                .slice(0, 5)
                .map((school, index) => (
                  <div key={school.id} className="flex items-center gap-4">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0
                          ? "bg-yellow-100 text-yellow-700"
                          : index === 1
                          ? "bg-gray-100 text-gray-700"
                          : index === 2
                          ? "bg-orange-100 text-orange-700"
                          : "bg-gray-50 text-gray-600"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900">{school.name}</span>
                        <span className="text-sm text-gray-500">{school.stats.students} students</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${(school.stats.students / (schoolsWithStats[0]?.stats.students || 1)) * 100}%`,
                            background: "linear-gradient(90deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recently Added Schools</CardTitle>
            <CardDescription>Latest schools to join platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {schoolsWithStats
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5)
                .map((school) => (
                  <div key={school.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold"
                      style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
                    >
                      {school.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{school.name}</p>
                      <p className="text-sm text-gray-500">
                        {school.stats.students} students • {school.stats.teachers} teachers
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200 text-xs"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add School Modal */}
      <AddSchoolModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
