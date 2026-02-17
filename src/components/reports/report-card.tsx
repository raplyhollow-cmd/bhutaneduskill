"use client";

import { logger } from "@/lib/logger";
/**
 * REPORT CARD COMPONENT WITH PDF GENERATION
 *
 * Features:
 * - Generate PDF report cards for students
 * - Include academic performance, attendance, behavior
 * - Print and download functionality
 */


import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Printer,
  FileText,
  User,
  Calendar,
  School,
  Award,
  TrendingUp,
  CheckCircle,
  X,
  Loader2,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

// Student type for dropdown
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber?: string;
}

// Report Card Data types
export interface ReportCardData {
  student: {
    id: string;
    name: string;
    rollNumber: string;
    class: string;
    section: string;
    academicYear: string;
    term: string;
  };
  attendance: {
    totalDays: number;
    present: number;
    absent: number;
    percentage: number;
  };
  results: StudentResult[];
  aggregate: {
    totalMarks: number;
    totalObtained: number;
    percentage: number;
    grade: string;
    rank: number;
  };
  behavior: {
    conduct: string;
    comments: string;
    teacherRemarks: string;
  };
  extracurricular: {
    activities: string[];
    achievements: string[];
  };
  school: {
    name: string;
    address: string;
    phone: string;
    website?: string;
    logo?: string;
  };
  signature: {
    classTeacher: string;
    principal: string;
    date: string;
  };
}

export interface StudentResult {
  subject: string;
  grade: string;
  marks: number;
  totalMarks: number;
  percentage: number;
  remarks: string;
}

