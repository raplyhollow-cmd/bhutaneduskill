"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
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
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface UserStats {
  assessmentCompleted: boolean;
  careerMatches: number;
  skillsInProgress: number;
  studyAbroadReadiness: number;
  latestAssessment: any;
}

interface UserProfile {
  firstName?: string;
  lastName?: string;
  name?: string;
  school?: string;
  grade?: string;
  interests?: string[];
}

interface Skill {
  name: string;
  level: number;
}

interface RecommendedStep {
  title: string;
  description: string;
  icon: any;
  href: string;
  priority: "high" | "medium" | "low";
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({
    assessmentCompleted: false,
    careerMatches: 0,
    skillsInProgress: 0,
    studyAbroadReadiness: 0,
    latestAssessment: null,
  });
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [skillsInProgress, setSkillsInProgress] = useState<Skill[]>([]);

  useEffect(() => {
    const checkSetupStatus = async () => {
      // First check if user needs setup before loading dashboard
      try {
        const roleRes = await fetch("/api/auth/set-role");
        if (roleRes.ok) {
          const roleData = await roleRes.json();
          // Platform admins go to admin portal, skip setup entirely
          if (roleData.userType === 'admin') {
            router.push('/admin');
            return;
          }
          // If user needs setup or has no user type, redirect to unified setup wizard
          if (roleData.needsSetup || !roleData.userType) {
            router.push("/setup/unified");
            return;
          }
        }
      } catch (error) {
        console.error("Failed to check setup status:", error);
        // Continue to load dashboard on error
      }

      // If setup is complete, load dashboard data
      loadUserData();
    };

    if (isLoaded) {
      checkSetupStatus();
    }
  }, [isLoaded, router]);

  const loadUserData = async () => {
    try {
      setError(null);

      // Load profile data from API
      const profileRes = await fetch("/api/user/profile");
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData.profile);
      } else {
        console.warn("Profile API failed:", profileRes.status);
      }

