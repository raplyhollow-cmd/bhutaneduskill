"use client";

/**
 * SCHOOL ADMIN INFIRMARY VISITS PAGE
 *
 * School administrators can:
 * - Log new medical visits
 * - View and manage visit history
 * - Record vital signs, diagnosis, and treatment
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Loader2,
  RefreshCw,
  Save,
  ArrowLeft,
  Users,
  Search,
  Thermometer,
  HeartPulse,
  Activity,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Student {
  id: string;
  name: string;
  classGrade?: number;
  section?: string;
}

interface MedicalRecord {
  id: string;
  visitDate: string;
  visitType: string;
  chiefComplaint: string;
  diagnosis?: string;
  treatment: string;
  isEmergency: boolean;
  student: Student;
}

export default function InfirmaryVisitsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [recentVisits, setRecentVisits] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    visitType: "routine",
    chiefComplaint: "",
    symptoms: [] as string[],
    temperature: "",
    bloodPressure: "",
    pulseRate: "",
    respiratoryRate: "",
    weight: "",
    height: "",
    oxygenSaturation: "",
    diagnosis: "",
    treatment: "",
    medications: [] as Array<{ name: string; dosage: string; frequency: string; duration: string }>,
    notes: "",
    followUpDate: "",
    isEmergency: false,
    parentNotified: false,
    dischargeCondition: "stable",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch students (for selection)
      const studentsRes = await fetch(`/api/school-admin/students?limit=100`);
      const studentsData = await studentsRes.json();

      if (studentsData.success) {
        setStudents(studentsData.data.students || []);
      }

      // Fetch recent visits
      const visitsRes = await fetch("/api/school-admin/medical");
      const visitsData = await visitsRes.json();

      if (visitsData.success) {
        setRecentVisits(visitsData.data.recentVisits || []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudent) {
      alert("Please select a student");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/school-admin/medical", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          ...formData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Reset form
        setFormData({
          visitType: "routine",
          chiefComplaint: "",
          symptoms: [],
          temperature: "",
          bloodPressure: "",
          pulseRate: "",
          respiratoryRate: "",
          weight: "",
          height: "",
          oxygenSaturation: "",
          diagnosis: "",
          treatment: "",
          medications: [],
          notes: "",
          followUpDate: "",
          isEmergency: false,
          parentNotified: false,
          dischargeCondition: "stable",
        });
        setSelectedStudent(null);

        // Refresh data
        await fetchData();

        alert("Medical visit recorded successfully!");
      } else {
        alert(data.error || "Failed to record visit");
      }
    } catch (error) {
      console.error("Error recording visit:", error);
      alert("Failed to record visit");
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
              <Calendar className="w-8 h-8 text-purple-600" />
              Log Medical Visit
            </h1>
            <p className="text-gray-600 mt-1">Record student visits to the infirmary</p>
          </div>
        </div>
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

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Visit Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>New Medical Visit</CardTitle>
              <CardDescription>Record details of the infirmary visit</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Student Selection */}
                <div className="space-y-2">
                  <Label>Student *</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      placeholder="Search student by name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {searchQuery && filteredStudents.length > 0 && (
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
                      <span className="text-sm text-gray-500">
                        {selectedStudent.classGrade && `Class ${selectedStudent.classGrade}`}
                        {selectedStudent.section && `-${selectedStudent.section}`}
                      </span>
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

                {/* Visit Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Visit Type</Label>
                    <Select
                      value={formData.visitType}
                      onValueChange={(value) => setFormData({ ...formData, visitType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="routine">Routine</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                        <SelectItem value="follow_up">Follow Up</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Emergency?</Label>
                    <Select
                      value={formData.isEmergency.toString()}
                      onValueChange={(value) => setFormData({ ...formData, isEmergency: value === "true" })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="false">No</SelectItem>
                        <SelectItem value="true">Yes - Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Chief Complaint */}
                <div className="space-y-2">
                  <Label>Chief Complaint *</Label>
                  <Input
                    placeholder="e.g., Headache, Stomach pain, Fever"
                    value={formData.chiefComplaint}
                    onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
                    required
                  />
                </div>

                {/* Vital Signs */}
                <div className="space-y-4">
                  <Label className="flex items-center gap-2">
                    <HeartPulse className="w-4 h-4" />
                    Vital Signs
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Temperature (°C)</Label>
                      <Input
                        type="text"
                        placeholder="36.5"
                        value={formData.temperature}
                        onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Blood Pressure</Label>
                      <Input
                        type="text"
                        placeholder="120/80"
                        value={formData.bloodPressure}
                        onChange={(e) => setFormData({ ...formData, bloodPressure: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Pulse (BPM)</Label>
                      <Input
                        type="number"
                        placeholder="72"
                        value={formData.pulseRate}
                        onChange={(e) => setFormData({ ...formData, pulseRate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">SpO2 (%)</Label>
                      <Input
                        type="number"
                        placeholder="98"
                        value={formData.oxygenSaturation}
                        onChange={(e) => setFormData({ ...formData, oxygenSaturation: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Weight (kg)</Label>
                      <Input
                        type="text"
                        placeholder="50"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Height (cm)</Label>
                      <Input
                        type="text"
                        placeholder="160"
                        value={formData.height}
                        onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Resp. Rate</Label>
                      <Input
                        type="number"
                        placeholder="16"
                        value={formData.respiratoryRate}
                        onChange={(e) => setFormData({ ...formData, respiratoryRate: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Diagnosis */}
                <div className="space-y-2">
                  <Label>Diagnosis</Label>
                  <Input
                    placeholder="e.g., Viral fever, Sprained ankle"
                    value={formData.diagnosis}
                    onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  />
                </div>

                {/* Treatment */}
                <div className="space-y-2">
                  <Label>Treatment Provided *</Label>
                  <Textarea
                    placeholder="Describe the treatment provided..."
                    value={formData.treatment}
                    onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                    rows={3}
                    required
                  />
                </div>

                {/* Additional Options */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Parent Notified</Label>
                    <Select
                      value={formData.parentNotified.toString()}
                      onValueChange={(value) => setFormData({ ...formData, parentNotified: value === "true" })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="false">No</SelectItem>
                        <SelectItem value="true">Yes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Discharge Condition</Label>
                    <Select
                      value={formData.dischargeCondition}
                      onValueChange={(value) => setFormData({ ...formData, dischargeCondition: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stable">Stable</SelectItem>
                        <SelectItem value="improved">Improved</SelectItem>
                        <SelectItem value="referred">Referred</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label>Additional Notes</Label>
                  <Textarea
                    placeholder="Any additional observations or notes..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={saving || !selectedStudent}
                  className="w-full"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Record Visit
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Recent Visits */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Recent Visits</CardTitle>
              <CardDescription>Latest infirmary activity</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : recentVisits.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No recent visits</p>
              ) : (
                <div className="space-y-3">
                  {recentVisits.slice(0, 10).map((visit) => (
                    <div
                      key={visit.id}
                      className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="font-medium text-sm">{visit.student.name}</span>
                      </div>
                      <p className="text-sm text-gray-600">{visit.chiefComplaint}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">{formatDate(visit.visitDate)}</span>
                        {visit.isEmergency && (
                          <Badge className="bg-red-600 text-white text-xs">Emergency</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
