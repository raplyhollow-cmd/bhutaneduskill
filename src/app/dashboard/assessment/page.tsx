"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Brain, Target, Compass, Lightbulb, GraduationCap, Briefcase, Sparkles } from "lucide-react";
import Link from "next/link";

const ASSESSMENT_CATEGORIES = [
  {
    id: "personality",
    name: "Personality Assessments",
    description: "Discover your personality type and traits",
    color: "bg-purple-50 border-purple-200",
    icon: <Brain className="w-8 h-8 text-purple-600" />,
    assessments: [
      {
        slug: "mbti",
        name: "MBTI Personality Test",
        description: "Discover your 16-type personality based on Jungian psychology",
        duration: "15 min",
        questions: 16,
        badge: "Popular",
      },
      {
        slug: "disc",
        name: "DISC Assessment",
        description: "Understand your behavioral style (Dominance, Influence, Steadiness, Conscientiousness)",
        duration: "10 min",
        questions: 8,
        badge: null,
      },
    ],
  },
  {
    id: "interests",
    name: "Interest & Career Assessments",
    description: "Explore careers matching your interests",
    color: "bg-blue-50 border-blue-200",
    icon: <Compass className="w-8 h-8 text-blue-600" />,
    assessments: [
      {
        slug: "riasec",
        name: "RIASEC Holland Code",
        description: "Classic career interest assessment (Realistic, Investigative, Artistic, Social, Enterprising, Conventional)",
        duration: "10 min",
        questions: 18,
        badge: "Recommended",
      },
      {
        slug: "spark-lite",
        name: "Career Spark Lite",
        description: "Simplified assessment for Grade 8 and below - explore the world of work",
        duration: "8 min",
        questions: 18,
        badge: "Grade 8",
      },
      {
        slug: "spark-basic",
        name: "Career Spark Basic",
        description: "For Grade 9-10 - help with stream and subject selection",
        duration: "12 min",
        questions: 24,
        badge: "Grade 9-10",
      },
      {
        slug: "spark-advanced",
        name: "Career Spark Advanced",
        description: "For Grade 11-12 - college and career path decisions",
        duration: "12 min",
        questions: 24,
        badge: "Grade 11-12",
      },
    ],
  },
  {
    id: "values",
    name: "Values & Preferences",
    description: "Understand what matters most to you",
    color: "bg-green-50 border-green-200",
    icon: <Target className="w-8 h-8 text-green-600" />,
    assessments: [
      {
        slug: "work-values",
        name: "Work Values Inventory",
        description: "Discover what's important to you in a job (achievement, independence, recognition, etc.)",
        duration: "10 min",
        questions: 18,
        badge: null,
      },
    ],
  },
  {
    id: "learning",
    name: "Learning & Development",
    description: "Understand how you learn best",
    color: "bg-orange-50 border-orange-200",
    icon: <Lightbulb className="w-8 h-8 text-orange-600" />,
    assessments: [
      {
        slug: "learning-styles",
        name: "VARK Learning Styles",
        description: "Discover your learning style (Visual, Auditory, Read/Write, Kinesthetic)",
        duration: "8 min",
        questions: 12,
        badge: null,
      },
    ],
  },
];

export default function AssessmentCatalogPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Career Assessments
        </h1>
        <p className="text-gray-600">
          Discover your strengths, interests, and values to find the perfect career path
        </p>
      </div>

      {/* Hero Card */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">Find Your Ideal Career</h2>
              <p className="text-blue-100">
                Take scientifically validated assessments to discover careers that match your personality,
                interests, and values. Our assessments are based on O*NET framework and trusted by counselors.
              </p>
            </div>
            <Sparkles className="w-16 h-16 text-blue-200" />
          </div>
        </CardContent>
      </Card>

      {/* Assessment Categories */}
      {ASSESSMENT_CATEGORIES.map((category) => (
        <div key={category.id} className="space-y-4">
          <div className={`p-4 rounded-lg border-2 ${category.color} flex items-center gap-4`}>
            {category.icon}
            <div>
              <h3 className="text-lg font-semibold">{category.name}</h3>
              <p className="text-sm text-gray-600">{category.description}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {category.assessments.map((assessment) => (
              <Card key={assessment.slug} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{assessment.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {assessment.description}
                      </CardDescription>
                    </div>
                    {assessment.badge && (
                      <Badge variant="secondary">{assessment.badge}</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <GraduationCap className="w-4 h-4" />
                        {assessment.questions} questions
                      </span>
                      <span>•</span>
                      <span>{assessment.duration}</span>
                    </div>
                    <Button size="sm" asChild>
                      <Link href={`/dashboard/assessment/${assessment.slug}`}>
                        Start
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-blue-900 mb-2">About Our Assessments</h3>
          <p className="text-blue-800 text-sm">
            Our assessments are based on established psychological frameworks including the Holland Code (RIASEC),
            Myers-Briggs Type Indicator (MBTI), DISC personality system, and O*NET career interest profiler.
            Results are used to provide personalized career recommendations matched to the Bhutanese job market.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
