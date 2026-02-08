"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Code,
  Palette,
  Calculator,
  MessageCircle,
  TrendingUp,
  ExternalLink,
  Clock,
  Star,
  Filter,
} from "lucide-react";

const LEARNING_RESOURCES = {
  "Programming": {
    icon: Code,
    color: "bg-blue-100 text-blue-600",
    resources: [
      {
        title: "FreeCodeCamp",
        description: "Learn to code for free with interactive lessons",
        url: "https://freecodecamp.org",
        type: "free",
        duration: "3-6 months",
        level: "beginner",
      },
      {
        title: "Khan Academy Computing",
        description: "Computer programming and basics",
        url: "https://khanacademy.org/computing",
        type: "free",
        duration: "2-4 months",
        level: "beginner",
      },
      {
        title: "Codecademy",
        description: "Interactive coding lessons in various languages",
        url: "https://codecademy.com",
        type: "freemium",
        duration: "1-3 months",
        level: "beginner",
      },
    ],
  },
  "Design": {
    icon: Palette,
    color: "bg-purple-100 text-purple-600",
    resources: [
      {
        title: "Canva Design School",
        description: "Learn graphic design basics with free tutorials",
        url: "https://canva.com/design-school",
        type: "free",
        duration: "2-4 weeks",
        level: "beginner",
      },
      {
        title: "Figma for Education",
        description: "Free design tool and tutorials for students",
        url: "https://figma.com/education",
        type: "free",
        duration: "4-8 weeks",
        level: "intermediate",
      },
    ],
  },
  "Mathematics": {
    icon: Calculator,
    color: "bg-green-100 text-green-600",
    resources: [
      {
        title: "Khan Academy Math",
        description: "Complete math curriculum from basic to advanced",
        url: "https://khanacademy.org/math",
        type: "free",
        duration: "ongoing",
        level: "all",
      },
      {
        title: "Brilliant",
        description: "Interactive math and science lessons",
        url: "https://brilliant.org",
        type: "freemium",
        duration: "ongoing",
        level: "intermediate",
      },
    ],
  },
  "Communication": {
    icon: MessageCircle,
    color: "bg-orange-100 text-orange-600",
    resources: [
      {
        title: "TED-Ed",
        description: "Educational videos on communication and presentation",
        url: "https://ed.ted.com",
        type: "free",
        duration: "ongoing",
        level: "all",
      },
      {
        title: "Toastmasters Youth",
        description: "Public speaking practice and guidance",
        url: "https://toastmasters.org",
        type: "free",
        duration: "ongoing",
        level: "all",
      },
    ],
  },
  "Problem Solving": {
    icon: TrendingUp,
    color: "bg-red-100 text-red-600",
    resources: [
      {
        title: "Brilliant Logic",
        description: "Interactive logic and problem-solving puzzles",
        url: "https://brilliant.org",
        type: "freemium",
        duration: "ongoing",
        level: "intermediate",
      },
      {
        title: "Chess.com",
        description: "Learn strategic thinking through chess",
        url: "https://chess.com",
        type: "freemium",
        duration: "ongoing",
        level: "all",
      },
    ],
  },
};

const BHUTAN_TTIS = [
  { name: "TTI Thimphu", location: "Thimphu", courses: ["IT", "Electrical", "Civil"] },
  { name: "TTI Rangjung", location: "Trashigang", courses: ["Auto", "Mechanical"] },
  { name: "TTI Chumey", location: "Bumthang", courses: ["Electrical", "Auto"] },
  { name: "TTI Khuruthang", location: "Punakha", courses: ["Civil", "IT"] },
];

type ResourceType = "free" | "freemium" | "paid";
type LevelType = "beginner" | "intermediate" | "advanced" | "all";

export default function SkillsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<ResourceType | "all">("all");
  const [selectedLevel, setSelectedLevel] = useState<LevelType | "all">("all");
  const [userSkills, setUserSkills] = useState<Record<string, number>>({
    Programming: 30,
    Mathematics: 45,
    Design: 20,
    Communication: 55,
    "Problem Solving": 40,
  });

  const categories = Object.keys(LEARNING_RESOURCES);
  const allResources = Object.entries(LEARNING_RESOURCES).flatMap(([category, data]) =>
    data.resources.map((resource) => ({ ...resource, category }))
  );

  const filteredResources = allResources.filter((resource) => {
    if (selectedCategory !== "all" && resource.category !== selectedCategory)
      return false;
    if (selectedType !== "all" && resource.type !== selectedType) return false;
    if (selectedLevel !== "all" && resource.level !== selectedLevel) return false;
    return true;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case "free":
        return "bg-green-100 text-green-800";
      case "freemium":
        return "bg-blue-100 text-blue-800";
      case "paid":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Skills Improvement Hub</h1>
        <p className="text-gray-600">
          Learn new skills with curated resources matched to your interests
        </p>
      </div>

      {/* Current Skills Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Your Skills Progress
          </CardTitle>
          <CardDescription>Track your development across key skill areas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(LEARNING_RESOURCES).map(([name, data]) => {
            const Icon = data.icon;
            const progress = userSkills[name] || 0;
            return (
              <div key={name}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${data.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-medium">{name}</span>
                  </div>
                  <span className="text-sm text-gray-500">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium">Filters:</span>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as ResourceType | "all")}
              className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="free">Free</option>
              <option value="freemium">Freemium</option>
              <option value="paid">Paid</option>
            </select>

            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as LevelType | "all")}
              className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Learning Resources */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Learning Resources ({filteredResources.length})
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource, index) => {
            const categoryData = LEARNING_RESOURCES[resource.category as keyof typeof LEARNING_RESOURCES];
            const Icon = categoryData?.icon || BookOpen;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${categoryData?.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <Badge className={getTypeColor(resource.type)}>{resource.type}</Badge>
                  </div>
                  <CardTitle className="text-lg">{resource.title}</CardTitle>
                  <CardDescription>{resource.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {resource.duration}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      {resource.level}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{resource.category}</Badge>
                  </div>
                  <Button className="w-full" size="sm" asChild>
                    <a href={resource.url} target="_blank" rel="noopener noreferrer">
                      Start Learning
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Bhutan TTIs Section */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
        <CardHeader>
          <CardTitle className="text-2xl">Technical Training in Bhutan</CardTitle>
          <CardDescription className="text-blue-100">
            Explore vocational training options at Technical Training Institutes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {BHUTAN_TTIS.map((tti) => (
              <div
                key={tti.name}
                className="bg-white/10 backdrop-blur rounded-lg p-4 hover:bg-white/20 transition-colors"
              >
                <h3 className="font-semibold text-lg">{tti.name}</h3>
                <p className="text-blue-100 text-sm mb-2">📍 {tti.location}</p>
                <div className="flex flex-wrap gap-2">
                  {tti.courses.map((course) => (
                    <Badge key={course} variant="secondary" className="text-xs">
                      {course}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
