"use client";

import { logger } from "@/lib/logger";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { calculateDISC, getDISCQuestions } from "@/lib/assessments";
import type { DISCInput, DISCResult } from "@/lib/assessments";
import { ArrowRight, CheckCircle2, ClipboardCheck } from "lucide-react";
import Link from "next/link";

const QUESTIONS = getDISCQuestions();

const DIMENSION_OPTIONS: Record<string, { label: string; value: string }[]> = {
  D: [
    { label: "Getting immediate results", value: "D" },
    { label: "Inspiring others", value: "I" },
    { label: "Supporting the team", value: "S" },
    { label: "Ensuring accuracy", value: "C" },
  ],
  I: [
    { label: "Being direct and firm", value: "D" },
    { label: "Being friendly and outgoing", value: "I" },
    { label: "Being supportive and understanding", value: "S" },
    { label: "Being logical and objective", value: "C" },
  ],
  S: [
    { label: "Taking the lead", value: "D" },
    { label: "Being the center of attention", value: "I" },
    { label: "Being a good team player", value: "S" },
    { label: "Analyzing the situation", value: "C" },
  ],
  C: [
    { label: "Confronting challenges head-on", value: "D" },
    { label: "Seeking help from others", value: "I" },
    { label: "Staying calm and steady", value: "S" },
    { label: "Planning carefully", value: "C" },
  ],
};

const DIMENSION_INFO: Record<string, { name: string; description: string; color: string }> = {
  D: { name: "Dominance", description: "Direct, firm, and forceful", color: "bg-red-50 border-red-200" },
  I: { name: "Influence", description: "Outgoing, enthusiastic, and sociable", color: "bg-yellow-50 border-yellow-200" },
  S: { name: "Steadiness", description: "Patient, supportive, and reliable", color: "bg-green-50 border-green-200" },
  C: { name: "Conscientiousness", description: "Analytical, precise, and private", color: "bg-blue-50 border-blue-200" },
};

export default function DISCAssessmentPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<DISCInput>({});
  const [result, setResult] = useState<DISCResult | null>(null);

  const handleAnswer = (mostValue: string, leastValue: string) => {
    const question = QUESTIONS[currentQuestion];
    const newAnswers = {
      ...answers,
      [question.id]: {
        most: mostValue as "D" | "I" | "S" | "C",
        least: leastValue as "D" | "I" | "S" | "C",
      },
    };
    setAnswers(newAnswers);

    if (currentQuestion < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
    } else {
      const calculatedResult = calculateDISC(newAnswers, QUESTIONS);
      setResult(calculatedResult);
      saveAssessment(newAnswers, calculatedResult);
    }
  };

  const saveAssessment = async (finalAnswers: DISCInput, assessmentResult: DISCResult) => {
    try {
      await fetch("/api/assessments/disc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "disc",
          answers: finalAnswers,
          results: assessmentResult,
        }),
      });
    } catch (error) {
      logger.error("Failed to save assessment:", error);
    }
  };

  const restartAssessment = () => {
    setAnswers({});
    setCurrentQuestion(0);
    setResult(null);
  };

  if (result) {
    const maxScore = Math.max(result.dominance, result.influence, result.steadiness, result.conscientiousness);

    return (
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Your DISC Personality Type
          </h1>
          <p className="text-gray-600">
            Understanding your behavioral style and how you interact with others
          </p>
        </div>

        {/* Primary Type Badge */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-6xl font-bold mb-2">{result.primaryType}</div>
              <p className="text-blue-100 text-lg">{result.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Score Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Your DISC Profile</CardTitle>
            <CardDescription>Your intensity across four behavioral dimensions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              { key: "D", score: result.dominance },
              { key: "I", score: result.influence },
              { key: "S", score: result.steadiness },
              { key: "C", score: result.conscientiousness },
            ].map(({ key, score }) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{key}</span>
                    <span className="text-sm text-gray-600">{DIMENSION_INFO[key].name}</span>
                    {score === maxScore && (
                      <Badge variant="default">Dominant</Badge>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">{score}%</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{DIMENSION_INFO[key].description}</p>
                <Progress value={score} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Traits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Behavioral Traits</CardTitle>
              <CardDescription>Key characteristics of your style</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {result.traits.map((trait, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                    <span>{trait}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Strengths</CardTitle>
              <CardDescription>What you naturally excel at</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {result.strengths.map((strength, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Career Suggestions */}
        <Card>
          <CardHeader>
            <CardTitle>Careers That Fit Your Style</CardTitle>
            <CardDescription>Based on your DISC personality type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {result.careerSuggestions.map((career) => (
                <div
                  key={career}
                  className="p-3 bg-gray-50 rounded-lg text-center text-sm font-medium"
                >
                  {career}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-wrap gap-4">
          <Button variant="outline" onClick={restartAssessment}>
            Retake Assessment
          </Button>
          <Button
            asChild
            style={{ background: "linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)" }}
          >
            <Link href="/student/careers">
              View Career Matches
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/student/assessment">
              More Assessments
              <ClipboardCheck className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const question = QUESTIONS[currentQuestion];
  const currentAnswer = answers[question.id];
  const progress = ((Object.keys(answers).length) / QUESTIONS.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Badge variant="outline" className={DIMENSION_INFO[question.dimension].color}>
            {DIMENSION_INFO[question.dimension].name}
          </Badge>
          <span className="text-sm text-gray-500">
            Question {currentQuestion + 1} of {QUESTIONS.length}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          DISC Behavior Assessment
        </h1>
        <p className="text-gray-600">
          For each question, select what is MOST like you and LEAST like you from the options below.
        </p>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </CardContent>
      </Card>

      {/* Question Card */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-xl">{question.text}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Response Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Most Like Me */}
            <div>
              <h3 className="font-medium text-green-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Most Like Me
              </h3>
              <div className="space-y-2">
                {DIMENSION_OPTIONS[question.dimension].map((option) => (
                  <button
                    key={`most-${option.value}`}
                    onClick={() => {
                      handleAnswer(
                        option.value,
                        currentAnswer ? currentAnswer.least : "C"
                      );
                    }}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      currentAnswer?.most === option.value
                        ? "border-green-500 bg-green-50 text-green-900"
                        : "border-gray-200 hover:border-green-300 hover:bg-green-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        currentAnswer?.most === option.value
                          ? "border-green-500 bg-green-500"
                          : "border-gray-300"
                      }`}>
                        {currentAnswer?.most === option.value && (
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span className="font-medium">{option.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Least Like Me */}
            <div>
              <h3 className="font-medium text-red-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                Least Like Me
              </h3>
              <div className="space-y-2">
                {DIMENSION_OPTIONS[question.dimension].map((option) => (
                  <button
                    key={`least-${option.value}`}
                    onClick={() => {
                      handleAnswer(
                        currentAnswer ? currentAnswer.most : "D",
                        option.value
                      );
                    }}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      currentAnswer?.least === option.value
                        ? "border-red-500 bg-red-50 text-red-900"
                        : "border-gray-200 hover:border-red-300 hover:bg-red-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        currentAnswer?.least === option.value
                          ? "border-red-500 bg-red-500"
                          : "border-gray-300"
                      }`}>
                        {currentAnswer?.least === option.value && (
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span className="font-medium">{option.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Indicators */}
      <div className="flex justify-center gap-2">
        {QUESTIONS.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentQuestion(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentQuestion
                ? "bg-blue-500 scale-125"
                : answers[QUESTIONS[index].id]
                  ? "bg-blue-300"
                  : "bg-gray-300"
            }`}
            aria-label={`Go to question ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
