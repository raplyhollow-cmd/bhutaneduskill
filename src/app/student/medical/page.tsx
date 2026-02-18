"use client";

/**
 * STUDENT MEDICAL RECORDS PAGE
 *
 * Students can view:
 * - Medical visit history
 * - Vaccination records
 * - Known allergies and conditions
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  HeartPulse,
  Syringe,
  AlertTriangle,
  Calendar,
  Loader2,
  RefreshCw,
  CheckCircle2,
  FileText,
  Thermometer,
  Activity,
} from "lucide-react";

interface MedicalRecord {
  id: string;
  visitDate: string;
  visitType: string;
  chiefComplaint: string;
  diagnosis?: string;
  treatment: string;
  isEmergency: boolean;
  dischargeCondition: string;
  symptoms?: string[];
}

interface VaccinationRecord {
  id: string;
  vaccineName: string;
  vaccineType: string;
  administrationDate: string;
  doseNumber?: number;
  requiresFollowUp: boolean;
  nextDoseDue?: string;
  manufacturer?: string;
  batchNumber?: string;
}

interface StudentAllergy {
  id: string;
  allergenType: string;
  allergenName?: string;
  severity: string;
  reaction?: string;
  conditionType?: string;
  conditionDetails?: string;
  requiresEmergencyMedication: boolean;
  emergencyMedication?: string;
}

interface MedicalData {
  studentId: string;
  medicalHistory: MedicalRecord[];
  vaccinations: VaccinationRecord[];
  allergies: StudentAllergy[];
  summary: {
    totalVisits: number;
    emergencyVisits: number;
    totalVaccinations: number;
    knownAllergies: number;
    chronicConditions: number;
  };
}

export default function StudentMedicalPage() {
  const [medicalData, setMedicalData] = useState<MedicalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"visits" | "vaccinations" | "allergies">("visits");

  useEffect(() => {
    fetchMedicalData();
  }, []);

  const fetchMedicalData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/student/medical");
      const data = await res.json();

      if (data.success) {
        setMedicalData(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch medical data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "mild":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "moderate":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "severe":
        return "bg-red-100 text-red-700 border-red-200";
      case "life_threatening":
        return "bg-purple-100 text-purple-700 border-purple-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getVisitTypeColor = (visitType: string) => {
    switch (visitType) {
      case "emergency":
        return "bg-red-100 text-red-700 border-red-200";
      case "routine":
        return "bg-green-100 text-green-700 border-green-200";
      case "follow_up":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "scheduled":
        return "bg-purple-100 text-purple-700 border-purple-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getVaccineTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      bcg: "BCG",
      polio: "Polio",
      mmr: "MMR",
      dpt: "DPT",
      hepatitis_b: "Hepatitis B",
      covid19: "COVID-19",
      other: "Other",
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <HeartPulse className="w-8 h-8 text-orange-600" />
            Medical Records
          </h1>
          <p className="text-gray-600 mt-1">
            View your medical history, vaccinations, and health information
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchMedicalData}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      {medicalData && (
        <div className="grid md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-gray-500">Total Visits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{medicalData.summary.totalVisits}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-gray-500">Emergency Visits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{medicalData.summary.emergencyVisits}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-gray-500">Vaccinations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{medicalData.summary.totalVaccinations}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-gray-500">Known Allergies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{medicalData.summary.knownAllergies}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-gray-500">Chronic Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{medicalData.summary.chronicConditions}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-3">
          <TabsTrigger value="visits">Visit History</TabsTrigger>
          <TabsTrigger value="vaccinations">Vaccinations</TabsTrigger>
          <TabsTrigger value="allergies">
            Allergies & Conditions
            {medicalData?.allergies && medicalData.allergies.length > 0 && (
              <Badge className="ml-2 bg-orange-600 text-white">
                {medicalData.allergies.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Visits Tab */}
        <TabsContent value="visits">
          <Card>
            <CardHeader>
              <CardTitle>Medical Visit History</CardTitle>
              <CardDescription>Record of your visits to the school infirmary</CardDescription>
            </CardHeader>
            <CardContent>
              {!medicalData?.medicalHistory || medicalData.medicalHistory.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p>No medical visits recorded.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {medicalData.medicalHistory.map((record) => (
                    <div
                      key={record.id}
                      className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-semibold text-gray-900">
                              {formatDate(record.visitDate)}
                            </p>
                            <p className="text-sm text-gray-500">{record.visitType.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getVisitTypeColor(record.visitType)} variant="outline">
                            {record.visitType.replace("_", " ")}
                          </Badge>
                          {record.isEmergency && (
                            <Badge className="bg-red-600 text-white">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Emergency
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium text-gray-700">Reason: </span>
                          <span className="text-sm text-gray-900">{record.chiefComplaint}</span>
                        </div>

                        {record.symptoms && record.symptoms.length > 0 && (
                          <div>
                            <span className="text-sm font-medium text-gray-700">Symptoms: </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {record.symptoms.map((symptom, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {symptom}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {record.diagnosis && (
                          <div>
                            <span className="text-sm font-medium text-gray-700">Diagnosis: </span>
                            <span className="text-sm text-gray-900">{record.diagnosis}</span>
                          </div>
                        )}

                        <div>
                          <span className="text-sm font-medium text-gray-700">Treatment: </span>
                          <span className="text-sm text-gray-900">{record.treatment}</span>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t">
                          <Activity className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-600">
                            Discharged: {record.dischargeCondition.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vaccinations Tab */}
        <TabsContent value="vaccinations">
          <Card>
            <CardHeader>
              <CardTitle>Vaccination Records</CardTitle>
              <CardDescription>Your immunization history and upcoming vaccinations</CardDescription>
            </CardHeader>
            <CardContent>
              {!medicalData?.vaccinations || medicalData.vaccinations.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Syringe className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p>No vaccination records found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {medicalData.vaccinations.map((vaccination) => (
                    <div
                      key={vaccination.id}
                      className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Syringe className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{vaccination.vaccineName}</p>
                            <p className="text-sm text-gray-500">
                              {getVaccineTypeLabel(vaccination.vaccineType)}
                              {vaccination.doseNumber && ` - Dose ${vaccination.doseNumber}`}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200" variant="outline">
                          {formatDate(vaccination.administrationDate)}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {vaccination.manufacturer && (
                          <div>
                            <span className="text-gray-500">Manufacturer: </span>
                            <span className="text-gray-900">{vaccination.manufacturer}</span>
                          </div>
                        )}
                        {vaccination.batchNumber && (
                          <div>
                            <span className="text-gray-500">Batch No: </span>
                            <span className="text-gray-900">{vaccination.batchNumber}</span>
                          </div>
                        )}
                      </div>

                      {vaccination.requiresFollowUp && vaccination.nextDoseDue && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm text-yellow-800">
                            Next dose due: {formatDate(vaccination.nextDoseDue)}
                          </span>
                        </div>
                      )}

                      {vaccination.requiresFollowUp && !vaccination.nextDoseDue && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-800">
                            Vaccination complete
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Allergies Tab */}
        <TabsContent value="allergies">
          <Card>
            <CardHeader>
              <CardTitle>Allergies & Medical Conditions</CardTitle>
              <CardDescription>Known allergies, chronic conditions, and special medical needs</CardDescription>
            </CardHeader>
            <CardContent>
              {!medicalData?.allergies || medicalData.allergies.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <CheckCircle2 className="w-16 h-16 mx-auto text-green-300 mb-4" />
                  <p>No known allergies or conditions recorded.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {medicalData.allergies.map((allergy) => (
                    <div
                      key={allergy.id}
                      className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            allergy.severity === "severe" || allergy.severity === "life_threatening"
                              ? "bg-red-100"
                              : "bg-orange-100"
                          }`}>
                            <AlertTriangle className={`w-5 h-5 ${
                              allergy.severity === "severe" || allergy.severity === "life_threatening"
                                ? "text-red-600"
                                : "text-orange-600"
                            }`} />
                          </div>
                          <div>
                            {allergy.allergenName ? (
                              <>
                                <p className="font-semibold text-gray-900">{allergy.allergenName}</p>
                                <p className="text-sm text-gray-500">
                                  {allergy.allergenType.replace("_", " ")} Allergy
                                </p>
                              </>
                            ) : allergy.conditionType ? (
                              <>
                                <p className="font-semibold text-gray-900">
                                  {allergy.conditionType.replace("_", " ")}
                                </p>
                                <p className="text-sm text-gray-500">Medical Condition</p>
                              </>
                            ) : (
                              <p className="font-semibold text-gray-900">Medical Note</p>
                            )}
                          </div>
                        </div>
                        <Badge className={getSeverityColor(allergy.severity)} variant="outline">
                          {allergy.severity.replace("_", " ")}
                        </Badge>
                      </div>

                      {allergy.reaction && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-700">Reaction: </span>
                          <span className="text-sm text-gray-900">{allergy.reaction}</span>
                        </div>
                      )}

                      {allergy.conditionDetails && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-700">Details: </span>
                          <span className="text-sm text-gray-900">{allergy.conditionDetails}</span>
                        </div>
                      )}

                      {allergy.requiresEmergencyMedication && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm font-medium text-red-800">
                            <AlertTriangle className="w-4 h-4 inline mr-1" />
                            Requires Emergency Medication
                          </p>
                          {allergy.emergencyMedication && (
                            <p className="text-sm text-red-700 mt-1">
                              Medication: {allergy.emergencyMedication}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
