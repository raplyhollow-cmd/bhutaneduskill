"use client";

import { useState } from "react";
import { AssessmentContainer, OptionButton } from "@/components/assessment";
import { ResultsCard, ScoreBar, SuggestionCard } from "@/components/assessment";
import { calculateRIASEC } from "@/lib/riasec";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface RIASECAssessmentProps {
  title: string;
  description: string;
  questions: Array<{ id: string; text: string; category: string; options: Array<{ value: number; text: string }> }>;
  assessmentType: string;
}

const CATEGORY_NAMES: Record<string, string> = {
  R: "Realistic - Working with tools, machines, and outdoor activities",
  I: "Investigative - Science, research, and problem-solving",
  A: "Artistic - Creative expression and design",
  S: "Social - Helping, teaching, and working with people",
  E: "Enterprising - Leadership, business, and persuasion",
  C: "Conventional - Organization, data, and structured tasks",
};

export function RIASECAssessment({ title, description, questions, assessmentType }: RIASECAssessmentProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<any>(null);

  const handleAnswer = (value: number) => {
    const newAnswers = { ...answers, [questions[currentQuestion].id]: value };
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
    } else {
      const calculatedResult = calculateRIASEC(newAnswers, questions);
      setResult(calculatedResult);
      saveAssessment(newAnswers, calculatedResult);
    }
  };

  const saveAssessment = async (finalAnswers: Record<string, number>, assessmentResult: any) => {
    try {
      await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: assessmentType,
          answers: finalAnswers,
          results: assessmentResult,
        }),
      });
    } catch (error) {
      console.error("Failed to save assessment:", error);
    }
  };

  if (result) {
    return (
      <ResultsCard
        title={title + " Results"}
        description="Here's your personalized RIASEC profile"
        badge={result.type}
      >
        <p className="text-gray-700 bg-blue-50 p-4 rounded-lg">
          Based on your responses, your dominant traits are <strong>{result.dominantTraits.join(", ")}</strong>
        </p>

        <Card>
          <CardHeader><CardTitle>Detailed Scores</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(result.scores).map(([category, score]) => (
              <ScoreBar
                key={category}
                label={category}
                description={CATEGORY_NAMES[category]}
                score={score as number}
                isHighest={result.dominantTraits.includes(category)}
              />
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-4">
          <Button asChild>
            <Link href="/dashboard/careers">
              View Career Matches
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retake Assessment
          </Button>
        </div>
      </ResultsCard>
    );
  }

  const question = questions[currentQuestion];
  const canGoNext = answers[question.id] !== undefined;

  return (
    <AssessmentContainer
      title={title}
      description={description}
      currentQuestion={currentQuestion}
      totalQuestions={questions.length}
      onPrevious={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
      onNext={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
      canGoNext={canGoNext}
      canGoBack={currentQuestion > 0}
      showComplete={currentQuestion === questions.length - 1}
    >
      <div className="space-y-6">
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
          {CATEGORY_NAMES[question.category].split(" - ")[0]} ({question.category})
        </div>
        <h2 className="text-xl font-semibold text-gray-900">{question.text}</h2>
        <div className="space-y-3">
          {question.options.map((option) => (
            <OptionButton
              key={option.value}
              label={option.text}
              isSelected={answers[question.id] === option.value}
              onClick={() => handleAnswer(option.value)}
            />
          ))}
        </div>
      </div>
    </AssessmentContainer>
  );
}
