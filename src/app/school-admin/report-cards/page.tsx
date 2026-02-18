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
import { Download, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";

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
                    {card.classRank && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Rank</span>
                        <span className="font-medium">{card.classRank}/{card.totalStudents}</span>
                      </div>
                    )}
                    <Button
                      onClick={() => handleDownload(card.id, card.studentName, card.term, card.academicYear)}
                      size="sm"
                      className="w-full"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
