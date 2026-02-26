"use client";

import { logger } from "@/lib/logger";
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


import { useState } from "react";
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
} from "lucide-react";
import Link from "next/link";

// Report template data
const reportTemplates = [
  {
    id: "RPT001",
    name: "Student Progress Report",
    description: "Comprehensive report on student academic progress, assessments, and career planning",
    category: "Student",
    icon: Users,
    color: "bg-blue-100 text-blue-600",
    lastGenerated: "2024-02-10",
    generates: 45,
  },
  {
    id: "RPT002",
    name: "Assessment Analytics",
    description: "Analysis of all assessment results with trends and insights",
    category: "Analytics",
    icon: BarChart3,
    color: "bg-purple-100 text-purple-600",
    lastGenerated: "2024-02-08",
    generates: 28,
  },
  {
    id: "RPT003",
    name: "Career Planning Summary",
    description: "Summary of all student career plans and completion status",
    category: "Career",
    icon: Target,
    color: "bg-green-100 text-green-600",
    lastGenerated: "2024-02-09",
    generates: 32,
  },
  {
    id: "RPT004",
    name: "Session History Report",
    description: "Detailed log of all counseling sessions conducted",
    category: "Sessions",
    icon: Calendar,
    color: "bg-orange-100 text-orange-600",
    lastGenerated: "2024-02-10",
    generates: 67,
  },
  {
    id: "RPT005",
    name: "RIASEC Analysis Report",
    description: "In-depth analysis of RIASEC Holland Code results across students",
    category: "Assessment",
    icon: TrendingUp,
    color: "bg-pink-100 text-pink-600",
    lastGenerated: "2024-02-05",
    generates: 18,
  },
  {
    id: "RPT006",
    name: "At-Risk Students Report",
    description: "List of students requiring attention based on various indicators",
    category: "Student",
    icon: AlertCircle,
    color: "bg-red-100 text-red-600",
    lastGenerated: "2024-02-07",
    generates: 12,
  },
  {
    id: "RPT007",
    name: "Monthly Activity Report",
    description: "Summary of counseling activities and outcomes for the month",
    category: "Activity",
    icon: FileText,
    color: "bg-gray-100 text-gray-600",
    lastGenerated: "2024-02-01",
    generates: 8,
  },
  {
    id: "RPT008",
    name: "School Performance Summary",
    description: "Aggregated performance metrics across all assigned schools",
    category: "Analytics",
    icon: Sparkles,
    color: "bg-cyan-100 text-cyan-600",
    lastGenerated: "2024-02-08",
    generates: 15,
  },
];

// Recent generated reports
const recentReports = [
  {
    id: "GEN001",
    templateId: "RPT001",
    templateName: "Student Progress Report",
    generatedBy: "Dr. Karma Wangchuk",
    generatedAt: "2024-02-10T10:30:00",
    format: "PDF",
    status: "completed",
    fileSize: "2.4 MB",
  },
  {
    id: "GEN002",
    templateId: "RPT002",
    templateName: "Assessment Analytics",
    generatedBy: "Dr. Karma Wangchuk",
    generatedAt: "2024-02-08T14:15:00",
    format: "Excel",
    status: "completed",
    fileSize: "1.8 MB",
  },
  {
    id: "GEN003",
    templateId: "RPT003",
    templateName: "Career Planning Summary",
    generatedBy: "Dr. Karma Wangchuk",
    generatedAt: "2024-02-09T09:00:00",
    format: "PDF",
    status: "completed",
    fileSize: "3.1 MB",
  },
  {
    id: "GEN004",
    templateId: "RPT004",
    templateName: "Session History Report",
    generatedBy: "Dr. Karma Wangchuk",
    generatedAt: "2024-02-07T16:45:00",
    format: "CSV",
    status: "completed",
    fileSize: "856 KB",
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
  lastGenerated: string;
  generates: number;
};

export default function CounselorReportsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [selectedFormat, setSelectedFormat] = useState("pdf");
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  // Filter templates
  const filteredTemplates = reportTemplates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === "All" || template.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleGenerateReport = () => {
    // In production, this would call an API to generate the report
    logger.debug("Generating report:", selectedTemplate, selectedFormat, dateRange);
    setShowGenerateModal(false);
    setSelectedTemplate(null);
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

  // Stats
  const totalReports = recentReports.length;
  const totalGenerated = reportTemplates.reduce((sum, t) => sum + t.generates, 0);
  const categories = new Set(reportTemplates.map((t) => t.category)).size;

  return (
    <div className="space-y-6">
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

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgb(168 85 247 / 0.2), rgb(147 51 234 / 0.2))' }}>
                <FileText className="w-6 h-6" style={{ color: 'rgb(147 51 234)' }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{reportTemplates.length}</p>
                <p className="text-sm text-gray-500">Report Types</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Download className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalGenerated}</p>
                <p className="text-sm text-gray-500">Total Generated</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{categories}</p>
                <p className="text-sm text-gray-500">Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalReports}</p>
                <p className="text-sm text-gray-500">Recent Reports</p>
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
                      <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{template.generates} generated</span>
                        <span>Last: {new Date(template.lastGenerated).toLocaleDateString()}</span>
                      </div>
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
                        <Button variant="ghost" size="icon" className="h-6 w-6" className="h-6 w-6">
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" className="h-6 w-6">
                          <Download className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" className="h-6 w-6">
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
                disabled={!selectedTemplate}
              >
                <Download className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </div>
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
