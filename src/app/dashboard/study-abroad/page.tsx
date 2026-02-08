"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { STUDY_ABROAD_REQUIREMENTS, RUB_COLLEGES } from "@/lib/tenant";
import Link from "next/link";
import { GraduationCap, Globe, BookOpen, CheckCircle2, AlertCircle, ArrowRight, GitCompareArrows } from "lucide-react";

export default function StudyAbroadPage() {
  // Mock user data - will be replaced with real data
  const userReadiness = {
    australia: 65,
    "new-zealand": 55,
    usa: 45,
    singapore: 70,
    europe: 40,
  };

  const userStats = {
    hasIELTS: false,
    ieltsScore: 0,
    hasSAT: false,
    satScore: 0,
    gpa: 75, // percentage
  };

  const getReadinessColor = (score: number) => {
    if (score >= 70) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getReadinessLabel = (score: number) => {
    if (score >= 70) return "Ready";
    if (score >= 50) return "Moderate";
    return "Needs Work";
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Study Abroad Readiness
          </h1>
          <Button variant="outline" asChild>
            <Link href="/dashboard/study-abroad/compare">
              <GitCompareArrows className="w-4 h-4 mr-2" />
              Compare Countries
            </Link>
          </Button>
        </div>
        <p className="text-gray-600">
          Check your readiness for international education opportunities
        </p>
      </div>

      {/* Overall Score */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
        <CardHeader>
          <CardTitle className="text-2xl">Your Study Abroad Readiness Score</CardTitle>
          <CardDescription className="text-blue-100">
            Based on your academic performance, language proficiency, and documentation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="text-6xl font-bold mb-2">
              {Math.round(Object.values(userReadiness).reduce((a, b) => a + b, 0) / 5)}%
            </div>
            <p className="text-blue-100">
              Average readiness across all destinations
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Country-Specific Readiness */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(STUDY_ABROAD_REQUIREMENTS).map(([countryId, country]) => {
          const readiness = userReadiness[countryId as keyof typeof userReadiness] || 0;

          return (
            <Card key={countryId} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{country.name}</CardTitle>
                  <Badge className={getReadinessColor(readiness)}>
                    {getReadinessLabel(readiness)}
                  </Badge>
                </div>
                <CardDescription>{country.avgTuition}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Readiness Progress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Readiness</span>
                    <span className={`text-sm font-bold ${getReadinessColor(readiness)}`}>
                      {readiness}%
                    </span>
                  </div>
                  <Progress value={readiness} />
                </div>

                {/* Requirements */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Requirements:</h4>
                  <ul className="space-y-2">
                    {countryId === "australia" || countryId === "new-zealand" || countryId === "singapore" ? (
                      <>
                        <li className="flex items-start gap-2 text-sm">
                          {userStats.hasIELTS && userStats.ieltsScore >= (country.ielts || 6.0) ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
                          )}
                          <span>
                            IELTS {country.ielts}+
                            {!userStats.hasIELTS && " (Not completed)"}
                            {userStats.hasIELTS && userStats.ieltsScore < (country.ielts || 6.0) && ` (Your score: ${userStats.ieltsScore})`}
                          </span>
                        </li>
                      </>
                    ) : null}
                    {countryId === "usa" && (
                      <li className="flex items-start gap-2 text-sm">
                        {userStats.hasSAT && userStats.satScore >= 1200 ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
                        )}
                        <span>
                          SAT 1200+
                          {!userStats.hasSAT && " (Not completed)"}
                        </span>
                      </li>
                    )}
                    {country.requirements.slice(0, 3).map((req, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5" />
                        <span className="text-gray-600">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Popular Courses */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Popular Courses:</h4>
                  <div className="flex flex-wrap gap-1">
                    {country.popularCourses.map((course) => (
                      <Badge key={course} variant="outline" className="text-xs">
                        {course}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button size="sm" className="w-full" variant="outline">
                  View Details
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* RUB Colleges */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Royal University of Bhutan Colleges
            </h2>
            <p className="text-gray-600">
              Explore local options before going abroad
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard/rub">
              View All RUB Colleges
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {RUB_COLLEGES.slice(0, 4).map((college) => (
            <Card key={college.id}>
              <CardHeader>
                <CardTitle>{college.name}</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  {college.location}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Programs:</h4>
                  <ul className="space-y-1">
                    {college.programs.slice(0, 3).map((program, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                        <BookOpen className="w-3 h-3 text-blue-500" />
                        {program}
                      </li>
                    ))}
                    {college.programs.length > 3 && (
                      <li className="text-xs text-gray-500">
                        +{college.programs.length - 3} more programs
                      </li>
                    )}
                  </ul>
                </div>
                <Button size="sm" variant="outline" className="w-full" asChild>
                  <Link href="/dashboard/rub">
                    Learn More
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Action Items */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            Recommended Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {!userStats.hasIELTS && (
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">1</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Register for IELTS Preparation</p>
                  <p className="text-sm text-gray-600">Required for Australia, NZ, Singapore, and UK admissions</p>
                </div>
              </li>
            )}
            {!userStats.hasSAT && (
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">2</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Start SAT Preparation</p>
                  <p className="text-sm text-gray-600">Required for US university admissions</p>
                </div>
              </li>
            )}
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-xs font-bold">3</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Research Scholarship Opportunities</p>
                <p className="text-sm text-gray-600">Explore government and international scholarship options</p>
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
