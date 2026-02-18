"use client";

import { logger } from "@/lib/logger";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CAREERS_DATABASE, STUDY_ABROAD_REQUIREMENTS } from "@/lib/tenant";
import { Search, TrendingUp, GraduationCap, Globe, DollarSign, Building, ArrowRight, Bookmark } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function CareersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [savedCareers, setSavedCareers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedCareers();
  }, []);

  const loadSavedCareers = async () => {
    try {
      const response = await fetch("/api/saved-careers");
      if (response.ok) {
        const data = await response.json();
        setSavedCareers(data.savedCareers || []);
      }
    } catch (error) {
      logger.error("Failed to load saved careers:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSaveCareer = async (careerId: string) => {
    const isSaved = savedCareers.includes(careerId);
    const action = isSaved ? "unsave" : "save";

    try {
      const response = await fetch("/api/saved-careers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ careerId, action }),
      });

      if (response.ok) {
        setSavedCareers(prev =>
          isSaved
            ? prev.filter(id => id !== careerId)
            : [...prev, careerId]
        );
      }
    } catch (error) {
      logger.error("Failed to update saved careers:", error);
    }
  };

  // Filter careers based on search and category
  const filteredCareers = CAREERS_DATABASE.filter((career) => {
    const matchesSearch =
      career.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      career.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      career.skills.some((skill) =>
        skill.toLowerCase().includes(searchTerm.toLowerCase())
      );

    return matchesSearch;
  });

  const getDemandColor = (demand: string) => {
    switch (demand) {
      case "very-high":
        return "bg-green-100 text-green-800";
      case "high":
        return "bg-blue-100 text-blue-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDemandLabel = (demand: string) => {
    switch (demand) {
      case "very-high":
        return "Very High Demand";
      case "high":
        return "High Demand";
      case "medium":
        return "Medium Demand";
      default:
        return "Emerging";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Career Explorer
        </h1>
        <p className="text-gray-600">
          Discover careers that match your skills and interests
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search careers, skills, or interests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Careers Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-900">
                {CAREERS_DATABASE.length}
              </span>
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              In High Demand
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-900">
                {CAREERS_DATABASE.filter((c) => c.demandOutlook === "high" || c.demandOutlook === "very-high").length}
              </span>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Study Abroad Options
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-900">
                {CAREERS_DATABASE.filter((c) => c.studyAbroad).length}
              </span>
              <Globe className="w-5 h-5 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Career Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {filteredCareers.map((career) => (
          <Card key={career.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{career.name}</CardTitle>
                  <CardDescription className="mt-1">{career.description}</CardDescription>
                </div>
                <Badge className={getDemandColor(career.demandOutlook)}>
                  {getDemandLabel(career.demandOutlook)}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">RIASEC: {career.riasecCode}</Badge>
                {career.bhutanSpecific && (
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                    🇧🇹 In-Demand in Bhutan
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Salary */}
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Salary Range:</span>
                <span className="font-semibold text-gray-900">{career.salaryRange}</span>
              </div>

              {/* Skills */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Key Skills:</h4>
                <div className="flex flex-wrap gap-2">
                  {career.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Education Path */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Education Path:</h4>
                <ul className="space-y-1">
                  {career.educationPath.map((step, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-blue-500">{index + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Study Abroad */}
              {career.studyAbroad && (
                <div className="pt-3 border-t">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Study Abroad Opportunities:
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(career.studyAbroad).map(([country, level]) => (
                      <Badge key={country} variant="outline" className="justify-start">
                        {country === "australia" && "🇦🇺 Australia"}
                        {country === "new-zealand" && "🇳🇿 New Zealand"}
                        {country === "usa" && "🇺🇸 USA"}
                        {country === "singapore" && "🇸🇬 Singapore"}
                        {level === "very-high" && " ⭐⭐⭐"}
                        {level === "high" && " ⭐⭐"}
                        {level === "medium" && " ⭐"}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-3">
                <Button
                  size="sm"
                  variant={savedCareers.includes(career.id) ? "default" : "outline"}
                  onClick={() => toggleSaveCareer(career.id)}
                  disabled={loading}
                  className="min-w-[100px]"
                >
                  <Bookmark className={cn("w-4 h-4 mr-2", savedCareers.includes(career.id) && "fill-current")} />
                  {savedCareers.includes(career.id) ? "Saved" : "Save"}
                </Button>
                <Button size="sm" variant="outline" className="flex-1" asChild>
                  <Link href="/student/skills">
                    <GraduationCap className="w-4 h-4 mr-2" />
                    Find Courses
                  </Link>
                </Button>
                <Button size="sm" className="flex-1" asChild>
                  <Link href={`/student/careers/${career.slug}`}>
                    View Details
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCareers.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-gray-500 mb-4">No careers found matching your search.</p>
          <Button variant="outline" onClick={() => setSearchTerm("")}>
            Clear Search
          </Button>
        </Card>
      )}
    </div>
  );
}
