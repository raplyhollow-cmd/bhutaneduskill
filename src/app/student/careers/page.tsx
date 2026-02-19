"use client";

import { logger } from "@/lib/logger";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, GraduationCap, ArrowRight, Bookmark, Sparkles, AlertCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface CareerMatch {
  id: string;
  careerId: string;
  careerTitle: string;
  matchScore: number;
  matchReason: string;
  isTopMatch: boolean;
  assessmentType: string;
}

interface CareerMatchesResponse {
  hasAssessments: boolean;
  assessmentCount: number;
  careerMatches: CareerMatch[];
  hollandCode: string | null;
  studentName: string;
  message?: string;
}

export default function CareersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [savedCareers, setSavedCareers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [careerData, setCareerData] = useState<CareerMatchesResponse | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    loadCareerMatches();
    loadSavedCareers();
  }, []);

  const loadCareerMatches = async () => {
    try {
      setLoading(true);
      setHasError(false);
      const response = await fetch("/api/student/career-matches");
      if (response.ok) {
        const data = await response.json();
        setCareerData(data);
      }
    } catch (error) {
      logger.error("Failed to load career matches:", error);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedCareers = async () => {
    try {
      const response = await fetch("/api/saved-careers");
      if (response.ok) {
        const data = await response.json();
        setSavedCareers(data.savedCareers || []);
      }
    } catch (error) {
      logger.error("Failed to load saved careers:", error);
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

  // Filter career matches based on search
  const filteredCareers = careerData?.careerMatches.filter((match) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      match.careerTitle.toLowerCase().includes(searchLower) ||
      match.matchReason?.toLowerCase().includes(searchLower) ||
      match.assessmentType.toLowerCase().includes(searchLower)
    );
  }) || [];

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800 border-green-200";
    if (score >= 60) return "bg-blue-100 text-blue-800 border-blue-200";
    return "bg-yellow-100 text-yellow-800 border-yellow-200";
  };

  const getMatchScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent Match";
    if (score >= 60) return "Good Match";
    return "Potential Match";
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Career Explorer
          </h1>
          <p className="text-gray-600">
            Discover careers that match your skills and interests
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (hasError) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Career Explorer
          </h1>
        </div>
        <Card className="p-12 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-700 font-medium mb-2">Unable to load career matches</p>
          <p className="text-gray-500 mb-4">There was an error loading your personalized career recommendations.</p>
          <Button onClick={loadCareerMatches}>Try Again</Button>
        </Card>
      </div>
    );
  }

  // No assessments completed state
  if (!careerData?.hasAssessments) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Career Explorer
          </h1>
          <p className="text-gray-600">
            Discover careers that match your skills and interests
          </p>
        </div>
        <Card className="p-12 text-center bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <Sparkles className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Complete Assessments to See Your Career Matches
          </h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Take our career assessments (RIASEC, MBTI, Work Values) to get personalized career recommendations based on your unique personality and interests.
          </p>
          <Button asChild className="bg-orange-500 hover:bg-orange-600">
            <Link href="/student/assessments">
              Start Assessments
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </Card>

        {/* Show general career categories as preview */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Career Categories</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { name: "STEM", icon: "🔬", color: "from-blue-50 to-cyan-50" },
              { name: "Healthcare", icon: "🏥", color: "from-red-50 to-pink-50" },
              { name: "Business", icon: "💼", color: "from-amber-50 to-yellow-50" },
              { name: "Arts", icon: "🎨", color: "from-purple-50 to-violet-50" },
              { name: "Education", icon: "📚", color: "from-green-50 to-emerald-50" },
              { name: "Agriculture", icon: "🌾", color: "from-lime-50 to-green-50" },
              { name: "Technology", icon: "💻", color: "from-indigo-50 to-blue-50" },
              { name: "Public Service", icon: "🏛️", color: "from-slate-50 to-gray-50" },
            ].map((category) => (
              <Card key={category.name} className={`hover:shadow-md transition-shadow bg-gradient-to-br ${category.color}`}>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl mb-2">{category.icon}</div>
                  <p className="font-medium text-gray-800">{category.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Has career matches - show personalized results
  return (
    <div className="space-y-8">
      {/* Header with Holland Code */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Your Career Matches
          </h1>
          <p className="text-gray-600">
            Personalized career recommendations based on your assessments
          </p>
          {careerData.hollandCode && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-gray-500">Your Holland Code:</span>
              <Badge variant="outline" className="text-sm font-mono bg-orange-50 text-orange-700 border-orange-200">
                {careerData.hollandCode}
              </Badge>
            </div>
          )}
        </div>
        <Button variant="outline" asChild>
          <Link href="/student/assessments">
            Retake Assessments
          </Link>
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search your career matches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Assessments Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-900">
                {careerData.assessmentCount}
              </span>
              <Sparkles className="w-5 h-5 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Your Career Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-900">
                {careerData.careerMatches.length}
              </span>
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Top Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-900">
                {careerData.careerMatches.filter(m => m.isTopMatch).length}
              </span>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Career Match Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {filteredCareers.map((match) => (
          <Card key={match.id} className={cn(
            "hover:shadow-lg transition-shadow",
            match.isTopMatch && "border-orange-300 bg-gradient-to-br from-orange-50/50 to-white"
          )}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-xl">{match.careerTitle}</CardTitle>
                    {match.isTopMatch && (
                      <Badge className="bg-orange-500 text-white shrink-0">
                        Top Match
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="mt-1">
                    Based on: {match.assessmentType}
                  </CardDescription>
                </div>
                <Badge className={cn("shrink-0", getMatchScoreColor(match.matchScore))}>
                  {match.matchScore}% Match
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {getMatchScoreLabel(match.matchScore)}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Match Reason */}
              {match.matchReason && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-900">
                    <span className="font-medium">Why this matches you:</span> {match.matchReason}
                  </p>
                </div>
              )}

              {/* Match Score Bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Match Score</span>
                  <span className="text-sm font-bold text-gray-900">{match.matchScore}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      match.matchScore >= 80 ? "bg-green-500" :
                      match.matchScore >= 60 ? "bg-blue-500" : "bg-yellow-500"
                    )}
                    style={{ width: `${match.matchScore}%` }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3">
                <Button
                  size="sm"
                  variant={savedCareers.includes(match.careerId) ? "default" : "outline"}
                  onClick={() => toggleSaveCareer(match.careerId)}
                  disabled={loading}
                  className="min-w-[100px]"
                >
                  <Bookmark className={cn("w-4 h-4 mr-2", savedCareers.includes(match.careerId) && "fill-current")} />
                  {savedCareers.includes(match.careerId) ? "Saved" : "Save"}
                </Button>
                <Button size="sm" variant="outline" className="flex-1" asChild>
                  <Link href="/student/skills">
                    <GraduationCap className="w-4 h-4 mr-2" />
                    Find Courses
                  </Link>
                </Button>
                <Button size="sm" className="flex-1" asChild>
                  <Link href={`/student/careers/${match.careerId}`}>
                    View Details
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCareers.length === 0 && careerData.careerMatches.length > 0 && (
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
