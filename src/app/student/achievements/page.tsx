"use client";

/**
 * STUDENT ACHIEVEMENTS PAGE
 * View badges, awards, and milestones earned
 */

import { useState } from "react";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  Award,
  Star,
  Target,
  Flame,
  BookOpen,
  CheckCircle2,
  Lock,
  Calendar,
  TrendingUp,
  Sparkles,
  Filter,
} from "lucide-react";

// Types
interface Achievement {
  id: string;
  title: string;
  description: string;
  category: "assessment" | "learning" | "homework" | "streak" | "special";
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  earnedDate: string | null;
  progress: number;
  maxProgress: number;
  xpReward: number;
  isUnlocked: boolean;
}

interface Milestone {
  level: number;
  xpRequired: number;
  rewards: string[];
  isUnlocked: boolean;
  currentXP: number;
}

// Mock achievements data
const mockAchievements: Achievement[] = [
  {
    id: "first_assessment",
    title: "Career Explorer",
    description: "Complete your first career assessment",
    category: "assessment",
    icon: "compass",
    rarity: "common",
    earnedDate: "2025-01-15T10:30:00",
    progress: 1,
    maxProgress: 1,
    xpReward: 50,
    isUnlocked: true,
  },
  {
    id: "riasec_complete",
    title: "RIASEC Master",
    description: "Complete the RIASEC career assessment",
    category: "assessment",
    icon: "brain",
    rarity: "rare",
    earnedDate: "2025-01-20T14:15:00",
    progress: 1,
    maxProgress: 1,
    xpReward: 100,
    isUnlocked: true,
  },
  {
    id: "all_assessments",
    title: "Assessment Champion",
    description: "Complete all available career assessments",
    category: "assessment",
    icon: "clipboard-check",
    rarity: "epic",
    earnedDate: null,
    progress: 3,
    maxProgress: 5,
    xpReward: 500,
    isUnlocked: false,
  },
  {
    id: "first_module",
    title: "Knowledge Seeker",
    description: "Complete your first learning module",
    category: "learning",
    icon: "book",
    rarity: "common",
    earnedDate: "2025-02-01T09:00:00",
    progress: 1,
    maxProgress: 1,
    xpReward: 75,
    isUnlocked: true,
  },
  {
    id: "module_streak",
    title: "Dedicated Learner",
    description: "Complete 5 learning modules in a row",
    category: "learning",
    icon: "fire",
    rarity: "rare",
    earnedDate: null,
    progress: 2,
    maxProgress: 5,
    xpReward: 200,
    isUnlocked: false,
  },
  {
    id: "perfect_score",
    title: "Perfect Score",
    description: "Score 100% on any homework assignment",
    category: "homework",
    icon: "star",
    rarity: "epic",
    earnedDate: "2025-02-05T16:45:00",
    progress: 1,
    maxProgress: 1,
    xpReward: 300,
    isUnlocked: true,
  },
  {
    id: "homework_streak",
    title: "Consistent Student",
    description: "Submit homework on time for 4 consecutive weeks",
    category: "streak",
    icon: "calendar-check",
    rarity: "rare",
    earnedDate: null,
    progress: 2,
    maxProgress: 4,
    xpReward: 150,
    isUnlocked: false,
  },
  {
    id: "early_bird",
    title: "Early Bird",
    description: "Submit homework before the deadline 10 times",
    category: "homework",
    icon: "sunrise",
    rarity: "common",
    earnedDate: "2025-02-08T11:30:00",
    progress: 10,
    maxProgress: 10,
    xpReward: 100,
    isUnlocked: true,
  },
  {
    id: "career_plan",
    title: "Pathfinder",
    description: "Create your first career plan",
    category: "special",
    icon: "map",
    rarity: "rare",
    earnedDate: "2025-01-25T13:20:00",
    progress: 1,
    maxProgress: 1,
    xpReward: 150,
    isUnlocked: true,
  },
  {
    id: "saved_careers",
    title: "Career Collector",
    description: "Save 10 different career paths to your profile",
    category: "special",
    earnedDate: null,
    progress: 7,
    maxProgress: 10,
    xpReward: 100,
    isUnlocked: false,
    icon: "bookmark",
    rarity: "common",
  },
  {
    id: "journal_entry",
    title: "Reflective Thinker",
    description: "Write 10 journal entries about your career journey",
    category: "special",
    earnedDate: null,
    progress: 5,
    maxProgress: 10,
    xpReward: 200,
    isUnlocked: false,
    icon: "pen",
    rarity: "rare",
  },
  {
    id: "legendary_student",
    title: "Legendary Student",
    description: "Achieve Level 10 by earning 5000+ XP",
    category: "special",
    earnedDate: null,
    progress: 1450,
    maxProgress: 5000,
    xpReward: 1000,
    isUnlocked: false,
    icon: "crown",
    rarity: "legendary",
  },
];

