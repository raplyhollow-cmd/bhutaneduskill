"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  GraduationCap,
  Plus,
  Search,
  Filter,
  MapPin,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AddSchoolModal } from "@/components/admin/add-school-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface School {
  id: string;
  name: string;
  code: string;
  district: string;
  schoolType: string;
  level: string;
  contactEmail: string;
  contactPhone: string;
  status: "Active" | "Inactive";
  students?: number;
  teachers?: number;
}

export default function MinistrySchoolsPage() {
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<School[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockSchools: School[] = [
      {
        id: "1",
        name: "Royal High School",
        code: "RHS-THI-2026",
        district: "Thimphu",
        schoolType: "HSS",
        level: "secondary",
        contactEmail: "admin@rhs.edu.bt",
        contactPhone: "+975 2 322456",
        status: "Active",
        students: 850,
        teachers: 65,
      },
      {
        id: "2",
        name: "Yangchenphug Higher Secondary School",
        code: "YHSS-THI-2026",
        district: "Thimphu",
        schoolType: "HSS",
        level: "secondary",
        contactEmail: "principal@yhss.edu.bt",
        contactPhone: "+975 2 345678",
        status: "Active",
        students: 1200,
        teachers: 85,
      },
      {
        id: "3",
        name: "Mongar Higher Secondary School",
        code: "MHSS-MON-2026",
        district: "Mongar",
        schoolType: "HSS",
        level: "secondary",
        contactEmail: "info@mhss.edu.bt",
        contactPhone: "+975 4 456789",
        status: "Active",
        students: 680,
        teachers: 52,
      },
      {
        id: "4",
        name: "Punakha Middle Secondary School",
        code: "PMSS-PUN-2026",
        district: "Punakha",
        schoolType: "MSS",
        level: "middle",
        contactEmail: "admin@pmss.edu.bt",
        contactPhone: "+975 3 567890",
        status: "Active",
        students: 450,
        teachers: 38,
      },
      {
        id: "5",
        name: "Paro Lower Secondary School",
        code: "PLSS-PAR-2026",
        district: "Paro",
        schoolType: "LSS",
        level: "middle",
        contactEmail: "principal@plss.edu.bt",
        contactPhone: "+975 8 234567",
        status: "Active",
        students: 380,
        teachers: 32,
      },
    ];

    setSchools(mockSchools);
    setFilteredSchools(mockSchools);
  }, []);

  useEffect(() => {
    let filtered = schools;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (school) =>
          school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          school.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // District filter
    if (districtFilter !== "all") {
      filtered = filtered.filter((school) => school.district === districtFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((school) => school.schoolType === typeFilter);
    }

    setFilteredSchools(filtered);
  }, [searchTerm, districtFilter, typeFilter, schools]);

  const districts = ["Thimphu", "Paro", "Punakha", "Wangdue", "Trongsa", "Bumthang", "Trashigang", "Mongar", "Samtse", "Sarpang"];
  const schoolTypes = ["HSS", "MSS", "LSS", "Primary", "Private"];

  const stats = {
    total: schools.length,
    totalStudents: schools.reduce((sum, s) => sum + (s.students || 0), 0),
    totalTeachers: schools.reduce((sum, s) => sum + (s.teachers || 0), 0),
    byDistrict: districts.length,
  };

  const colors = {
    primary: "rgb(168 85 247)",
    gradient: "linear-gradient(135deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Schools Management</h1>
          <p className="text-gray-600">Create and manage schools across Bhutan</p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          style={{ background: colors.gradient }}
          className="text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add School
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4" style={{ borderLeftColor: colors.primary }}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg" style={{ background: "rgb(250 245 255)" }}>
                <Building2 className="w-6 h-6" style={{ color: colors.primary }} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Schools</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4" style={{ borderLeftColor: colors.primary }}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg" style={{ background: "rgb(250 245 255)" }}>
                <Users className="w-6 h-6" style={{ color: colors.primary }} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStudents.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4" style={{ borderLeftColor: colors.primary }}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg" style={{ background: "rgb(250 245 255)" }}>
                <GraduationCap className="w-6 h-6" style={{ color: colors.primary }} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Teachers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTeachers.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4" style={{ borderLeftColor: colors.primary }}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg" style={{ background: "rgb(250 245 255)" }}>
                <MapPin className="w-6 h-6" style={{ color: colors.primary }} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Districts Covered</p>
                <p className="text-2xl font-bold text-gray-900">{stats.byDistrict}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search by school name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={districtFilter} onValueChange={setDistrictFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Districts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Districts</SelectItem>
                {districts.map((district) => (
                  <SelectItem key={district} value={district}>
                    {district}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {schoolTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Schools Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Schools ({filteredSchools.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">School</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Code</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">District</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Students</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchools.map((school) => (
                  <tr key={school.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{school.name}</p>
                        <p className="text-sm text-gray-500">{school.contactEmail}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {school.code}
                      </code>
                    </td>
                    <td className="py-3 px-4 text-gray-700">{school.district}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">{school.schoolType}</Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-700">{school.students?.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <Badge className={school.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                        {school.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add School Modal */}
      <AddSchoolModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          router.refresh();
          setIsAddModalOpen(false);
        }}
      />
    </div>
  );
}
