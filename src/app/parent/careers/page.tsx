/**
 * PARENT CAREERS PAGE
 *
 * Allows parents to view career guidance information for their child, including:
 * - Child's assessment results
 * - Recommended career paths
 * - Skills development suggestions
 * - Course recommendations
 * - College planning timeline
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChildSelector, Child } from "@/components/parent/child-selector";
import {
  Briefcase,
  TrendingUp,
  Target,
  GraduationCap,
  BookOpen,
  Sparkles,
  Lightbulb,
  Calendar,
  Globe,
  Award,
  Building2,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Info,
  Code,
  Palette,
  Microscope,
  Calculator,
  Globe2,
  Heart,
} from "lucide-react";
import Link from "next/link";

// Mock children data
const mockChildren: Child[] = [
  {
    id: "child1",
    name: "Tashi Dorji",
    firstName: "Tashi",
    lastName: "Dorji",
    grade: "Class 10",
    classGrade: 10,
    section: "A",
    school: "Yangchenphug HSS",
    assessmentCompleted: true,
    riasecCode: "AIR",
  },
  {
    id: "child2",
    name: "Pema Lhamo",
    firstName: "Pema",
    lastName: "Lhamo",
    grade: "Class 8",
    classGrade: 8,
    section: "B",
    school: "Motithang HSS",
    assessmentCompleted: true,
    riasecCode: "SCE",
  },
];

// RIASEC type descriptions
const riasecTypes: Record<string, { name: string; description: string; color: string; icon: any }> = {
  R: { name: "Realistic", description: "Practical, hands-on activities", color: "bg-green-100 text-green-700", icon: Calculator },
  I: { name: "Investigative", description: "Analyzing, investigating", color: "bg-blue-100 text-blue-700", icon: Microscope },
  A: { name: "Artistic", description: "Creative, original work", color: "bg-purple-100 text-purple-700", icon: Palette },
  S: { name: "Social", description: "Helping, teaching people", color: "bg-pink-100 text-pink-700", icon: Heart },
  E: { name: "Enterprising", description: "Leading, persuading", color: "bg-orange-100 text-orange-700", icon: TrendingUp },
  C: { name: "Conventional", description: "Organizing data/systems", color: "bg-gray-100 text-gray-700", icon: Code },
};

// Mock career matches
const mockCareerMatches: Record<string, Array<{
  career: string;
  matchScore: number;
  riasecCode: string;
  category: string;
  description: string;
  salary: string;
  demand: "high" | "medium" | "low";
}>> = {
  child1: [
    {
      career: "Software Developer",
      matchScore: 92,
      riasecCode: "IAR",
      category: "Technology",
      description: "Design and develop software applications and systems",
      salary: "Nu. 50,000 - 150,000/month",
      demand: "high",
    },
    {
      career: "UX Designer",
      matchScore: 88,
      riasecCode: "AIR",
      category: "Design",
      description: "Create user-friendly digital experiences",
      salary: "Nu. 40,000 - 120,000/month",
      demand: "high",
    },
    {
      career: "Data Scientist",
      matchScore: 85,
      riasecCode: "I",
      category: "Technology",
      description: "Analyze complex data to drive decisions",
      salary: "Nu. 60,000 - 180,000/month",
      demand: "high",
    },
    {
      career: "Digital Artist",
      matchScore: 82,
      riasecCode: "A",
      category: "Creative",
      description: "Create digital art and animations",
      salary: "Nu. 30,000 - 100,000/month",
      demand: "medium",
    },
  ],
  child2: [
    {
      career: "Teacher",
      matchScore: 90,
      riasecCode: "S",
      category: "Education",
      description: "Educate and inspire students",
      salary: "Nu. 25,000 - 60,000/month",
      demand: "high",
    },
    {
      career: "Counselor",
      matchScore: 85,
      riasecCode: "S",
      category: "Healthcare",
      description: "Help people with personal and social challenges",
      salary: "Nu. 30,000 - 80,000/month",
      demand: "medium",
    },
    {
      career: "Nurse",
      matchScore: 82,
      riasecCode: "S",
      category: "Healthcare",
      description: "Provide patient care and support",
      salary: "Nu. 25,000 - 70,000/month",
      demand: "high",
    },
  ],
};

// Mock skills data
const mockSkills: Record<string, {
  developed: Array<{ name: string; level: number; category: string }>;
  recommended: Array<{ name: string; category: string; priority: "high" | "medium" | "low" }>;
}> = {
  child1: {
    developed: [
      { name: "Problem Solving", level: 85, category: "Cognitive" },
      { name: "Mathematics", level: 88, category: "Academic" },
      { name: "Computer Basics", level: 75, category: "Technical" },
      { name: "Creativity", level: 80, category: "Creative" },
    ],
    recommended: [
      { name: "Python Programming", category: "Technical", priority: "high" },
      { name: "Web Development", category: "Technical", priority: "high" },
      { name: "Data Analysis", category: "Technical", priority: "medium" },
      { name: "Communication Skills", category: "Soft Skills", priority: "medium" },
      { name: "Team Collaboration", category: "Soft Skills", priority: "medium" },
    ],
  },
  child2: {
    developed: [
      { name: "Communication", level: 82, category: "Soft Skills" },
      { name: "Empathy", level: 90, category: "Soft Skills" },
      { name: "English", level: 78, category: "Academic" },
      { name: "Dzongkha", level: 85, category: "Academic" },
    ],
    recommended: [
      { name: "Public Speaking", category: "Soft Skills", priority: "high" },
      { name: "Leadership Skills", category: "Soft Skills", priority: "medium" },
      { name: "Psychology Basics", category: "Academic", priority: "medium" },
      { name: "First Aid", category: "Healthcare", priority: "low" },
    ],
  },
};

// Mock college recommendations
const mockCollegeRecommendations: Record<string, Array<{
  name: string;
  location: string;
  programs: string[];
  deadline: string;
  type: "rub" | "international";
}>> = {
  child1: [
    {
      name: "College of Science and Technology (CST)",
      location: "Rinchending, Phuentsholing",
      programs: ["B.E. in Computer Science", "B.E. in Information Technology"],
      deadline: "March 31, 2025",
      type: "rub",
    },
    {
      name: "Royal Thimphu College",
      location: "Thimphu",
      programs: ["B.Sc. in Computer Science", "B.Sc. in Data Science"],
      deadline: "April 15, 2025",
      type: "rub",
    },
  ],
  child2: [
    {
      name: "Paro College of Education",
      location: "Paro",
      programs: ["B.Ed in Primary Education", "B.Ed in Secondary Education"],
      deadline: "March 31, 2025",
      type: "rub",
    },
  ],
};

// Mock timeline
const mockTimeline = [
  {
    phase: "Class 10",
    title: "Complete Assessments",
    description: "Finish RIASEC, skills, and interest assessments",
    status: "completed",
    icon: CheckCircle,
  },
  {
    phase: "Class 10-11",
    title: "Explore Career Options",
    description: "Research top 3 career matches and related programs",
    status: "in_progress",
    icon: Target,
  },
  {
    phase: "Class 11",
    title: "Subject Selection",
    description: "Choose subjects aligned with career goals",
    status: "pending",
    icon: BookOpen,
  },
  {
    phase: "Class 12",
    title: "Apply to Colleges",
    description: "Prepare for and submit college applications",
    status: "pending",
    icon: GraduationCap,
  },
];

type TabType = "overview" | "careers" | "skills" | "timeline" | "colleges";

export default function ParentCareersPage() {
  const [selectedChild, setSelectedChild] = useState<Child>(mockChildren[0]);
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  const careerMatches = mockCareerMatches[selectedChild.id] || [];
  const skills = mockSkills[selectedChild.id] || { developed: [], recommended: [] };
  const collegeRecommendations = mockCollegeRecommendations[selectedChild.id] || [];

  const parentPortalGradient = {
    background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)"
  };

  const getDemandBadge = (demand: string) => {
    const config = {
      high: { label: "High Demand", color: "bg-green-100 text-green-700" },
      medium: { label: "Moderate", color: "bg-yellow-100 text-yellow-700" },
      low: { label: "Limited", color: "bg-gray-100 text-gray-700" },
    };
    const { label, color } = config[demand as keyof typeof config];
    return <Badge className={color}>{label}</Badge>;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            {/* RIASEC Result */}
            {selectedChild.riasecCode && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" style={{ color: "rgb(107 114 128)" }} />
                    RIASEC Profile
                  </CardTitle>
                  <CardDescription>
                    {selectedChild.name}&apos;s career interest assessment results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className="w-20 h-20 rounded-xl flex items-center justify-center text-white text-2xl font-bold"
                      style={parentPortalGradient}
                    >
                      {selectedChild.riasecCode}
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedChild.riasecCode.split("").map((letter) => riasecTypes[letter]?.name).join(" - ")}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedChild.riasecCode.split("").map((letter) => riasecTypes[letter]?.description).join(", ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedChild.riasecCode.split("").map((letter) => {
                      const type = riasecTypes[letter];
                      if (!type) return null;
                      const Icon = type.icon;
                      return (
                        <Badge key={letter} className={type.color}>
                          <Icon className="w-3 h-3 mr-1" />
                          {letter} - {type.name}
                        </Badge>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Career Matches */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  Top Career Matches
                </CardTitle>
                <CardDescription>Based on assessment results and interests</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {careerMatches.slice(0, 3).map((career, index) => (
                  <div key={career.career} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                        index === 0 ? "bg-yellow-100 text-yellow-700" :
                        index === 1 ? "bg-gray-200 text-gray-700" :
                        "bg-amber-100 text-amber-700"
                      }`}
                    >
                      #{index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{career.career}</h4>
                        {getDemandBadge(career.demand)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{career.description}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span>Match: <strong>{career.matchScore}%</strong></span>
                        <span>Salary: {career.salary}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/careers/${career.career.toLowerCase().replace(/\s+/g, "-")}`}>
                        Details
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Skills Snapshot */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Developed Skills
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {skills.developed.slice(0, 4).map((skill) => (
                    <div key={skill.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{skill.name}</span>
                        <span className="text-sm text-gray-500">{skill.level}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-full rounded-full bg-green-500"
                          style={{ width: `${skill.level}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                    Recommended Skills
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {skills.recommended.slice(0, 5).map((skill) => (
                    <div
                      key={skill.name}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <span className="text-sm">{skill.name}</span>
                      <Badge
                        className={
                          skill.priority === "high"
                            ? "bg-red-100 text-red-700"
                            : skill.priority === "medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }
                      >
                        {skill.priority}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case "careers":
        return (
          <div className="space-y-4">
            {careerMatches.map((career) => (
              <Card key={career.career} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{career.career}</h3>
                        {getDemandBadge(career.demand)}
                        <Badge variant="outline">{career.category}</Badge>
                      </div>
                      <p className="text-gray-600 mb-3">{career.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          {career.matchScore}% match
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          {career.salary}
                        </span>
                        <span className="flex items-center gap-1">
                          <Code className="w-4 h-4" />
                          RIASEC: {career.riasecCode}
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" className="ml-4" asChild>
                      <Link href={`/dashboard/careers/${career.career.toLowerCase().replace(/\s+/g, "-")}`}>
                        Explore
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case "skills":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Skills Development Progress
                </CardTitle>
                <CardDescription>
                  Track {selectedChild.name}&apos;s skill development journey
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {skills.developed.map((skill) => (
                    <div key={skill.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{skill.name}</span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {skill.category}
                          </Badge>
                        </div>
                        <span className="text-sm font-bold" style={{ color: "rgb(107 114 128)" }}>
                          {skill.level}%
                        </span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${skill.level}%`,
                            background: "linear-gradient(90deg, rgb(107 114 128), rgb(75 85 99))"
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  Recommended Skills to Develop
                </CardTitle>
                <CardDescription>
                  Suggested skills based on career goals and interests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {skills.recommended.map((skill) => (
                    <div
                      key={skill.name}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            skill.priority === "high"
                              ? "bg-red-500"
                              : skill.priority === "medium"
                              ? "bg-yellow-500"
                              : "bg-gray-400"
                          }`}
                        />
                        <div>
                          <p className="font-medium">{skill.name}</p>
                          <p className="text-xs text-gray-500">{skill.category}</p>
                        </div>
                      </div>
                      <Badge
                        className={
                          skill.priority === "high"
                            ? "bg-red-100 text-red-700"
                            : skill.priority === "medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }
                      >
                        {skill.priority} priority
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card
              className="border-2"
              style={{ borderColor: "rgb(107 114 128)", background: "linear-gradient(to right, rgb(249 250 251), rgb(243 244 246))" }}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: "rgb(55 65 81)" }}>
                  <Info className="w-5 h-5" />
                  Parent Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>• Encourage practice of recommended skills through hobbies and projects</p>
                <p>• Connect skills to real-world applications to increase interest</p>
                <p>• Celebrate milestones in skill development to motivate progress</p>
              </CardContent>
            </Card>
          </div>
        );

      case "timeline":
        return (
          <div className="space-y-4">
            {mockTimeline.map((item, index) => {
              const Icon = item.icon;
              return (
                <Card key={item.phase} className={item.status === "in_progress" ? "ring-2 ring-gray-400" : ""}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          item.status === "completed"
                            ? "bg-green-100"
                            : item.status === "in_progress"
                            ? "bg-blue-100"
                            : "bg-gray-100"
                        }`}
                      >
                        <Icon
                          className={`w-6 h-6 ${
                            item.status === "completed"
                              ? "text-green-600"
                              : item.status === "in_progress"
                              ? "text-blue-600"
                              : "text-gray-400"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{item.title}</h4>
                          <Badge
                            className={
                              item.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : item.status === "in_progress"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                            }
                          >
                            {item.status === "completed" ? "Completed" : item.status === "in_progress" ? "In Progress" : "Upcoming"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{item.description}</p>
                        <p className="text-xs text-gray-500 mt-1">Phase: {item.phase}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        );

      case "colleges":
        return (
          <div className="space-y-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">College Recommendations</p>
                    <p className="text-sm text-blue-700">
                      Based on {selectedChild.name}&apos;s career interests and academic performance.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {collegeRecommendations.map((college) => (
              <Card key={college.name}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{college.name}</h3>
                        <Badge className={college.type === "rub" ? "bg-orange-100 text-orange-700" : "bg-purple-100 text-purple-700"}>
                          {college.type === "rub" ? "RUB" : "International"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Globe2 className="w-3 h-3" />
                        {college.location}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-2">Recommended Programs:</p>
                      <div className="flex flex-wrap gap-2">
                        {college.programs.map((program) => (
                          <Badge key={program} variant="outline">
                            {program}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>Deadline: {college.deadline}</span>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Study Abroad Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Consider these study abroad options based on career interests:
                </p>
                <div className="grid md:grid-cols-2 gap-3">
                  <Button variant="outline" className="h-auto py-3 flex-col items-start" asChild>
                    <Link href="/dashboard/study-abroad">
                      <span className="font-medium">Explore Countries</span>
                      <span className="text-xs text-gray-500">Compare study destinations</span>
                    </Link>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex-col items-start" asChild>
                    <Link href="/dashboard/scholarships">
                      <Award className="w-4 h-4 mb-1" />
                      <span className="font-medium">Scholarships</span>
                      <span className="text-xs text-gray-500">Find funding opportunities</span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Career Guidance
          </h1>
          <p className="text-gray-600">
            Support {selectedChild.name}&apos;s career exploration journey
          </p>
        </div>
      </div>

      {/* Child Selector */}
      <ChildSelector
        children={mockChildren}
        selectedChildId={selectedChild.id}
        onChildChange={setSelectedChild}
      />

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-2 overflow-x-auto" aria-label="Career tabs">
          {([
            { value: "overview", label: "Overview", icon: Briefcase },
            { value: "careers", label: "Career Matches", icon: Target },
            { value: "skills", label: "Skills", icon: Sparkles },
            { value: "timeline", label: "Timeline", icon: Calendar },
            { value: "colleges", label: "Colleges", icon: Building2 },
          ] as const).map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value as TabType)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors min-h-[44px] ${
                activeTab === tab.value
                  ? "border-gray-500 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              aria-current={activeTab === tab.value ? "page" : undefined}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Parent Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button variant="outline" className="h-auto py-3 flex-col gap-1" asChild>
              <Link href={`/dashboard/careers`}>
                <Briefcase className="w-5 h-5" />
                <span className="text-sm font-medium">Explore Careers</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex-col gap-1" asChild>
              <Link href={`/dashboard/skills`}>
                <Sparkles className="w-5 h-5" />
                <span className="text-sm font-medium">Skill Activities</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex-col gap-1" asChild>
              <Link href={`/dashboard/plan`}>
                <Target className="w-5 h-5" />
                <span className="text-sm font-medium">Career Plan</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex-col gap-1" asChild>
              <Link href={`/dashboard/rub`}>
                <GraduationCap className="w-5 h-5" />
                <span className="text-sm font-medium">RUB Colleges</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Back Navigation */}
      <div className="pt-4">
        <Button variant="outline" asChild>
          <Link href="/parent">
            Back to Parent Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
