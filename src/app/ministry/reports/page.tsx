"use client";

import { useState } from "react";
import {
  FileText,
  Download,
  Calendar,
  Filter,
  Search,
  BarChart3,
  Users,
  Building,
  GraduationCap,
  TrendingUp,
  Loader2,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  lastGenerated: string;
  format: "PDF" | "Excel" | "CSV";
  icon: any;
}

interface GeneratedReport {
  id: string;
  name: string;
  generatedAt: string;
  generatedBy: string;
  format: string;
  size: string;
  status: "completed" | "processing" | "failed";
}

export default function MinistryReportsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isGenerating, setIsGenerating] = useState(false);

  const colors = {
    primary: "rgb(168 85 247)",
    gradient: "linear-gradient(135deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)",
  };

  const reportTemplates: ReportTemplate[] = [
    {
      id: "national-gnh",
      name: "National GNH Report",
      description: "Comprehensive Gross National Happiness metrics across all dzongkhags",
      category: "Wellbeing",
      lastGenerated: "2026-02-21",
      format: "PDF",
      icon: BarChart3,
    },
    {
      id: "workforce-alignment",
      name: "Workforce Alignment Analysis",
      description: "Student career interests vs national HRD requirements",
      category: "Strategic",
      lastGenerated: "2026-02-20",
      format: "PDF",
      icon: TrendingUp,
    },
    {
      id: "school-performance",
      name: "School Performance Summary",
      description: "Academic performance rankings by dzongkhag",
      category: "Academic",
      lastGenerated: "2026-02-21",
      format: "Excel",
      icon: GraduationCap,
    },
    {
      id: "teacher-distribution",
      name: "Teacher Resource Distribution",
      description: "Teacher-student ratios and subject gaps analysis",
      category: "Resources",
      lastGenerated: "2026-02-19",
      format: "PDF",
      icon: Users,
    },
    {
      id: "infrastructure-audit",
      name: "Infrastructure Audit",
      description: "School facilities and digital infrastructure status",
      category: "Resources",
      lastGenerated: "2026-02-15",
      format: "PDF",
      icon: Building,
    },
    {
      id: "emis-data-export",
      name: "EMIS Data Export",
      description: "Raw data export for EMIS system integration",
      category: "Compliance",
      lastGenerated: "2026-02-22",
      format: "CSV",
      icon: FileText,
    },
  ];

  const recentReports: GeneratedReport[] = [
    {
      id: "1",
      name: "National GNH Report - February 2026",
      generatedAt: "2026-02-21 14:30",
      generatedBy: "Dasho Secretary",
      format: "PDF",
      size: "2.4 MB",
      status: "completed",
    },
    {
      id: "2",
      name: "Workforce Alignment - Q1 2026",
      generatedAt: "2026-02-20 10:15",
      generatedBy: "DOE Analyst",
      format: "PDF",
      size: "1.8 MB",
      status: "completed",
    },
    {
      id: "3",
      name: "School Performance by Dzongkhag",
      generatedAt: "2026-02-21 09:00",
      generatedBy: "Dasho Secretary",
      format: "Excel",
      size: "856 KB",
      status: "completed",
    },
  ];

  const categories = ["all", "Wellbeing", "Strategic", "Academic", "Resources", "Compliance"];

  const filteredTemplates = selectedCategory === "all"
    ? reportTemplates
    : reportTemplates.filter(t => t.category === selectedCategory);

  const handleGenerateReport = (templateId: string) => {
    setIsGenerating(true);
    // Simulate report generation
    setTimeout(() => {
      setIsGenerating(false);
    }, 2000);
  };

  const handleDownload = (reportId: string) => {
    // Simulate download
    console.log("Downloading report:", reportId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6" style={{ color: colors.primary }} />
            <h1 className="text-3xl font-bold text-gray-900">National Reports</h1>
          </div>
          <p className="text-gray-600 mt-1">Generate and download Ministry education reports</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-100">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Report Templates</p>
                <p className="text-2xl font-bold text-gray-900">{reportTemplates.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100">
                <Download className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Downloads This Month</p>
                <p className="text-2xl font-bold text-gray-900">147</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-100">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Last EMIS Sync</p>
                <p className="text-2xl font-bold text-gray-900">2h ago</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Templates */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Report Templates</CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {cat === "all" ? "All Categories" : cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates.map((template) => {
                  const Icon = template.icon;
                  return (
                    <div
                      key={template.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-100">
                          <Icon className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{template.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                {template.category}
                              </span>
                              <span className="text-xs text-gray-500">
                                {template.format}
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGenerateReport(template.id)}
                              disabled={isGenerating}
                              className="h-7"
                            >
                              {isGenerating ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <>
                                  <FileText className="w-3 h-3 mr-1" />
                                  Generate
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Reports */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleDownload(report.id)}
                  >
                    <div className="w-10 h-10 rounded flex items-center justify-center bg-red-100">
                      <FileText className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{report.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{report.generatedAt}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{report.size}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">by {report.generatedBy}</p>
                    </div>
                    <Download className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                  </div>
                ))}
              </div>

              <Button variant="outline" className="w-full mt-4" size="sm">
                View All Reports
              </Button>
            </CardContent>
          </Card>

          {/* Schedule Report */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm">Schedule Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-600 mb-4">
                Automate monthly reports to be generated and emailed to stakeholders
              </p>
              <Button
                className="w-full"
                size="sm"
                variant="outline"
              >
                <Clock className="w-4 h-4 mr-2" />
                Set Up Schedule
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
