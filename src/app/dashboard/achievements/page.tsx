"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  Target,
  Flame,
  Star,
  Lock,
  Unlock,
  Medal,
  Award,
  Zap,
  BookOpen,
  TrendingUp,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

const ACHIEVEMENTS = [
  {
    id: "first-assessment",
    name: "Career Explorer",
    description: "Complete your first RIASEC assessment",
    icon: Target,
    color: "bg-blue-100 text-blue-600",
    xp: 100,
    category: "assessment",
  },
  {
    id: "assessment-master",
    name: "Assessment Master",
    description: "Complete all available assessments",
    icon: Target,
    color: "bg-purple-100 text-purple-600",
    xp: 500,
    category: "assessment",
  },
  {
    id: "profile-complete",
    name: "All About Me",
    description: "Complete your profile with school and interests",
    icon: Star,
    color: "bg-green-100 text-green-600",
    xp: 50,
    category: "profile",
  },
  {
    id: "skill-starter",
    name: "Skill Starter",
    description: "Start learning your first skill",
    icon: BookOpen,
    color: "bg-orange-100 text-orange-600",
    xp: 75,
    category: "skills",
  },
  {
    id: "skill-level-5",
    name: "Dedicated Learner",
    description: "Reach level 5 in any skill",
    icon: TrendingUp,
    color: "bg-pink-100 text-pink-600",
    xp: 200,
    category: "skills",
  },
  {
    id: "skill-level-10",
    name: "Skill Champion",
    description: "Reach level 10 in any skill",
    icon: Award,
    color: "bg-yellow-100 text-yellow-600",
    xp: 500,
    category: "skills",
  },
  {
    id: "streak-3",
    name: "On Fire",
    description: "Visit platform 3 days in a row",
    icon: Flame,
    color: "bg-red-100 text-red-600",
    xp: 100,
    category: "engagement",
  },
  {
    id: "streak-7",
    name: "Week Warrior",
    description: "Visit platform 7 days in a row",
    icon: Zap,
    color: "bg-amber-100 text-amber-600",
    xp: 300,
    category: "engagement",
  },
  {
    id: "streak-30",
    name: "Monthly Master",
    description: "Visit platform 30 days in a row",
    icon: Trophy,
    color: "bg-emerald-100 text-emerald-600",
    xp: 1000,
    category: "engagement",
  },
  {
    id: "career-explorer",
    name: "Career Explorer",
    description: "Explore 10 different careers",
    icon: Medal,
    color: "bg-indigo-100 text-indigo-600",
    xp: 150,
    category: "exploration",
  },
  {
    id: "study-abroad-researcher",
    name: "Global Thinker",
    description: "Check study abroad options for 3 countries",
    icon: Calendar,
    color: "bg-cyan-100 text-cyan-600",
    xp: 200,
    category: "exploration",
  },
];

const LEVELS = [
  { level: 1, xp: 0, title: "Explorer" },
  { level: 2, xp: 100, title: "Pathfinder" },
  { level: 3, xp: 300, title: "Discoverer" },
  { level: 4, xp: 600, title: "Achiever" },
  { level: 5, xp: 1000, title: "Champion" },
  { level: 6, xp: 1500, title: "Master" },
  { level: 7, xp: 2500, title: "Expert" },
  { level: 8, xp: 4000, title: "Legend" },
  { level: 9, xp: 6000, title: "Hero" },
  { level: 10, xp: 10000, title: "Career Compass Master" },
];

