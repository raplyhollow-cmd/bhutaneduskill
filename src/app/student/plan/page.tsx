"use client";

/**
 * STUDENT CAREER PLAN PAGE
 * View assessment results, career paths, skills development, and academic goals
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Target,
  Brain,
  TrendingUp,
  Calendar,
  CheckCircle,
  Circle,
  Plus,
  Edit,
  BookOpen,
  Award,
  Lightbulb,
  ArrowRight,
  Briefcase,
  GraduationCap,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface AssessmentProfile {
  completedAssessments: number;
  assessmentTypes: string[];
  riasec: {
    hollandCode: string;
    description: string;
    scores: Record<string, number>;
    dominantTraits: string[];
  } | null;
  mbti: {
    type: string;
    description: string;
    strengths: string[];
  } | null;
  topCareers: Array<{
    id: string;
    title: string;
    matchScore: number;
  }>;
}

interface Goal {
  id: string;
  title: string;
  deadline: string;
  status: "completed" | "in_progress" | "not_started";
  progress: number;
  category: string;
  actions: Array<{ text: string; done: boolean }>;
}

// Static timeline milestones (these are educational milestones, not user-specific)
const TIMELINE_MILESTONES: Array<{
  id: string;
  date: string;
  title: string;
  status: "upcoming" | "in_progress" | "completed" | "not_started";
  description: string;
  icon: any;
}> = [
  {
    id: "t1",
    date: "Phase 1",
    title: "Career Assessment",
    status: "upcoming",
    description: "Complete RIASEC and MBTI assessments",
    icon: Brain,
  },
  {
    id: "t2",
    date: "Phase 2",
    title: "Career Exploration",
    status: "upcoming",
    description: "Explore matched careers and RUB colleges",
    icon: Briefcase,
  },
  {
    id: "t3",
    date: "Phase 3",
    title: "Skill Development",
    status: "upcoming",
    description: "Build skills through courses and activities",
    icon: TrendingUp,
  },
  {
    id: "t4",
    date: "Phase 4",
    title: "Exam Preparation",
    status: "upcoming",
    description: "Prepare for Class 10/12 board exams",
    icon: GraduationCap,
  },
  {
    id: "t5",
    date: "Phase 5",
    title: "College Applications",
    status: "upcoming",
    description: "Apply to RUB colleges and scholarships",
    icon: Target,
  },
];

function StudentPlanPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [assessmentProfile, setAssessmentProfile] = useState<AssessmentProfile | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/student/assessment-profile").catch(() => null),
      fetch("/api/student/goals").catch(() => null),
    ])
      .then(async ([profileRes, goalsRes]) => {
        const profileData = profileRes?.ok ? await profileRes.json() : null;
        const goalsData = goalsRes?.ok ? await goalsRes.json() : null;

        setAssessmentProfile(profileData);
        setGoals(goalsData?.goals || []);

        // Update timeline status based on assessments completed
        const updatedMilestones = [...TIMELINE_MILESTONES];
        const completedAssessments = profileData?.completedAssessments || 0;

        if (completedAssessments >= 2) {
          updatedMilestones[0].status = "completed";
          updatedMilestones[1].status = "in_progress";
        } else if (completedAssessments >= 1) {
          updatedMilestones[0].status = "in_progress";
        }

        return updatedMilestones;
      })
      .then((updatedMilestones) => {
        setTimeline(updatedMilestones);
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
        setError("Failed to load your plan data");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const [timeline, setTimeline] = useState(TIMELINE_MILESTONES);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "in_progress":
        return "bg-orange-100 text-orange-700";
      case "upcoming":
        return "bg-blue-100 text-blue-700";
      case "not_started":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getGoalStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600";
      case "in_progress":
        return "text-orange-600";
      default:
        return "text-gray-400";
    }
  };

  // Calculate overall progress
  const overallProgress = assessmentProfile
    ? Math.min(100, (assessmentProfile.completedAssessments / 4) * 100)
    : 0;

  // Get top career matches with enhanced data
  const topCareers = assessmentProfile?.topCareers?.slice(0, 3).map((career) => ({
    id: career.id,
    name: career.title,
    matchPercentage: Math.round(career.matchScore * 100) || 85,
    riasecCode: assessmentProfile?.riasec?.hollandCode || "SIA",
    cluster: "Career",
    description: "Based on your assessment results",
    education: "Bachelor's Degree",
    avgSalary: "Nu. 30,000 - 60,000/month",
  })) || [];

  // Skills from API (placeholder for now - will be enhanced)
  const mockSkills = [
    {
      id: "s1",
      name: "Communication Skills",
      category: "Core",
      currentLevel: 65,
      targetLevel: 85,
      status: "in_progress",
      activities: ["Public Speaking Club", "Debate Team", "Peer Tutoring"],
    },
    {
      id: "s2",
      name: "Problem Solving",
      category: "Core",
      currentLevel: 75,
      targetLevel: 90,
      status: "in_progress",
      activities: ["Math Olympiad", "Puzzle Challenges", "Research Projects"],
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-600" />
          <p className="text-gray-600">Loading your career plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card className="mb-6" style={{ background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)' }}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-white">
            <div>
              <h2 className="text-2xl font-bold mb-1">Your Career Journey</h2>
              <p className="text-orange-100">Track your progress from assessment to admission</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-3xl font-bold">{Math.round(overallProgress)}%</p>
                <p className="text-orange-100 text-sm">Overall Progress</p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Target className="w-8 h-8" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" className="min-h-[44px]">Overview</TabsTrigger>
          <TabsTrigger value="assessments" className="min-h-[44px]">Assessments</TabsTrigger>
          <TabsTrigger value="goals" className="min-h-[44px]">Goals</TabsTrigger>
          <TabsTrigger value="timeline" className="min-h-[44px]">Timeline</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Quick Stats */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{assessmentProfile?.completedAssessments || 0}/4</p>
                    <p className="text-sm text-gray-600">Assessments</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Target className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">{goals.filter((g) => g.status === "in_progress").length + goals.filter((g) => g.status === "not_started").length}</p>
                    <p className="text-sm text-gray-600">Active Goals</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{topCareers.length}</p>
                    <p className="text-sm text-gray-600">Career Matches</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">{mockSkills.length}</p>
                    <p className="text-sm text-gray-600">Skills Building</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Career Matches */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Top Career Matches</CardTitle>
                  <CardDescription>Based on your assessment results</CardDescription>
                </div>
                <Link href="/student/careers">
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {topCareers.length > 0 ? (
                <div className="space-y-4">
                  {topCareers.map((career) => (
                    <div
                      key={career.id}
                      className="flex items-center gap-4 p-4 rounded-lg border hover:border-orange-300 hover:bg-orange-50/50 transition-colors cursor-pointer"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                        {career.matchPercentage}%
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{career.name}</h4>
                          <Badge variant="outline" className="text-xs">{career.cluster}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">{career.description}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Brain className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Complete your assessments to see career matches</p>
                  <Link href="/student/assessment">
                    <Button className="mt-4">Take Assessment</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Skills Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Skills Development</CardTitle>
              <CardDescription>Track your skill-building progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {mockSkills.slice(0, 4).map((skill) => (
                  <div key={skill.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{skill.name}</h4>
                        <p className="text-sm text-gray-500">{skill.category} Skill</p>
                      </div>
                      <Badge className={getStatusColor(skill.status)}>
                        {skill.status === "in_progress" ? "In Progress" : skill.status === "completed" ? "Done" : "Not Started"}
                      </Badge>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{skill.currentLevel}% → {skill.targetLevel}%</span>
                      </div>
                      <Progress value={skill.currentLevel} />
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/student/skills">
                <Button variant="outline" className="w-full mt-4">
                  View All Skills
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assessments Tab */}
        <TabsContent value="assessments" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* RIASEC Result */}
            <Card className={assessmentProfile?.riasec ? "" : "opacity-60"}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>RIASEC Assessment</CardTitle>
                  {assessmentProfile?.riasec ? (
                    <Badge className="bg-green-100 text-green-700">Completed</Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-700">Pending</Badge>
                  )}
                </div>
                {assessmentProfile?.riasec && (
                  <CardDescription>Holland Code: {assessmentProfile.riasec.hollandCode}</CardDescription>
                )}
              </CardHeader>
              {assessmentProfile?.riasec ? (
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {Object.entries(assessmentProfile.riasec.scores).map(([trait, score]) => (
                      <div key={trait} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{trait}</span>
                          <span>{score as number}/30</span>
                        </div>
                        <Progress value={((score as number) / 30) * 100} className="h-2" />
                      </div>
                    ))}
                  </div>
                  <div className="pt-3 border-t">
                    <p className="text-sm font-medium mb-2">Top Traits:</p>
                    <div className="flex flex-wrap gap-2">
                      {assessmentProfile.riasec.dominantTraits.map((trait) => (
                        <Badge key={trait} variant="secondary">{trait}</Badge>
                      ))}
                    </div>
                  </div>
                  <Link href="/student/assessment/riasec">
                    <Button variant="outline" size="sm" className="w-full">View Full Results</Button>
                  </Link>
                </CardContent>
              ) : (
                <CardContent>
                  <Link href="/student/assessment/riasec">
                    <Button className="w-full">Take Assessment</Button>
                  </Link>
                </CardContent>
              )}
            </Card>

            {/* MBTI Result */}
            <Card className={assessmentProfile?.mbti ? "" : "opacity-60"}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>MBTI Assessment</CardTitle>
                  {assessmentProfile?.mbti ? (
                    <Badge className="bg-green-100 text-green-700">Completed</Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-700">Pending</Badge>
                  )}
                </div>
                {assessmentProfile?.mbti && (
                  <CardDescription>Type: {assessmentProfile.mbti.type}</CardDescription>
                )}
              </CardHeader>
              {assessmentProfile?.mbti ? (
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">{assessmentProfile.mbti.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {assessmentProfile.mbti.type.split('').map((trait) => (
                      <Badge key={trait} variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        {trait}
                      </Badge>
                    ))}
                  </div>
                  <Link href="/student/assessment/mbti">
                    <Button variant="outline" size="sm" className="w-full">View Full Results</Button>
                  </Link>
                </CardContent>
              ) : (
                <CardContent>
                  <Link href="/student/assessment/mbti">
                    <Button className="w-full">Take Assessment</Button>
                  </Link>
                </CardContent>
              )}
            </Card>

            {/* More Assessments */}
            <Card className="border-dashed">
              <CardContent className="pt-6 flex flex-col items-center justify-center text-center h-full min-h-[200px]">
                <Brain className="w-12 h-12 text-gray-300 mb-3" />
                <h3 className="font-semibold text-gray-900">More Assessments</h3>
                <p className="text-sm text-gray-500 mb-4">Explore additional assessments</p>
                <Link href="/student/assessment">
                  <Button variant="outline" size="sm">Browse All</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Your Goals</h2>
              <p className="text-gray-600">Track your academic and personal development goals</p>
            </div>
            <Button size="sm" className="min-h-[44px]">
              <Plus className="w-4 h-4 mr-2" />
              Add Goal
            </Button>
          </div>

          <div className="grid gap-4">
            {goals.length > 0 ? goals.map((goal) => (
              <Card key={goal.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className={getGoalStatusColor(goal.status)}>
                      {goal.status === "completed" ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <Circle className="w-6 h-6" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-500">
                              {new Date(goal.deadline).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                        <Badge className={getStatusColor(goal.status)}>
                          {goal.status === "completed" ? "Completed" : goal.status === "in_progress" ? "In Progress" : "Not Started"}
                        </Badge>
                      </div>

                      <Progress value={goal.progress} className="my-3" />

                      {goal.actions.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {goal.actions.slice(0, 4).map((action, idx) => (
                            <div key={idx} className="flex items-center gap-3 text-sm">
                              {action.done ? (
                                <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                              ) : (
                                <Circle className="w-4 h-4 text-gray-300 shrink-0" />
                              )}
                              <span className={action.done ? "text-gray-500 line-through" : "text-gray-700"}>
                                {action.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button variant="ghost" size="icon" className="shrink-0">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <Target className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold mb-2">No goals yet</h3>
                  <p className="text-gray-600 mb-4">Start by setting your first academic or career goal</p>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Goal
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Journey Timeline</CardTitle>
              <CardDescription>Key milestones from assessment to college admission</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

                <div className="space-y-6">
                  {timeline.map((milestone, idx) => {
                    const Icon = milestone.icon;
                    return (
                      <div key={milestone.id} className="relative flex gap-6">
                        {/* Timeline dot */}
                        <div className={`
                          relative z-10 w-12 h-12 rounded-full flex items-center justify-center shrink-0
                          ${milestone.status === "completed" ? "bg-green-500" : ""}
                          ${milestone.status === "in_progress" ? "bg-orange-500" : ""}
                          ${milestone.status === "upcoming" ? "bg-gray-300" : ""}
                        `}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>

                        {/* Content */}
                        <Card className={`flex-1 ${milestone.status === "completed" ? "bg-green-50 border-green-200" : milestone.status === "in_progress" ? "bg-orange-50 border-orange-200" : ""}`}>
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold">{milestone.title}</h4>
                                  <Badge className={getStatusColor(milestone.status)} variant="outline">
                                    {milestone.status === "completed" ? "Completed" : milestone.status === "in_progress" ? "In Progress" : "Upcoming"}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600">{milestone.description}</p>
                                <p className="text-xs text-gray-500 mt-1">{milestone.date}</p>
                              </div>
                              {milestone.status === "not_started" && (
                                <Lightbulb className="w-5 h-5 text-orange-500" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader>
              <CardTitle>Key Dates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div>
                    <p className="font-medium">Class 10/12 Board Exams</p>
                    <p className="text-sm text-gray-600">BCSE/BCSEA Examination</p>
                  </div>
                  <Badge className="bg-orange-100 text-orange-700">March</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <p className="font-medium">RUB Application Portal</p>
                    <p className="text-sm text-gray-600">Start college applications</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700">June</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <p className="font-medium">Scholarship Applications</p>
                    <p className="text-sm text-gray-600">Apply for scholarships</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700">July</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default StudentPlanPage;
