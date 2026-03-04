/**
 * SCHOOL ADMIN ASSESSMENT DETAIL PAGE
 *
 * Detailed view for a specific assessment type across the entire school
 * Shows class comparison, student-by-student breakdown, and school analytics
 */

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Users,
  TrendingUp,
  BarChart3,
  Download,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  Target,
  Brain,
  Lightbulb,
  School,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface ClassData {
  classId: string;
  className: string;
  totalStudents: number;
  completedStudents: number;
  completionRate: number;
  teacher?: string;
}

interface StudentResult {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  completedAt: string;
  result: {
    type?: string;
    hollandCode?: string;
    primaryType?: string;
    topValues?: string[];
  };
  status: "completed" | "pending" | "not_started";
}

interface AssessmentDetail {
  assessmentType: string;
  totalStudents: number;
  completedStudents: number;
  pendingStudents: number;
  notStartedStudents: number;
  completionRate: number;
  classes: ClassData[];
  students: StudentResult[];
  topCareerClusters: string[];
  atRiskStudents: number;
}

export default function SchoolAdminAssessmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentType = params.type as string;

  const [detail, setDetail] = useState<AssessmentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "classes" | "students">("overview");
  const [filterClass, setFilterClass] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "pending" | "not_started">("all");

  useEffect(() => {
    async function fetchDetail() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/school-admin/assessments/${assessmentType}`);
        if (response.ok) {
          const data = await response.json();
          setDetail(data);
        } else {
          console.error("Failed to fetch assessment detail");
        }
      } catch (error) {
        console.error("Error fetching detail:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDetail();
  }, [assessmentType]);

  const getAssessmentInfo = (type: string) => {
    const info = {
      riasec: { label: "RIASEC Career Assessment", icon: Target, color: "blue" },
      mbti: { label: "MBTI Personality Test", icon: Brain, color: "purple" },
      disc: { label: "DISC Assessment", icon: TrendingUp, color: "green" },
      "work-values": { label: "Work Values Assessment", icon: Lightbulb, color: "amber" },
    };
    return info[type as keyof typeof info] || { label: type, icon: BarChart3, color: "gray" };
  };

  const assessmentInfo = getAssessmentInfo(assessmentType);
  const Icon = assessmentInfo.icon;

  const getStudentStatusBadge = (status: StudentResult["status"]) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-600 gap-1"><CheckCircle className="w-3 h-3" />Completed</Badge>;
      case "pending":
        return <Badge className="bg-amber-600 gap-1"><Clock className="w-3 h-3" />Pending</Badge>;
      case "not_started":
        return <Badge variant="outline" className="gap-1"><AlertTriangle className="w-3 h-3" />Not Started</Badge>;
    }
  };

  const filteredStudents = detail?.students.filter((s) => {
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    if (filterClass !== "all" && s.className !== filterClass) return false;
    return true;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading assessment details...</p>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-2">Assessment Not Found</h2>
        <p className="text-gray-600 mb-4">Could not load assessment details</p>
        <Button asChild>
          <Link href="/school-admin/assessments">Back to Assessments</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/school-admin/assessments">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Icon className={`w-6 h-6 text-${assessmentInfo.color}-600`} />
            <h1 className="text-2xl font-bold">{assessmentInfo.label}</h1>
            <Badge variant="outline">School-Wide</Badge>
          </div>
          <p className="text-gray-600 mt-1">Analytics across all classes</p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600">Total Students</p>
            <p className="text-2xl font-bold">{detail.totalStudents}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-green-600">{detail.completedStudents}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-amber-600">{detail.pendingStudents}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600">Not Started</p>
            <p className="text-2xl font-bold text-gray-600">{detail.notStartedStudents}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600">Completion Rate</p>
            <p className="text-2xl font-bold text-blue-600">{detail.completionRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Top Career Clusters */}
          <Card>
            <CardHeader>
              <CardTitle>Top Career Interests</CardTitle>
              <CardDescription>Most popular career clusters from this assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-3">
                {detail.topCareerClusters.map((cluster, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100"
                  >
                    <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                      {i + 1}
                    </span>
                    <span className="font-medium">{cluster}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* At Risk Alert */}
          {detail.atRiskStudents > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <AlertTriangle className="w-12 h-12 text-red-600" />
                  <div>
                    <h3 className="font-semibold text-red-900">{detail.atRiskStudents} Students At Risk</h3>
                    <p className="text-sm text-red-700">
                      These students haven't completed any assessments. Consider sending reminders.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Classes Tab */}
        <TabsContent value="classes" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {detail.classes.map((classData) => (
              <Card key={classData.classId} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{classData.className}</CardTitle>
                    <Badge variant={classData.completionRate >= 80 ? "default" : "secondary"}>
                      {classData.completionRate}%
                    </Badge>
                  </div>
                  <CardDescription>
                    {classData.completedStudents}/{classData.totalStudents} students completed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div
                      className={`h-2 rounded-full ${
                        classData.completionRate >= 80
                          ? "bg-green-600"
                          : classData.completionRate >= 50
                          ? "bg-amber-600"
                          : "bg-red-600"
                      }`}
                      style={{ width: `${classData.completionRate}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      <School className="w-4 h-4 inline mr-1" />
                      {classData.teacher || "No teacher assigned"}
                    </span>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/school-admin/assessments/${assessmentType}/${classData.classId}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap items-center gap-4">
                <Filter className="w-4 h-4 text-gray-600" />
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={filterStatus === "all" ? "default" : "outline"}
                    onClick={() => setFilterStatus("all")}
                  >
                    All ({detail.students.length})
                  </Button>
                  <Button
                    size="sm"
                    variant={filterStatus === "completed" ? "default" : "outline"}
                    onClick={() => setFilterStatus("completed")}
                  >
                    Completed ({detail.completedStudents})
                  </Button>
                  <Button
                    size="sm"
                    variant={filterStatus === "not_started" ? "default" : "outline"}
                    onClick={() => setFilterStatus("not_started")}
                  >
                    Not Started ({detail.notStartedStudents})
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Student List */}
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-2">
                {filteredStudents.slice(0, 50).map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                        {student.studentName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{student.studentName}</p>
                        <p className="text-sm text-gray-600">{student.className}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {student.status === "completed" && student.completedAt && (
                        <span className="text-sm text-gray-500">
                          {new Date(student.completedAt).toLocaleDateString()}
                        </span>
                      )}
                      {getStudentStatusBadge(student.status)}
                    </div>
                  </div>
                ))}
                {filteredStudents.length > 50 && (
                  <p className="text-center text-sm text-gray-500 py-4">
                    Showing 50 of {filteredStudents.length} students
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}