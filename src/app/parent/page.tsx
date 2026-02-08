"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  GraduationCap,
  TrendingUp,
  Target,
  CheckCircle2,
  Clock,
  Lightbulb,
  Mic,
  ArrowRight,
  Globe,
} from "lucide-react";
import Link from "next/link";

export default function ParentDashboardPage() {
  // Mock data - will be replaced with real data from database
  const [child] = useState({
    name: "Tashi Dorji",
    grade: "Class 10",
    age: 15,
    school: "Yangchenphug HSS",
    assessmentCompleted: true,
    riasecCode: "AIR",
    topCareerMatches: [
      { career: "Software Developer", match: 87 },
      { career: "UX Designer", match: 82 },
      { career: "Data Analyst", match: 78 },
    ],
    skillsInProgress: [
      { name: "Problem Solving", level: 65 },
      { name: "Communication", level: 45 },
      { name: "Technical Skills", level: 30 },
    ],
    recentActivity: [
      { type: "assessment", description: "Completed RIASEC assessment", time: "2 days ago" },
      { type: "career", description: "Explored Software Developer career", time: "1 day ago" },
      { type: "learning", description: "Started Python basics course", time: "5 hours ago" },
    ],
    studyAbroadReadiness: 55,
  });

  const recentNotes = [
    {
      id: 1,
      date: "2025-02-05",
      note: "Tashi was very excited about the coding project today. Spent 2 hours voluntarily working on it.",
      sentiment: "positive",
    },
    {
      id: 2,
      date: "2025-02-03",
      note: "Showed interest in the IT career discussion during class. Asked good questions about programming.",
      sentiment: "positive",
    },
  ];

  const expectationsVsReality = {
    parentExpectations: ["Doctor", "Engineer"],
    childInterests: ["Software Developer", "UX Designer", "Data Analyst"],
    alignmentScore: 65,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Parent Dashboard
        </h1>
        <p className="text-gray-600">
          Track {child.name}&apos;s career exploration journey
        </p>
      </div>

      {/* Child Profile Card */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {child.name.split(" ").map(n => n[0]).join("")}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{child.name}</h2>
              <p className="text-gray-600">{child.grade} • {child.age} years old</p>
              <p className="text-sm text-gray-500">{child.school}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Assessment Complete
                </Badge>
                <Badge variant="outline">
                  RIASEC: {child.riasecCode}
                </Badge>
              </div>
            </div>
            <Button asChild>
              <Link href="/parent/child">
                View Full Profile
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Top Career Match
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-gray-900">
              {child.topCareerMatches[0].career}
            </div>
            <p className="text-xs text-green-600 mt-1">
              {child.topCareerMatches[0].match}% match
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Skills in Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {child.skillsInProgress.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Actively learning</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Engagement Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">High</div>
            <p className="text-xs text-gray-500 mt-1">Past 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Study Abroad Ready
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {child.studyAbroadReadiness}%
            </div>
            <p className="text-xs text-yellow-600 mt-1">Needs improvement</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Career Matches */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Top Career Matches
            </CardTitle>
            <CardDescription>Based on {child.name}&apos;s assessment results</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {child.topCareerMatches.map((match, index) => (
              <div key={match.career} className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0 ? "bg-blue-100 text-blue-700" :
                  index === 1 ? "bg-purple-100 text-purple-700" :
                  "bg-gray-100 text-gray-700"
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{match.career}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                      style={{ width: `${match.match}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-semibold text-blue-600">{match.match}%</span>
              </div>
            ))}
            <Button variant="outline" className="w-full" asChild>
              <Link href="/parent/careers">
                View All Matches
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Skills Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Skills Development
            </CardTitle>
            <CardDescription>Track {child.name}&apos;s skill growth</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {child.skillsInProgress.map((skill) => (
              <div key={skill.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{skill.name}</span>
                  <span className="text-sm text-gray-500">{skill.level}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${skill.level}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Expectations vs Reality */}
        <Card className="border-2 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-orange-500" />
              Your Expectations vs {child.name}&apos;s Interests
            </CardTitle>
            <CardDescription>
              Alignment: {expectationsVsReality.alignmentScore}% - Good potential for discussion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Your Expectations
                </h4>
                <div className="space-y-2">
                  {expectationsVsReality.parentExpectations.map((career) => (
                    <div key={career} className="flex items-center gap-2 p-2 bg-white rounded-lg">
                      <Target className="w-4 h-4 text-orange-500" />
                      <span>{career}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  {child.name}&apos;s Interests
                </h4>
                <div className="space-y-2">
                  {expectationsVsReality.childInterests.map((career) => (
                    <div key={career} className="flex items-center gap-2 p-2 bg-white rounded-lg">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>{career}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-white rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Insight:</strong> {child.name} shows strong aptitude for technology careers.
                Software Developer combines problem-solving skills with creative elements, which might
                align well with your interest in engineering fields.
              </p>
            </div>
          </CardContent>
        </Card>

      {/* Recent Activity & Quick Notes */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from {child.name}&apos;s journey</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {child.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  activity.type === "assessment" ? "bg-green-100" :
                  activity.type === "career" ? "bg-purple-100" :
                  "bg-blue-100"
                }`}>
                  {activity.type === "assessment" && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                  {activity.type === "career" && <Target className="w-4 h-4 text-purple-600" />}
                  {activity.type === "learning" && <Clock className="w-4 h-4 text-blue-600" />}
                </div>
                <div>
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5" />
              Quick Voice Notes
            </CardTitle>
            <CardDescription>
              Record 30-second observations about {child.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" size="lg">
              <Mic className="w-4 h-4 mr-2" />
              Record Voice Note
            </Button>
            <p className="text-xs text-gray-500 text-center">
              AI will transcribe and extract insights automatically
            </p>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Notes</h4>
              <div className="space-y-3">
                {recentNotes.map((note) => (
                  <div key={note.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{note.note}</p>
                    <p className="text-xs text-gray-500 mt-1">{note.date}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 mt-0.5" />
              <div>
                <p className="font-medium">Discuss careers together this weekend</p>
                <p className="text-blue-100 text-sm">
                  {child.name} has completed the assessment and is exploring tech careers.
                  A conversation about your expectations would be valuable.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 mt-0.5" />
              <div>
                <p className="font-medium">Encourage Python learning</p>
                <p className="text-blue-100 text-sm">
                  {child.name} started a Python basics course. Your encouragement could boost completion.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 mt-0.5" />
              <div>
                <p className="font-medium">Explore study abroad options</p>
                <p className="text-blue-100 text-sm">
                  {child.name}&apos;s interest in tech opens opportunities in Australia, NZ, and Singapore.
                  Consider exploring these together.
                </p>
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
