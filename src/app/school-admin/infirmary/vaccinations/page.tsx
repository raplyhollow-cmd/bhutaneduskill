"use client";

/**
 * SCHOOL ADMIN VACCINATION RECORDS PAGE
 *
 * School administrators can:
 * - View vaccination records
 * - Add new vaccinations
 * - Track upcoming doses
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Syringe,
  Plus,
  Loader2,
  RefreshCw,
  ArrowLeft,
  Search,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Users,
} from "lucide-react";
import Link from "next/link";

interface Student {
  id: string;
  name: string;
  classGrade?: number;
  section?: string;
}

interface VaccinationRecord {
  id: string;
  student: Student;
  vaccineName: string;
  vaccineType: string;
  administrationDate: string;
  doseNumber?: number;
  requiresFollowUp: boolean;
  nextDoseDue?: string;
  manufacturer?: string;
  batchNumber?: string;
  isSchoolProvided: boolean;
}

export default function InfirmaryVaccinationsPage() {
  const [vaccinations, setVaccinations] = useState<VaccinationRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [vaccineTypeFilter, setVaccineTypeFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [adding, setAdding] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const [addFormData, setAddFormData] = useState({
    studentId: "",
    vaccineName: "",
    vaccineType: "other",
    manufacturer: "",
    batchNumber: "",
    lotNumber: "",
    administrationDate: "",
    administrationSite: "left_arm",
    doseNumber: 1,
    requiresFollowUp: false,
    nextDoseDue: "",
    certificateNumber: "",
    isSchoolProvided: false,
    notes: "",
  });

  const vaccineTypes = [
    { value: "bcg", label: "BCG" },
    { value: "polio", label: "Polio" },
    { value: "mmr", label: "MMR" },
    { value: "dpt", label: "DPT" },
    { value: "hepatitis_b", label: "Hepatitis B" },
    { value: "covid19", label: "COVID-19" },
    { value: "other", label: "Other" },
  ];

  useEffect(() => {
    fetchData();
  }, [vaccineTypeFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch students
      const studentsRes = await fetch(`/api/school-admin/students?limit=200`);
      const studentsData = await studentsRes.json();
      if (studentsData.success) {
        setStudents(studentsData.data.students || []);
      }

      // Fetch vaccinations
      const params = new URLSearchParams();
      if (vaccineTypeFilter !== "all") params.append("vaccineType", vaccineTypeFilter);

      const vaxRes = await fetch(`/api/school-admin/medical/vaccinations?${params.toString()}`);
      const vaxData = await vaxRes.json();
      if (vaxData.success) {
        setVaccinations(vaxData.data.vaccinations || []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVaccination = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudent) {
      alert("Please select a student");
      return;
    }

    setAdding(true);

    try {
      const response = await fetch("/api/school-admin/medical/vaccinations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...addFormData,
          studentId: selectedStudent.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowAddDialog(false);
        setSelectedStudent(null);
        setAddFormData({
          studentId: "",
          vaccineName: "",
          vaccineType: "other",
          manufacturer: "",
          batchNumber: "",
          lotNumber: "",
          administrationDate: "",
          administrationSite: "left_arm",
          doseNumber: 1,
          requiresFollowUp: false,
          nextDoseDue: "",
          certificateNumber: "",
          isSchoolProvided: false,
          notes: "",
        });
        await fetchData();
        alert("Vaccination record added successfully!");
      } else {
        alert(data.error || "Failed to add vaccination record");
      }
    } catch (error) {
      console.error("Error adding vaccination:", error);
      alert("Failed to add vaccination record");
    } finally {
      setAdding(false);
    }
  };

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredVaccinations = vaccinations.filter((v) =>
    v.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.vaccineName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getVaccineTypeLabel = (type: string) => {
    const found = vaccineTypes.find((vt) => vt.value === type);
    return found?.label || type;
  };

  const isUpcoming = (nextDose?: string) => {
    if (!nextDose) return false;
    const due = new Date(nextDose);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return due <= thirtyDaysFromNow && due > new Date();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/school-admin/infirmary">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Syringe className="w-8 h-8 text-purple-600" />
              Vaccination Records
            </h1>
            <p className="text-gray-600 mt-1">Manage student immunization records</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Vaccination
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Vaccination Record</DialogTitle>
                <DialogDescription>Record a new vaccination for a student</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddVaccination} className="space-y-4">
                <div className="space-y-2">
                  <Label>Student *</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      placeholder="Search student..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setSelectedStudent(null);
                      }}
                      className="pl-10"
                    />
                  </div>
                  {searchQuery && filteredStudents.length > 0 && !selectedStudent && (
                    <div className="border rounded-lg max-h-40 overflow-y-auto">
                      {filteredStudents.slice(0, 10).map((student) => (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => {
                            setSelectedStudent(student);
                            setSearchQuery("");
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center justify-between"
                        >
                          <span>{student.name}</span>
                          <span className="text-sm text-gray-500">
                            {student.classGrade && `Class ${student.classGrade}`}
                            {student.section && `-${student.section}`}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedStudent && (
                    <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <Users className="w-5 h-5 text-purple-600" />
                      <span className="font-medium">{selectedStudent.name}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedStudent(null)}
                        className="ml-auto text-gray-400 hover:text-gray-600"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Vaccine Name *</Label>
                    <Input
                      required
                      value={addFormData.vaccineName}
                      onChange={(e) => setAddFormData({ ...addFormData, vaccineName: e.target.value })}
                      placeholder="e.g., Pentavalent"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Vaccine Type *</Label>
                    <Select
                      value={addFormData.vaccineType}
                      onValueChange={(value) => setAddFormData({ ...addFormData, vaccineType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {vaccineTypes.map((vt) => (
                          <SelectItem key={vt.value} value={vt.value}>{vt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Administration Date *</Label>
                    <Input
                      type="date"
                      required
                      value={addFormData.administrationDate}
                      onChange={(e) => setAddFormData({ ...addFormData, administrationDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Dose Number</Label>
                    <Input
                      type="number"
                      min="1"
                      value={addFormData.doseNumber}
                      onChange={(e) => setAddFormData({ ...addFormData, doseNumber: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Manufacturer</Label>
                    <Input
                      value={addFormData.manufacturer}
                      onChange={(e) => setAddFormData({ ...addFormData, manufacturer: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Batch Number</Label>
                    <Input
                      value={addFormData.batchNumber}
                      onChange={(e) => setAddFormData({ ...addFormData, batchNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="requiresFollowUp"
                    checked={addFormData.requiresFollowUp}
                    onChange={(e) => setAddFormData({ ...addFormData, requiresFollowUp: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="requiresFollowUp">Requires Follow-up Dose</Label>
                </div>

                {addFormData.requiresFollowUp && (
                  <div className="space-y-2">
                    <Label>Next Dose Due Date</Label>
                    <Input
                      type="date"
                      value={addFormData.nextDoseDue}
                      onChange={(e) => setAddFormData({ ...addFormData, nextDoseDue: e.target.value })}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Certificate Number</Label>
                    <Input
                      value={addFormData.certificateNumber}
                      onChange={(e) => setAddFormData({ ...addFormData, certificateNumber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Administration Site</Label>
                    <Select
                      value={addFormData.administrationSite}
                      onValueChange={(value) => setAddFormData({ ...addFormData, administrationSite: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left_arm">Left Arm</SelectItem>
                        <SelectItem value="right_arm">Right Arm</SelectItem>
                        <SelectItem value="thigh">Thigh</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isSchoolProvided"
                    checked={addFormData.isSchoolProvided}
                    onChange={(e) => setAddFormData({ ...addFormData, isSchoolProvided: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="isSchoolProvided">Provided by School</Label>
                </div>

                <Button type="submit" disabled={adding || !selectedStudent} className="w-full">
                  {adding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Add Vaccination Record
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            onClick={fetchData}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search by student name or vaccine..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={vaccineTypeFilter} onValueChange={setVaccineTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Vaccine Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {vaccineTypes.map((vt) => (
                  <SelectItem key={vt.value} value={vt.value}>{vt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Doses Alert */}
      {filteredVaccinations.some((v) => v.requiresFollowUp && isUpcoming(v.nextDoseDue)) && (
        <Card className="bg-orange-50 border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="w-5 h-5" />
              Upcoming Vaccinations Due
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-3">
              {filteredVaccinations
                .filter((v) => v.requiresFollowUp && isUpcoming(v.nextDoseDue))
                .map((v) => (
                  <div
                    key={v.id}
                    className="p-3 bg-white border border-orange-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{v.student.name}</p>
                        <p className="text-sm text-gray-500">{v.vaccineName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-orange-600">
                          {v.nextDoseDue && formatDate(v.nextDoseDue)}
                        </p>
                        <Badge className="bg-orange-100 text-orange-700 text-xs">Due Soon</Badge>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vaccination Records */}
      <Card>
        <CardHeader>
          <CardTitle>All Vaccination Records</CardTitle>
          <CardDescription>
            {filteredVaccinations.length} records found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : filteredVaccinations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Syringe className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p>No vaccination records found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredVaccinations.map((record) => (
                <div
                  key={record.id}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Syringe className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{record.student.name}</p>
                          {record.isSchoolProvided && (
                            <Badge className="bg-green-100 text-green-700 text-xs">School Provided</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {record.student.classGrade && `Class ${record.student.classGrade}`}
                          {record.student.section && `-${record.student.section}`}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="font-medium text-gray-900">{record.vaccineName}</p>
                          <Badge variant="outline" className="text-xs">
                            {getVaccineTypeLabel(record.vaccineType)}
                          </Badge>
                          {record.doseNumber && (
                            <span className="text-xs text-gray-500">Dose {record.doseNumber}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(record.administrationDate)}
                          </span>
                          {record.manufacturer && (
                            <span>{record.manufacturer}</span>
                          )}
                          {record.batchNumber && (
                            <span>Batch: {record.batchNumber}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {record.requiresFollowUp ? (
                        record.nextDoseDue ? (
                          <div className={`p-2 rounded-lg ${
                            isUpcoming(record.nextDoseDue)
                              ? "bg-orange-100"
                              : new Date(record.nextDoseDue) < new Date()
                              ? "bg-red-100"
                              : "bg-blue-100"
                          }`}>
                            <p className="text-xs text-gray-600">Next Due</p>
                            <p className={`font-medium ${
                              isUpcoming(record.nextDoseDue)
                                ? "text-orange-600"
                                : new Date(record.nextDoseDue) < new Date()
                                ? "text-red-600"
                                : "text-blue-600"
                            }`}>
                              {formatDate(record.nextDoseDue)}
                            </p>
                          </div>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-700">Follow-up Required</Badge>
                        )
                      ) : (
                        <div className="p-2 bg-green-100 rounded-lg">
                          <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto" />
                          <p className="text-xs text-green-600 mt-1">Complete</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