export default function AchievementsPage() {
  const { user, isLoaded } = useUser();
  const [userXP, setUserXP] = useState(0);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [lastVisitDate, setLastVisitDate] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded) {
      loadUserData();
    }
  }, [isLoaded]);

  const loadUserData = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        const settings = data.profile?.settings || {};
        setUserXP(settings.xp || 0);
        setUnlockedAchievements(settings.unlockedAchievements || []);
        setCurrentStreak(settings.streak || 0);
        setLastVisitDate(settings.lastVisitDate || null);
      }
    } catch (error) {
      console.error("Failed to load user data:", error);
    }
  };

  const getCurrentLevel = () => {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (userXP >= LEVELS[i].xp) {
        return LEVELS[i];
      }
    }
    return LEVELS[0];
  };

  const getNextLevel = () => {
    const currentLevelIndex = LEVELS.findIndex((l) => l.level === getCurrentLevel().level);
    return LEVELS[currentLevelIndex + 1] || null;
  };

  const currentLevel = getCurrentLevel();
  const nextLevel = getNextLevel();
  const progressToNext = nextLevel
    ? ((userXP - currentLevel.xp) / (nextLevel.xp - currentLevel.xp)) * 100
    : 100;

  const getAchievementStatus = (achievementId: string) => {
    return unlockedAchievements.includes(achievementId);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "assessment": return Target;
      case "profile": return Star;
      case "skills": return BookOpen;
      case "engagement": return Flame;
      case "exploration": return Medal;
      default: return Award;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "assessment": return "bg-blue-100 text-blue-700";
      case "profile": return "bg-green-100 text-green-700";
      case "skills": return "bg-orange-100 text-orange-700";
      case "engagement": return "bg-red-100 text-red-700";
      case "exploration": return "bg-purple-100 text-purple-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const lockedCount = ACHIEVEMENTS.length - unlockedAchievements.length;
  const totalXP = ACHIEVEMENTS.reduce((sum, a) => sum + a.xp, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Achievements & Progress
        </h1>
        <p className="text-gray-600">
          Track your journey and earn badges as you explore careers
        </p>
      </div>

      {/* Level Progress */}
      <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Level {currentLevel.level}</CardTitle>
              <CardDescription className="text-purple-100">
                {currentLevel.title}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{userXP} XP</div>
              <CardDescription className="text-purple-100">
                {nextLevel ? `${nextLevel.xp - userXP} XP to Level ${nextLevel.level}` : "Max Level!"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progressToNext} className="h-3 bg-white/20" />
          <div className="flex justify-between mt-2 text-sm text-purple-100">
            <span>{currentLevel.title}</span>
            <span>{nextLevel ? nextLevel.title : "Max Level"}</span>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold text-gray-900">
                  {unlockedAchievements.length}
                </span>
                <span className="text-gray-500">/{ACHIEVEMENTS.length}</span>
              </div>
              <Trophy className="w-5 h-5 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Daily Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-900">{currentStreak} days</span>
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Total XP Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-900">{userXP}</span>
              <Star className="w-5 h-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-900">
                {Math.round((unlockedAchievements.length / ACHIEVEMENTS.length) * 100)}%
              </span>
              <Award className="w-5 h-5 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        {lockedCount > 0 && (
          <Card className="border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg">Continue Your Journey</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="outline" asChild>
                <Link href="/dashboard/assessment">
                  <Target className="w-4 h-4 mr-2" />
                  Take Assessment
                </Link>
              </Button>
              <Button className="w-full" variant="outline" asChild>
                <Link href="/dashboard/skills">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Learn Skills
                </Link>
              </Button>
              <Button className="w-full" variant="outline" asChild>
                <Link href="/dashboard/careers">
                  <Medal className="w-4 h-4 mr-2" />
                  Explore Careers
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="border-2 border-green-200">
          <CardHeader>
            <CardTitle className="text-lg">Daily Login Bonus</CardTitle>
            <CardDescription>
              {lastVisitDate === new Date().toISOString().split('T')[0]
                ? "Already claimed today!"
                : "Come back daily to earn bonus XP"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Daily Streak Bonus</p>
                <p className="text-sm text-gray-500">
                  +{10 * currentStreak} XP for today
                </p>
              </div>
              {lastVisitDate !== new Date().toISOString().split('T')[0] && (
                <Button size="sm">Claim XP</Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200">
          <CardHeader>
            <CardTitle className="text-lg">Leaderboard</CardTitle>
            <CardDescription>Top performers this week</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { name: "Tashi D.", xp: 2500, rank: 1 },
              { name: "Karma W.", xp: 2100, rank: 2 },
              { name: "Pema L.", xp: 1800, rank: 3 },
            ].map((user) => (
              <div key={user.name} className="flex items-center gap-3 text-sm">
                <span className={`font-bold ${
                  user.rank === 1 ? "text-yellow-600" :
                  user.rank === 2 ? "text-gray-600" :
                  user.rank === 3 ? "text-orange-600" :
                  "text-gray-500"
                }`}>#{user.rank}</span>
                <span className="flex-1">{user.name}</span>
                <span className="font-semibold">{user.xp} XP</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* All Achievements */}
      <Card>
        <CardHeader>
          <CardTitle>All Achievements</CardTitle>
          <CardDescription>
            {unlockedAchievements.length} unlocked • {lockedCount} remaining
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ACHIEVEMENTS.map((achievement) => {
              const isUnlocked = getAchievementStatus(achievement.id);
              const Icon = achievement.icon;

              return (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isUnlocked
                      ? "border-green-300 bg-green-50"
                      : "border-gray-200 bg-gray-50 opacity-60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isUnlocked ? achievement.color : "bg-gray-200"
                      }`}
                    >
                      {isUnlocked ? (
                        <Icon className="w-6 h-6" />
                      ) : (
                        <Lock className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{achievement.name}</h4>
                        {isUnlocked && (
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={`text-xs ${getCategoryColor(achievement.category)}`}
                        >
                          {achievement.category}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          +{achievement.xp} XP
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Level Rewards */}
      <Card>
        <CardHeader>
          <CardTitle>Level Rewards</CardTitle>
          <CardDescription>Unlock special features as you level up</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-5 gap-4">
            {LEVELS.map((levelData) => {
              const isReached = userXP >= levelData.xp;
              return (
                <div
                  key={levelData.level}
                  className={`text-center p-4 rounded-lg ${
                    isReached ? "bg-blue-50 border-2 border-blue-300" : "bg-gray-50 border-2 border-gray-200"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                    isReached ? "bg-blue-500 text-white" : "bg-gray-300 text-gray-500"
                  }`}>
                    {levelData.level}
                  </div>
                  <h4 className="font-semibold text-sm mb-1">{levelData.title}</h4>
                  <p className="text-xs text-gray-500">{levelData.xp} XP</p>
                  {isReached && (
                    <Badge className="mt-2 bg-green-100 text-green-800">Unlocked!</Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
