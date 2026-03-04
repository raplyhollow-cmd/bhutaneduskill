/**
 * SCHOOL ADMIN ASSESSMENTS PAGE
 *
 * Modern card-based view of all assessments with:
 * - Card grid layout for assessments
 * - Status badges (Draft/Published/Graded)
 * - Student count and completion rates
 * - Quick actions: Publish, Grade, View Results
 * - SlideOverPanel for assessment details
 * - Filter by subject/class
 * - Modern gradient styling
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ClipboardList,
  TrendingUp,
  CheckCircle,
  Clock,
  BarChart3,
  Download,
  Users,
  AlertTriangle,
  Target,
  Brain,
  Lightbulb,
  Loader2,
  Eye,
  Send,
  FileText,
  Filter,
  GraduationCap,
  BookOpen,
  Sparkles,
  MoreVertical,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { SlideOverPanel } from "@/components/ui/slide-over-panel";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { portal } from "@/styles/design-tokens";

// ============================================================================
// TYPES
// ============================================================================

interface ClassAssessmentSummary {
  classId: string;
  className: string;
  totalStudents: number;
  completedStudents: number;
  totalAssessments: number;
  completionRate: number;
  teacher?: string;
}

interface SchoolAssessmentData {
  assessmentType: string;
  totalStudents: number;
  completedStudents: number;
  pendingStudents: number;
  notStartedStudents: number;
  completionRate: number;
  classes: ClassAssessmentSummary[];
  topCareerClusters: string[];
  atRiskStudents: number;
  status?: "draft" | "published" | "graded";
  subject?: string;
  dueDate?: string;
}

interface AssessmentCardProps {
  assessment: SchoolAssessmentData;
  onViewDetails: (assessment: SchoolAssessmentData) => void;
  onPublish?: (type: string) => void;
  onGrade?: (type: string) => void;
}

// ============================================================================
// ASSESSMENT CONFIG
// ============================================================================

const assessmentConfig = {
  riasec: {
    label: "RIASEC Career Assessment",
    shortLabel: "RIASEC",
    icon: Target,
    gradient: "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)",
    bgGradient: "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    borderColor: "border-blue-200",
    shadow: "shadow-blue-100/50",
  },
  mbti: {
    label: "MBTI Personality Test",
    shortLabel: "MBTI",
    icon: Brain,
    gradient: "linear-gradient(135deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)",
    bgGradient: "linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(147, 51, 234, 0.05) 100%)",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    borderColor: "border-purple-200",
    shadow: "shadow-purple-100/50",
  },
  disc: {
    label: "DISC Assessment",
    shortLabel: "DISC",
    icon: TrendingUp,
    gradient: "linear-gradient(135deg, rgb(34 197 94) 0%, rgb(22 163 74) 100%)",
    bgGradient: "linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(22, 163, 74, 0.05) 100%)",
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    borderColor: "border-green-200",
    shadow: "shadow-green-100/50",
  },
  "work-values": {
    label: "Work Values Assessment",
    shortLabel: "Work Values",
    icon: Lightbulb,
    gradient: "linear-gradient(135deg, rgb(245 158 11) 0%, rgb(217 119 6) 100%)",
    bgGradient: "linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%)",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    borderColor: "border-amber-200",
    shadow: "shadow-amber-100/50",
  },
};

const statusConfig = {
  draft: {
    label: "Draft",
    variant: "secondary" as const,
    icon: FileText,
    bgColor: "bg-gray-100",
    textColor: "text-gray-600",
  },
  published: {
    label: "Published",
    variant: "default" as const,
    icon: Send,
    bgColor: "bg-blue-100",
    textColor: "text-blue-600",
  },
  graded: {
    label: "Graded",
    variant: "success" as const,
    icon: CheckCircle,
    bgColor: "bg-green-100",
    textColor: "text-green-600",
  },
};

// ============================================================================
// ASSESSMENT CARD COMPONENT
// ============================================================================

function AssessmentCard({ assessment, onViewDetails, onPublish, onGrade }: AssessmentCardProps) {
  const config = assessmentConfig[assessment.assessmentType as keyof typeof assessmentConfig] || assessmentConfig.riasec;
  const status = assessment.status || "published";
  const statusInfo = statusConfig[status];
  const StatusIcon = statusInfo.icon;
  const Icon = config.icon;

  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return "text-green-600";
    if (rate >= 50) return "text-amber-600";
    return "text-red-600";
  };

  const getProgressColor = (rate: number) => {
    if (rate >= 80) return "bg-gradient-to-r from-green-500 to-green-400";
    if (rate >= 50) return "bg-gradient-to-r from-amber-500 to-amber-400";
    return "bg-gradient-to-r from-red-500 to-red-400";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="group"
    >
      <Card
        className={cn(
          "overflow-hidden border-2 transition-all duration-200 hover:shadow-lg",
          config.borderColor,
          "hover:scale-[1.02] cursor-pointer"
        )}
        onClick={() => onViewDetails(assessment)}
      >
        {/* Gradient Header */}
        <div
          className="relative h-20 px-4 flex items-center justify-between"
          style={{ background: config.bgGradient }}
        >
          <div className="flex items-center gap-3">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", config.iconBg)}>
              <Icon className={cn("w-6 h-6", config.iconColor)} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{config.shortLabel}</h3>
              <p className="text-xs text-gray-500">Career Assessment</p>
            </div>
          </div>
          <Badge
            variant={statusInfo.variant}
            className={cn("gap-1.5 font-medium", statusInfo.bgColor, statusInfo.textColor)}
          >
            <StatusIcon className="w-3 h-3" />
            {statusInfo.label}
          </Badge>
        </div>

        <CardContent className="p-4 space-y-4">
          {/* Completion Stats */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Completion</span>
              <span className={cn("font-bold", getCompletionColor(assessment.completionRate))}>
                {assessment.completionRate}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${assessment.completionRate}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={cn("h-full rounded-full", getProgressColor(assessment.completionRate))}
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-lg bg-gray-50">
              <Users className="w-4 h-4 mx-auto text-gray-400 mb-1" />
              <p className="text-lg font-bold text-gray-900">{assessment.totalStudents}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-green-50">
              <CheckCircle className="w-4 h-4 mx-auto text-green-500 mb-1" />
              <p className="text-lg font-bold text-green-600">{assessment.completedStudents}</p>
              <p className="text-xs text-gray-500">Done</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-amber-50">
              <Clock className="w-4 h-4 mx-auto text-amber-500 mb-1" />
              <p className="text-lg font-bold text-amber-600">{assessment.pendingStudents}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </div>

          {/* Classes Involved */}
          {assessment.classes.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <GraduationCap className="w-4 h-4 text-gray-400" />
              <span className="truncate">{assessment.classes.length} classes assigned</span>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-1.5"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(assessment);
              }}
            >
              <Eye className="w-3.5 h-3.5" />
              View
            </Button>
            {status === "draft" && onPublish && (
              <Button
                size="sm"
                className="flex-1 gap-1.5"
                style={{ background: config.gradient }}
                onClick={(e) => {
                  e.stopPropagation();
                  onPublish(assessment.assessmentType);
                }}
              >
                <Send className="w-3.5 h-3.5" />
                Publish
              </Button>
            )}
            {status === "published" && onGrade && (
              <Button
                size="sm"
                variant="secondary"
                className="flex-1 gap-1.5"
                onClick={(e) => {
                  e.stopPropagation();
                  onGrade(assessment.assessmentType);
                }}
              >
                <FileText className="w-3.5 h-3.5" />
                Grade
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// ASSESSMENT DETAILS SLIDE OVER
// ============================================================================

interface AssessmentDetailsSlideOverProps {
  assessment: SchoolAssessmentData | null;
  open: boolean;
  onClose: () => void;
}

function AssessmentDetailsSlideOver({ assessment, open, onClose }: AssessmentDetailsSlideOverProps) {
  if (!assessment) return null;

  const config = assessmentConfig[assessment.assessmentType as keyof typeof assessmentConfig] || assessmentConfig.riasec;
  const Icon = config.icon;

  return (
    <SlideOverPanel
      open={open}
      onClose={onClose}
      size="xl"
      title={config.label}
      headerActions={
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => window.location.href = `/school-admin/assessments/${assessment.assessmentType}`}
        >
          <BarChart3 className="w-4 h-4" />
          Full Report
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Status & Meta */}
        <div className="flex items-center gap-3">
          <Badge variant="default" className="gap-1.5">
            <CheckCircle className="w-3 h-3" />
            {assessment.status || "Published"}
          </Badge>
          {assessment.subject && (
            <Badge variant="outline" className="gap-1.5">
              <BookOpen className="w-3 h-3" />
              {assessment.subject}
            </Badge>
          )}
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">Total Students</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{assessment.totalStudents}</p>
          </div>
          <div className="p-4 rounded-xl bg-green-50 border border-green-100">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Completed</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{assessment.completedStudents}</p>
          </div>
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
            <div className="flex items-center gap-2 text-amber-600 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Pending</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{assessment.pendingStudents}</p>
          </div>
          <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
            <div className="flex items-center gap-2 text-purple-600 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">Completion</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{assessment.completionRate}%</p>
          </div>
        </div>

        {/* Class Breakdown */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            Class Breakdown
          </h3>
          <div className="space-y-2">
            {assessment.classes.slice(0, 5).map((classData) => (
              <div
                key={classData.classId}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{classData.className}</p>
                  <p className="text-xs text-gray-500">
                    {classData.completedStudents}/{classData.totalStudents} students
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">{classData.completionRate}%</p>
                  <div className="w-16 h-1.5 bg-gray-200 rounded-full mt-1">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        classData.completionRate >= 80
                          ? "bg-green-500"
                          : classData.completionRate >= 50
                          ? "bg-amber-500"
                          : "bg-red-500"
                      )}
                      style={{ width: `${classData.completionRate}%` }}
                    />
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            ))}
          </div>
        </div>

        {/* Top Career Interests */}
        {assessment.topCareerClusters && assessment.topCareerClusters.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Top Career Interests
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {assessment.topCareerClusters.map((cluster, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100"
                >
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium">{cluster}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* At Risk Alert */}
        {assessment.atRiskStudents > 0 && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-900">{assessment.atRiskStudents} Students At Risk</h4>
                <p className="text-sm text-red-700 mt-1">
                  These students haven't completed the assessment. Consider sending reminders.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </SlideOverPanel>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function SchoolAdminAssessmentsPage() {
  const [assessmentData, setAssessmentData] = useState<SchoolAssessmentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedAssessment, setSelectedAssessment] = useState<SchoolAssessmentData | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/school-admin/assessments");
        if (response.ok) {
          const data = await response.json();
          // Add mock status for demo
          const assessmentsWithStatus = (data.assessments || []).map((a: SchoolAssessmentData) => ({
            ...a,
            status: ["draft", "published", "graded"][Math.floor(Math.random() * 3)] as SchoolAssessmentData["status"],
            subject: ["Career Guidance", "Psychology", "Life Skills"][Math.floor(Math.random() * 3)],
          }));
          setAssessmentData(assessmentsWithStatus);
        }
      } catch (error) {
        console.error("Error fetching assessment data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  // Filter data
  const filteredData = assessmentData.filter((d) => {
    if (selectedType !== "all" && d.assessmentType !== selectedType) return false;
    if (selectedSubject !== "all" && d.subject !== selectedSubject) return false;
    return true;
  });

  // Calculate school-wide totals
  const schoolTotals = assessmentData.reduce(
    (acc, curr) => ({
      totalStudents: acc.totalStudents + curr.totalStudents,
      completedStudents: acc.completedStudents + curr.completedStudents,
      pendingStudents: acc.pendingStudents + curr.pendingStudents,
      notStartedStudents: acc.notStartedStudents + curr.notStartedStudents,
    }),
    { totalStudents: 0, completedStudents: 0, pendingStudents: 0, notStartedStudents: 0 }
  );

  const overallCompletionRate = schoolTotals.totalStudents > 0
    ? Math.round((schoolTotals.completedStudents / schoolTotals.totalStudents) * 100)
    : 0;

  // Get unique values for filters
  const allSubjects = Array.from(new Set(assessmentData.map((d) => d.subject).filter(Boolean))) as string[];
  const allClasses = Array.from(
    new Set(assessmentData.flatMap((d) => d.classes.map((c) => c.className)))
  );

  const handleViewDetails = (assessment: SchoolAssessmentData) => {
    setSelectedAssessment(assessment);
    setDetailsOpen(true);
  };

  const handlePublish = async (type: string) => {
    // TODO: Implement publish action
    console.log("Publishing assessment:", type);
  };

  const handleGrade = async (type: string) => {
    // TODO: Implement grade action
    console.log("Grading assessment:", type);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading assessment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assessments</h1>
          <p className="text-gray-600">Manage and track all school assessments</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
          <Button className="gap-2" style={{ background: portal.schoolAdmin.gradient }}>
            <Sparkles className="w-4 h-4" />
            Create Assessment
          </Button>
        </div>
      </div>

      {/* School-Wide Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-2 border-blue-200 bg-blue-50/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{schoolTotals.totalStudents}</p>
                <p className="text-sm text-gray-600">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-green-50/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{schoolTotals.completedStudents}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-amber-200 bg-amber-50/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{schoolTotals.pendingStudents}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-gray-200 bg-gray-50/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{schoolTotals.notStartedStudents}</p>
                <p className="text-sm text-gray-600">Not Started</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 bg-purple-50/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{overallCompletionRate}%</p>
                <p className="text-sm text-gray-600">Completion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-2">
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-4">
            <Filter className="w-4 h-4 text-gray-500" />
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All assessments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assessments</SelectItem>
                <SelectItem value="riasec">RIASEC</SelectItem>
                <SelectItem value="mbti">MBTI</SelectItem>
                <SelectItem value="disc">DISC</SelectItem>
                <SelectItem value="work-values">Work Values</SelectItem>
              </SelectContent>
            </Select>

            {allSubjects.length > 0 && (
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {allSubjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {allClasses.map((cls) => (
                  <SelectItem key={cls} value={cls}>
                    {cls}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(selectedType !== "all" || selectedSubject !== "all" || selectedClass !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedType("all");
                  setSelectedSubject("all");
                  setSelectedClass("all");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Assessment Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredData.map((assessment) => (
          <AssessmentCard
            key={assessment.assessmentType}
            assessment={assessment}
            onViewDetails={handleViewDetails}
            onPublish={handlePublish}
            onGrade={handleGrade}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredData.length === 0 && (
        <Card className="border-2 border-dashed">
          <CardContent className="py-16 text-center">
            <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No assessments found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your filters or create a new assessment</p>
            <Button style={{ background: portal.schoolAdmin.gradient }}>
              <Sparkles className="w-4 h-4 mr-2" />
              Create Assessment
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Assessment Details Slide Over */}
      <AssessmentDetailsSlideOver
        assessment={selectedAssessment}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
      />
    </div>
  );
}
