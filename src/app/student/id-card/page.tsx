"use client";

import { logger } from "@/lib/logger";
/**
 * STUDENT ID CARD PAGE
 *
 * Students can:
 * - View and download their ID card
 * - Print or save the ID card
 */


import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Download,
  Printer,
  Loader2,
  Image,
  User,
  Calendar,
  Shield,
  Info,
} from "lucide-react";

interface StudentData {
  id: string;
  firstName: string;
  lastName: string;
  type: string;
  classGrade?: number;
  section?: string;
  dateOfBirth?: string;
  parentId?: string;
  parent?: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  school?: {
    name: string;
    code: string;
    address?: string;
  };
  profilePicture?: string;
  employeeId?: string;
}

export default function StudentIdCardPage() {
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [idCardUrl, setIdCardUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/user/profile");
        const data = await response.json();
        setStudentData(data);
      } catch (error) {
        logger.error("Error fetching student data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  const handleDownload = async () => {
    if (!studentData) return;

    try {
      setDownloading(true);
      const response = await fetch(`/api/id-card?userId=${studentData.id}`);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        setIdCardUrl(url);

        // Trigger download
        const a = document.createElement("a");
        a.href = url;
        a.download = `id-card-${studentData.id}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (error) {
      logger.error("Error downloading ID card:", error);
      alert("Failed to download ID card. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    if (!idCardUrl) return;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Print ID Card</title></head>
          <body style="margin:0;padding:20px;display:flex;justify-content:center;align-items:center;min-height:100vh;">
            <img src="${idCardUrl}" style="max-width:600px;width:100%;" />
            <script>
              window.onload = function() {
                window.print();
                window.close();
              }
            </script>
          </body>
        </html>
      `);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getRoleLabel = (type: string) => {
    const labels: Record<string, string> = {
      student: "Student",
      teacher: "Teacher",
      parent: "Parent",
      admin: "School Administrator",
      counselor: "Counselor",
      "school-admin": "School Administrator",
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-orange-600" />
          My ID Card
        </h1>
        <p className="text-gray-600 mt-1">
          Download and print your official school identification card
        </p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
            <p className="ml-3 text-gray-600">Loading your ID card...</p>
          </CardContent>
        </Card>
      ) : !studentData ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Shield className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Unable to Generate ID Card
            </h3>
            <p className="text-gray-500">
              Please complete your profile setup to generate your ID card.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ID Card Preview */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-orange-800">ID Card Preview</CardTitle>
                <Badge className="bg-orange-600 text-white">
                  {getRoleLabel(studentData.type)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="max-w-2xl mx-auto bg-gradient-to-br from-orange-100 via-white to-amber-100 via-white rounded-lg shadow-xl overflow-hidden">
                {/* Card Visual */}
                <div className="bg-white rounded-lg p-6 border-4 border-orange-200">
                  <div className="flex items-start gap-6">
                    {/* Photo Area */}
                    <div className="relative">
                      {studentData.profilePicture ? (
                        <div className="w-32 h-40 rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50">
                          <img
                            src={studentData.profilePicture}
                            alt={`${studentData.firstName} ${studentData.lastName}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-32 h-40 rounded-lg bg-orange-100 flex items-center justify-center">
                          <User className="w-16 h-16 text-orange-600" />
                        </div>
                      )}
                      <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <Shield className="w-4 h-4 text-white" />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      {/* Name */}
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">
                        {studentData.firstName} {studentData.lastName}
                      </h2>
                      <p className="text-lg text-gray-600 mb-4">
                        {getRoleLabel(studentData.type)}
                      </p>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {studentData.type === "student" && studentData.classGrade && (
                          <div>
                            <p className="text-gray-500">Class</p>
                            <p className="font-semibold text-gray-900">
                              Class {studentData.classGrade}{studentData.section && `-${studentData.section}`}
                            </p>
                          </div>
                        )}
                        {studentData.employeeId && (
                          <div>
                            <p className="text-gray-500">Employee ID</p>
                            <p className="font-semibold text-gray-900">{studentData.employeeId}</p>
                          </div>
                        )}
                        {studentData.dateOfBirth && (
                          <div>
                            <p className="text-gray-500">Date of Birth</p>
                            <p className="font-semibold text-gray-900">{formatDate(studentData.dateOfBirth)}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-gray-500">ID Number</p>
                          <p className="font-mono font-semibold text-gray-900">
                            {studentData.id.slice(-8).toUpperCase()}
                          </p>
                        </div>
                      </div>

                      {/* School Name */}
                      {studentData.school && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-gray-500 text-sm">School</p>
                          <p className="font-semibold text-gray-900">{studentData.school.name}</p>
                          <p className="text-gray-600 text-sm">{studentData.school.code}</p>
                        </div>
                      )}

                      {/* Parent/Guardian Info (for students) */}
                      {studentData.parent && studentData.type === "student" && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-gray-500 text-sm">Parent/Guardian</p>
                          <p className="font-semibold text-gray-900">
                            {studentData.parent.firstName} {studentData.parent.lastName}
                          </p>
                          {studentData.parent.phone && (
                            <p className="text-gray-600 text-sm">{studentData.parent.phone}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Bar */}
                  <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Valid through {new Date().getFullYear() + 1}
                    </div>
                    <div className="flex items-center gap-2">
                      <Image className="w-4 h-4 text-orange-600" />
                      <span className="text-xs text-gray-600">Official ID Card</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-orange-600 hover:bg-orange-700"
                  onClick={handleDownload}
                  disabled={downloading}
                >
                  {downloading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download PNG
                    </>
                  )}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handlePrint}
                  disabled={!idCardUrl}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Card
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Information Notice */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Important Information</h3>
                  <p className="text-sm text-blue-800">
                    This ID card is for official school identification purposes.
                    Please carry it with you at all times while on campus.
                    If lost, report to the school administration immediately for replacement.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
