"use client";

import { logger } from "@/lib/logger";
/**
 * PLATFORM ADMIN - REPORTS
 *
 * Platform-wide reports and exports dashboard.
 * Generate and download various reports for schools, users, and analytics.
 */


import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Users,
  School,
  GraduationCap,
  TrendingUp,
  Calendar,
  BarChart3,
  Settings,
  Clock,
  CheckCircle,
  Loader2,
  FileDown,
} from "lucide-react";
import jsPDF from "jspdf";

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: string;
  schedule?: string;
  available: boolean;
}

interface ReportData {
  stats?: {
    totalSchools: number;
    totalStudents: number;
    totalTeachers: number;
    totalCounselors: number;
    recentSubmissions: number;
  };
  reportTemplates: ReportTemplate[];
  recentReports: Array<{
    id: string;
    name: string;
    generatedAt: string;
    status: string;
  }>;
}

const categories = ["All", "Schools", "Users", "Assessments", "Analytics", "Finance"];

// Icon mapping for report types
const iconMap: Record<string, any> = {
  "school-performance": School,
  "user-engagement": Users,
  "assessment-summary": GraduationCap,
  "career-interests": TrendingUp,
  "revenue-report": BarChart3,
  "platform-usage": FileText,
};

interface GeneratedReport {
  id: string;
  name: string;
  generatedAt: string;
  status: string;
  data?: any;
}

