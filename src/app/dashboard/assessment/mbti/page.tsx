"use client";

import { logger } from "@/lib/logger";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { calculateMBTI, getMBTIQuestions } from "@/lib/assessments";
import type { MBTIInput, MBTIResult } from "@/lib/assessments";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const QUESTIONS = getMBTIQuestions();

const DIMENSION_NAMES: Record<string, { name: string; left: string; right: string }> = {
  EI: { name: "Extraversion vs Introversion", left: "Extraversion (E)", right: "Introversion (I)" },
  SN: { name: "Sensing vs Intuition", left: "Sensing (S)", right: "Intuition (N)" },
  TF: { name: "Thinking vs Feeling", left: "Thinking (T)", right: "Feeling (F)" },
  JP: { name: "Judging vs Perceiving", left: "Judging (J)", right: "Perceiving (P)" },
};

const OPTIONS = [
  { value: 2, label: "Strongly Agree" },
  { value: 1, label: "Agree" },
  { value: -1, label: "Disagree" },
  { value: -2, label: "Strongly Disagree" },
];

export default function MBTIAssessmentPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<MBTIInput>({});
  const [result, setResult] = useState<MBTIResult | null>(null);

  const handleAnswer = (value: number) => {
    const newAnswers = { ...answers, [QUESTIONS[currentQuestion].id]: value };
    setAnswers(newAnswers);

    if (currentQuestion < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
    } else {
      const calculatedResult = calculateMBTI(newAnswers, QUESTIONS);
      setResult(calculatedResult);
      saveAssessment(newAnswers, calculatedResult);
    }
  };

  const saveAssessment = async (finalAnswers: MBTIInput, assessmentResult: MBTIResult) => {
    try {
      await fetch("/api/assessments/mbti", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "mbti",
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
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Your MBTI Personality Type
          </h1>
          <p className="text-gray-600">
            Based on your responses, here's your personality profile
          </p>
        </div>

        {/* Primary Type Badge */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-6xl font-bold mb-2">{result.type}</div>
              <p className="text-blue-100 text-lg">{result.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Score Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Your Personality Dimensions</CardTitle>
            <CardDescription>Your position on each personality continuum</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* E vs I */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">Extraversion (E)</span>
                <span className="font-semibold">Introversion (I)</span>
              </div>
              <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-blue-500 transition-all"
                  style={{ width: `${(result.eiScore + 100) / 2}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-white mix-blend-difference">
                    {result.eiScore >= 0 ? "E" : "I"} ({Math.abs(result.eiScore)}%)
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1 text-center">
                {result.eiScore >= 0
                  ? "You tend to be outgoing and gain energy from social interactions"
                  : "You tend to be reserved and gain energy from solitude"}
              </p>
            </div>

            {/* S vs N */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">Sensing (S)</span>
                <span className="font-semibold">Intuition (N)</span>
              </div>
              <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-green-500 transition-all"
                  style={{ width: `${(result.snScore + 100) / 2}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-white mix-blend-difference">
                    {result.snScore >= 0 ? "S" : "N"} ({Math.abs(result.snScore)}%)
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1 text-center">
                {result.snScore >= 0
                  ? "You focus on present realities and concrete facts"
                  : "You focus on future possibilities and abstract concepts"}
              </p>
            </div>

            {/* T vs F */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">Thinking (T)</span>
                <span className="font-semibold">Feeling (F)</span>
              </div>
              <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-yellow-500 transition-all"
                  style={{ width: `${(result.tfScore + 100) / 2}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-white mix-blend-difference">
                    {result.tfScore >= 0 ? "T" : "F"} ({Math.abs(result.tfScore)}%)
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1 text-center">
                {result.tfScore >= 0
                  ? "You make decisions based on logic and objective analysis"
                  : "You make decisions based on values and people's feelings"}
              </p>
            </div>

            {/* J vs P */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">Judging (J)</span>
                <span className="font-semibold">Perceiving (P)</span>
              </div>
              <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-purple-500 transition-all"
                  style={{ width: `${(result.jpScore + 100) / 2}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-white mix-blend-difference">
                    {result.jpScore >= 0 ? "J" : "P"} ({Math.abs(result.jpScore)}%)
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1 text-center">
                {result.jpScore >= 0
                  ? "You prefer structure, planning, and decidedness"
                  : "You prefer flexibility, spontaneity, and options"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Traits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Traits</CardTitle>
              <CardDescription>Key characteristics of your personality type</CardDescription>
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
              <CardDescription>Things you naturally excel at</CardDescription>
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
            <CardTitle>Suggested Careers</CardTitle>
            <CardDescription>Based on your MBTI personality type</CardDescription>
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
          <Button asChild>
            <Link href="/dashboard/careers">
              View Career Matches
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <Button variant="outline" onClick={restartAssessment}>
            Retake Assessment
          </Button>
        </div>
      </div>
    );
  }

  const question = QUESTIONS[currentQuestion];
  const currentAnswer = answers[question.id];
  const progress = ((Object.keys(answers).length) / QUESTIONS.length) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Badge variant="outline">
            {DIMENSION_NAMES[question.dimension].name}
          </Badge>
          <span className="text-sm text-gray-500">
            Question {currentQuestion + 1} of {QUESTIONS.length}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          MBTI Personality Assessment
        </h1>
        <p className="text-gray-600">
          Answer each question honestly based on how you truly feel, not how you think you should answer.
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
        <CardContent className="space-y-3">
          {OPTIONS.map((option) => {
            const isSelected = currentAnswer === option.value;
            return (
              <button
                key={option.value}
                onClick={() => handleAnswer(option.value)}
                className={`
                  w-full text-left p-4 rounded-lg border-2 transition-all
                  ${isSelected
                    ? "border-blue-500 bg-blue-50 text-blue-900"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`
                    w-6 h-6 rounded-full border-2 flex items-center justify-center
                    ${isSelected ? "border-blue-500 bg-blue-500" : "border-gray-300"}
                  `}>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                  <span className="font-medium">{option.label}</span>
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Progress Indicators */}
      <div className="flex justify-center gap-2">
        {QUESTIONS.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentQuestion(index)}
            className={`
              w-3 h-3 rounded-full transition-all
              ${index === currentQuestion
                ? "bg-blue-500 scale-125"
                : answers[QUESTIONS[index].id]
                  ? "bg-blue-300"
                  : "bg-gray-300"
              }
            `}
            aria-label={`Go to question ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
