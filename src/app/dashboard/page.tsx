"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  BookOpen,
  Target,
  TrendingUp,
  Award,
  Globe,
  Brain,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { AICareerCoach } from "@/components/ai/career-coach";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [userStats, setUserStats] = useState({
    assessmentCompleted: false,
    careerMatches: 0,
    skillsInProgress: 0,
    studyAbroadReadiness: 0,
    latestAssessment: null as any,
  });

  const [profile, setProfile] = useState<any>(null);
  const [skillsInProgress, setSkillsInProgress] = useState<Array<{ name: string; level: number }>>([]);

  useEffect(() => {
    if (isLoaded) {
      loadUserData();
    }
  }, [isLoaded]);

  const loadUserData = async () => {
    try {
      // Load profile
      const profileRes = await fetch("/api/user/profile");
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData.profile);
      }

      // Load assessments
      const assessmentsRes = await fetch("/api/assessments");
      if (assessmentsRes.ok) {
        const assessmentsData = await assessmentsRes.json();
        const assessments = assessmentsData.assessments || [];

        // Calculate real stats from data
        const completedAssessments = assessments.filter(a => a.status === "completed");
        const careerMatchesCount = await getCareerMatchesCount();

        setUserStats({
          assessmentCompleted: completedAssessments.length > 0,
          careerMatches: careerMatchesCount,
          skillsInProgress: 0, // Will be updated below
          studyAbroadReadiness: 0, // Would calculate from profile
          latestAssessment: assessments.length > 0 ? assessments[0] : null,
        });

        // Load real skills data from API
        await loadSkillsData();
      } else {
        // If assessments API fails, still load skills
        await loadSkillsData();
      }
    } catch (error) {
      console.error("Failed to load user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get career matches count
  const getCareerMatchesCount = async (): Promise<number> => {
    try {
      const res = await fetch("/api/career-matches");
      if (res.ok) {
        const data = await res.json();
        return data.count || 0;
      }
      return 0;
    } catch {
      return 0;
    }
  };

  // Helper function to get skills in progress count
  const getSkillsInProgressCount = async (): Promise<number> => {
    try {
      const res = await fetch("/api/skills/count");
      if (res.ok) {
        const data = await res.json();
        return data.count || 0;
      }
      return 0;
    } catch {
      return 0;
    }
  };

  // Load real skills data from API
  const loadSkillsData = async () => {
    try {
      const res = await fetch("/api/skills");
      if (res.ok) {
        const data = await res.json();
        const userProgress = data.userProgress || {};

        // Convert userProgress to array format for display
        const skillsArray = Object.entries(userProgress)
          .filter(([_, level]) => (level as number) > 0)
          .map(([name, level]) => ({ name, level: level as number }))
          .sort((a, b) => b.level - a.level)
          .slice(0, 3); // Show top 3

        setSkillsInProgress(skillsArray);
        setUserStats(prev => ({ ...prev, skillsInProgress: skillsArray.length }));
      }
    } catch (error) {
      console.error("Failed to load skills data:", error);
    }
  };

  const recommendedNextSteps = [
    ...(userStats.assessmentCompleted
      ? []
      : [
          {
            title: "Complete RIASEC Assessment",
            description: "Discover your personality type and career interests",
            icon: Brain,
            href: "/dashboard/assessment",
            priority: "high" as const,
          },
        ]),
    {
      title: profile?.firstName ? "Complete Your Profile" : "Set Up Your Profile",
      description: "Add your school, interests, and goals",
      icon: Target,
      href: "/dashboard/profile",
      priority: (!profile?.firstName || !profile?.school) ? ("high" as const) : ("medium" as const),
    },
    {
      title: "Explore Learning Resources",
      description: "Browse free courses to develop your skills",
      icon: BookOpen,
      href: "/dashboard/skills",
      priority: "medium" as const,
    },
    {
      title: "Check Study Abroad Options",
      description: "See requirements for Australia, NZ, USA, and more",
      icon: Globe,
      href: "/dashboard/study-abroad",
      priority: "medium" as const,
    },
  ].slice(0, 3);

  // Skills are now fetched from API - no hardcoded values
  // The skills data comes from /api/skills/count endpoint

  if (!isLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome, {profile?.firstName || profile?.name || user?.firstName || user?.lastName || "Student"}!
        </h1>
        <p className="text-gray-600">
          Your journey to discovering the perfect career path starts here.
        </p>
      </div>

      {/* Stats Grid - Mobile responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Assessment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Badge variant={userStats.assessmentCompleted ? "default" : "secondary"}>
                {userStats.assessmentCompleted ? "Completed" : "Not Started"}
              </Badge>
              <Brain className="w-5 h-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Career Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-900">
                {userStats.careerMatches > 0 ? userStats.careerMatches : "—"}
              </span>
              <Target className="w-5 h-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Skills in Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-900">
                {skillsInProgress.length}
              </span>
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Study Abroad Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-900">
                {userStats.studyAbroadReadiness > 0 ? `${userStats.studyAbroadReadiness}%` : "—"}
              </span>
              <Globe className="w-5 h-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid - Mobile responsive */}
      <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Recommended Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Recommended Next Steps
            </CardTitle>
            <CardDescription>
              Personalized recommendations based on your profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendedNextSteps.map((step) => (
              <Link key={step.title} href={step.href}>
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <step.icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{step.title}</h3>
                      {step.priority === "high" && (
                        <Badge variant="destructive" className="text-xs">
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 mt-4" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Skills Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Skills Development
            </CardTitle>
            <CardDescription>
              Track your progress on key skills
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {skillsInProgress.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No skills in progress yet</p>
                <p className="text-sm text-gray-400 mb-4">Start learning to track your progress</p>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/dashboard/skills">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Browse Learning Resources
                  </Link>
                </Button>
              </div>
            ) : (
              <>
                {skillsInProgress.map((skill) => (
                  <div key={skill.name}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{skill.name}</span>
                      <span className="text-sm text-gray-500">{skill.level}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${skill.level}%` }}
                      />
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/dashboard/skills">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Browse Learning Resources
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
        <CardHeader>
          <CardTitle className="text-2xl">
            Ready to discover your ideal career?
          </CardTitle>
          <CardDescription className="text-blue-100">
            Complete your assessment to get personalized career recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!userStats.assessmentCompleted ? (
            <Button size="lg" variant="secondary" asChild>
              <Link href="/dashboard/assessment">
                Start Assessment
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          ) : (
            <Button size="lg" variant="secondary" asChild>
              <Link href="/dashboard/careers">
                View Your Career Matches
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* AI Career Coach - Floating Chat Button */}
      <AICareerCoach
        userId={user?.id}
        userName={profile?.firstName || profile?.name || "Student"}
      />
    </div>
  );
}