      // Load assessments data from API
      const assessmentsRes = await fetch("/api/assessments");
      if (assessmentsRes.ok) {
        const assessmentsData = await assessmentsRes.json();
        const assessments = assessmentsData.assessments || [];

        const completedAssessments = assessments.filter((a: any) => a.status === "completed");
        const careerMatchesCount = await getCareerMatchesCount();

        setUserStats({
          assessmentCompleted: completedAssessments.length > 0,
          careerMatches: careerMatchesCount,
          skillsInProgress: 0,
          studyAbroadReadiness: 0,
          latestAssessment: assessments.length > 0 ? assessments[0] : null,
        });

        await loadSkillsData();
      } else {
        console.warn("Assessments API failed:", assessmentsRes.status);
        await loadSkillsData();
      }
    } catch (err) {
      console.error("Failed to load user data:", err);
      setError("Failed to load dashboard data. Please refresh the page.");
    } finally {
      setIsLoading(false);
    }
  };

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

  const loadSkillsData = async () => {
    try {
      const res = await fetch("/api/skills");
      if (res.ok) {
        const data = await res.json();
        const userProgress = data.userProgress || {};

        const skillsArray = Object.entries(userProgress)
          .filter(([_, level]) => (level as number) > 0)
          .map(([name, level]) => ({ name, level: level as number }))
          .sort((a, b) => b.level - a.level)
          .slice(0, 3);

        setSkillsInProgress(skillsArray);
        setUserStats(prev => ({ ...prev, skillsInProgress: skillsArray.length }));
      }
    } catch (err) {
      console.error("Failed to load skills data:", err);
    }
  };

  // Generate recommended steps based on actual user data
  const getRecommendedSteps = (): RecommendedStep[] => {
    const steps: RecommendedStep[] = [];

    if (!userStats.assessmentCompleted) {
      steps.push({
        title: "Complete RIASEC Assessment",
        description: "Discover your personality type and career interests",
        icon: Brain,
        href: "/dashboard/assessment",
        priority: "high",
      });
    }

    if (!profile?.firstName || !profile?.school) {
      steps.push({
        title: profile?.firstName ? "Complete Your Profile" : "Set Up Your Profile",
        description: "Add your school, interests, and goals",
        icon: Target,
        href: "/dashboard/profile",
        priority: "high",
      });
    }

    steps.push({
      title: "Explore Learning Resources",
      description: "Browse free courses to develop your skills",
      icon: BookOpen,
      href: "/dashboard/skills",
      priority: "medium",
    });

    if (userStats.assessmentCompleted) {
      steps.push({
        title: "Explore Career Matches",
        description: `View your ${userStats.careerMatches} personalized career recommendations`,
        icon: Target,
        href: "/dashboard/careers",
        priority: "high",
      });
    }

    steps.push({
      title: "Study Abroad Options",
      description: "See requirements for Australia, NZ, USA, and more",
      icon: Globe,
      href: "/dashboard/study-abroad",
      priority: "medium",
    });

    return steps.slice(0, 3);
  };

  const recommendedNextSteps = getRecommendedSteps();

  // Get display name from real data
  const displayName = profile?.firstName || profile?.name || user?.firstName || user?.lastName || "Student";
  const hasProfileData = profile?.firstName && profile?.school;

  if (!isLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unable to Load Dashboard</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Section - Uses real user data */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {displayName}!
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          {userStats.assessmentCompleted
            ? `You have ${userStats.careerMatches} career matches waiting for you.`
            : "Start your journey by completing an assessment."}
        </p>
      </div>

      {/* Stats Grid - Mobile responsive with real data */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">
              Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Badge variant={userStats.assessmentCompleted ? "default" : "secondary"} className="text-xs sm:text-sm">
                {userStats.assessmentCompleted ? "Done" : "Start"}
              </Badge>
              <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">
              Careers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-xl sm:text-2xl font-bold text-gray-900">
                {userStats.careerMatches > 0 ? userStats.careerMatches : "—"}
              </span>
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">
              Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-xl sm:text-2xl font-bold text-gray-900">
                {skillsInProgress.length}
              </span>
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">
              Study Abroad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-xl sm:text-2xl font-bold text-gray-900">
                {userStats.studyAbroadReadiness > 0 ? `${userStats.studyAbroadReadiness}%` : "—"}
              </span>
              <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid - Mobile responsive */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* Recommended Next Steps - Based on real data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Target className="w-5 h-5" />
              Recommended for You
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              {hasProfileData
                ? "Personalized based on your profile"
                : "Complete your profile for better recommendations"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            {recommendedNextSteps.length === 0 ? (
              <p className="text-gray-500 text-center py-4">All caught up! Check back later.</p>
            ) : (
              recommendedNextSteps.map((step) => (
                <Link key={step.title} href={step.href}>
                  <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <step.icon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{step.title}</h3>
                        {step.priority === "high" && (
                          <Badge variant="destructive" className="text-xs">
                            Recommended
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600">{step.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Skills Progress - Real data from API */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Award className="w-5 h-5" />
              Your Skills
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Track your learning progress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            {skillsInProgress.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm sm:text-base">No skills in progress</p>
                <p className="text-xs sm:text-sm text-gray-400 mb-4">Start learning to track progress</p>
                <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
                  <Link href="/dashboard/skills">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Browse Resources
                  </Link>
                </Button>
              </div>
            ) : (
              <>
                {skillsInProgress.map((skill) => (
                  <div key={skill.name}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 text-sm sm:text-base">{skill.name}</span>
                      <span className="text-xs sm:text-sm text-gray-500">{skill.level}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${skill.level}%` }}
                      />
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
                  <Link href="/dashboard/skills">
                    <BookOpen className="w-4 h-4 mr-2" />
                    View All Skills
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Call to Action - Dynamic based on assessment status */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">
            {userStats.assessmentCompleted
              ? "Explore Your Career Options"
              : "Start Your Career Discovery"}
          </CardTitle>
          <CardDescription className="text-blue-100 text-sm sm:text-base">
            {userStats.assessmentCompleted
              ? `You have ${userStats.careerMatches} careers matched to your profile`
              : "Take a quick assessment to discover careers that fit you"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!userStats.assessmentCompleted ? (
            <Button size="lg" variant="secondary" className="w-full sm:w-auto" asChild>
              <Link href="/dashboard/assessment">
                Start Assessment
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          ) : (
            <Button size="lg" variant="secondary" className="w-full sm:w-auto" asChild>
              <Link href="/dashboard/careers">
                View Career Matches
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Profile completion prompt - only if profile incomplete */}
      {!hasProfileData && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Complete Your Profile</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Add your school and interests to get personalized career recommendations.
                </p>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/dashboard/profile">Update Profile</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
