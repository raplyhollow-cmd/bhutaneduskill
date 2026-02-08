"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  User,
  TrendingUp,
  BookOpen,
  Target,
  Calendar,
  Award,
  Flame,
  Sparkles,
  Brain,
  Lightbulb,
  ArrowRight,
  GraduationCap,
  CheckCircle2,
  Clock,
  Play,
} from "lucide-react";
import Link from "next/link";

export default function StudentPortalPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);

  // Mock student data
  const [studentData, setStudentData] = useState({
    name: "Tashi Dorji",
    grade: "Class 10",
    school: "Yangchenphug HSS",
    age: 15,
    xp: 2450,
    level: 7,
    streak: 12,
    completedAssessments: 1,
    inProgressCourses: 3,
  });

  const [recommendedCareers, setRecommendedCareers] = useState([
    { career: "Software Developer", match: 87, icon: "💻" },
    { career: "UX Designer", match: 82, icon: "🎨" },
    { career: "Data Analyst", match: 78, icon: "📊" },
  ]);

  const [skills, setSkills] = useState([
    { name: "Problem Solving", progress: 85, color: "bg-blue-500" },
    { name: "Communication", progress: 72, color: "bg-green-500" },
    { name: "Creativity", progress: 68, color: "bg-purple-500" },
    { name: "Technical Aptitude", progress: 78, color: "bg-orange-500" },
  ]);

  const [currentActivities, setCurrentActivities] = useState([
    {
      type: "course",
      title: "Python Fundamentals",
      progress: 65,
      total: 20,
      completed: 13,
      icon: BookOpen,
      color: "bg-blue-500",
    },
    {
      type: "assessment",
      title: "Aptitude Test",
      progress: 30,
      total: 50,
      completed: 15,
      icon: Target,
      color: "bg-purple-500",
    },
    {
      type: "project",
      title: "Build Your First Website",
      progress: 40,
      total: 10,
      completed: 4,
      icon: Lightbulb,
      color: "bg-green-500",
    },
  ]);

  const [achievements, setAchievements] = useState([
    { name: "First Steps", icon: "👶", earned: true, description: "Completed your first assessment" },
    { name: "Week Warrior", icon: "🔥", earned: true, description: "7-day learning streak" },
    { name: "Skill Seeker", icon: "🔍", earned: true, description: "Explored 10 careers" },
    { name: "Code Crusader", icon: "💻", earned: false, description: "Complete 5 coding courses" },
    { name: "Career Master", icon: "🎯", earned: false, description: "Match 90% with any career" },
  ]);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Welcome back, {studentData.name}!</h1>
                <p className="text-blue-100">{studentData.grade} • {studentData.school}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center px-4 py-2 bg-white/10 rounded-lg">
                <Flame className="w-6 h-6 mx-auto text-orange-300" />
                <p className="text-sm font-medium">{studentData.streak}</p>
                <p className="text-xs text-blue-100">Day Streak</p>
              </div>
              <div className="text-center px-4 py-2 bg-white/10 rounded-lg">
                <Sparkles className="w-6 h-6 mx-auto text-yellow-300" />
                <p className="text-sm font-medium">{studentData.xp}</p>
                <p className="text-xs text-blue-100">Total XP</p>
              </div>
            </div>
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
                  <p className="text-blue-100 text-sm">Your Level</p>
                  <p className="text-3xl font-bold">Level {studentData.level}</p>
                  <p className="text-blue-100 text-xs mt-1">550 XP to next level</p>
                </div>
                <Award className="w-10 h-10 text-blue-200" />
              </div>
              <Progress value={82} className="mt-3 bg-blue-400" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Learning Streak</p>
                  <p className="text-3xl font-bold">{studentData.streak} days</p>
                  <p className="text-green-100 text-xs mt-1">Keep it up!</p>
                </div>
                <Flame className="w-10 h-10 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Assessments Done</p>
                  <p className="text-3xl font-bold">{studentData.completedAssessments}</p>
                  <p className="text-purple-100 text-xs mt-1">2 more recommended</p>
                </div>
                <Target className="w-10 h-10 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">In Progress</p>
                  <p className="text-3xl font-bold">{studentData.inProgressCourses}</p>
                  <p className="text-orange-100 text-xs mt-1">Courses & Activities</p>
                </div>
                <BookOpen className="w-10 h-10 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Career Matches */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-600" />
                    Your Top Career Matches
                  </CardTitle>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/careers">View All</Link>
                  </Button>
                </div>
                <CardDescription>Based on your assessment results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recommendedCareers.map((career, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="text-3xl">{career.icon}</div>
                        <div>
                          <p className="font-medium">{career.career}</p>
                          <p className="text-sm text-gray-500">
                            {career.match >= 80 ? "Excellent match!" : "Good match!"}
                          </p>
                        </div>
                      </div>
                      <Badge className={career.match >= 80 ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
                        {career.match}% match
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Current Activities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Continue Learning
                </CardTitle>
                <CardDescription>Pick up where you left off</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentActivities.map((activity, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 ${activity.color} rounded-lg flex items-center justify-center`}>
                            <activity.icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium">{activity.title}</p>
                            <p className="text-sm text-gray-500">
                              {activity.completed} of {activity.total} completed
                            </p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          <Play className="w-4 h-4 mr-2" />
                          Continue
                        </Button>
                      </div>
                      <Progress value={activity.progress} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Skills Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Your Skills Progress
                </CardTitle>
                <CardDescription>Track your growth over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {skills.map((skill, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{skill.name}</span>
                        <span className="text-gray-500">{skill.progress}%</span>
                      </div>
                      <Progress value={skill.progress} className="h-2" />
                    </div>
                  ))}
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
                    Take Assessment
                  </Link>
                </Button>
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link href="/dashboard/careers">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Explore Careers
                  </Link>
                </Button>
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link href="/dashboard/rub">
                    <GraduationCap className="w-4 h-4 mr-2" />
                    RUB Colleges
                  </Link>
                </Button>
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link href="/dashboard/skills">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Learn Skills
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {achievements.slice(0, 6).map((achievement, index) => (
                    <div
                      key={index}
                      className={`text-center p-3 rounded-lg ${
                        achievement.earned ? "bg-yellow-50" : "bg-gray-100 opacity-50"
                      }`}
                      title={achievement.description}
                    >
                      <div className="text-2xl mb-1">{achievement.icon}</div>
                      <p className="text-xs font-medium">{achievement.name}</p>
                      {achievement.earned && (
                        <CheckCircle2 className="w-3 h-3 text-green-500 mx-auto mt-1" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recommended Next Steps */}
            <Card className="bg-gradient-to-br from-blue-600 to-purple-600 text-white border-0">
              <CardContent className="pt-6">
                <Lightbulb className="w-8 h-8 mb-3 text-yellow-300" />
                <h3 className="font-semibold mb-2">Recommended for You</h3>
                <ul className="space-y-2 text-sm text-blue-100 mb-4">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Complete the Aptitude Assessment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Finish Python Fundamentals course</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Explore RUB college programs</span>
                  </li>
                </ul>
                <Button variant="secondary" size="sm" className="w-full" asChild>
                  <Link href="/dashboard/assessment">
                    Start Now <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Study Abroad Readiness */}
            <Card className="border-2 border-green-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-green-600" />
                  Study Abroad Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-1">72%</div>
                  <p className="text-sm text-gray-600 mb-3">Ready for international studies</p>
                  <Progress value={72} className="h-2 mb-3" />
                  <Button size="sm" variant="outline" className="w-full" asChild>
                    <Link href="/dashboard/study-abroad">View Details</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