export function ReportCardGenerator() {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [generatedData, setGeneratedData] = useState<ReportCardData | null>(null);
  const [showPrintView, setShowPrintView] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Students state - fetched from API
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  // Fetch students when class is selected
  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass);
    } else {
      setStudents([]);
    }
  }, [selectedClass]);

  const fetchStudents = async (classId: string) => {
    setIsLoadingStudents(true);
    try {
      // Fetch students for this class
      // For now, using a simple approach - in production would have proper API
      const res = await fetch(`/api/students?class=${classId}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      }
    } catch (error) {
      logger.error("Failed to fetch students:", error);
      setStudents([]);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedClass || !selectedStudent || !selectedTerm) {
      return;
    }

    setGeneratedData({
      student: {
        id: "1",
        name: "Tashi Wangchuk",
        rollNumber: "2024001",
        class: "10",
        section: "A",
        academicYear: "2024",
        term: "Mid-Term"
      },
      attendance: {
        totalDays: 120,
        present: 108,
        absent: 12,
        percentage: 90
      },
      results: [
        {
          subject: "English",
          grade: "A",
          marks: 85,
          totalMarks: 100,
          percentage: 85,
          remarks: "Excellent performance"
        }
      ],
      aggregate: {
        totalMarks: 600,
        totalObtained: 513,
        percentage: 85,
        grade: "A",
        rank: 3
      },
      behavior: {
        conduct: "Excellent",
        comments: "Tashi is a diligent student who actively participates in class activities.",
        teacherRemarks: "Keep up the excellent work!"
      },
      extracurricular: {
        activities: ["Basketball", "Debate Club"],
        achievements: ["Best Debater - Inter School Competition 2024", "Sports Captain"]
      },
      school: {
        name: "Pelkhil Higher Secondary School",
        address: "Thimphu, Bhutan",
        phone: "+975 17 123 456",
        website: undefined,
        logo: undefined
      },
      signature: {
        classTeacher: "Ms. Karma Choden",
        principal: "Principal",
        date: new Date().toLocaleDateString()
      }
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      // Use browser's native print to PDF
      setShowPrintView(true);
      setTimeout(() => {
        window.print();
        setShowPrintView(false);
        setIsGenerating(false);
      }, 500);
    } catch (error) {
      logger.error("PDF generation error:", error);
      setIsGenerating(false);
    }
  };

  if (generatedData) {
    return (
      <>
        {/* Print Preview */}
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Generate Report Card - {generatedData.student.term}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setGeneratedData(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Header */}
            <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
              <School className="w-10 h-10 text-gray-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{generatedData.school.name}</h1>
                <p className="text-sm text-gray-600">{generatedData.school.address}</p>
                <p className="text-sm text-gray-600">{generatedData.school.phone}</p>
              </div>
            </div>

            <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
              <h2 className="text-xl font-bold text-gray-900">PROGRESS REPORT</h2>
              <p className="text-sm text-gray-600">{generatedData.student.academicYear} - {generatedData.student.term}</p>
            </div>

            {/* Student Info */}
            <div className="grid md:grid-cols-2 gap-6 mb-6 text-sm">
              <div className="flex flex-col gap-2">
                <p className="text-gray-600">Name:</p>
                <p className="font-semibold text-gray-900">{generatedData.student.name}</p>
                <p className="text-gray-600">{generatedData.student.rollNumber}</p>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-gray-600">Class:</p>
                <p className="font-semibold text-gray-900">{generatedData.student.class} - {generatedData.student.section}</p>
              </div>
            </div>

            {/* Attendance Summary */}
            <div className="border-b-2 border-gray-800 p-4 rounded-lg bg-gray-50 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">ATTENDANCE SUMMARY</h3>
              <div className="flex justify-between gap-6 text-sm">
                <span>Total Attendance:</span>
                <span>{generatedData.attendance.totalDays} days</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-green-600">{generatedData.attendance.present} days</span>
                  <span className="text-sm text-gray-500">Present</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-red-600">{generatedData.attendance.absent} days</span>
                  <span className="text-sm text-gray-500">Absent</span>
                </div>
              </div>
              <Progress value={generatedData.attendance.percentage} className="h-2" />
            </div>

            <div className="border-b-2 border-gray-800 p-4 rounded-lg bg-gray-50 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">RESULTS</h3>
              <table className="w-full border-collapse border border-gray-400 mb-6 text-sm">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-gray-400 px-3 py-2 text-left">Subject</th>
                    <th className="border border-gray-400 px-3 py-2 text-center">Max Marks</th>
                    <th className="border border-gray-400 px-3 py-2 text-center">Obtained</th>
                    <th className="border border-gray-400 px-3 py-2 text-center">Percentage</th>
                    <th className="border border-gray-400 px-3 py-2 text-left">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedData.results.map((result, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <td className="border border-gray-400 px-3 py-2">{result.subject}</td>
                      <td className="border border-gray-400 px-3 py-2 text-center">{result.totalMarks}</td>
                      <td className="border border-gray-400 px-3 py-2 text-center">{result.marks}</td>
                      <td className="border border-gray-400 px-3 py-2 text-center">{result.percentage}%</td>
                      <td className="border border-gray-400 px-3 py-2 text-xs">{result.remarks}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-300 font-bold">
                  <tr>
                    <td className="border border-gray-400 px-3 py-2" colSpan={2}>TOTAL / AGGREGATE</td>
                    <td className="border border-gray-400 px-3 py-2 text-center">{generatedData.aggregate.totalObtained}</td>
                    <td className="border border-gray-400 px-3 py-2 text-center">{generatedData.aggregate.totalMarks}</td>
                    <td className="border border-gray-400 px-3 py-2 text-center">{generatedData.aggregate.percentage}%</td>
                    <td className="border border-gray-400 px-3 py-2 text-center">{generatedData.aggregate.grade}</td>
                  </tr>
                </tfoot>
              </table>

              {/* Grades Legend */}
              <div className="flex justify-center gap-4 mb-6 text-xs">
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded"></span> A+/A: Excellent</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded"></span> B+/B: Very Good</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-500 rounded"></span> C+/C: Good</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-orange-500 rounded"></span> D+/D: Satisfactory</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded"></span> E/F: Needs Improvement</span>
              </div>
            </div>

            {/* Attendance & Behavior */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="border border-gray-400 p-4 rounded-lg">
                <h3 className="font-bold text-center mb-3 border-b pb-2">ATTENDANCE SUMMARY</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-6">
                    <span>Attendance Rate:</span>
                    <span className="font-bold">{generatedData.attendance.percentage}%</span>
                  </div>
                  <Progress value={generatedData.attendance.percentage} className="h-2" />
                </div>
                <div className="mt-4">
                  <p className="text-gray-600">Total: {generatedData.attendance.totalDays} days</p>
                  <p className="text-gray-600">Present: {generatedData.attendance.present} days</p>
                  <p className="text-gray-600">Absent: {generatedData.attendance.absent} days</p>
                </div>
              </div>
              <div className="border border-gray-400 p-4 rounded-lg bg-white">
                <h3 className="font-bold text-center mb-3 border-b pb-2">CONDUCT & BEHAVIOR</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex"><span className="font-medium w-24">Conduct:</span> <span>{generatedData.behavior.conduct}</span></div>
                  <p className="text-gray-600 mt-2">{generatedData.behavior.comments}</p>
                  <div className="flex items-center gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Details
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Extracurricular */}
            {generatedData.extracurricular.activities.length > 0 && (
              <div className="border border-gray-400 p-4 rounded-lg mb-6">
                <h3 className="font-bold text-center mb-3 border-b pb-2">EXTRACURRICULAR ACTIVITIES</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Activities Participated:</h3>
                    <ul className="list-disc list-inside text-gray-600">
                      {generatedData.extracurricular.activities.map((activity, i) => (
                        <li key={i}>{activity}</li>
                      ))}
                    </ul>
                  </div>
                  {generatedData.extracurricular.achievements.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Achievements:</h3>
                      <ul className="list-disc list-inside text-gray-600">
                        {generatedData.extracurricular.achievements.map((achievement, i) => (
                          <li key={i}>{achievement}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Signatures */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <p className="text-xs">Class Teacher</p>
                <p className="text-sm font-medium">{generatedData.signature.classTeacher}</p>
              </div>
              <div className="text-center">
                <p className="text-xs">Principal</p>
                <p className="text-sm font-medium">{generatedData.signature.principal}</p>
              </div>
              <div className="text-center">
                <p className="text-xs">Date</p>
                <p className="text-sm font-medium">{generatedData.signature.date}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-8 pt-4 border-t text-xs text-gray-500">
              <p>This is a computer-generated report card. Signature does not require authentication.</p>
              <p>Generated on {new Date().toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Print View */}
        {showPrintView && (
          <div className="min-h-screen bg-white p-8">
            <Button onClick={() => setShowPrintView(false)} variant="ghost" className="absolute top-4 right-4 z-10">
              <X className="w-6 h-6" />
            </Button>

            <div className="bg-white p-8 max-w-4xl mx-auto print:p-4 print:shadow-none print:p-4">
              {/* Header */}
              <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
                <div className="flex items-center justify-center gap-4 mb-2">
                  <School className="w-10 h-10 text-gray-600" />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{generatedData.school.name}</h1>
                    <p className="text-sm text-gray-600">{generatedData.school.address}</p>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">PROGRESS REPORT</h1>
                    <p className="text-sm text-gray-600">{generatedData.student.academicYear} - {generatedData.student.term}</p>
                  </div>
                </div>
              </div>

              {/* Student Info */}
              <div className="grid md:grid-cols-2 gap-6 mb-6 text-sm">
                <div>
                  <p className="text-gray-600">Name:</p>
                  <p className="font-semibold text-gray-900">{generatedData.student.name}</p>
                  <p className="text-gray-600">{generatedData.student.rollNumber}</p>
                </div>
                <div>
                  <p className="text-gray-600">Class:</p>
                  <p className="font-semibold text-gray-900">{generatedData.student.class} - {generatedData.student.section}</p>
                </div>
              </div>

              {/* Attendance Table */}
              <table className="w-full border-collapse border border-gray-400 mb-6 text-sm">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Marks/100</th>
                    <th>Grade</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedData.results.map((result, index) => (
                    <tr key={index}>
                      <td>{result.subject}</td>
                      <td>{result.totalMarks}</td>
                      <td className="text-center">{result.percentage}%</td>
                      <td className="text-center">{result.remarks}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-300 font-bold">
                  <tr>
                    <td colSpan={2} className="border border-gray-400 px-3 py-2 text-center">TOTAL / AGGREGATE</td>
                    <td className="border border-gray-400 px-3 py-2 text-center">{generatedData.aggregate.totalMarks}</td>
                    <td className="border border-gray-400 px-3 py-2 text-center">{generatedData.aggregate.percentage}%</td>
                    <td className="border border-gray-400 px-3 py-2 text-center">{generatedData.aggregate.grade}</td>
                  </tr>
                </tfoot>
              </table>

              {/* Footer */}
              <div className="text-center mt-8 pt-4 border-t text-xs text-gray-500">
                <p>Generated on {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Return input form when no generated data
  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Student</CardTitle>
        <CardDescription>Generate report card by selecting class and student</CardDescription>
      </CardHeader>
    </Card>
  );
}

/**
 * Report Card Component with data
 */
interface ReportCardProps {
  data: ReportCardData;
  printable?: boolean;
  onClose?: () => void;
}

const gradeColorMap: Record<string, string> = {
  "A+": "bg-green-100 text-green-700",
  "A": "bg-green-100 text-green-700",
  "B+": "bg-blue-100 text-blue-700",
  "B": "bg-blue-100 text-blue-700",
  "C+": "bg-yellow-100 text-yellow-700",
  "C": "bg-yellow-100 text-yellow-700",
  "D+": "bg-orange-100 text-orange-700",
  "D": "bg-orange-100 text-orange-700",
  "E": "bg-red-100 text-red-700",
  "F": "bg-red-100 text-red-700",
};

export function ReportCard({ data, printable = false, onClose }: ReportCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Report Card - {data.student.term}</CardTitle>
          </div>
      </CardHeader>
      <CardContent>
        {/* Header */}
        <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              <School className="w-10 h-10 text-gray-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{data.school.name}</h1>
                <p className="text-sm text-gray-600">{data.school.address}</p>
              </div>
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900">PROGRESS REPORT</h2>
          <p className="text-sm text-gray-600">{data.student.academicYear} - {data.student.term}</p>
        </div>

        {/* Student Info */}
        <div className="grid md:grid-cols-2 gap-6 mb-6 text-sm">
          <div>
            <p className="text-gray-600">Name:</p>
            <p className="font-semibold text-gray-900">{data.student.name}</p>
            <p className="text-gray-600">{data.student.rollNumber}</p>
          </div>
          <div>
            <p className="text-gray-600">Class:</p>
            <p className="font-semibold text-gray-900">{data.student.class} - {data.student.section}</p>
          </div>
        </div>
      </CardContent>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={handlePrint} variant="outline" className="flex-1">
          <Printer className="w-4 h-4 mr-2" />
          Print Report
        </Button>
        <Button variant="outline" className="flex-1">
          <Download className="w-4 h-4 mr-2" />
          Download PDF
        </Button>
      </div>
    </Card>
  );
}