// Mock milestones
const mockMilestones: Milestone[] = [
  { level: 1, xpRequired: 0, rewards: ["Welcome Badge"], isUnlocked: true, currentXP: 1450 },
  { level: 2, xpRequired: 200, rewards: ["+50 XP Bonus"], isUnlocked: true, currentXP: 1450 },
  { level: 3, xpRequired: 500, rewards: ["Bronze Badge"], isUnlocked: true, currentXP: 1450 },
  { level: 4, xpRequired: 1000, rewards: ["Silver Badge"], isUnlocked: true, currentXP: 1450 },
  { level: 5, xpRequired: 1500, rewards: ["Gold Badge", "Certificate"], isUnlocked: false, currentXP: 1450 },
  { level: 6, xpRequired: 2500, rewards: ["Platinum Badge", "Profile Theme"], isUnlocked: false, currentXP: 1450 },
  { level: 7, xpRequired: 3500, rewards: ["Diamond Badge", "Mentor Access"], isUnlocked: false, currentXP: 1450 },
  { level: 8, xpRequired: 5000, rewards: ["Legendary Status", "Exclusive Content"], isUnlocked: false, currentXP: 1450 },
];

const currentXP = 1450;
const currentLevel = 5;
const nextLevelXP = 1500;
const prevLevelXP = 1000;
const levelProgress = ((currentXP - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100;

const categoryIcons: Record<string, React.JSX.Element> = {
  compass: <Target className="w-8 h-8" />,
  brain: <Sparkles className="w-8 h-8" />,
  "clipboard-check": <CheckCircle2 className="w-8 h-8" />,
  book: <BookOpen className="w-8 h-8" />,
  fire: <Flame className="w-8 h-8" />,
  star: <Star className="w-8 h-8" />,
  "calendar-check": <Calendar className="w-8 h-8" />,
  sunrise: <Sparkles className="w-8 h-8" />,
  map: <Target className="w-8 h-8" />,
  bookmark: <Trophy className="w-8 h-8" />,
  pen: <BookOpen className="w-8 h-8" />,
  crown: <Award className="w-8 h-8" />,
};

const rarityColors = {
  common: "from-gray-400 to-gray-500 border-gray-400",
  rare: "from-blue-400 to-blue-500 border-blue-400",
  epic: "from-purple-400 to-purple-500 border-purple-400",
  legendary: "from-amber-400 to-orange-500 border-amber-400",
};

const rarityBgColors = {
  common: "bg-gray-50 border-gray-200",
  rare: "bg-blue-50 border-blue-200",
  epic: "bg-purple-50 border-purple-200",
  legendary: "bg-amber-50 border-amber-200",
};

export default function StudentAchievementsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [filterType, setFilterType] = useState<"all" | "earned" | "locked">("all");

  const categories = [
    { id: "all", label: "All", icon: Trophy },
    { id: "assessment", label: "Assessments", icon: CheckCircle2 },
    { id: "learning", label: "Learning", icon: BookOpen },
    { id: "homework", label: "Homework", icon: Star },
    { id: "streak", label: "Streaks", icon: Flame },
    { id: "special", label: "Special", icon: Award },
  ];

  const filteredAchievements = mockAchievements.filter((achievement) => {
    const categoryMatch = selectedCategory === "all" || achievement.category === selectedCategory;
    const statusMatch = filterType === "all" || (filterType === "earned" && achievement.isUnlocked) || (filterType === "locked" && !achievement.isUnlocked);
    return categoryMatch && statusMatch;
  });

  const earnedCount = mockAchievements.filter((a) => a.isUnlocked).length;
  const totalCount = mockAchievements.length;
  const totalXPReward = mockAchievements.filter((a) => a.isUnlocked).reduce((sum, a) => sum + a.xpReward, 0);

  return (
    <div className="space-y-6">
      {/* XP & Level Overview */}
        <Card
          className="mb-6 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)' }}
        >
          <CardContent className="pt-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-orange-100 text-sm">Current Level</p>
                <p className="text-4xl font-bold">{currentLevel}</p>
              </div>
              <div className="text-right">
                <p className="text-orange-100 text-sm">Total XP</p>
                <p className="text-4xl font-bold">{currentXP.toLocaleString()}</p>
              </div>
            </div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>Level {currentLevel} Progress</span>
              <span>{Math.round(levelProgress)}%</span>
            </div>
            <Progress value={levelProgress} className="h-3 bg-orange-900/30" />
            <p className="text-orange-100 text-sm mt-2">
              {nextLevelXP - currentXP} XP to Level {currentLevel + 1}
            </p>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{earnedCount}</p>
                  <p className="text-sm text-muted-foreground">Achievements Earned</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Star className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">{totalXPReward}</p>
                  <p className="text-sm text-muted-foreground">XP Earned</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {Math.round((earnedCount / totalCount) * 100)}%
                  </p>
                  <p className="text-sm text-muted-foreground">Completion</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">
                    {mockAchievements.filter((a) => a.rarity === "legendary" && a.isUnlocked).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Legendary Badges</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Category:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <Button
                      key={category.id}
                      size="sm"
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      onClick={() => setSelectedCategory(category.id)}
                      className={selectedCategory === category.id ? "" : ""}
                    >
                      <Icon className="w-4 h-4 mr-1" />
                      {category.label}
                    </Button>
                  );
                })}
              </div>

              <div className="ml-auto flex gap-2">
                <Button
                  size="sm"
                  variant={filterType === "all" ? "default" : "outline"}
                  onClick={() => setFilterType("all")}
                >
                  All
                </Button>
                <Button
                  size="sm"
                  variant={filterType === "earned" ? "default" : "outline"}
                  onClick={() => setFilterType("earned")}
                >
                  Earned
                </Button>
                <Button
                  size="sm"
                  variant={filterType === "locked" ? "default" : "outline"}
                  onClick={() => setFilterType("locked")}
                >
                  Locked
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievements Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAchievements.map((achievement) => (
            <Card
              key={achievement.id}
              className={`overflow-hidden transition-all hover:shadow-lg ${
                achievement.isUnlocked ? "" : "opacity-75"
              }`}
            >
              {/* Header with rarity gradient */}
              <div
                className={`h-2 bg-gradient-to-r ${rarityColors[achievement.rarity]}`}
              />
              <CardHeader className={achievement.isUnlocked ? "" : "pb-3"}>
                <div className="flex items-start justify-between">
                  <div
                    className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                      achievement.isUnlocked
                        ? `bg-gradient-to-br ${rarityColors[achievement.rarity]}`
                        : "bg-gray-200"
                    }`}
                  >
                    {achievement.isUnlocked ? (
                      <span className="text-white">{categoryIcons[achievement.icon]}</span>
                    ) : (
                      <Lock className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={`capitalize ${
                      achievement.isUnlocked
                        ? rarityBgColors[achievement.rarity]
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {achievement.rarity}
                  </Badge>
                </div>
                <CardTitle className={achievement.isUnlocked ? "" : "text-gray-400"}>
                  {achievement.title}
                </CardTitle>
                <CardDescription>{achievement.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {achievement.isUnlocked ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Earned on</span>
                      <span className="font-medium">
                        {achievement.earnedDate
                          ? new Date(achievement.earnedDate).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">XP Earned</span>
                      <span className="font-medium text-orange-600">+{achievement.xpReward} XP</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">
                          {achievement.progress} / {achievement.maxProgress}
                        </span>
                      </div>
                      <Progress
                        value={(achievement.progress / achievement.maxProgress) * 100}
                        className="h-2"
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Reward</span>
                      <span className="font-medium text-orange-600">+{achievement.xpReward} XP</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Milestones Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-orange-500" />
              Level Milestones
            </CardTitle>
            <CardDescription>Unlock special rewards as you level up</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockMilestones.map((milestone, index) => (
                <div
                  key={milestone.level}
                  className={`flex items-center gap-4 p-4 rounded-lg border ${
                    milestone.isUnlocked
                      ? "bg-green-50 border-green-200"
                      : index === currentLevel - 1
                      ? "bg-orange-50 border-orange-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      milestone.isUnlocked
                        ? "bg-green-500"
                        : index === currentLevel - 1
                        ? "bg-orange-500"
                        : "bg-gray-300"
                    }`}
                  >
                    {milestone.isUnlocked ? (
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    ) : (
                      <Lock className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">Level {milestone.level}</p>
                      {milestone.isUnlocked && (
                        <Badge className="bg-green-100 text-green-700 text-xs">Unlocked</Badge>
                      )}
                      {index === currentLevel - 1 && !milestone.isUnlocked && (
                        <Badge className="bg-orange-100 text-orange-700 text-xs">Current</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {milestone.rewards.join(" • ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{milestone.xpRequired} XP</p>
                    {index === currentLevel - 1 && (
                      <p className="text-xs text-orange-600">
                        {milestone.xpRequired - currentXP} XP to go
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
