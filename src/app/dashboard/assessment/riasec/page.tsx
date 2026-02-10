"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RIASEC_QUESTIONS } from "@/lib/tenant";
import { ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

type Answers = Record<string, number>;

export default function AssessmentPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<any>(null);

  const questions = RIASEC_QUESTIONS;
  const progress = ((Object.keys(answers).length) / questions.length) * 100;

  const handleAnswer = (value: number) => {
    const newAnswers = {
      ...answers,
      [questions[currentQuestion].id]: value,
    };
    setAnswers(newAnswers);

    // Auto-advance to next question after a short delay
    if (currentQuestion < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
      }, 300);
    } else {
      // Calculate results
      calculateResults(newAnswers);
    }
  };

  const saveAssessment = async (finalAnswers: Answers, assessmentResult: any) => {
    try {
      const response = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "riasec",
          answers: finalAnswers,
          results: assessmentResult,
        }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to save assessment:", error);
      return null;
    }
  };

  const calculateResults = (finalAnswers: Answers) => {
    // Calculate scores by category
    const categoryScores: Record<string, number[]> = {
      R: [], I: [], A: [], S: [], E: [], C: [],
    };

    questions.forEach((q) => {
      const answer = finalAnswers[q.id];
      if (answer !== undefined) {
        categoryScores[q.category].push(answer);
      }
    });

    // Calculate average for each category
    const averages: Record<string, number> = {};
    Object.entries(categoryScores).forEach(([cat, scores]) => {
      averages[cat] = scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0;
    });

    // Convert to 0-100 scale
    const normalizedScores: Record<string, number> = {};
    Object.entries(averages).forEach(([cat, avg]) => {
      normalizedScores[cat] = Math.round((avg / 5) * 100);
    });

    // Find top 3 categories
    const sorted = Object.entries(normalizedScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    const riasecCode = sorted.map(([cat]) => cat).join("");

    const assessmentResult = {
      riasecCode,
      scores: normalizedScores,
      dominantTraits: sorted.map(([cat]) => cat),
    };

    // Save to database
    saveAssessment(finalAnswers, assessmentResult);

    setResult(assessmentResult);
    setIsCompleted(true);
  };

  const restartAssessment = () => {
    setAnswers({});
    setCurrentQuestion(0);
    setIsCompleted(false);
    setResult(null);
  };

  if (isCompleted && result) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Assessment Complete!
          </h1>
          <p className="text-gray-600">
            Here's your personalized RIASEC profile
          </p>
        </div>

        {/* RIASEC Code Result */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Your RIASEC Code</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-6xl font-bold mb-4">{result.riasecCode}</div>
            <p className="text-blue-100 mb-6">
              Based on your responses, these are your dominant personality traits
            </p>
            <Button variant="secondary" size="lg" asChild>
              <Link href="/dashboard/careers">
                View Career Matches
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Score Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Scores</CardTitle>
            <CardDescription>Your scores across all six personality types</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(result.scores).map(([category, score]) => {
              const categoryNames: Record<string, string> = {
                R: "Realistic - Working with tools, machines, and outdoor activities",
                I: "Investigative - Science, research, and problem-solving",
                A: "Artistic - Creative expression and design",
                S: "Social - Helping, teaching, and working with people",
                E: "Enterprising - Leadership, business, and persuasion",
                C: "Conventional - Organization, data, and structured tasks",
              };

              const isDominant = result.dominantTraits.includes(category);

              return (
                <div key={category}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{category}</span>
                      {isDominant && (
                        <Badge variant="default">Dominant</Badge>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">{String(score)}%</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {categoryNames[category]}
                  </p>
                  <Progress value={typeof score === 'number' ? score : 0} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button variant="outline" onClick={restartAssessment}>
            Retake Assessment
          </Button>
          <Button asChild>
            <Link href="/dashboard/careers">
              View Career Matches
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/monetize">
              See Earning Opportunities
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const categoryNames: Record<string, string> = {
    R: "Realistic",
    I: "Investigative",
    A: "Artistic",
    S: "Social",
    E: "Enterprising",
    C: "Conventional",
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Badge variant="outline">
            {categoryNames[question.category]} ({question.category})
          </Badge>
          <span className="text-sm text-gray-500">
            Question {currentQuestion + 1} of {questions.length}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          RIASEC Career Assessment
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
          {question.options.map((option) => {
            const isSelected = answers[question.id] === option.value;
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
                  <span className="font-medium">{option.text}</span>
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
          disabled={currentQuestion === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        <div className="flex gap-2">
          {questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestion(index)}
              className={`
                w-3 h-3 rounded-full transition-all
                ${index === currentQuestion
                  ? "bg-blue-500 scale-125"
                  : answers[questions[index].id]
                    ? "bg-blue-300"
                    : "bg-gray-300"
                }
              `}
            />
          ))}
        </div>

        <Button
          onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
          disabled={currentQuestion === questions.length - 1 || !answers[question.id]}
        >
          Next
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
