/**
 * REPORT CARDS PAGE (Parent)
 * View and download child's report cards
 */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Loader2, AlertCircle, CheckCircle } from "lucide-react";

interface Child {
  id: string;
  name: string;
  grade: string;
  section?: string;
  schoolName: string;
}

interface ReportCard {
  id: string;
  studentName: string;
  rollNumber?: string;
  grade: string;
  term: string;
  academicYear: string;
  overallPercentage: number;
  overallGrade: string;
  classRank?: number;
  totalStudents?: number;
  totalMarks: number;
  maxTotalMarks: number;
  attendancePercentage: number;
  subjects: Array<{
    subjectName: string;
    marksObtained: number;
    maxMarks: number;
    grade: string;
  }>;
  generatedAt: string;
}

export default function ParentReportCardsPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      fetchReportCards();
    }
  }, [selectedChild]);

  const fetchChildren = async () => {
    try {
      const res = await fetch("/api/parent/children");
      const data = await res.json();
      if (data.success) {
        setChildren(data.data || []);
        if (data.data?.length > 0) {
          setSelectedChild(data.data[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch children:", error);
    }
  };

  const fetchReportCards = async () => {
    if (!selectedChild) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/parent/report-cards?studentId=${selectedChild}`);
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

  const handleDownload = async (reportCardId: string) => {
    setDownloading(reportCardId);
    setMessage(null);

    try {
      const res = await fetch("/api/parent/report-cards/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportCardId }),
      });

      const data = await res.json();

      if (data.success && data.data.pdf) {
        const link = document.createElement("a");
        link.href = data.data.pdf;
        link.download = data.data.filename || "ReportCard.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setMessage({ type: "success", text: "Report card downloaded!" });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to download" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to download report card" });
    } finally {
      setDownloading(null);
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith("A")) return "bg-green-100 text-green-800";
    if (grade.startsWith("B")) return "bg-blue-100 text-blue-800";
    if (grade.startsWith("C")) return "bg-yellow-100 text-yellow-800";
    if (grade === "F") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  const selectedChildData = children.find(c => c.id === selectedChild);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Report Cards</h1>
        <p className="text-gray-500">View and download your child's report cards</p>
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

      {/* Child Selector */}
      {children.length > 1 && (
        <Card>
          <CardContent className="pt-6">
            <label className="block text-sm font-medium mb-2">Select Child</label>
            <div className="flex gap-2 flex-wrap">
              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChild(child.id)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    selectedChild === child.id
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {child.name} (Class {child.grade})
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedChildData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            <span className="font-medium">{selectedChildData.name}</span>
            {" "}- Class {selectedChildData.grade}{selectedChildData.section ? `-${selectedChildData.section}` : ""}
            {selectedChildData.schoolName && ` • ${selectedChildData.schoolName}`}
          </p>
        </div>
      )}

      {/* Report Cards List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : reportCards.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No report cards available yet.</p>
            <p className="text-sm text-gray-400 mt-1">Report cards will appear here once generated by the school.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reportCards.map((card) => (
            <Card key={card.id}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>{card.term} - {card.academicYear}</CardTitle>
                    <CardDescription>
                      Generated on {new Date(card.generatedAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge className={getGradeColor(card.overallGrade)}>
                    Grade: {card.overallGrade}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Summary Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{card.overallPercentage}%</p>
                    <p className="text-xs text-gray-500">Overall</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">
                      {card.totalMarks}/{card.maxTotalMarks}
                    </p>
                    <p className="text-xs text-gray-500">Total Marks</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{card.attendancePercentage}%</p>
                    <p className="text-xs text-gray-500">Attendance</p>
                  </div>
                  {card.classRank && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">
                        {card.classRank}<span className="text-sm">/{card.totalStudents}</span>
                      </p>
                      <p className="text-xs text-gray-500">Class Rank</p>
                    </div>
                  )}
                </div>

                {/* Subject Breakdown */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-3">Subject Performance</h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {card.subjects.map((subject, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">{subject.subjectName}</span>
                        <span className="text-sm font-medium">
                          {subject.marksObtained}/{subject.maxMarks}
                          <Badge variant="outline" className="ml-2 text-xs">
                            {subject.grade}
                          </Badge>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Download Button */}
                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={() => handleDownload(card.id)}
                    disabled={downloading === card.id}
                  >
                    {downloading === card.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
