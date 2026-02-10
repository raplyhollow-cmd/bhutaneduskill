/**
 * SCHOOL ADMIN - REPORTS GENERATION
 *
 * Features:
 * - Generate various school reports
 * - Student performance reports
 * - Attendance reports
 * - Fee collection reports
 * - Teacher workload reports
 * - Export to PDF/Excel
 * - Schedule recurring reports
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Calendar,
  Users,
  DollarSign,
  GraduationCap,
  BarChart3,
  TrendingUp,
  Clock,
  Filter,
  Search,
  FileSpreadsheet,
  File,
  Mail,
  Bell,
  Settings,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

// Report categories and templates
const reportCategories = [
  {
    id: "academic",
    name: "Academic Reports",
    description: "Student performance, exam results, grade analysis",
    icon: FileText,
    color: "bg-blue-100 text-blue-600",
    reports: [
      { id: "student-performance", name: "Student Performance Report", description: "Individual student academic performance" },
      { id: "class-results", name: "Class Results Summary", description: "Overall class performance summary" },
      { id: "subject-analysis", name: "Subject-wise Analysis", description: "Performance by subject across grades" },
      { id: "exam-comparison", name: "Exam Comparison", description: "Compare performance across exams" },
    ],
  },
  {
    id: "attendance",
    name: "Attendance Reports",
    description: "Daily, monthly, and yearly attendance statistics",
    icon: Calendar,
    color: "bg-green-100 text-green-600",
    reports: [
      { id: "daily-attendance", name: "Daily Attendance Register", description: "Day-wise attendance for all classes" },
      { id: "monthly-summary", name: "Monthly Attendance Summary", description: "Monthly attendance overview" },
      { id: "chronic-absenteeism", name: "Chronic Absenteeism Report", description: "Students with low attendance" },
      { id: "teacher-attendance", name: "Teacher Attendance", description: "Staff attendance records" },
    ],
  },
  {
    id: "financial",
    name: "Financial Reports",
    description: "Fee collection, outstanding payments, revenue",
    icon: DollarSign,
    color: "bg-yellow-100 text-yellow-600",
    reports: [
      { id: "fee-collection", name: "Fee Collection Report", description: "Daily/monthly fee collections" },
      { id: "outstanding-fees", name: "Outstanding Fees", description: "Students with pending fees" },
      { id: "payment-history", name: "Payment History", description: "Historical payment records" },
      { id: "revenue-summary", name: "Revenue Summary", description: "Monthly/annual revenue overview" },
    ],
  },
  {
    id: "staff",
    name: "Staff Reports",
    description: "Teacher workload, payroll, evaluations",
    icon: GraduationCap,
    color: "bg-purple-100 text-purple-600",
    reports: [
      { id: "teacher-workload", name: "Teacher Workload", description: "Classes and periods assigned" },
      { id: "staff-directory", name: "Staff Directory", description: "Complete staff listing" },
      { id: "payroll-summary", name: "Payroll Summary", description: "Salary and payment details" },
      { id: "performance-evaluation", name: "Performance Evaluation", description: "Teacher performance metrics" },
    ],
  },
  {
    id: "enrollment",
    name: "Enrollment Reports",
    description: "Admissions, dropouts, class strength",
    icon: Users,
    color: "bg-orange-100 text-orange-600",
    reports: [
      { id: "enrollment-summary", name: "Enrollment Summary", description: "Current enrollment by grade" },
      { id: "new-admissions", name: "New Admissions", description: "Recently enrolled students" },
      { id: "dropout-analysis", name: "Dropout Analysis", description: "Student withdrawal trends" },
      { id: "class-strength", name: "Class Strength", description: "Student count per class" },
    ],
  },
];

const recentReports = [
  { id: "1", name: "Monthly Attendance - February 2025", type: "attendance", generatedAt: "2025-02-10", format: "PDF", size: "2.4 MB" },
  { id: "2", name: "Fee Collection - January 2025", type: "financial", generatedAt: "2025-02-01", format: "Excel", size: "1.1 MB" },
  { id: "3", name: "Mid-term Results - Class 10", type: "academic", generatedAt: "2025-01-25", format: "PDF", size: "3.2 MB" },
  { id: "4", name: "Teacher Workload Analysis", type: "staff", generatedAt: "2025-01-20", format: "PDF", size: "856 KB" },
  { id: "5", name: "Enrollment Summary 2025", type: "enrollment", generatedAt: "2025-01-15", format: "Excel", size: "1.8 MB" },
];

const scheduledReports = [
  { id: "1", name: "Daily Attendance Report", frequency: "Daily", nextRun: "Today 6:00 PM", lastRun: "Yesterday 6:00 PM", active: true },
  { id: "2", name: "Weekly Fee Collection", frequency: "Weekly", nextRun: "Monday 9:00 AM", lastRun: "Feb 3, 2025", active: true },
  { id: "3", name: "Monthly Performance Summary", frequency: "Monthly", nextRun: "Mar 1, 2025", lastRun: "Feb 1, 2025", active: true },
];

export default function ReportsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const filteredCategories = reportCategories.filter((category) => {
    const matchesSearch =
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.reports.some((r) =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesSearch;
  });

  const handleGenerateReport = async (reportId: string) => {
    setIsGenerating(true);
    setSelectedReport(reportId);

    // Simulate report generation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsGenerating(false);
    setSelectedReport(null);

    // Show success notification
    alert("Report generated successfully!");
  };

  const getReportCategory = (type: string) => {
    return reportCategories.find((c) => c.id === type || c.reports.some((r) => r.id === type));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Generate and manage school reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowScheduleModal(true)}>
            <Bell className="w-4 h-4 mr-2" />
            Scheduled Reports
          </Button>
          <Button
            className="text-white"
            style={{ background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)" }}
          >
            <Settings className="w-4 h-4 mr-2" />
            Report Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">156</p>
                <p className="text-sm text-gray-500">Reports Generated</p>
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
                <p className="text-2xl font-bold text-gray-900">89</p>
                <p className="text-sm text-gray-500">Downloads This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Bell className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{scheduledReports.length}</p>
                <p className="text-sm text-gray-500">Scheduled Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">12</p>
                <p className="text-sm text-gray-500">Report Templates</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search reports by name or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Categories */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((category) => (
          <Card
            key={category.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedCategory === category.id ? "ring-2 ring-violet-500" : ""
            }`}
            onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${category.color}`}>
                  <category.icon className="w-6 h-6" />
                </div>
                <Badge
                  variant="outline"
                  className={category.color}
                >
                  {category.reports.length} reports
                </Badge>
              </div>
              <CardTitle className="mt-4">{category.name}</CardTitle>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {category.reports.slice(0, 3).map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGenerateReport(report.id);
                    }}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{report.name}</p>
                      <p className="text-xs text-gray-500">{report.description}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isGenerating && selectedReport === report.id}
                    >
                      {isGenerating && selectedReport === report.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                ))}
                {category.reports.length > 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-violet-600"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View all {category.reports.length} reports
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-violet-600" />
            Recently Generated Reports
          </CardTitle>
          <CardDescription>Access your previously generated reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Report Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Generated</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Format</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Size</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentReports.map((report) => {
                  const category = getReportCategory(report.type);
                  const CategoryIcon = category?.icon || FileText;

                  return (
                    <tr key={report.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <CategoryIcon className="w-5 h-5 text-gray-400" />
                          <span className="font-medium text-gray-900">{report.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className={category?.color || "bg-gray-100 text-gray-600"}
                        >
                          {report.type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{report.generatedAt}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          {report.format === "PDF" ? (
                            <File className="w-4 h-4 text-red-500" />
                          ) : (
                            <FileSpreadsheet className="w-4 h-4 text-green-500" />
                          )}
                          <span className="text-sm">{report.format}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{report.size}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Mail className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Reports Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-violet-600" />
            Scheduled Reports
          </CardTitle>
          <CardDescription>Automated report generation schedule</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {scheduledReports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    report.active ? "bg-green-100" : "bg-gray-100"
                  }`}>
                    {report.active ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{report.name}</p>
                    <p className="text-sm text-gray-500">
                      {report.frequency} • Next: {report.nextRun}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={report.active ? "default" : "secondary"}>
                    {report.active ? "Active" : "Paused"}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Schedule Reports Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Scheduled Reports</h2>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Schedule a New Report</h4>
                <p className="text-sm text-blue-700">
                  Set up automatic report generation and have them emailed to specific recipients.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option>Select report type...</option>
                    {reportCategories.map((cat) =>
                      cat.reports.map((report) => (
                        <option key={report.id} value={report.id}>
                          {cat.name} - {report.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                      <option>Daily</option>
                      <option>Weekly</option>
                      <option>Monthly</option>
                      <option>Quarterly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    <Input type="time" defaultValue="09:00" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Recipients</label>
                  <Input placeholder="admin@school.edu.bt, principal@school.edu.bt" />
                  <p className="text-xs text-gray-500 mt-1">Comma-separated email addresses</p>
                </div>
              </div>
            </div>
            <div className="border-t px-6 py-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowScheduleModal(false)}>
                Cancel
              </Button>
              <Button
                className="text-white"
                style={{ background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)" }}
              >
                <Check className="w-4 h-4 mr-2" />
                Schedule Report
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
