"use client";

/**
 * TEACHER ASSESSMENTS PAGE
 * Create and manage assessments, view results
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Plus,
  Users,
  TrendingUp,
  CheckCircle,
  Clock,
  BarChart3,
  Eye,
  Edit,
  Trash2,
  FileText,
  Loader2,
  Calendar,
  Target,
} from "lucide-react";
import Link from "next/link";

interface Assessment {
  id: string;
  title: string;
  type: "riasec" | "mbti" | "disc" | "spark_career" | "spark_skills" | "custom";
  classId: string;
  className: string;
  subject?: string;
  assignedDate: string;
  dueDate: string;
  totalStudents: number;
  completedStudents: number;
  pendingStudents: number;
  status: "draft" | "active" | "completed";
  averageScore?: number;
}

interface ClassData {
  id: string;
  name: string;
  grade: number;
  section: string;
}

const assessmentTypes = [
  { value: "riasec", label: "RIASEC Career Assessment", icon: "Target", color: "blue" },
  { value: "mbti", label: "MBTI Personality Test", icon: "ClipboardList", color: "purple" },
  { value: "disc", label: "DISC Assessment", icon: "TrendingUp", color: "green" },
  { value: "spark_career", label: "SPARK Career Explorer", icon: "FileText", color: "orange" },
  { value: "spark_skills", label: "SPARK Skills Assessment", icon: "BarChart3", color: "pink" },
  { value: "custom", label: "Custom Quiz", icon: "Edit", color: "gray" },
];

export default function TeacherAssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "results">("list");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const response = await fetch("/api/teacher/assessments");
        if (response.ok) {
          const data = await response.json();
          setClasses(data.classes || []);
          setAssessments(data.assessments || []);
        } else {
          // Mock data
          const mockClasses: ClassData[] = [
            { id: "c1", name: "Class 10 A", grade: 10, section: "A" },
            { id: "c2", name: "Class 10 B", grade: 10, section: "B" },
            { id: "c3", name: "Class 9 A", grade: 9, section: "A" },
          ];

          const mockAssessments: Assessment[] = [
            {
              id: "a1",
              title: "RIASEC Career Assessment - Term 1",
              type: "riasec",
              classId: "c1",
              className: "Class 10 A",
              assignedDate: "2025-02-01",
              dueDate: "2025-02-15",
              totalStudents: 42,
              completedStudents: 35,
              pendingStudents: 7,
              status: "active",
              averageScore: 78,
            },
            {
              id: "a2",
              title: "MBTI Personality Test",
              type: "mbti",
              classId: "c2",
              className: "Class 10 B",
              assignedDate: "2025-02-05",
              dueDate: "2025-02-20",
              totalStudents: 38,
              completedStudents: 12,
              pendingStudents: 26,
              status: "active",
              averageScore: 72,
            },
            {
              id: "a3",
              title: "DISC Behavior Assessment",
              type: "disc",
              classId: "c3",
              className: "Class 9 A",
              assignedDate: "2025-01-15",
              dueDate: "2025-01-30",
              totalStudents: 40,
              completedStudents: 40,
              pendingStudents: 0,
              status: "completed",
              averageScore: 81,
            },
            {
              id: "a4",
              title: "SPARK Career Explorer - Mid Term",
              type: "spark_career",
              classId: "c1",
              className: "Class 10 A",
              assignedDate: "2025-03-01",
              dueDate: "2025-03-15",
              totalStudents: 42,
              completedStudents: 0,
              pendingStudents: 42,
              status: "draft",
            },
          ];

          setClasses(mockClasses);
          setAssessments(mockAssessments);
        }
      } catch (error) {
        console.error("Error fetching assessments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredAssessments = assessments.filter((a) => {
    if (selectedClass !== "all" && a.classId !== selectedClass) return false;
    if (selectedStatus !== "all" && a.status !== selectedStatus) return false;
    return true;
  });

  // Calculate stats
  const totalAssessments = assessments.length;
  const activeAssessments = assessments.filter((a) => a.status === "active").length;
  const totalCompletions = assessments.reduce((sum, a) => sum + a.completedStudents, 0);
  const avgCompletionRate = assessments.length
    ? Math.round(
        assessments.reduce((sum, a) => sum + (a.completedStudents / a.totalStudents) * 100, 0) /
          assessments.length
      )
    : 0;

  const getTypeColor = (type: string) => {
    switch (type) {
      case "riasec":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "mbti":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "disc":
        return "bg-green-100 text-green-700 border-green-200";
      case "spark_career":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "spark_skills":
        return "bg-pink-100 text-pink-700 border-pink-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-blue-600">Active</Badge>;
      case "completed":
        return <Badge className="bg-green-600">Completed</Badge>;
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assessments</h1>
          <p className="text-gray-600">Create and manage student assessments</p>
        </div>
        <Button
          style={{ background: "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)" }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Assessment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalAssessments}</p>
                <p className="text-sm text-gray-600">Total Assessments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{activeAssessments}</p>
                <p className="text-sm text-gray-600">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalCompletions}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{avgCompletionRate}%</p>
                <p className="text-sm text-gray-600">Avg Completion</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-full sm:w-[200px] h-11">
                <SelectValue placeholder="Filter by class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-[180px] h-11">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Assessment List */}
      {isLoading ? (
        <Card>
          <CardContent className="pt-6 flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-gray-600">Loading assessments...</p>
            </div>
          </CardContent>
        </Card>
      ) : filteredAssessments.length === 0 ? (
        <Card>
          <CardContent className="pt-6 py-12 text-center">
            <ClipboardList className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No assessments found</p>
            <p className="text-sm text-gray-500 mt-2">Create your first assessment to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredAssessments.map((assessment) => {
            const completionPercentage = Math.round(
              (assessment.completedStudents / assessment.totalStudents) * 100
            );

            return (
              <Card key={assessment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${getTypeColor(
                        assessment.type
                      )}`}
                    >
                      <Target className="w-6 h-6" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{assessment.title}</h3>
                            {getStatusBadge(assessment.status)}
                          </div>
                          <p className="text-sm text-gray-600">{assessment.className}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                          {assessment.status === "draft" && (
                            <Button size="sm" variant="ghost">
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Assigned: {new Date(assessment.assignedDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>Due: {new Date(assessment.dueDate).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">Completion Progress</span>
                          <span className="font-medium">
                            {assessment.completedStudents}/{assessment.totalStudents} students
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${completionPercentage}%`,
                              background: "linear-gradient(90deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)",
                            }}
                          />
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center gap-3 mt-4">
                        <Link
                          href={`/teacher/assessments/${assessment.id}/results`}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          <BarChart3 className="w-4 h-4 inline mr-1" />
                          View Results
                        </Link>
                        <span className="text-gray-300">|</span>
                        <button className="text-sm text-gray-600 hover:text-gray-700">
                          <Users className="w-4 h-4 inline mr-1" />
                          Remind Pending ({assessment.pendingStudents})
                        </button>
                        {assessment.averageScore && (
                          <>
                            <span className="text-gray-300">|</span>
                            <span className="text-sm text-gray-600">
                              Average Score: <span className="font-semibold">{assessment.averageScore}%</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Quick Create Panel */}
      <Card
        className="border-dashed border-2 border-blue-200 bg-blue-50/30"
        style={{ background: "linear-gradient(to bottom right, rgb(239 246 255), rgb(219 234 254))" }}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" />
            Quick Create Assessment
          </CardTitle>
          <CardDescription>Select a template to get started quickly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {assessmentTypes.map((type) => (
              <Button
                key={type.value}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-2 hover:border-blue-300 hover:bg-blue-50"
              >
                <div className={`w-10 h-10 rounded-lg bg-${type.color}-100 flex items-center justify-center`}>
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">{type.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {type.value === "riasec" && "Career interests inventory"}
                    {type.value === "mbti" && "Personality type assessment"}
                    {type.value === "disc" && "Behavioral style test"}
                    {type.value === "spark_career" && "Career exploration for students"}
                    {type.value === "spark_skills" && "Skills assessment"}
                    {type.value === "custom" && "Create your own quiz"}
                  </p>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
