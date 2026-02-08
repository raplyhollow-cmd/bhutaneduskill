"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  DollarSign,
  GraduationCap,
  MapPin,
  Building,
  Users,
  Briefcase,
  TrendingUp,
  CheckCircle2,
  ExternalLink,
  Heart,
  Share2,
  Target,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { CAREERS_DATABASE } from "@/lib/tenant";

export default function CareerDetailPage() {
  const params = useParams();
  const [isSaved, setIsSaved] = useState(false);
  const [career, setCareer] = useState<any>(null);

  useEffect(() => {
    const foundCareer = CAREERS_DATABASE.find((c) => c.slug === params.slug);
    setCareer(foundCareer || null);
  }, [params.slug]);

  if (!career) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Career not found</h2>
        <Button asChild>
          <Link href="/dashboard/careers">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Careers
          </Link>
        </Button>
      </div>
    );
  }

  const relatedCareers = CAREERS_DATABASE.filter((c) => {
    const careerTraits = career.riasecCode.split("");
    const cTraits = c.riasecCode.split("");
    return c.id !== career.id && cTraits.some((t: string) => careerTraits.includes(t));
  }).slice(0, 4);

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
        return "Very High";
      case "high":
        return "High";
      case "medium":
        return "Moderate";
      default:
        return "Emerging";
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/careers">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Careers
          </Link>
        </Button>
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="sm" onClick={() => setIsSaved(!isSaved)}>
            <Heart className={`w-4 h-4 mr-2 ${isSaved ? "fill-red-500" : ""}`} />
            {isSaved ? "Saved" : "Save"}
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
        <CardContent className="pt-8 pb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-4xl font-bold">{career.name}</h1>
                <Badge className={getDemandColor(career.demandOutlook)}>
                  {getDemandLabel(career.demandOutlook)} Demand
                </Badge>
              </div>
              <p className="text-xl text-blue-100 mb-6">{career.description}</p>
              <div className="flex flex-wrap gap-2">
                {career.bhutanSpecific && (
                  <Badge className="bg-white/20 text-white border-white">
                    🇧🇹 In-Demand in Bhutan
                  </Badge>
                )}
                <Badge variant="outline" className="text-white border-white/50">
                  RIASEC: {career.riasecCode}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Salary Range
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-gray-900">{career.salaryRange}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Education Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium text-gray-900">
              {career.educationPath[0].includes("Bachelor") ? "Bachelor's Degree" : "Various"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Job Outlook
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getDemandColor(career.demandOutlook)}>
              {getDemandLabel(career.demandOutlook)}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Building className="w-4 h-4" />
              Work Environment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">{career.workEnvironment}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Key Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Required Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {career.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="px-3 py-1">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Subjects to Focus On */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Subjects to Focus On
              </CardTitle>
              <CardDescription>
                If you're interested in {career.name}, focus on these subjects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {career.subjects.map((subject) => (
                  <Badge key={subject} variant="outline" className="px-3 py-1">
                    {subject}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Education Path */}
          <Card>
            <CardHeader>
              <CardTitle>Education Pathway</CardTitle>
              <CardDescription>
                Steps to become a {career.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {career.educationPath.map((step, index) => (
                <div key={index} className="flex gap-4">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-900">{step}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Study Abroad Options */}
          {career.studyAbroad && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Study Abroad Opportunities
                </CardTitle>
                <CardDescription>
                  Countries with high demand for this career
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(career.studyAbroad).map(([country, level]) => (
                    <div key={country} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        {country === "australia" && "🇦🇺 Australia"}
                        {country === "new-zealand" && "🇳🇿 New Zealand"}
                        {country === "usa" && "🇺🇸 USA"}
                        {country === "singapore" && "🇸🇬 Singapore"}
                      </div>
                      <div className="flex gap-1">
                        {level === "very-high" && <span className="text-yellow-500">⭐⭐⭐</span>}
                        {level === "high" && <span className="text-yellow-500">⭐⭐</span>}
                        {level === "medium" && <span className="text-yellow-500">⭐</span>}
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link href="/dashboard/study-abroad/compare">
                    Compare Countries
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Your Match */}
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Your Match
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Based on your RIASEC results</span>
                  <span className="text-sm font-bold text-blue-600">
                    {/* Would calculate actual match */}
                    85%
                  </span>
                </div>
                <Progress value={85} className="h-2" />
              </div>
              <p className="text-sm text-gray-700">
                This career strongly matches your interests in{" "}
                {career.riasecCode.split("").map((c) => {
                  const names: Record<string, string> = {
                    R: "Realistic activities",
                    I: "Investigative work",
                    A: "Creative expression",
                    S: "Helping others",
                    E: "Leadership",
                    C: "Organized work",
                  };
                  return names[c] || c;
                }).join(" and ")}.
              </p>
            </CardContent>
          </Card>

          {/* Learning Resources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Start Learning Today
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/dashboard/skills">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Browse Free Courses
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/dashboard/monetize">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Earning Opportunities
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Related Careers */}
          <Card>
            <CardHeader>
              <CardTitle>Related Careers</CardTitle>
              <CardDescription>
                Similar careers you might like
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {relatedCareers.map((related) => (
                <Link
                  key={related.id}
                  href={`/dashboard/careers/${related.slug}`}
                  className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{related.name}</p>
                      <p className="text-sm text-gray-500">{related.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" size="sm" asChild>
                <Link href="/dashboard/assessment">
                  Take Assessment
                </Link>
              </Button>
              <Button className="w-full" size="sm" variant="outline" asChild>
                <Link href="/dashboard/monetize">
                  See Earning Potential
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Day in the Life */}
      <Card>
        <CardHeader>
          <CardTitle>A Day in the Life</CardTitle>
          <CardDescription>
            What does a {career.name} actually do?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Morning
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Check emails and messages</li>
                <li>• Team standup meeting</li>
                <li>• Plan the day's tasks</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Afternoon
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Focused work on projects</li>
                <li>• Client meetings or calls</li>
                <li>• Problem-solving and collaboration</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Growth
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Learning new technologies</li>
                <li>• Skill development</li>
                <li>• Career networking</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
