/**
 * REPORT CARD COMPONENT WITH PDF GENERATION
 *
 * Features:
 * - Generate PDF report cards for students
 * - Include academic performance, attendance, behavior
 * - Print and download functionality
 */

"use client";

import { useState } from "react";
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

export interface StudentResult {
  subject: string;
  grade: string;
  marks: number;
  totalMarks: number;
  percentage: number;
  remarks: string;
}

export interface ReportCardData {
  student: {
    id: string;
    name: string;
    rollNumber: string;
    class: string;
    section: string;
    academicYear: string;
    term: string;
    photo?: string;
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
    rank?: number;
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
    logo?: string;
    address: string;
    phone: string;
    website?: string;
  };
  signature: {
    classTeacher: string;
    principal: string;
    date: string;
  };
}

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
  const [showPrintView, setShowPrintView] = useState(false);

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
      console.error("PDF generation error:", error);
      setIsGenerating(false);
    }
  };

  const PrintView = () => (
    <div className="bg-white p-8 max-w-4xl mx-auto print:shadow-none print:p-4">
      {/* Header */}
      <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
        <div className="flex items-center justify-center gap-4 mb-2">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
            <School className="w-10 h-10 text-gray-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{data.school.name}</h1>
            <p className="text-sm text-gray-600">{data.school.address}</p>
            <p className="text-sm text-gray-600">{data.school.phone}</p>
          </div>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mt-4">PROGRESS REPORT</h2>
        <p className="text-sm text-gray-600">{data.student.academicYear} - {data.student.term}</p>
      </div>

      {/* Student Info */}
      <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div className="space-y-2">
          <div className="flex"><span className="font-medium w-32">Name:</span> <span>{data.student.name}</span></div>
          <div className="flex"><span className="font-medium w-32">Roll Number:</span> <span>{data.student.rollNumber}</span></div>
          <div className="flex"><span className="font-medium w-32">Class:</span> <span>{data.student.class} {data.student.section}</span></div>
        </div>
        <div className="space-y-2">
          <div className="flex"><span className="font-medium w-32">Total Attendance:</span> <span>{data.attendance.totalDays} days</span></div>
          <div className="flex"><span className="font-medium w-32">Present:</span> <span className="text-green-600">{data.attendance.present} days</span></div>
          <div className="flex"><span className="font-medium w-32">Absent:</span> <span className="text-red-600">{data.attendance.absent} days</span></div>
        </div>
      </div>

      {/* Results Table */}
      <table className="w-full border-collapse border border-gray-400 mb-6 text-sm">
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-gray-400 px-3 py-2 text-left">Subject</th>
            <th className="border border-gray-400 px-3 py-2 text-center">Max Marks</th>
            <th className="border border-gray-400 px-3 py-2 text-center">Obtained</th>
            <th className="border border-gray-400 px-3 py-2 text-center">Percentage</th>
            <th className="border border-gray-400 px-3 py-2 text-center">Grade</th>
            <th className="border border-gray-400 px-3 py-2 text-left">Remarks</th>
          </tr>
        </thead>
        <tbody>
          {data.results.map((result, index) => (
            <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
              <td className="border border-gray-400 px-3 py-2">{result.subject}</td>
              <td className="border border-gray-400 px-3 py-2 text-center">{result.totalMarks}</td>
              <td className="border border-gray-400 px-3 py-2 text-center">{result.marks}</td>
              <td className="border border-gray-400 px-3 py-2 text-center">{result.percentage}%</td>
              <td className="border border-gray-400 px-3 py-2 text-center font-bold">{result.grade}</td>
              <td className="border border-gray-400 px-3 py-2 text-xs">{result.remarks}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-300 font-bold">
          <tr>
            <td className="border border-gray-400 px-3 py-2" colSpan={2}>TOTAL / AGGREGATE</td>
            <td className="border border-gray-400 px-3 py-2 text-center">{data.aggregate.totalObtained}</td>
            <td className="border border-gray-400 px-3 py-2 text-center">{data.aggregate.totalMarks}</td>
            <td className="border border-gray-400 px-3 py-2 text-center">{data.aggregate.percentage}%</td>
            <td className="border border-gray-400 px-3 py-2 text-center">{data.aggregate.grade}</td>
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

      {/* Attendance & Behavior */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="border border-gray-400 p-4 rounded">
          <h3 className="font-bold text-center mb-3 border-b pb-2">ATTENDANCE SUMMARY</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Attendance Rate:</span><span className="font-bold">{data.attendance.percentage}%</span></div>
            <Progress value={data.attendance.percentage} className="h-2" />
          </div>
        </div>
        <div className="border border-gray-400 p-4 rounded">
          <h3 className="font-bold text-center mb-3 border-b pb-2">CONDUCT & BEHAVIOR</h3>
          <div className="space-y-2 text-sm">
            <div className="flex"><span className="font-medium w-24">Conduct:</span> <span>{data.behavior.conduct}</span></div>
            <p className="text-gray-600 mt-2">{data.behavior.comments}</p>
          </div>
        </div>
      </div>

      {/* Extracurricular */}
      {data.extracurricular.activities.length > 0 && (
        <div className="border border-gray-400 p-4 rounded mb-6">
          <h3 className="font-bold text-center mb-3 border-b pb-2">EXTRACURRICULAR ACTIVITIES</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium mb-1">Activities Participated:</p>
              <ul className="list-disc list-inside text-gray-600">
                {data.extracurricular.activities.map((activity, i) => (
                  <li key={i}>{activity}</li>
                ))}
              </ul>
            </div>
            {data.extracurricular.achievements.length > 0 && (
              <div>
                <p className="font-medium mb-1">Achievements:</p>
                <ul className="list-disc list-inside text-gray-600">
                  {data.extracurricular.achievements.map((achievement, i) => (
                    <li key={i}>{achievement}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Remarks */}
      <div className="border border-gray-400 p-4 rounded mb-6">
        <h3 className="font-bold text-center mb-3 border-b pb-2">TEACHER'S REMARKS</h3>
        <p className="text-sm text-gray-700 italic">"{data.behavior.teacherRemarks}"</p>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-3 gap-4 mt-8 pt-4">
        <div className="text-center">
          <div className="border-b border-gray-400 mb-1 h-12"></div>
          <p className="text-xs">Class Teacher</p>
          <p className="text-sm font-medium">{data.signature.classTeacher}</p>
        </div>
        <div className="text-center">
          <div className="border-b border-gray-400 mb-1 h-12"></div>
          <p className="text-xs">Principal</p>
          <p className="text-sm font-medium">{data.signature.principal}</p>
        </div>
        <div className="text-center">
          <div className="border-b border-gray-400 mb-1 h-12"></div>
          <p className="text-xs">Date</p>
          <p className="text-sm font-medium">{data.signature.date}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-8 pt-4 border-t text-xs text-gray-500">
        <p>This is a computer-generated report card. Signature does not require authentication.</p>
        <p>Generated on {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );

  // Printable view (full page)
  if (showPrintView || printable) {
    return (
      <div className="min-h-screen bg-gray-100 print:bg-white">
        <PrintView />
      </div>
    );
  }

  // Card view
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Report Card - {data.student.term}
            </CardTitle>
            <CardDescription>
              {data.student.academicYear} • {data.student.class} {data.student.section}
            </CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Quick Summary */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-500">Aggregate</p>
            <p className="text-2xl font-bold text-blue-600">{data.aggregate.percentage}%</p>
            <Badge className={gradeColorMap[data.aggregate.grade] || "bg-gray-100"}>{data.aggregate.grade}</Badge>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-500">Attendance</p>
            <p className="text-2xl font-bold text-green-600">{data.attendance.percentage}%</p>
            <p className="text-xs text-gray-500">{data.attendance.present}/{data.attendance.totalDays} days</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-500">Subjects</p>
            <p className="text-2xl font-bold text-purple-600">{data.results.length}</p>
            <p className="text-xs text-gray-500">Passed</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-500">Rank</p>
            <p className="text-2xl font-bold text-orange-600">
              {data.aggregate.rank || "-"}
            </p>
            {data.aggregate.rank && <p className="text-xs text-gray-500">in class</p>}
          </div>
        </div>

        {/* Subject Performance */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Award className="w-4 h-4" />
            Subject Performance
          </h3>
          <div className="space-y-2">
            {data.results.slice(0, 5).map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{result.subject}</p>
                  <Progress value={result.percentage} className="h-2 mt-1 w-32" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">{result.marks}/{result.totalMarks}</span>
                  <Badge className={gradeColorMap[result.grade] || "bg-gray-100"}>
                    {result.grade}
                  </Badge>
                </div>
              </div>
            ))}
            {data.results.length > 5 && (
              <p className="text-sm text-gray-500 text-center pt-2">
                +{data.results.length - 5} more subjects
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="flex-1"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </>
            )}
          </Button>
          <Button onClick={handlePrint} variant="outline" className="flex-1">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      </CardContent>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:shadow-none,
          .print\\:shadow-none * {
            visibility: visible;
          }
          .print\\:shadow-none {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            size: A4;
            margin: 10mm;
          }
        }
      `}</style>
    </Card>
  );
}

/**
 * Report Card Generator Component
 * Allows selection of student and term to generate report card
 */
export function ReportCardGenerator() {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [generatedData, setGeneratedData] = useState<ReportCardData | null>(null);

  // Mock data - replace with API calls
  const mockGenerateReportCard = (): ReportCardData => ({
    student: {
      id: "1",
      name: "Tashi Wangchuk",
      rollNumber: "2024001",
      class: "10",
      section: "A",
      academicYear: "2024",
      term: "Mid-Term",
    },
    attendance: {
      totalDays: 120,
      present: 108,
      absent: 12,
      percentage: 90,
    },
    results: [
      { subject: "English", grade: "A", marks: 85, totalMarks: 100, percentage: 85, remarks: "Excellent performance" },
      { subject: "Dzongkha", grade: "B+", marks: 78, totalMarks: 100, percentage: 78, remarks: "Good effort" },
      { subject: "Mathematics", grade: "A+", marks: 92, totalMarks: 100, percentage: 92, remarks: "Outstanding" },
      { subject: "Science", grade: "A", marks: 88, totalMarks: 100, percentage: 88, remarks: "Very good" },
      { subject: "Social Studies", grade: "B+", marks: 75, totalMarks: 100, percentage: 75, remarks: "Satisfactory" },
      { subject: "Information Technology", grade: "A+", marks: 95, totalMarks: 100, percentage: 95, remarks: "Exceptional" },
    ],
    aggregate: {
      totalMarks: 600,
      totalObtained: 513,
      percentage: 85.5,
      grade: "A",
      rank: 3,
    },
    behavior: {
      conduct: "Excellent",
      comments: "Tashi is a diligent student who actively participates in class activities. Shows leadership qualities.",
      teacherRemarks: "Keep up the excellent work! Continue to maintain your academic performance.",
    },
    extracurricular: {
      activities: ["Basketball", "Debate Club", "School Magazine"],
      achievements: ["Best Debater - Inter School Competition 2024", "Sports Captain"],
    },
    school: {
      name: "Pelkhil Higher Secondary School",
      address: "Thimphu, Bhutan",
      phone: "+975-2-322519",
    },
    signature: {
      classTeacher: "Ms. Karma Choden",
      principal: "Principal",
      date: new Date().toLocaleDateString(),
    },
  });

  const handleGenerate = () => {
    const data = mockGenerateReportCard();
    setGeneratedData(data);
  };

  if (generatedData) {
    return (
      <div>
        <Button variant="outline" onClick={() => setGeneratedData(null)} className="mb-4">
          ← Generate Another Report
        </Button>
        <ReportCard data={generatedData} onClose={() => setGeneratedData(null)} />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Generate Report Card
        </CardTitle>
        <CardDescription>
          Select student and term to generate PDF report card
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Class</label>
            <select
              className="w-full p-2 border rounded-md"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">Select Class</option>
              <option value="10">Class 10</option>
              <option value="11">Class 11</option>
              <option value="12">Class 12</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Student</label>
            <select
              className="w-full p-2 border rounded-md"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              disabled={!selectedClass}
            >
              <option value="">Select Student</option>
              <option value="1">Tashi Wangchuk</option>
              <option value="2">Karma Wangmo</option>
              <option value="3">Dorji Penjore</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Term</label>
            <select
              className="w-full p-2 border rounded-md"
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
            >
              <option value="">Select Term</option>
              <option value="mid-term">Mid-Term</option>
              <option value="annual">Annual</option>
            </select>
          </div>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={!selectedClass || !selectedStudent || !selectedTerm}
          className="w-full"
        >
          <FileText className="w-4 h-4 mr-2" />
          Generate Report Card
        </Button>
      </CardContent>
    </Card>
  );
}
