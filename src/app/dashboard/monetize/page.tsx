"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  TrendingUp,
  Laptop,
  Users,
  Palette,
  Video,
  FileText,
  Camera,
  Music,
  ShoppingBag,
  ExternalLink,
  Clock,
  Star,
  Target,
  ArrowRight,
} from "lucide-react";

const MONETIZATION_PATHWAYS = [
  {
    category: "Freelancing Online",
    icon: Laptop,
    color: "bg-blue-100 text-blue-600",
    minAge: 16,
    platforms: [
      {
        name: "Fiverr",
        description: "Offer services starting at $5",
        skills: ["Graphic Design", "Writing", "Video Editing", "Programming"],
        link: "https://fiverr.com",
        potential: "$50-500/month",
      },
      {
        name: "Upwork",
        description: "Professional freelance marketplace",
        skills: ["Web Development", "Content Writing", "Data Entry", "Virtual Assistant"],
        link: "https://upwork.com",
        potential: "$100-1000/month",
      },
      {
        name: "Freelancer",
        description: "Bid on projects worldwide",
        skills: ["Design", "Development", "Marketing", "Admin"],
        link: "https://freelancer.com",
        potential: "$50-300/month",
      },
    ],
  },
  {
    category: "Content Creation",
    icon: Video,
    color: "bg-purple-100 text-purple-600",
    minAge: 15,
    platforms: [
      {
        name: "YouTube",
        description: "Create videos on topics you love",
        skills: ["Video Editing", "Teaching", "Entertainment", "Gaming"],
        link: "https://youtube.com",
        potential: "$0-2000/month",
      },
      {
        name: "TikTok",
        description: "Short-form content creation",
        skills: ["Comedy", "Education", "Dance", "Lip-sync"],
        link: "https://tiktok.com",
        potential: "$0-1000/month",
      },
      {
        name: "Instagram",
        description: "Build audience around your passion",
        skills: ["Photography", "Art", "Fashion", "Food"],
        link: "https://instagram.com",
        potential: "$0-500/month",
      },
    ],
  },
  {
    category: "Local Services",
    icon: Users,
    color: "bg-green-100 text-green-600",
    minAge: 14,
    platforms: [
      {
        name: "Tutoring",
        description: "Teach younger students",
        skills: ["Math", "Science", "English", "Computers"],
        link: "#local",
        potential: "Nu. 2000-5000/month",
      },
      {
        name: "Photography",
        description: "Cover events and ceremonies",
        skills: ["Photography", "Photo Editing"],
        link: "#local",
        potential: "Nu. 3000-8000/event",
      },
      {
        name: "Design Services",
        description: "Logos, banners for local businesses",
        skills: ["Graphic Design", "Canva"],
        link: "#local",
        potential: "Nu. 500-3000/project",
      },
    ],
  },
  {
    category: "Creative Arts",
    icon: Palette,
    color: "bg-orange-100 text-orange-600",
    minAge: 13,
    platforms: [
      {
        name: "Etsy",
        description: "Sell handmade crafts and art",
        skills: ["Crafting", "Jewelry", "Painting", "Digital Art"],
        link: "https://etsy.com",
        potential: "$50-500/month",
      },
      {
        name: "Redbubble",
        description: "Print-on-demand designs",
        skills: ["Graphic Design", "Illustration"],
        link: "https://redbubble.com",
        potential: "$20-200/month",
      },
      {
        name: "Spotify",
        description: "Upload your music",
        skills: ["Music Production", "Singing", "Songwriting"],
        link: "https://spotify.com/artists",
        potential: "$0-1000/month",
      },
    ],
  },
];

