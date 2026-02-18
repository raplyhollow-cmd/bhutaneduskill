"use client";

import { logger } from "@/lib/logger";

import { useState } from "react";
import { AssessmentContainer, LikertOption } from "@/components/assessment";
import { ResultsCard, ScoreBar, SuggestionCard } from "@/components/assessment";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { calculateWorkValues, getWorkValuesQuestions } from "@/lib/assessments";
import type { WorkValuesInput, WorkValuesResult } from "@/lib/assessments";
import { WORK_VALUES } from "@/lib/assessments";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const QUESTIONS = getWorkValuesQuestions();

export default function WorkValuesPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<WorkValuesInput>({});
  const [result, setResult] = useState<WorkValuesResult | null>(null);

  const handleAnswer = (value: number) => {
    const newAnswers = { ...answers, [QUESTIONS[currentQuestion].id]: value };
    setAnswers(newAnswers);

    if (currentQuestion < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
    } else {
      const calculatedResult = calculateWorkValues(newAnswers, QUESTIONS);
      setResult(calculatedResult);
      saveAssessment(newAnswers, calculatedResult);
    }
  };

  const saveAssessment = async (finalAnswers: WorkValuesInput, assessmentResult: WorkValuesResult) => {
    try {
      await fetch("/api/assessments/work-values", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "work-values", answers: finalAnswers, results: assessmentResult }),
      });
    } catch (error) {
      logger.error("Failed to save assessment:", error);
    }
  };

  if (result) {
    return (
      <ResultsCard
        title="Your Work Values Profile"
        description="What matters most to you in a career"
        badge={result.topValues.join(" + ").toUpperCase()}
      >
        <Card>
          <CardHeader><CardTitle>Your Work Values</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(result.values).map(([key, score]) => (
              <ScoreBar
                key={key}
                label={WORK_VALUES[key as keyof typeof WORK_VALUES].name}
                description={WORK_VALUES[key as keyof typeof WORK_VALUES].description}
                score={score}
                isHighest={result.topValues.includes(key as any)}
              />
            ))}
          </CardContent>
        </Card>
        <p className="text-gray-700 bg-blue-50 p-4 rounded-lg">{result.description}</p>
        <SuggestionCard title="Careers Aligned With Your Values" icon="💼" suggestions={result.careerSuggestions} />
        <div className="flex gap-4">
          <Button asChild><Link href="/dashboard/careers">View Career Matches <ArrowRight className="w-4 h-4 ml-2" /></Link></Button>
          <Button variant="outline" onClick={() => window.location.reload()}>Retake</Button>
        </div>
      </ResultsCard>
    );
  }

  const question = QUESTIONS[currentQuestion];
  const canGoNext = answers[question.id] !== undefined;

  return (
    <AssessmentContainer
      title="Work Values Inventory"
      description="Rate how important each aspect is to you in your ideal career."
      currentQuestion={currentQuestion}
      totalQuestions={QUESTIONS.length}
      onPrevious={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
      onNext={() => setCurrentQuestion(Math.min(QUESTIONS.length - 1, currentQuestion + 1))}
      canGoNext={canGoNext}
      canGoBack={currentQuestion > 0}
      showComplete={currentQuestion === QUESTIONS.length - 1}
    >
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">{question.text}</h2>
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <LikertOption
              key={value}
              value={value}
              label={["Not Important", "Slightly", "Moderately", "Very", "Essential"][value - 1]}
              isSelected={answers[question.id] === value}
              onClick={handleAnswer}
            />
          ))}
        </div>
      </div>
    </AssessmentContainer>
  );
}
