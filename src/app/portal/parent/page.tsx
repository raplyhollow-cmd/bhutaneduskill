"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  TrendingUp,
  BookOpen,
  Target,
  Calendar,
  Award,
  MessageSquare,
  Settings,
  Bell,
  CheckCircle2,
  AlertCircle,
  Brain,
  Heart,
  Lightbulb,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Flame,
} from "lucide-react";
import Link from "next/link";

export default function ParentPortalPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);

  // Mock data - replace with actual API calls
  const [childData, setChildData] = useState({
    name: "Tashi Dorji",
    grade: "Class 10",
    school: "Yangchenphug HSS",
    age: 15,
    xp: 2450,
    level: 7,
    streak: 12,
  });

  const [careerMatches, setCareerMatches] = useState([
    { career: "Software Developer", match: 87, demand: "High" },
    { career: "UX Designer", match: 82, demand: "High" },
    { career: "Data Analyst", match: 78, demand: "Medium" },
  ]);

  const [recentActivity, setRecentActivity] = useState([
    { type: "assessment", title: "Completed RIASEC Assessment", date: "2 days ago", icon: Brain },
    { type: "course", title: "Started Python Fundamentals", date: "5 days ago", icon: BookOpen },
    { type: "achievement", title: "Earned 'Week Warrior' Badge", date: "1 week ago", icon: Award },
  ]);

  const [skills, setSkills] = useState([
    { name: "Problem Solving", progress: 85, color: "bg-blue-500" },
    { name: "Communication", progress: 72, color: "bg-green-500" },
    { name: "Creativity", progress: 68, color: "bg-purple-500" },
    { name: "Technical Aptitude", progress: 78, color: "bg-orange-500" },
  ]);

  const [recommendations, setRecommendations] = useState([
    {
      type: "course",
      title: "Introduction to Web Development",
      platform: "Khan Academy",
      reason: "Aligns with their interest in technology",
    },
    {
      type: "activity",
      title: "Participate in coding hackathon",
      platform: "School Club",
      reason: "Build practical skills and portfolio",
    },
    {
      type: "scholarship",
      title: "Singapore Scholarship 2026",
      platform: "Government",
      reason: "Great fit for their academic profile",
    },
  ]);

  useEffect(() => {
    // Simulate loading child data
    setTimeout(() => setLoading(false), 1000);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your child's progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Parent Portal</h1>
                <p className="text-purple-100">Track your child's career journey</p>
              </div>
            </div>
            <Button variant="secondary" size="sm" asChild>
              <Link href="/dashboard/settings">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Child's Level</p>
                  <p className="text-3xl font-bold">Level {childData.level}</p>
                </div>
                <Award className="w-10 h-10 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Learning Streak</p>
                  <p className="text-3xl font-bold">{childData.streak} days</p>
                </div>
                <Flame className="w-10 h-10 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Total XP</p>
                  <p className="text-3xl font-bold">{childData.xp}</p>
                </div>
                <Sparkles className="w-10 h-10 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Assessments</p>
                  <p className="text-3xl font-bold">1</p>
                </div>
                <Target className="w-10 h-10 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Child Profile Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {childData.name.split(" ").map((n: string) => n[0]).join("")}
                    </div>
                    <div>
                      <CardTitle className="text-2xl">{childData.name}</CardTitle>
                      <CardDescription>{childData.grade} • {childData.school}</CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active Learner</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <Brain className="w-5 h-5 text-purple-600" />
                      Top Career Matches
                    </h4>
                    <div className="space-y-3">
                      {careerMatches.map((match, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{match.career}</p>
                            <p className="text-sm text-gray-500">Demand: {match.demand}</p>
                          </div>
                          <Badge className={match.match >= 80 ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
                            {match.match}% match
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      Skills Progress
                    </h4>
                    <div className="space-y-4">
                      {skills.map((skill, index) => (
                        <div key={index}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{skill.name}</span>
                            <span className="text-gray-500">{skill.progress}%</span>
                          </div>
                          <Progress value={skill.progress} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <activity.icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.title}</p>
                        <p className="text-sm text-gray-500">{activity.date}</p>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-purple-600" />
                  AI Insights for You
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-white rounded-lg">
                  <Heart className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Strong Interest in Technology</p>
                    <p className="text-sm text-gray-600">
                      Your child shows consistent interest in coding and tech-related activities. Consider enrolling them in advanced computer classes.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-white rounded-lg">
                  <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Math Skills Need Attention</p>
                    <p className="text-sm text-gray-600">
                      Consider encouraging extra practice in mathematics, as it's important for their top career choices.
                    </p>
                  </div>
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
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link href="/dashboard/assessment">
                    <Target className="w-4 h-4 mr-2" />
                    View Assessment Results
                  </Link>
                </Button>
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link href="/dashboard/careers">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Explore Careers
                  </Link>
                </Button>
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link href="/dashboard/scholarships">
                    <GraduationCap className="w-4 h-4 mr-2" />
                    Scholarship Finder
                  </Link>
                </Button>
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link href="/dashboard/journal">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    View Journal
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Your Expectations vs Child's Interests */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Expectations vs Interests</CardTitle>
                <CardDescription>How your goals align with your child's interests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm">Technology Careers</span>
                    <Badge className="bg-green-100 text-green-800">Aligned</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <span className="text-sm">Medical Field</span>
                    <Badge className="bg-yellow-100 text-yellow-800">Exploring</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm">Study Abroad</span>
                    <Badge className="bg-green-100 text-green-800">Aligned</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recommended for You</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recommendations.map((rec, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs capitalize">{rec.type}</Badge>
                    </div>
                    <p className="font-medium text-sm">{rec.title}</p>
                    <p className="text-xs text-gray-500">{rec.platform}</p>
                    <p className="text-xs text-gray-600 mt-2">{rec.reason}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Need Help */}
            <Card className="bg-gradient-to-br from-blue-600 to-purple-600 text-white border-0">
              <CardContent className="pt-6">
                <MessageSquare className="w-8 h-8 mb-3" />
                <h3 className="font-semibold mb-2">Have Questions?</h3>
                <p className="text-sm text-blue-100 mb-4">
                  Our counselors are here to help you support your child's journey.
                </p>
                <Button variant="secondary" size="sm" className="w-full" asChild>
                  <Link href="/contact">Contact Support</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
