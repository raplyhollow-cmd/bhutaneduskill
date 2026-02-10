/**
 * COUNSELOR - CAREER PLANNING TOOLS
 *
 * Features:
 * - View all student career plans
 * - Create and edit career plans
 * - Track plan completion status
 * - Access planning resources
 * - Monitor student progress
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Calendar,
  GraduationCap,
  BookOpen,
  Award,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  FileText,
  Sparkles,
  Download,
  Users,
  Lightbulb,
} from "lucide-react";
import Link from "next/link";

// Mock career plan data
const mockCareerPlans = [
  {
    id: "CP001",
    studentId: "STU001",
    studentName: "Tashi Dorji",
    studentGrade: 12,
    studentSchool: "Thimphu HSS",
    targetCareer: "Software Engineer",
    matchPercentage: 92,
    status: "in_progress",
    completionPercentage: 65,
    milestones: [
      { title: "Complete RIASEC Assessment", completed: true, date: "2024-01-15" },
      { title: "Research Software Engineering Careers", completed: true, date: "2024-01-20" },
      { title: "Explore RUB College of Science & Technology", completed: true, date: "2024-01-25" },
      { title: "Prepare for Class 12 Exams", completed: false, date: "2024-03-01" },
      { title: "Apply to RUB CST", completed: false, date: "2024-04-15" },
      { title: "Attend Career Counseling Sessions", completed: true, date: "2024-02-01" },
    ],
    shortTermGoals: ["Score above 75% in Class 12 exams", "Learn Python programming", "Participate in coding competitions"],
    longTermGoals: ["Complete B.E. in Software Engineering", "Work at a tech company", "Pursue higher studies abroad"],
    counselorNotes: "Student shows strong aptitude for programming. Recommend focusing on mathematics and computer science fundamentals.",
    lastUpdated: "2024-02-08",
    nextReview: "2024-03-01",
    riasecCode: "IAR",
  },
  {
    id: "CP002",
    studentId: "STU004",
    studentName: "Dorji Wangchuk",
    studentGrade: 12,
    studentSchool: "Pelkhil HSS",
    targetCareer: "Civil Engineer",
    matchPercentage: 88,
    status: "completed",
    completionPercentage: 100,
    milestones: [
      { title: "Complete RIASEC Assessment", completed: true, date: "2024-01-10" },
      { title: "Research Civil Engineering Careers", completed: true, date: "2024-01-15" },
      { title: "Explore College Options", completed: true, date: "2024-01-20" },
      { title: "Prepare for Class 12 Exams", completed: true, date: "2024-02-01" },
      { title: "Apply to Engineering Colleges", completed: true, date: "2024-02-15" },
    ],
    shortTermGoals: ["Excel in Class 12 exams", "Visit construction sites", "Learn CAD software"],
    longTermGoals: ["Complete B.E. in Civil Engineering", "Get licensed as P.E.", "Start own firm"],
    counselorNotes: "Student has completed all planned milestones. Ready for application phase.",
    lastUpdated: "2024-02-10",
    nextReview: "2024-04-01",
    riasecCode: "RIE",
  },
  {
    id: "CP003",
    studentId: "STU005",
    studentName: "Sonam Yangdon",
    studentGrade: 10,
    studentSchool: "Rigsum HSS",
    targetCareer: "Nurse",
    matchPercentage: 85,
    status: "in_progress",
    completionPercentage: 40,
    milestones: [
      { title: "Complete RIASEC Assessment", completed: true, date: "2024-01-25" },
      { title: "Research Nursing Careers", completed: true, date: "2024-01-28" },
      { title: "Explore Health Science Programs", completed: false, date: "2024-03-01" },
      { title: "Volunteer at Hospital", completed: false, date: "2024-04-01" },
      { title: "Focus on Science Subjects", completed: true, date: "2024-02-01" },
    ],
    shortTermGoals: ["Maintain good grades in science", "Volunteer at local hospital", "Learn about healthcare programs"],
    longTermGoals: ["Complete B.Sc. Nursing", "Work at hospital", "Specialize in pediatrics"],
    counselorNotes: "Student shows strong interest in healthcare. Encourage to gain volunteer experience.",
    lastUpdated: "2024-02-05",
    nextReview: "2024-03-15",
    riasecCode: "SIE",
  },
  {
    id: "CP004",
    studentId: "STU007",
    studentName: "Tshering Yangdon",
    studentGrade: 12,
    studentSchool: "Yangchenphug HSS",
    targetCareer: "Data Scientist",
    matchPercentage: 90,
    status: "completed",
    completionPercentage: 100,
    milestones: [
      { title: "Complete All Assessments", completed: true, date: "2024-01-05" },
      { title: "Research Data Science Careers", completed: true, date: "2024-01-10" },
      { title: "Learn Programming Basics", completed: true, date: "2024-01-20" },
      { title: "Prepare for Exams", completed: true, date: "2024-02-01" },
      { title: "Apply to Universities", completed: true, date: "2024-02-10" },
    ],
    shortTermGoals: ["Score top 10% in Class 12", "Complete online data science course", "Build programming portfolio"],
    longTermGoals: ["Complete B.Tech in Computer Science", "Work as Data Analyst", "Pursue M.S. in Data Science"],
    counselorNotes: "Exceptionally motivated student with clear goals. Recommend for mentorship program.",
    lastUpdated: "2024-02-10",
    nextReview: "2024-06-01",
    riasecCode: "IAR",
  },
];

const statusOptions = ["All", "Not Started", "In Progress", "Completed"];
const gradeOptions = ["All", "9", "10", "11", "12"];

export default function CounselorPlansPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedGrade, setSelectedGrade] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter plans
  const filteredPlans = mockCareerPlans.filter((plan) => {
    const matchesSearch =
      plan.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.targetCareer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.studentSchool.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = selectedStatus === "All" ||
      plan.status.toLowerCase().replace(" ", "_") === selectedStatus.toLowerCase().replace(" ", "_");
    const matchesGrade = selectedGrade === "All" || plan.studentGrade.toString() === selectedGrade;

    return matchesSearch && matchesStatus && matchesGrade;
  });

  // Pagination
  const itemsPerPage = 9;
  const totalPages = Math.ceil(filteredPlans.length / itemsPerPage);
  const paginatedPlans = filteredPlans.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusBadge = (status: string) => {
    const styles = {
      not_started: "bg-gray-100 text-gray-700 border-gray-200",
      in_progress: "bg-blue-100 text-blue-700 border-blue-200",
      completed: "bg-green-100 text-green-700 border-green-200",
    };
    const labels = {
      not_started: "Not Started",
      in_progress: "In Progress",
      completed: "Completed",
    };
    return { className: styles[status as keyof typeof styles] || styles.not_started, label: labels[status as keyof typeof labels] || status };
  };

  // Stats
  const totalPlans = mockCareerPlans.length;
  const completedPlans = mockCareerPlans.filter((p) => p.status === "completed").length;
  const inProgressPlans = mockCareerPlans.filter((p) => p.status === "in_progress").length;
  const avgCompletion = Math.round(mockCareerPlans.reduce((sum, p) => sum + p.completionPercentage, 0) / totalPlans);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Career Planning</h1>
          <p className="text-gray-600 mt-1">
            Manage and track student career development plans
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export Plans
          </Button>
          <Button className="gap-2" style={{ background: 'linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))' }}>
            <Plus className="w-4 h-4" />
            Create Plan
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgb(168 85 247 / 0.2), rgb(147 51 234 / 0.2))' }}>
                <Target className="w-6 h-6" style={{ color: 'rgb(147 51 234)' }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalPlans}</p>
                <p className="text-sm text-gray-500">Total Plans</p>
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
                <p className="text-2xl font-bold text-gray-900">{completedPlans}</p>
                <p className="text-sm text-gray-500">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{inProgressPlans}</p>
                <p className="text-sm text-gray-500">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{avgCompletion}%</p>
                <p className="text-sm text-gray-500">Avg. Completion</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by student, career, or school..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === "All" ? "All Status" : status}
                </option>
              ))}
            </select>

            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {gradeOptions.map((grade) => (
                <option key={grade} value={grade}>
                  {grade === "All" ? "All Grades" : `Grade ${grade}`}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedPlans.map((plan) => {
          const statusBadge = getStatusBadge(plan.status);
          const completedMilestones = plan.milestones.filter((m) => m.completed).length;
          const totalMilestones = plan.milestones.length;

          return (
            <Card key={plan.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{plan.studentName}</CardTitle>
                    <CardDescription className="text-xs">
                      Grade {plan.studentGrade} • {plan.studentSchool}
                    </CardDescription>
                  </div>
                  <Badge className={statusBadge.className} variant="outline">
                    {statusBadge.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Target Career */}
                <div className="p-3 rounded-lg" style={{ background: 'linear-gradient(135deg, rgb(168 85 247 / 0.1), rgb(147 51 234 / 0.1))' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" style={{ color: 'rgb(147 51 234)' }} />
                      <span className="font-medium text-sm">{plan.targetCareer}</span>
                    </div>
                    <span className="text-sm font-bold" style={{ color: 'rgb(147 51 234)' }}>{plan.matchPercentage}%</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      RIASEC: {plan.riasecCode}
                    </Badge>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{plan.completionPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${plan.completionPercentage}%`, background: 'linear-gradient(to right, rgb(168 85 247), rgb(147 51 234))' }}
                    />
                  </div>
                </div>

                {/* Milestones */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Milestones</span>
                    <span className="font-medium">{completedMilestones}/{totalMilestones}</span>
                  </div>
                  <div className="space-y-1">
                    {plan.milestones.slice(0, 3).map((milestone, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        {milestone.completed ? (
                          <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                        ) : (
                          <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        )}
                        <span className={milestone.completed ? "text-gray-900" : "text-gray-500"}>{milestone.title}</span>
                      </div>
                    ))}
                    {totalMilestones > 3 && (
                      <p className="text-xs text-gray-500">+{totalMilestones - 3} more milestones</p>
                    )}
                  </div>
                </div>

                {/* Goals Preview */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Lightbulb className="w-3 h-3" />
                    <span className="font-medium">Short-term:</span>
                  </div>
                  <p className="text-xs text-gray-700 line-clamp-2">{plan.shortTermGoals[0]}</p>
                </div>

                {/* Dates */}
                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                  <span>Updated: {new Date(plan.lastUpdated).toLocaleDateString()}</span>
                  <span>Review: {new Date(plan.nextReview).toLocaleDateString()}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/counselor/plans/${plan.id}`}>
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/counselor/plans/${plan.id}/edit`}>
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {paginatedPlans.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No career plans found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your filters or create a new plan</p>
            <Button variant="outline" onClick={() => {
              setSearchQuery("");
              setSelectedStatus("All");
              setSelectedGrade("All");
            }}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredPlans.length)} of {filteredPlans.length}{" "}
            plans
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  style={currentPage === pageNum ? { background: 'linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))' } : {}}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
