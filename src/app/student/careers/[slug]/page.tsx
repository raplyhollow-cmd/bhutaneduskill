"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CAREERS_DATABASE } from "@/lib/tenant";
import {
  ArrowLeft,
  GraduationCap,
  DollarSign,
  Building,
  Bookmark,
  Share2,
  CheckCircle2,
  Clock,
  Globe,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function CareerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [career, setCareer] = useState<typeof CAREERS_DATABASE[0] | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Find career by slug
    const foundCareer = CAREERS_DATABASE.find((c) => c.slug === slug);
    setCareer(foundCareer || null);

    // Check if saved
    checkIfSaved(slug);
  }, [slug]);

  const checkIfSaved = async (careerSlug: string) => {
    try {
      const response = await fetch("/api/saved-careers");
      if (response.ok) {
        const data = await response.json();
        const savedCareers = data.savedCareers || [];
        setIsSaved(savedCareers.some((c: any) => c.slug === careerSlug));
      }
    } catch (error) {
      console.error("Failed to check saved status:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSave = async () => {
    if (!career) return;

    try {
      const response = await fetch("/api/saved-careers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          careerId: career.id,
          action: isSaved ? "unsave" : "save",
        }),
      });

      if (response.ok) {
        setIsSaved(!isSaved);
      }
    } catch (error) {
      console.error("Failed to save career:", error);
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!career) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Career Not Found</h1>
        <p className="text-gray-600 mb-6">
          The career you're looking for doesn't exist.
        </p>
        <Button onClick={() => router.push("/student/careers")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Careers
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/student/careers")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Careers
        </Button>
        <div className="flex gap-2">
          <Button
            variant={isSaved ? "default" : "outline"}
            size="sm"
            onClick={toggleSave}
          >
            <Bookmark className={cn("w-4 h-4 mr-2", isSaved && "fill-current")} />
            {isSaved ? "Saved" : "Save"}
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Title Section */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <CardTitle className="text-3xl">{career.name}</CardTitle>
                <Badge className={getDemandColor(career.demandOutlook)}>
                  {getDemandLabel(career.demandOutlook)}
                </Badge>
                {career.bhutanSpecific && (
                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                    Bhutan Focus
                  </Badge>
                )}
              </div>
              <CardDescription className="text-base">
                {career.description}
              </CardDescription>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Demand</p>
                <p className="font-semibold capitalize">{career.demandOutlook}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Salary Range</p>
                <p className="font-semibold text-sm">{career.salaryRange}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-500">Education</p>
                <p className="font-semibold text-sm">
                  {career.educationPath[0] || "Varies"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-500">Work Environment</p>
                <p className="font-semibold text-sm">{career.workEnvironment}</p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle>Required Skills</CardTitle>
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

      {/* Education Path */}
      <Card>
        <CardHeader>
          <CardTitle>Education Path</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {career.educationPath.map((edu, index) => (
              <li key={index} className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span>{edu}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Related Subjects */}
      <Card>
        <CardHeader>
          <CardTitle>Related Subjects</CardTitle>
          <CardDescription>
            Focus on these subjects in school to prepare for this career
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

      {/* Study Abroad Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle>Study Abroad Opportunities</CardTitle>
          <CardDescription>
            Countries with strong programs in this field
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(career.studyAbroad).map(([country, level]) => (
              <div
                key={country}
                className="border rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-blue-600" />
                  <div>
                    <h4 className="font-semibold capitalize">{country}</h4>
                    <p className="text-xs text-gray-500 capitalize">Demand: {level}</p>
                  </div>
                </div>
                <Badge
                  variant={level === "very-high" ? "default" : "secondary"}
                  className="capitalize"
                >
                  {level}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* RIASEC Code */}
      <Card>
        <CardHeader>
          <CardTitle>Your Personality Match</CardTitle>
          <CardDescription>
            This career matches the RIASEC code: <strong>{career.riasecCode}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-2">
                Take the RIASEC assessment to see if this career matches your personality!
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/student/assessment/riasec">
                  Take Assessment
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card className="bg-orange-50 border-orange-200">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button className="flex-1" asChild>
              <Link href="/student/assessment/riasec">
                <GraduationCap className="w-4 h-4 mr-2" />
                Take Career Assessment
              </Link>
            </Button>
            <Button variant="outline" className="flex-1" asChild>
              <Link href="/student/skills">
                <TrendingUp className="w-4 h-4 mr-2" />
                Find Related Courses
              </Link>
            </Button>
            <Button variant="outline" className="flex-1" asChild>
              <Link href="/student/rub">
                <Globe className="w-4 h-4 mr-2" />
                Explore RUB Programs
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
