"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Users,
  TrendingUp,
  BookOpen,
  Target,
  Calendar,
  Award,
  CheckCircle2,
  AlertCircle,
  Brain,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Flame,
  MessageSquare,
  Phone,
  Clock,
  FileText,
  BarChart3,
  UserCheck,
  Calendar as CalendarIcon,
  AlertTriangle,
  RefreshCw,
  Mail as MailIcon,
  UserMinus,
  Briefcase,
  Video,
  Send,
  X,
  Eye,
  Filter,
  Download,
  Building2,
  Lightbulb,
  Bell,
} from "lucide-react";
import Link from "next/link";
import { INDUSTRIES, OUTREACH_TEMPLATES } from "@/lib/industry-database";

export default function CounselorPortalPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"dashboard" | "students" | "outreach" | "analytics">("dashboard");
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);

  // Mock counselor data
  const [counselorData] = useState({
    name: "Dorji Wangmo",
    school: "Yangchenphug HSS",
    studentsAssigned: 250,
    sessionsThisMonth: 48,
    satisfactionRate: 94,
  });

  // Students needing attention - with detailed indecision data
  const [studentsNeedingAttention, setStudentsNeedingAttention] = useState([
    {
      id: 1,
      name: "Pema Lhamo",
      class: "12 Science",
      profileStrength: 35,
      assessmentCompleteness: 40,
      interestConsistency: 25,
      parentAlignmentGap: 60,
      decisionConfidence: 30,
      lastActivityDays: 14,
      interests: ["Computers", "Art"],
      parentExpectation: "Medical Field",
      priority: "critical",
      status: "not-contacted",
      recommendation: "Strong interest in creative tech (UX Design) but parents want medical",
      aiRecommendation: {
        career: "UX Designer",
        confidence: 85,
        reasoning: ["High creativity scores", "Strong tech aptitude", "Visual thinking strength"],
        pathway: "B.Sc. at CST or private college",
      },
    },
    {
      id: 2,
      name: "Jigme Norbu",
      class: "10 B",
      profileStrength: 45,
      assessmentCompleteness: 50,
      interestConsistency: 35,
      parentAlignmentGap: 45,
      decisionConfidence: 40,
      lastActivityDays: 7,
      interests: ["Sports", "Business"],
      parentExpectation: "Government Job",
      priority: "high",
      status: "contacted",
      recommendation: "Entrepreneurial spirit, could excel in business/sports management",
      aiRecommendation: {
        career: "Business Administration",
        confidence: 78,
        reasoning: ["Leadership qualities", "Team player", "Practical mindset"],
        pathway: "GCBS or private college BBA",
      },
    },
    {
      id: 3,
      name: "Dechen Wangmo",
      class: "12 Arts",
      profileStrength: 60,
      assessmentCompleteness: 70,
      interestConsistency: 50,
      parentAlignmentGap: 30,
      decisionConfidence: 45,
      lastActivityDays: 3,
      interests: ["Literature", "Social Work"],
      parentExpectation: "Open to options",
      priority: "medium",
      status: "not-contacted",
      recommendation: "Good profile, just needs guidance on specific pathways",
      aiRecommendation: {
        career: "Social Worker",
        confidence: 72,
        reasoning: ["Strong empathy", "Communication skills", "Social awareness"],
        pathway: "PCE or Sherubtse B.A.",
      },
    },
  ]);

  // Analytics data
  const [analyticsData] = useState({
    studentDistribution: {
      undecided: 45,
      exploring: 120,
      decided: 85,
    },
    parentInvolvement: {
      highlyEngaged: 80,
      moderatelyEngaged: 120,
      notEngaged: 50,
    },
    topIndustries: [
      { industry: "Technology", students: 85, growth: 25 },
      { industry: "Healthcare", students: 65, growth: 20 },
      { industry: "Government", students: 55, growth: 5 },
      { industry: "Engineering", students: 45, growth: 18 },
    ],
    interventionImpact: {
      contacted: 30,
      responded: 22,
      scheduled: 18,
      resolved: 15,
    },
  });

  // Outreach state
  const [outreachType, setOutreachType] = useState<"parent" | "teacher">("parent");
  const [outreachMessage, setOutreachMessage] = useState("");
  const [sendingOutreach, setSendingOutreach] = useState(false);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const getIndecisionLevel = (student: typeof studentsNeedingAttention[0]) => {
    const avgScore = (
      student.profileStrength +
      student.assessmentCompleteness +
      student.interestConsistency +
      student.decisionConfidence
    ) / 4;

    if (avgScore < 40) return { level: "Critical", color: "red", icon: AlertTriangle };
    if (avgScore < 55) return { level: "High", color: "orange", icon: AlertCircle };
    if (avgScore < 70) return { level: "Medium", color: "yellow", icon: Bell };
    return { level: "Low", color: "green", icon: CheckCircle2 };
  };

  const handleSelectStudent = (studentId: number) => {
    setSelectedStudents(prev =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  const handleOutreach = async () => {
    setSendingOutreach(true);
    setTimeout(() => {
      setSendingOutreach(false);
      setSelectedStudents([]);
      alert(`Outreach sent to ${selectedStudents.length} recipients`);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading Counselor Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 via-blue-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <MessageSquare className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Career Counselor Portal</h1>
                <p className="text-teal-100">{counselorData.school}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center px-4 py-2 bg-white/10 rounded-lg">
                <Users className="w-6 h-6 mx-auto text-teal-200" />
                <p className="text-sm font-medium">{counselorData.studentsAssigned}</p>
                <p className="text-xs text-teal-100">Students</p>
              </div>
              <div className="text-center px-4 py-2 bg-white/10 rounded-lg">
                <Sparkles className="w-6 h-6 mx-auto text-yellow-300" />
                <p className="text-sm font-medium">{counselorData.satisfactionRate}%</p>
                <p className="text-xs text-teal-100">Satisfaction</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex gap-2 bg-white rounded-lg p-1 shadow-sm overflow-x-auto">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all whitespace-nowrap ${
              activeTab === "dashboard" ? "bg-teal-600 text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("students")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all whitespace-nowrap ${
              activeTab === "students" ? "bg-teal-600 text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Users className="w-4 h-4" />
            Students
            <Badge variant={activeTab === "students" ? "secondary" : "outline"} className="ml-1">
              {studentsNeedingAttention.length}
            </Badge>
          </button>
          <button
            onClick={() => setActiveTab("outreach")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all whitespace-nowrap ${
              activeTab === "outreach" ? "bg-teal-600 text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Send className="w-4 h-4" />
            Outreach
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all whitespace-nowrap ${
              activeTab === "analytics" ? "bg-teal-600 text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Analytics
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <>
            {/* Quick Stats */}
            <div className="grid md:grid-cols-5 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-teal-100 text-sm">Total Students</p>
                      <p className="text-3xl font-bold">{counselorData.studentsAssigned}</p>
                    </div>
                    <Users className="w-10 h-10 text-teal-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Undecided</p>
                      <p className="text-3xl font-bold">{analyticsData.studentDistribution.undecided}</p>
                    </div>
                    <AlertCircle className="w-10 h-10 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-indigo-100 text-sm">Decided</p>
                      <p className="text-3xl font-bold">{analyticsData.studentDistribution.decided}</p>
                    </div>
                    <CheckCircle2 className="w-10 h-10 text-indigo-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm">Sessions This Month</p>
                      <p className="text-3xl font-bold">{counselorData.sessionsThisMonth}</p>
                    </div>
                    <Calendar className="w-10 h-10 text-orange-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-100 text-sm">Critical Cases</p>
                      <p className="text-3xl font-bold">
                        {studentsNeedingAttention.filter(s => s.priority === "critical").length}
                      </p>
                    </div>
                    <AlertTriangle className="w-10 h-10 text-red-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Critical Students Requiring Human Intervention */}
                <Card className="border-2 border-red-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        Students Requiring Human Intervention
                      </CardTitle>
                      <Button size="sm" variant="outline" onClick={() => setActiveTab("students")}>
                        View All
                      </Button>
                    </div>
                    <CardDescription>
                      Human + AI: Empowering students to make informed career decisions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {studentsNeedingAttention.map((student) => {
                        const level = getIndecisionLevel(student);
                        const LevelIcon = level.icon;
                        return (
                          <div key={student.id} className="p-4 bg-red-50 rounded-lg border border-red-200">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-red-700 font-bold shadow">
                                  {student.name.split(" ").map((n: string) => n[0]).join("")}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold">{student.name}</p>
                                    <Badge className={
                                      student.priority === "critical" ? "bg-red-600 text-white" :
                                      student.priority === "high" ? "bg-orange-500 text-white" :
                                      "bg-yellow-500 text-white"
                                    }>
                                      {student.priority.toUpperCase()}
                                    </Badge>
                                    <Badge variant="outline">{student.class}</Badge>
                                  </div>
                                  <p className="text-sm text-gray-500">Last active: {student.lastActivityDays} days ago</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <LevelIcon className={`w-5 h-5 text-${level.color}-600`} />
                                <span className="text-sm font-medium">{level.level} Need</span>
                              </div>
                            </div>

                            {/* Decision Metrics */}
                            <div className="grid grid-cols-5 gap-3 mb-3">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Profile</p>
                                <Progress value={student.profileStrength} className="h-2" />
                                <p className="text-xs text-right mt-1">{student.profileStrength}%</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Assessment</p>
                                <Progress value={student.assessmentCompleteness} className="h-2" />
                                <p className="text-xs text-right mt-1">{student.assessmentCompleteness}%</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Interest</p>
                                <Progress value={student.interestConsistency} className="h-2" />
                                <p className="text-xs text-right mt-1">{student.interestConsistency}%</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Confidence</p>
                                <Progress value={student.decisionConfidence} className="h-2" />
                                <p className="text-xs text-right mt-1">{student.decisionConfidence}%</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Parent Gap</p>
                                <Progress value={student.parentAlignmentGap} className="h-2 bg-orange-400" />
                                <p className="text-xs text-right mt-1">{student.parentAlignmentGap}%</p>
                              </div>
                            </div>

                            {/* AI + Human Recommendation */}
                            <div className="bg-white p-3 rounded-lg border border-gray-200 mb-3">
                              <div className="flex items-start gap-3">
                                <Brain className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-700">
                                    AI Recommendation (based on passion + results + assessment)
                                  </p>
                                  <div className="mt-2 p-2 bg-purple-50 rounded">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-medium">{student.aiRecommendation.career}</span>
                                      <Badge className="bg-purple-100 text-purple-800">
                                        {student.aiRecommendation.confidence}% confidence
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-gray-600 mb-1">Why: {student.aiRecommendation.reasoning.join(", ")}</p>
                                    <p className="text-xs text-blue-600">Pathway: {student.aiRecommendation.pathway}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Human Insight */}
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-3">
                              <div className="flex items-start gap-2">
                                <UserCheck className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-700">Counselor Insight</p>
                                  <p className="text-sm text-gray-600">{student.recommendation}</p>
                                </div>
                              </div>
                            </div>

                            {/* Parent-Student Gap */}
                            {student.parentAlignmentGap > 40 && (
                              <div className="flex items-center gap-2 text-xs text-orange-600">
                                <AlertCircle className="w-3 h-3" />
                                <span>
                                  Parent expects "{student.parentExpectation}" but student prefers {student.interests.join(", ")}
                                </span>
                              </div>
                            )}

                            {/* Quick Actions */}
                            <div className="flex gap-2 mt-3">
                              <Button size="sm" variant="outline">
                                <Phone className="w-4 h-4 mr-1" />
                                Call Student
                              </Button>
                              <Button size="sm" variant="outline">
                                <MailIcon className="w-4 h-4 mr-1" />
                                Email Parent
                              </Button>
                              <Button size="sm" variant="outline">
                                <GraduationCap className="w-4 h-4 mr-1" />
                                Contact Teacher
                              </Button>
                              <Button size="sm">
                                <CalendarIcon className="w-4 h-4 mr-1" />
                                Schedule Session
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab("students")}>
                      <Users className="w-4 h-4 mr-2" />
                      View At-Risk Students
                    </Button>
                    <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab("outreach")}>
                      <Send className="w-4 h-4 mr-2" />
                      Send Outreach
                    </Button>
                    <Button className="w-full justify-start" variant="outline" asChild>
                      <Link href="/dashboard/assessment">
                        <Target className="w-4 h-4 mr-2" />
                        Schedule Assessment
                      </Link>
                    </Button>
                    <Button className="w-full justify-start" variant="outline" asChild>
                      <Link href="/dashboard/careers">
                        <Briefcase className="w-4 h-4 mr-2" />
                        Career Database
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                {/* Intervention Impact */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-teal-600" />
                      Intervention Impact
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Contacted</span>
                        <span className="font-bold">{analyticsData.interventionImpact.contacted}</span>
                      </div>
                      <Progress value={(analyticsData.interventionImpact.contacted / 30) * 100} className="h-2" />

                      <div className="flex items-center justify-between">
                        <span className="text-sm">Responded</span>
                        <span className="font-bold">{analyticsData.interventionImpact.responded}</span>
                      </div>
                      <Progress value={(analyticsData.interventionImpact.responded / 30) * 100} className="h-2" />

                      <div className="flex items-center justify-between">
                        <span className="text-sm">Sessions Scheduled</span>
                        <span className="font-bold">{analyticsData.interventionImpact.scheduled}</span>
                      </div>
                      <Progress value={(analyticsData.interventionImpact.scheduled / 30) * 100} className="h-2" />

                      <div className="flex items-center justify-between">
                        <span className="text-sm">Resolved</span>
                        <span className="font-bold text-green-600">{analyticsData.interventionImpact.resolved}</span>
                      </div>
                      <Progress value={(analyticsData.interventionImpact.resolved / 30) * 100} className="h-2 bg-green-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}

        {/* Students Tab */}
        {activeTab === "students" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Students Requiring Human Intervention</CardTitle>
                    <CardDescription>
                      Empower students with AI recommendations + human guidance for informed decisions
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {studentsNeedingAttention.map((student) => {
                    const level = getIndecisionLevel(student);
                    const LevelIcon = level.icon;
                    return (
                      <div key={student.id} className={`p-4 rounded-lg border-2 ${
                        student.priority === "critical" ? "bg-red-50 border-red-300" :
                        student.priority === "high" ? "bg-orange-50 border-orange-300" :
                        "bg-yellow-50 border-yellow-300"
                      }`}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(student.id)}
                              onChange={() => handleSelectStudent(student.id)}
                              className="w-5 h-5 rounded"
                            />
                            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center font-bold text-lg shadow">
                              {student.name.split(" ").map((n: string) => n[0]).join("")}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-lg">{student.name}</p>
                                <Badge className={
                                  student.priority === "critical" ? "bg-red-600 text-white" :
                                  student.priority === "high" ? "bg-orange-500 text-white" :
                                  "bg-yellow-500 text-white"
                                }>
                                  {student.priority.toUpperCase()}
                                </Badge>
                                <Badge variant="outline">{student.class}</Badge>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                Last activity: {student.lastActivityDays} days ago
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <LevelIcon className={`w-5 h-5 text-${level.color}-600`} />
                            <span className="font-medium">{level.level} Priority</span>
                            <Badge className={
                              student.status === "contacted" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-600"
                            }>
                              {student.status === "contacted" ? "Contacted" : "Not Contacted"}
                            </Badge>
                          </div>
                        </div>

                        {/* Decision Metrics */}
                        <div className="grid grid-cols-5 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Profile Strength</p>
                            <Progress value={student.profileStrength} className="h-2" />
                            <p className="text-xs text-right mt-1 font-medium">{student.profileStrength}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Assessment Done</p>
                            <Progress value={student.assessmentCompleteness} className="h-2" />
                            <p className="text-xs text-right mt-1 font-medium">{student.assessmentCompleteness}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Interest Consistency</p>
                            <Progress value={student.interestConsistency} className="h-2" />
                            <p className="text-xs text-right mt-1 font-medium">{student.interestConsistency}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Decision Confidence</p>
                            <Progress value={student.decisionConfidence} className="h-2" />
                            <p className="text-xs text-right mt-1 font-medium">{student.decisionConfidence}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Parent Gap</p>
                            <Progress value={student.parentAlignmentGap} className="h-2 bg-orange-400" />
                            <p className="text-xs text-right mt-1 font-medium">{student.parentAlignmentGap}% gap</p>
                          </div>
                        </div>

                        {/* Data-Driven Recommendation Box */}
                        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200 mb-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Brain className="w-5 h-5 text-purple-600" />
                            <p className="font-semibold">Data-Driven Recommendation</p>
                            <Badge className="bg-purple-100 text-purple-800">
                              {student.aiRecommendation.confidence}% Confidence
                            </Badge>
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-gray-700">Recommended Career</p>
                              <p className="text-lg font-bold text-purple-700">{student.aiRecommendation.career}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700">Education Pathway</p>
                              <p className="text-sm text-blue-600">{student.aiRecommendation.pathway}</p>
                            </div>
                          </div>
                          <div className="mt-3">
                            <p className="text-xs text-gray-500 mb-1">Why this match?</p>
                            <p className="text-sm text-gray-700">{student.aiRecommendation.reasoning.join(" • ")}</p>
                          </div>
                        </div>

                        {/* Human Intervention Notes */}
                        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
                          <div className="flex items-start gap-2 mb-2">
                            <UserCheck className="w-4 h-4 text-blue-600 mt-0.5" />
                            <p className="text-sm font-medium text-gray-700">Counselor Notes & Human Insight</p>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{student.recommendation}</p>
                          <div className="grid md:grid-cols-2 gap-4 text-xs bg-gray-50 p-3 rounded">
                            <div>
                              <span className="text-gray-500">Student Interests:</span>
                              <span className="ml-2 font-medium">{student.interests.join(", ")}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Parent Expectation:</span>
                              <span className="ml-2 font-medium">{student.parentExpectation}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline">
                            <Phone className="w-4 h-4 mr-2" />
                            Call Student
                          </Button>
                          <Button size="sm" variant="outline">
                            <MailIcon className="w-4 h-4 mr-2" />
                            Email Parent
                          </Button>
                          <Button size="sm" variant="outline">
                            <GraduationCap className="w-4 h-4 mr-2" />
                            Contact Teacher
                          </Button>
                          <Button size="sm">
                            <CalendarIcon className="w-4 h-4 mr-2" />
                            Schedule Session
                          </Button>
                          <Button size="sm" variant="secondary">
                            <Eye className="w-4 h-4 mr-2" />
                            Full Profile
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Outreach Tab */}
        {activeTab === "outreach" && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Student Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Students for Outreach</CardTitle>
                <CardDescription>Choose students and customize your outreach message</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {studentsNeedingAttention.map((student) => (
                    <div
                      key={student.id}
                      onClick={() => handleSelectStudent(student.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedStudents.includes(student.id)
                          ? "bg-teal-50 border-teal-500"
                          : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => handleSelectStudent(student.id)}
                          className="w-5 h-5"
                        />
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center font-bold">
                          {student.name.split(" ").map((n: string) => n[0]).join("")}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-gray-500">{student.class} • {student.priority} priority</p>
                        </div>
                        {student.status === "contacted" && (
                          <CheckCircle2 className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                  <p className="text-sm font-medium">
                    {selectedStudents.length} student{selectedStudents.length !== 1 ? "s" : ""} selected
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Message Composer */}
            <Card>
              <CardHeader>
                <CardTitle>Compose Outreach</CardTitle>
                <CardDescription>Send personalized outreach to parents or teachers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Outreach Type</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setOutreachType("parent")}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                        outreachType === "parent" ? "bg-blue-50 border-blue-500" : "border-gray-200"
                      }`}
                    >
                      <Users className="w-5 h-5 mx-auto mb-1" />
                      <p className="text-sm font-medium">Parent Outreach</p>
                    </button>
                    <button
                      onClick={() => setOutreachType("teacher")}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                        outreachType === "teacher" ? "bg-blue-50 border-blue-500" : "border-gray-200"
                      }`}
                    >
                      <GraduationCap className="w-5 h-5 mx-auto mb-1" />
                      <p className="text-sm font-medium">Teacher Inquiry</p>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Message Template</label>
                  <div className="space-y-2">
                    <button
                      onClick={() => setOutreachMessage(OUTREACH_TEMPLATES.parent.email)}
                      className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg text-sm"
                    >
                      <MailIcon className="w-4 h-4 inline mr-2" />
                      Parent Email Template
                    </button>
                    <button
                      onClick={() => setOutreachMessage(OUTREACH_TEMPLATES.parent.sms)}
                      className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg text-sm"
                    >
                      <MessageSquare className="w-4 h-4 inline mr-2" />
                      SMS Template
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Customize Message</label>
                  <Textarea
                    value={outreachMessage}
                    onChange={(e) => setOutreachMessage(e.target.value)}
                    placeholder="Type your message or select a template above..."
                    rows={8}
                    className="w-full"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleOutreach}
                    disabled={selectedStudents.length === 0 || sendingOutreach}
                    className="flex-1"
                  >
                    {sendingOutreach ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send to {selectedStudents.length} Recipient{selectedStudents.length !== 1 ? "s" : ""}
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => { setSelectedStudents([]); setOutreachMessage(""); }}>
                    <X className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* Student Decision Distribution */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Undecided Students</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-red-600 mb-2">
                      {analyticsData.studentDistribution.undecided}
                    </div>
                    <Progress value={(analyticsData.studentDistribution.undecided / 250) * 100} className="h-2 mb-2" />
                    <p className="text-sm text-gray-500">{Math.round((analyticsData.studentDistribution.undecided / 250) * 100)}% of total</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Exploring Options</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-blue-600 mb-2">
                      {analyticsData.studentDistribution.exploring}
                    </div>
                    <Progress value={(analyticsData.studentDistribution.exploring / 250) * 100} className="h-2 mb-2" />
                    <p className="text-sm text-gray-500">{Math.round((analyticsData.studentDistribution.exploring / 250) * 100)}% of total</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Decided</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-green-600 mb-2">
                      {analyticsData.studentDistribution.decided}
                    </div>
                    <Progress value={(analyticsData.studentDistribution.decided / 250) * 100} className="h-2 mb-2" />
                    <p className="text-sm text-gray-500">{Math.round((analyticsData.studentDistribution.decided / 250) * 100)}% of total</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Parent Engagement */}
            <Card>
              <CardHeader>
                <CardTitle>Parent Engagement Levels</CardTitle>
                <CardDescription>How involved are parents in their child's career journey?</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <UserCheck className="w-8 h-8 mx-auto text-green-600 mb-2" />
                    <p className="text-2xl font-bold text-green-700">{analyticsData.parentInvolvement.highlyEngaged}</p>
                    <p className="text-sm text-gray-600">Highly Engaged</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <Eye className="w-8 h-8 mx-auto text-yellow-600 mb-2" />
                    <p className="text-2xl font-bold text-yellow-700">{analyticsData.parentInvolvement.moderatelyEngaged}</p>
                    <p className="text-sm text-gray-600">Moderately Engaged</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <UserMinus className="w-8 h-8 mx-auto text-red-600 mb-2" />
                    <p className="text-2xl font-bold text-red-700">{analyticsData.parentInvolvement.notEngaged}</p>
                    <p className="text-sm text-gray-600">Not Engaged</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Industries */}
            <Card>
              <CardHeader>
                <CardTitle>Popular Career Industries</CardTitle>
                <CardDescription>Student interest by industry sector with growth data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.topIndustries.map((industry) => (
                    <div key={industry.industry} className="flex items-center gap-4">
                      <div className="w-32 text-sm font-medium">{industry.industry}</div>
                      <div className="flex-1">
                        <Progress value={(industry.students / 250) * 100} className="h-3" />
                      </div>
                      <div className="w-16 text-right">
                        <p className="text-sm font-medium">{industry.students} students</p>
                        <p className="text-xs text-green-600">+{industry.growth}% growth</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Full Industry Database */}
            <Card>
              <CardHeader>
                <CardTitle>Industry Career Database</CardTitle>
                <CardDescription>Browse careers by industry with demand, salary, and study abroad options</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {INDUSTRIES.map((industry) => (
                    <div key={industry.id} className="p-4 bg-gray-50 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="text-3xl">{industry.icon}</div>
                        <div>
                          <p className="font-medium">{industry.name}</p>
                          <Badge className={`bg-gradient-to-r ${industry.color} text-white`}>
                            {industry.demandInBhutan}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{industry.description}</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Salary:</span>
                          <span className="font-medium">{industry.avgSalaryRange}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Growth:</span>
                          <span className="text-green-600">{industry.growthOutlook}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Study Abroad:</span>
                          <span className="font-medium">{industry.studyAbroadPotential.slice(0, 2).join(", ")}</span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-1">Careers:</p>
                        <div className="flex flex-wrap gap-1">
                          {industry.relatedCareers.slice(0, 3).map((career) => (
                            <Badge key={career} variant="outline" className="text-xs">
                              {career}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
