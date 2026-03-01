"use client";

/**
 * COUNSELOR - REPORT GENERATION
 *
 * Features:
 * - Generate various counselor reports
 * - Student progress reports
 * - Assessment analytics reports
 * - Career planning summaries
 * - Session history reports
 * - Export in multiple formats (PDF, Excel, CSV)
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  TrendingUp,
  Users,
  Target,
  Calendar,
  BarChart3,
  Filter,
  Search,
  Eye,
  Plus,
  FileSpreadsheet,
  FileJson,
  Printer,
  Mail,
  Sparkles,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";

// ============================================================================
// REPORT TEMPLATES (Dynamic configuration)
// ============================================================================

const reportTemplates = [
  {
    id: "RPT001",
    name: "Student Progress Report",
    description: "Comprehensive report on student academic progress, assessments, and career planning",
    category: "Student",
    icon: Users,
    color: "bg-blue-100 text-blue-600",
  },
  {
    id: "RPT002",
    name: "Assessment Analytics",
    description: "Analysis of all assessment results with trends and insights",
    category: "Analytics",
    icon: BarChart3,
    color: "bg-purple-100 text-purple-600",
  },
  {
    id: "RPT003",
    name: "Career Planning Summary",
    description: "Summary of all student career plans and completion status",
    category: "Career",
    icon: Target,
    color: "bg-green-100 text-green-600",
  },
  {
    id: "RPT004",
    name: "Session History Report",
    description: "Detailed log of all counseling sessions conducted",
    category: "Sessions",
    icon: Calendar,
    color: "bg-orange-100 text-orange-600",
  },
  {
    id: "RPT005",
    name: "RIASEC Analysis Report",
    description: "In-depth analysis of RIASEC Holland Code results across students",
    category: "Assessment",
    icon: TrendingUp,
    color: "bg-pink-100 text-pink-600",
  },
  {
    id: "RPT006",
    name: "At-Risk Students Report",
    description: "List of students requiring attention based on various indicators",
    category: "Student",
    icon: AlertCircle,
    color: "bg-red-100 text-red-600",
  },
  {
    id: "RPT007",
    name: "Monthly Activity Report",
    description: "Summary of counseling activities and outcomes for the month",
    category: "Activity",
    icon: FileText,
    color: "bg-gray-100 text-gray-600",
  },
  {
    id: "RPT008",
    name: "School Performance Summary",
    description: "Aggregated performance metrics across all assigned schools",
    category: "Analytics",
    icon: Sparkles,
    color: "bg-cyan-100 text-cyan-600",
  },
];

const exportFormats = [
  { id: "pdf", name: "PDF", description: "Best for printing and sharing", icon: FileText },
  { id: "excel", name: "Excel", description: "For data analysis", icon: FileSpreadsheet },
  { id: "csv", name: "CSV", description: "Raw data export", icon: FileJson },
];

const categoryOptions = ["All", "Student", "Analytics", "Career", "Sessions", "Assessment", "Activity"];

type ReportTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
};

interface StudentsData {
  total: number;
  atRisk: number;
  onTrack: number;
  students: Array<{
    id: string;
    name: string;
    riskLevel: string;
  }>;
  stats?: {
    totalStudents: number;
    studentsCompletedAssessments: number;
    studentsWithCareerPlans: number;
    studentsNeedingAttention: number;
  };
}

interface SessionsData {
  total: number;
  thisMonth: number;
  avgDuration: number;
  sessions: Array<{
    id: string;
    studentName: string;
    date: string;
    type: string;
  }>;
}

interface RecentReport {
  id: string;
  name?: string;
  type?: string;
  generatedAt: string;
  format: string;
  templateId?: string;
  templateName?: string;
  generatedBy?: string;
  status?: string;
  fileSize?: string;
  url?: string;
  data?: Record<string, unknown>;
}

export default function CounselorReportsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [selectedFormat, setSelectedFormat] = useState("pdf");
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  // Real data state
  const [studentsData, setStudentsData] = useState<StudentsData | null>(null);
  const [sessionsData, setSessionsData] = useState<SessionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);

  // Report generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingToOffice, setIsSendingToOffice] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<RecentReport | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);

  // Fetch real data on mount
  useEffect(() => {
    fetchCounselorData();
  }, []);

  async function fetchCounselorData() {
    try {
      setLoading(true);

      // Fetch students data from counselor API
      const studentsRes = await fetch("/api/counselor/students");
      const studentsJson = await studentsRes.json();

      // Fetch sessions data from counselor sessions API
      const sessionsRes = await fetch("/api/counselor/sessions");
      const sessionsJson = await sessionsRes.json();

      if (studentsJson.success) {
        setStudentsData(studentsJson.data);

        // Generate mock recent reports based on real students data
        const mockRecentReports: RecentReport[] = [
          {
            id: `GEN-${Date.now()}-1`,
            templateId: "RPT001",
            templateName: "Student Progress Report",
            generatedBy: "Current Counselor",
            generatedAt: new Date().toISOString(),
            format: "PDF",
            status: "completed",
            fileSize: "~2.4 MB",
          },
          {
            id: `GEN-${Date.now()}-2`,
            templateId: "RPT003",
            templateName: "Career Planning Summary",
            generatedBy: "Current Counselor",
            generatedAt: new Date(Date.now() - 86400000).toISOString(),
            format: "PDF",
            status: "completed",
            fileSize: "~3.1 MB",
          },
          {
            id: `GEN-${Date.now()}-3`,
            templateId: "RPT004",
            templateName: "Session History Report",
            generatedBy: "Current Counselor",
            generatedAt: new Date(Date.now() - 172800000).toISOString(),
            format: "CSV",
            status: "completed",
            fileSize: "~856 KB",
          },
        ];

        setRecentReports(mockRecentReports);
      }

      if (sessionsJson.success || sessionsJson.data) {
        setSessionsData(sessionsJson.data || sessionsJson);
      }
    } catch (error) {
      console.error("Failed to fetch counselor data:", error);
    } finally {
      setLoading(false);
    }
  }

  // Filter templates
  const filteredTemplates = reportTemplates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === "All" || template.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleGenerateReport = async () => {
    if (!selectedTemplate) return;

    try {
      setIsGenerating(true);

      // Call the actual report generation API
      const response = await fetch("/api/counselor/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          format: selectedFormat,
          dateRange: dateRange.from && dateRange.to ? dateRange : undefined
        })
      });

      const result = await response.json();

      if (result.success) {
        const newReport: RecentReport = {
          id: result.data.reportId,
          templateId: result.data.templateId,
          templateName: result.data.templateName,
          generatedBy: result.data.generatedBy,
          generatedAt: result.data.generatedAt,
          format: result.data.format,
          status: result.data.status,
          fileSize: result.data.fileSize,
          data: result.data.data
        };

        setRecentReports([newReport, ...recentReports.slice(0, 9)]);
        setGeneratedReport(newReport);

        // Close modal and show send option
        setShowGenerateModal(false);
        setShowSendModal(true);
        setSelectedTemplate(null);
      } else {
        console.error("Failed to generate report:", result.error);
      }
    } catch (error) {
      console.error("Failed to generate report:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendToOffice = async (recipientType: "school-admin" | "ministry" | "admin") => {
    if (!generatedReport) return;

    try {
      setIsSendingToOffice(true);

      const response = await fetch("/api/counselor/reports/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: generatedReport.id,
          templateId: generatedReport.templateId,
          templateName: generatedReport.templateName,
          format: generatedReport.format,
          recipientType,
          message: `Please find attached the ${generatedReport.templateName}.`
        })
      });

      const result = await response.json();

      if (result.success) {
        setSendSuccess(`Report sent to ${result.data.recipients.length} recipient(s)`);
        setTimeout(() => {
          setShowSendModal(false);
          setSendSuccess(null);
          setGeneratedReport(null);
        }, 2000);
      }
    } catch (error) {
      console.error("Failed to send report:", error);
    } finally {
      setIsSendingToOffice(false);
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case "PDF":
        return <FileText className="w-4 h-4 text-red-500" />;
      case "Excel":
        return <FileSpreadsheet className="w-4 h-4 text-green-500" />;
      case "CSV":
        return <FileJson className="w-4 h-4 text-blue-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  // Stats - use real data
  const totalReports = recentReports.length;
  const totalGenerated = studentsData?.stats?.totalStudents || 0;
  const categories = new Set(reportTemplates.map((t) => t.category)).size;

  // Calculate real stats from counselor data
  const studentsCompletedAssessments = studentsData?.stats?.studentsCompletedAssessments || 0;
  const studentsWithCareerPlans = studentsData?.stats?.studentsWithCareerPlans || 0;
  const studentsNeedingAttention = studentsData?.stats?.studentsNeedingAttention || 0;

  // Count total students from API
  const totalStudents = studentsData?.students?.length || 0;

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports Center</h1>
          <p className="text-gray-600 mt-1">
            Generate and manage counseling reports
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Printer className="w-4 h-4" />
            Print
          </Button>
          <Button className="gap-2" style={{ background: 'linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))' }} onClick={() => setShowGenerateModal(true)}>
            <Plus className="w-4 h-4" />
            New Report
          </Button>
        </div>
      </div>

      {/* Stats Cards - Using real counselor data */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgb(168 85 247 / 0.2), rgb(147 51 234 / 0.2))' }}>
                <FileText className="w-6 h-6" style={{ color: 'rgb(147 51 234)' }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
                <p className="text-sm text-gray-500">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{studentsCompletedAssessments}</p>
                <p className="text-sm text-gray-500">Assessments Done</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{studentsWithCareerPlans}</p>
                <p className="text-sm text-gray-500">Career Plans</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{studentsNeedingAttention}</p>
                <p className="text-sm text-gray-500">Need Attention</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Report Templates */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search reports..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category === "All" ? "All Categories" : category}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Report Templates Grid */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Templates</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {filteredTemplates.map((template) => {
                const Icon = template.icon;
                return (
                  <Card
                    key={template.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedTemplate(template);
                      setShowGenerateModal(true);
                    }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${template.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <CardDescription className="text-xs">{template.category}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">{template.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Reports */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Reports</CardTitle>
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </div>
              <CardDescription>Recently generated reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentReports.map((report) => (
                  <div key={report.id} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{report.templateName}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(report.generatedAt).toLocaleString()}
                        </p>
                      </div>
                      {getFormatIcon(report.format)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{report.fileSize}</span>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6" title="View">
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" title="Download">
                          <Download className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          title="Send to Office"
                          onClick={() => {
                            setGeneratedReport(report);
                            setShowSendModal(true);
                          }}
                        >
                          <Mail className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <Link href="/counselor/data-export">
                  <Download className="w-4 h-4" />
                  Export All Data
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Mail className="w-4 h-4" />
                Email Reports
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Sparkles className="w-4 h-4" />
                Schedule Reports
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Filter className="w-4 h-4" />
                  Customize Templates
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Generate Report Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Generate Report</CardTitle>
                  <CardDescription>Configure and generate your report</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => {
                  setShowGenerateModal(false);
                  setSelectedTemplate(null);
                }}>
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Report Template */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report Type *</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={selectedTemplate?.id || ""}
                  onChange={(e) => {
                    const template = reportTemplates.find((t) => t.id === e.target.value);
                    setSelectedTemplate(template);
                  }}
                >
                  <option value="">Select report type</option>
                  {reportTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                {selectedTemplate && (
                  <p className="text-xs text-gray-500 mt-1">{selectedTemplate.description}</p>
                )}
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                  />
                  <span className="text-gray-500">to</span>
                  <Input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                  />
                </div>
              </div>

              {/* Export Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
                <div className="grid grid-cols-3 gap-2">
                  {exportFormats.map((format) => {
                    const Icon = format.icon;
                    const isSelected = selectedFormat === format.id;
                    return (
                      <button
                        key={format.id}
                        onClick={() => setSelectedFormat(format.id)}
                        className={`p-3 border rounded-lg text-center transition-all ${
                          isSelected
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <Icon className={`w-6 h-6 mx-auto mb-1 ${isSelected ? "text-purple-600" : "text-gray-400"}`} />
                        <p className="text-xs font-medium">{format.name}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" defaultChecked />
                  <span>Include charts and graphs</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                  <span>Include detailed notes</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" defaultChecked />
                  <span>Email me when ready</span>
                </label>
              </div>
            </CardContent>
            <div className="border-t px-6 py-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => {
                setShowGenerateModal(false);
                setSelectedTemplate(null);
              }}>
                Cancel
              </Button>
              <Button
                style={{ background: 'linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))' }}
                onClick={handleGenerateReport}
                disabled={!selectedTemplate || isGenerating}
              >
                {isGenerating ? (
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
            </div>
          </Card>
        </div>
      )}

      {/* Send to Office Modal */}
      {showSendModal && generatedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Send Report to Office</CardTitle>
                  <CardDescription>Choose where to send this report</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => {
                  setShowSendModal(false);
                  setGeneratedReport(null);
                }}>
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Report Info */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">{generatedReport.templateName}</p>
                <p className="text-xs text-gray-500">
                  {generatedReport.format} • {generatedReport.fileSize}
                </p>
              </div>

              {sendSuccess ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-green-700 font-medium">{sendSuccess}</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Send To:</label>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => handleSendToOffice("school-admin")}
                        disabled={isSendingToOffice}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        School Administration
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => handleSendToOffice("ministry")}
                        disabled={isSendingToOffice}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Ministry Office
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => handleSendToOffice("admin")}
                        disabled={isSendingToOffice}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Platform Admin
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Mail className="w-3 h-3" />
                    <span>Recipients will be notified via the platform notification system</span>
                  </div>
                </>
              )}
            </CardContent>
            {isSendingToOffice && (
              <div className="border-t px-6 py-4 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

function XCircle({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  );
}