const SKILL_MONETIZATION_MAP: Record<string, string[]> = {
  "Programming": [
    "Freelance Web Development",
    "Mobile App Development",
    "Create Online Courses",
    "Bug Bounty Hunting",
    "Tech Support",
  ],
  "Design": [
    "Logo Design",
    "Social Media Graphics",
    "UI/UX Design",
    "Print-on-Demand",
    "Commission Art",
  ],
  "Writing": [
    "Content Writing",
    "Copywriting",
    "Blog Posts",
    "Technical Writing",
    "Ghostwriting",
  ],
  "Communication": [
    "Social Media Management",
    "Virtual Assistant",
    "Customer Support",
    "Public Speaking",
    "Podcasting",
  ],
  "Problem Solving": [
    "Consulting",
    "Tutoring",
    "Game Testing",
    "Quality Assurance",
    "Research",
  ],
  "Mathematics": [
    "Math Tutoring",
    "Data Entry",
    "Accounting Help",
    "Statistics Consulting",
  ],
};

export default function MonetizePage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [userAge, setUserAge] = useState<number>(15);

  const filteredPathways = selectedCategory
    ? MONETIZATION_PATHWAYS.filter((p) => p.category === selectedCategory)
    : MONETIZATION_PATHWAYS;

  const getRecommendedPathways = () => {
    const recommendations: string[] = [];
    MONETIZATION_PATHWAYS.forEach((pathway) => {
      if (userAge >= pathway.minAge) {
        recommendations.push(pathway.category);
      }
    });
    return recommendations;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <DollarSign className="w-8 h-8 text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            Turn Your Skills Into Income
          </h1>
        </div>
        <p className="text-gray-600">
          Discover how to monetize your skills - both now and in the future
        </p>
      </div>

      {/* Age Notice */}
      <Card className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
        <CardHeader>
          <CardTitle className="text-xl">Age-Appropriate Opportunities</CardTitle>
          <CardDescription className="text-blue-100">
            Select your age to see personalized earning options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-blue-100">I am:</span>
            {[13, 14, 15, 16, 17, 18].map((age) => (
              <button
                key={age}
                onClick={() => setUserAge(age)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  userAge === age
                    ? "bg-white text-blue-600"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                {age} {age === 18 ? "+" : ""}
              </button>
            ))}
          </div>
          <p className="text-blue-100 text-sm">
            {userAge < 15
              ? "At your age, focus on building skills. Local opportunities may be available with parental support."
              : userAge < 16
              ? "Great! You can start with local services and content creation with parental guidance."
              : "Excellent! You can explore most freelancing platforms with proper documentation."}
          </p>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Available Pathways
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {getRecommendedPathways().length}
            </div>
            <p className="text-xs text-gray-500 mt-1">For your age group</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Platforms Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">12+</div>
            <p className="text-xs text-gray-500 mt-1">Global & local</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Potential Range
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              Nu. 2K - 50K
            </div>
            <p className="text-xs text-gray-500 mt-1">Monthly earning potential</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Time to Start
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {userAge >= 16 ? "Now!" : "Soon"}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {userAge < 16 ? `Can start in ${16 - userAge} year(s)` : "Ready to earn"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter by Category */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !selectedCategory
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Categories
            </button>
            {MONETIZATION_PATHWAYS.map((pathway) => (
              <button
                key={pathway.category}
                onClick={() => setSelectedCategory(pathway.category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === pathway.category
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {pathway.category}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monetization Pathways */}
      <div className="space-y-8">
        {filteredPathways.map((pathway) => (
          <div key={pathway.category}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${pathway.color}`}>
                <pathway.icon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{pathway.category}</h2>
                <p className="text-gray-600">
                  {userAge < pathway.minAge
                    ? `Available starting age ${pathway.minAge}`
                    : "Available for your age group"}
                </p>
              </div>
              {userAge >= pathway.minAge && (
                <Badge className="bg-green-100 text-green-800">Ready to Start</Badge>
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {pathway.platforms.map((platform) => (
                <Card
                  key={platform.name}
                  className={`${userAge < pathway.minAge ? "opacity-50" : ""} hover:shadow-lg transition-shadow`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{platform.name}</CardTitle>
                      {platform.link !== "#local" && (
                        <a
                          href={platform.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    <CardDescription>{platform.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Skills */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Required Skills:</h4>
                      <div className="flex flex-wrap gap-1">
                        {platform.skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Earning Potential */}
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm text-gray-600">Earning Potential:</span>
                      <span className="font-bold text-green-600">{platform.potential}</span>
                    </div>

                    {/* Time Commitment */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Flexible hours - work anytime</span>
                    </div>

                    {/* Action */}
                    {userAge >= pathway.minAge ? (
                      <Button size="sm" className="w-full" asChild>
                        <a
                          href={platform.link}
                          target={platform.link !== "#local" ? "_blank" : undefined}
                          rel={platform.link !== "#local" ? "noopener noreferrer" : undefined}
                        >
                          {platform.link === "#local" ? "Learn How to Start" : "Explore Platform"}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </a>
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" className="w-full" disabled>
                        <Clock className="w-4 h-4 mr-2" />
                        Available at age {pathway.minAge}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Skill to Money Mapping */}
      <Card className="border-2 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            Your Skills → Income Ideas
          </CardTitle>
          <CardDescription>
            Based on your assessment results and interests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {Object.entries(SKILL_MONETIZATION_MAP).slice(0, 4).map(([skill, ideas]) => (
              <div key={skill} className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  {skill}
                </h4>
                <ul className="space-y-2">
                  {ideas.map((idea) => (
                    <li key={idea} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      {idea}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-4" asChild>
            <a href="/dashboard/assessment">
              Take Assessment to Discover More Ideas
              <ArrowRight className="w-4 h-4 ml-2" />
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Success Stories */}
      <Card className="bg-gradient-to-r from-green-600 to-teal-600 text-white border-0">
        <CardHeader>
          <CardTitle className="text-xl">Success Stories: Young Earners</CardTitle>
          <CardDescription className="text-green-100">
            Real examples of young people monetizing their skills
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-3xl mb-2">👩‍💻</div>
              <h4 className="font-semibold mb-1">Priya, 17</h4>
              <p className="text-sm text-green-100 mb-2">India</p>
              <p className="text-sm">
                Started freelancing on Fiverr at 16. Now earns $500/month from web development.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-3xl mb-2">🎨</div>
              <h4 className="font-semibold mb-1">Karma, 16</h4>
              <p className="text-sm text-green-100 mb-2">Bhutan</p>
              <p className="text-sm">
                Creates digital art and sells on Redbubble. Earns $100/month while studying.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-3xl mb-2">📱</div>
              <h4 className="font-semibold mb-1">Tashi, 15</h4>
              <p className="text-sm text-green-100 mb-2">Thimphu</p>
              <p className="text-sm">
                Started tech tutoring for Class 6-8 students. Makes Nu. 3000/month locally.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Getting Started Guide */}
      <Card>
        <CardHeader>
          <CardTitle>How to Start Earning: Step-by-Step</CardTitle>
          <CardDescription>
            Follow these steps to begin your earning journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-5 gap-6">
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                1
              </div>
              <h4 className="font-medium mb-1">Identify Skills</h4>
              <p className="text-sm text-gray-600">
                Complete assessment to find your strengths
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                2
              </div>
              <h4 className="font-medium mb-1">Learn Basics</h4>
              <p className="text-sm text-gray-600">
                Use Skills Hub to learn fundamentals
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                3
              </div>
              <h4 className="font-medium mb-1">Build Portfolio</h4>
              <p className="text-sm text-gray-600">
                Create sample work to show clients
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                4
              </div>
              <h4 className="font-medium mb-1">Create Account</h4>
              <p className="text-sm text-gray-600">
                Sign up on platforms with parental help
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                5
              </div>
              <h4 className="font-medium mb-1">Start Earning</h4>
              <p className="text-sm text-gray-600">
                Begin with small projects, build reputation
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parental Involvement Notice */}
      <Card className="border-2 border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-yellow-600" />
            Parental Guidance Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700">
            If you are under 18, you will need your parents' help to:
            Create accounts on freelancing platforms, set up payment methods,
            and verify your identity. Show them this page and discuss together!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
