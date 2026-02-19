/**
 * REPORT CARDS PAGE (School Admin)
 * Generate and manage student report cards
 */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileText, Loader2, CheckCircle, AlertCircle, Calendar, User, TrendingUp } from "lucide-react";

interface ReportCard {
  id: string;
  studentName: string;
  studentId: string;
  rollNumber?: string;
  grade: string;
  term: string;
  academicYear: string;
  overallPercentage: number;
  overallGrade: string;
  classRank?: number;
  totalStudents?: number;
  status: string;
  generatedAt: string;
  // Attendance fields
  totalDays?: number;
  presentDays?: number;
  absentDays?: number;
  attendancePercentage?: number;
}

interface ReportCardDetail extends ReportCard {
  subjects?: Array<{
    subjectName: string;
    marksObtained: number;
    maxMarks: number;
    grade: string;
  }>;
  classTeacherRemarks?: string;
  principalRemarks?: string;
}

interface Student {
  id: string;
  name: string;
  rollNumber?: string;
  grade: number;
  section?: string;
}

interface Exam {
  id: string;
  examName: string;
  term: string;
  academicYear: string;
}

export default function ReportCardsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("generate");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedReportCard, setSelectedReportCard] = useState<ReportCardDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Fetch students and exams on load
  useEffect(() => {
    fetchStudents();
    fetchExams();
    fetchReportCards();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await fetch("/api/school-admin/students?limit=100");
      const data = await res.json();
      if (data.success) {
        setStudents(data.data.students || []);
      }
    } catch (error) {
      console.error("Failed to fetch students:", error);
    }
  };

  const fetchExams = async () => {
    try {
      const res = await fetch("/api/school-admin/exams");
      const data = await res.json();
      if (data.success) {
        setExams(data.data.exams || []);
      }
    } catch (error) {
      console.error("Failed to fetch exams:", error);
    }
  };

  const fetchReportCards = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/school-admin/report-cards");
      const data = await res.json();
      if (data.success) {
        setReportCards(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch report cards:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedStudent || !selectedExam) {
      setMessage({ type: "error", text: "Please select a student and exam" });
      return;
    }

    setGenerating(true);
    setMessage(null);

    try {
      const res = await fetch("/api/school-admin/report-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent,
          examId: selectedExam,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: "success", text: "Report card generated successfully!" });
        fetchReportCards();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to generate report card" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to generate report card" });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (reportCardId: string, studentName: string, term: string, year: string) => {
    try {
      const res = await fetch("/api/school-admin/report-cards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportCardId }),
      });

      const data = await res.json();

      if (data.success && data.data.pdf) {
        // Download PDF
        const link = document.createElement("a");
        link.href = data.data.pdf;
        link.download = data.data.filename || `ReportCard_${studentName}_${term}_${year}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setMessage({ type: "success", text: "Report card downloaded!" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to download report card" });
    }
  };

  const handleViewDetails = async (reportCardId: string) => {
    try {
      const res = await fetch(`/api/school-admin/report-cards/${reportCardId}`);
      const data = await res.json();

      if (data.success && data.data) {
        setSelectedReportCard(data.data);
        setShowDetailModal(true);
      } else {
        setMessage({ type: "error", text: "Failed to load report card details" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to load report card details" });
    }
  };

  const handleGenerateBulk = async () => {
    // Generate for all students in selected exam
    if (!selectedExam) {
      setMessage({ type: "error", text: "Please select an exam first" });
      return;
    }

    setGenerating(true);
    setMessage(null);

    try {
      const promises = students.slice(0, 10).map((student) =>
        fetch("/api/school-admin/report-cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: student.id,
            examId: selectedExam,
          }),
        })
      );

      await Promise.all(promises);
      setMessage({ type: "success", text: `Generated report cards for ${Math.min(students.length, 10)} students!` });
      fetchReportCards();
    } catch (error) {
      setMessage({ type: "error", text: "Failed to generate bulk report cards" });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report Cards</h1>
          <p className="text-gray-500">Generate and manage student report cards</p>
        </div>
      </div>

      {message && (
        <div className={`flex items-center gap-2 p-4 rounded-lg ${message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
          {message.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="ml-auto hover:opacity-70"
          >
            ×
          </button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Single Generation Card */}
            <Card>
              <CardHeader>
                <CardTitle>Generate Single Report Card</CardTitle>
                <CardDescription>Select a student and exam to generate</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Student</label>
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select student...</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name} - Class {student.grade}{student.section ? `-${student.section}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Exam</label>
                  <select
                    value={selectedExam}
                    onChange={(e) => setSelectedExam(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select exam...</option>
                    {exams.map((exam) => (
                      <option key={exam.id} value={exam.id}>
                        {exam.examName} - {exam.term} {exam.academicYear}
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={generating || !selectedStudent || !selectedExam}
                  className="w-full"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Generate Report Card
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Bulk Generation Card */}
            <Card>
              <CardHeader>
                <CardTitle>Bulk Generation</CardTitle>
                <CardDescription>Generate for entire class</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Generate report cards for all students in the selected exam.
                  This may take a few moments.
                </p>

                <div>
                  <label className="block text-sm font-medium mb-2">Exam</label>
                  <select
                    value={selectedExam}
                    onChange={(e) => setSelectedExam(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select exam...</option>
                    {exams.map((exam) => (
                      <option key={exam.id} value={exam.id}>
                        {exam.examName} - {exam.term} {exam.academicYear}
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  onClick={handleGenerateBulk}
                  disabled={generating || !selectedExam}
                  variant="outline"
                  className="w-full"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Generate for Class ({students.length} students)
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : reportCards.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                No report cards generated yet. Select a student and exam to generate one.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reportCards.map((card) => (
                <Card key={card.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{card.studentName}</CardTitle>
                        <CardDescription className="text-xs">
                          Class {card.grade} • {card.rollNumber || "No Roll"}
                        </CardDescription>
                      </div>
                      <Badge variant={
                        card.overallGrade.startsWith("A") ? "default" :
                        card.overallGrade.startsWith("B") ? "secondary" :
                        card.overallGrade === "F" ? "destructive" : "outline"
                      }>
                        {card.overallGrade}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Term</span>
                      <span className="font-medium">{card.term}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Year</span>
                      <span className="font-medium">{card.academicYear}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Percentage</span>
                      <span className="font-medium">{card.overallPercentage}%</span>
                    </div>

                    {/* Attendance Summary */}
                    {card.totalDays !== undefined && card.totalDays > 0 && (
                      <div className="pt-2 border-t">
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                          <Calendar className="w-3 h-3" />
                          <span>Attendance</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {card.presentDays}/{card.totalDays}
                          </span>
                          <Badge
                            variant={card.attendancePercentage && card.attendancePercentage >= 75 ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {card.attendancePercentage}%
                          </Badge>
                        </div>
                      </div>
                    )}

                    {card.classRank && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Rank</span>
                        <span className="font-medium">{card.classRank}/{card.totalStudents}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleViewDetails(card.id)}
                        size="sm"
                        variant="outline"
                        className="flex-1"
                      >
                        <User className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        onClick={() => handleDownload(card.id, card.studentName, card.term, card.academicYear)}
                        size="sm"
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Report Card Detail Modal */}
        {showDetailModal && selectedReportCard && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedReportCard.studentName}</CardTitle>
                    <CardDescription>
                      Class {selectedReportCard.grade} • {selectedReportCard.term} • {selectedReportCard.academicYear}
                    </CardDescription>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Academic Performance */}
                <div>
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Academic Performance
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold">{selectedReportCard.overallGrade}</div>
                      <div className="text-xs text-gray-500">Grade</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold">{selectedReportCard.overallPercentage}%</div>
                      <div className="text-xs text-gray-500">Percentage</div>
                    </div>
                    {selectedReportCard.classRank && (
                      <div className="bg-gray-50 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold">
                          {selectedReportCard.classRank}/{selectedReportCard.totalStudents}
                        </div>
                        <div className="text-xs text-gray-500">Class Rank</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Subjects */}
                {selectedReportCard.subjects && selectedReportCard.subjects.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm mb-3">Subject-wise Performance</h3>
                    <div className="space-y-2">
                      {selectedReportCard.subjects.map((subject, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm font-medium">{subject.subjectName}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600">
                              {subject.marksObtained}/{subject.maxMarks}
                            </span>
                            <Badge variant="outline">{subject.grade}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attendance Details */}
                {selectedReportCard.totalDays !== undefined && selectedReportCard.totalDays > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Attendance Record
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-2xl font-bold text-green-700">
                              {selectedReportCard.presentDays}
                            </div>
                            <div className="text-xs text-green-600">Days Present</div>
                          </div>
                          <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          </div>
                        </div>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-2xl font-bold text-red-700">
                              {selectedReportCard.absentDays}
                            </div>
                            <div className="text-xs text-red-600">Days Absent</div>
                          </div>
                          <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Working Days</span>
                        <span className="font-semibold">{selectedReportCard.totalDays}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-gray-600">Attendance Rate</span>
                        <Badge
                          variant={selectedReportCard.attendancePercentage && selectedReportCard.attendancePercentage >= 75 ? "default" : "destructive"}
                        >
                          {selectedReportCard.attendancePercentage}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                {/* Remarks */}
                {(selectedReportCard.classTeacherRemarks || selectedReportCard.principalRemarks) && (
                  <div>
                    <h3 className="font-semibold text-sm mb-3">Remarks</h3>
                    {selectedReportCard.classTeacherRemarks && (
                      <div className="p-3 bg-blue-50 rounded-lg mb-2">
                        <div className="text-xs text-blue-600 font-medium mb-1">Class Teacher</div>
                        <p className="text-sm text-gray-700">{selectedReportCard.classTeacherRemarks}</p>
                      </div>
                    )}
                    {selectedReportCard.principalRemarks && (
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="text-xs text-purple-600 font-medium mb-1">Principal</div>
                        <p className="text-sm text-gray-700">{selectedReportCard.principalRemarks}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleDownload(selectedReportCard.id, selectedReportCard.studentName, selectedReportCard.term, selectedReportCard.academicYear)}
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowDetailModal(false)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </Tabs>
    </div>
  );
}