export default function AdminReportsPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);

  // Fetch report data on mount
  useEffect(() => {
    fetchReportsData();
  }, []);

  const fetchReportsData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/reports");
      if (response.ok) {
        const result = await response.json();
        setReportData(result.data);
      }
    } catch (error) {
      logger.error("Failed to fetch reports data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reportData && selectedCategory === "All"
    ? reportData.reportTemplates
    : reportData?.reportTemplates.filter((r) => r.category === selectedCategory);

  const handleGenerateReport = async (reportId: string, format: "json" | "pdf" = "pdf") => {
    setGenerating(reportId);
    try {
      const response = await fetch("/api/admin/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportType: reportId, format }),
      });

      if (response.ok) {
        const result = await response.json();
        const report = result.data;

        // Add to generated reports
        const newReport: GeneratedReport = {
          id: `report_${Date.now()}`,
          name: report.title,
          generatedAt: report.generatedAt,
          status: "completed",
          data: report,
        };

        setGeneratedReports((prev) => [newReport, ...prev].slice(0, 10));

        // Download as PDF or JSON
        if (format === "pdf") {
          generatePDF(report);
        } else {
          downloadJSON(report);
        }

        alert(`Report generated successfully as ${format.toUpperCase()}!`);
      } else {
        const error = await response.json();
        alert(`Failed to generate report: ${error.error}`);
      }
    } catch (error) {
      logger.error("Failed to generate report:", error);
      alert("Failed to generate report. Please try again.");
    } finally {
      setGenerating(null);
    }
  };

  const downloadJSON = (report: any) => {
    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${report.type}-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generatePDF = (report: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Helper function to check if we need a new page
    const checkPageBreak = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }
    };

    // Header
    doc.setFillColor(236, 72, 153);
    doc.rect(0, 0, pageWidth, 15, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Bhutan EduSkill - Platform Report", pageWidth / 2, 10, { align: "center" });

    yPosition = 30;
    doc.setTextColor(0, 0, 0);

    // Report Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(report.title, 20, yPosition);
    yPosition += 10;

    // Metadata
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date(report.generatedAt).toLocaleString()}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Report Type: ${report.type}`, 20, yPosition);
    yPosition += 15;

    // Summary Section
    if (report.summary) {
      checkPageBreak(40);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Summary", 20, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      Object.entries(report.summary).forEach(([key, value]) => {
        checkPageBreak(7);
        const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
        doc.text(`${label}: ${String(value)}`, 25, yPosition);
        yPosition += 7;
      });
      yPosition += 10;
    }

    // Data sections based on report type
    if (report.type === "school-performance" && report.schools) {
      checkPageBreak(30);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("School Details", 20, yPosition);
      yPosition += 10;

      // Table header
      doc.setFillColor(240, 240, 240);
      doc.rect(15, yPosition - 5, pageWidth - 30, 8, "F");
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("School Name", 20, yPosition);
      doc.text("Students", 100, yPosition);
      doc.text("Teachers", 130, yPosition);
      doc.text("Type", 160, yPosition);
      yPosition += 10;

      // Table rows
      doc.setFont("helvetica", "normal");
      report.schools.forEach((school: any, index: number) => {
        checkPageBreak(8);
        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(15, yPosition - 5, pageWidth - 30, 8, "F");
        }
        const name = school.name?.substring(0, 30) || "N/A";
        doc.text(name, 20, yPosition);
        doc.text(String(school.students || 0), 100, yPosition);
        doc.text(String(school.teachers || 0), 130, yPosition);
        doc.text(school.schoolType || "N/A", 160, yPosition);
        yPosition += 8;
      });
    }

    if (report.type === "user-engagement" && report.usersByType) {
      checkPageBreak(30);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("User Distribution", 20, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      Object.entries(report.usersByType).forEach(([key, value]) => {
        checkPageBreak(7);
        const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
        doc.text(`${label}: ${String(value)}`, 25, yPosition);
        yPosition += 7;
      });
    }

    if (report.type === "career-interests" && report.topCareers) {
      checkPageBreak(30);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Top Career Choices", 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      report.topCareers.forEach((career: any, index: number) => {
        checkPageBreak(7);
        doc.text(`${index + 1}. ${career.career}`, 25, yPosition);
        doc.text(`(${career.count} students)`, 160, yPosition);
        yPosition += 7;
      });
    }

    // Footer
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Page ${i} of ${totalPages} | Bhutan EduSkill Platform`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );
    }

    // Save the PDF
    const fileName = `${report.type}-${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(fileName);
  };

  const handleDownloadReport = (report: GeneratedReport, format: "json" | "pdf" = "pdf") => {
    setDownloading(report.id);
    try {
      if (report.data) {
        if (format === "pdf") {
          generatePDF(report.data);
        } else {
          downloadJSON(report.data);
        }
      } else {
        alert("Report data not available. Please generate the report again.");
      }
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
        <p className="ml-3 text-gray-600">Loading reports...</p>
      </div>
    );
  }

  const displayReports = generatedReports.length > 0 ? generatedReports : (reportData?.recentReports || []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Reports
          </h1>
          <p className="text-gray-600">
            Generate and download platform-wide reports
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => fetchReportsData()}>
            <Settings className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {reportData?.stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-gray-500">Total Schools</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{reportData.stats.totalSchools}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-gray-500">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{reportData.stats.totalStudents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-gray-500">Total Teachers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{reportData.stats.totalTeachers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-gray-500">Counselors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{reportData.stats.totalCounselors}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-gray-500">Assessments (30d)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{reportData.stats.recentSubmissions}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            onClick={() => setSelectedCategory(category)}
            style={
              selectedCategory === category
                ? { background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)", border: "none" }
                : {}
            }
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Report Templates Grid */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Reports</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports?.map((report) => {
            const Icon = iconMap[report.id] || FileText;
            return (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="p-3 rounded-lg bg-pink-50">
                      <Icon className="w-6 h-6 text-pink-600" />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {report.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg mt-3">{report.name}</CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Schedule:</span>
                    <Badge variant="secondary" className="capitalize">
                      {report.schedule}
                    </Badge>
                  </div>
                  <Button
                    className="w-full"
                    style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
                    onClick={() => handleGenerateReport(report.id)}
                    disabled={generating === report.id}
                  >
                    {generating === report.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Generate Report
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recently Generated Reports */}
      {displayReports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recently Generated Reports
            </CardTitle>
            <CardDescription>View and download previously generated reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {displayReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded bg-green-100">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{report.name}</p>
                      <p className="text-sm text-gray-500">Generated on {report.generatedAt?.split('T')[0] || report.generatedAt}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadReport(report, "pdf")}
                      disabled={downloading === report.id}
                    >
                      <FileDown className="w-4 h-4 mr-2" />
                      PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadReport(report, "json")}
                      disabled={downloading === report.id}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      JSON
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Calendar className="w-5 h-5" />
            Scheduled Reports
          </CardTitle>
          <CardDescription className="text-blue-700">
            Set up automated report generation and delivery
          </CardDescription>
        </CardHeader>
        <CardContent className="text-blue-800">
          <p>
            Configure automatic report generation and have reports delivered to your email on a daily, weekly, or monthly schedule.
            This feature will be available in the next release.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
