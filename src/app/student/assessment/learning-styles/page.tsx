"use client";

import { logger } from "@/lib/logger";

import { useState } from "react";
import { AssessmentContainer, OptionButton } from "@/components/assessment";
import { ResultsCard, ScoreBar, TraitCard } from "@/components/assessment";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateLearningStyles, getLearningStylesQuestions } from "@/lib/assessments";
import type { LearningStylesInput, LearningStylesResult } from "@/lib/assessments";
import { Eye, Ear, BookOpen, Activity, ArrowRight, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const QUESTIONS = getLearningStylesQuestions();

const STYLE_ICONS: Record<string, React.ReactNode> = {
  visual: <Eye className="w-5 h-5" />,
  auditory: <Ear className="w-5 h-5" />,
  read_write: <BookOpen className="w-5 h-5" />,
  kinesthetic: <Activity className="w-5 h-5" />,
};

const STYLE_NAMES: Record<string, string> = {
  visual: "Visual",
  auditory: "Auditory",
  read_write: "Read/Write",
  kinesthetic: "Kinesthetic",
};

export default function LearningStylesPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<LearningStylesInput>({});
  const [result, setResult] = useState<LearningStylesResult | null>(null);

  const restartAssessment = () => {
    setAnswers({});
    setCurrentQuestion(0);
    setResult(null);
  };

  const handleAnswer = (value: "visual" | "auditory" | "read_write" | "kinesthetic") => {
    const newAnswers = { ...answers, [QUESTIONS[currentQuestion].id]: value };
    setAnswers(newAnswers);

    if (currentQuestion < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
    } else {
      const calculatedResult = calculateLearningStyles(newAnswers, QUESTIONS);
      setResult(calculatedResult);
      saveAssessment(newAnswers, calculatedResult);
    }
  };

  const saveAssessment = async (finalAnswers: LearningStylesInput, assessmentResult: LearningStylesResult) => {
    try {
      await fetch("/api/assessments/learning-styles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "learning-styles", answers: finalAnswers, results: assessmentResult }),
      });
    } catch (error) {
      logger.error("Failed to save assessment:", error);
    }
  };

  if (result) {
    return (
      <ResultsCard
        title="Your Learning Style"
        description="Discover how you learn best"
        badge={STYLE_NAMES[result.dominantStyle]}
      >
        <p className="text-gray-700 bg-blue-50 p-4 rounded-lg">{result.description}</p>

        <Card>
          <CardHeader><CardTitle>Your Learning Profile</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(result).filter(([k]) => ["visual", "auditory", "readWrite", "kinesthetic"].includes(k)).map(([key, score]) => (
              <ScoreBar
                key={key}
                label={STYLE_NAMES[key]}
                description={`You learn ${score > 50 ? "best" : "somewhat"} by ${STYLE_NAMES[key].toLowerCase()} means`}
                score={score as number}
                isHighest={key === result.dominantStyle}
              />
            ))}
          </CardContent>
        </Card>

        <TraitCard
          title="Study Tips for Your Style"
          icon="📚"
          description="How to study more effectively"
          items={result.recommendations.studyTips}
        />

        <TraitCard
          title="Best Teaching Methods for You"
          icon="👨‍🏫"
          description="Approaches that help you learn best"
          items={result.recommendations.teachingMethods}
        />

        <div className="flex flex-wrap gap-4">
          <Button variant="outline" onClick={restartAssessment}>
            Retake Assessment
          </Button>
          <Button
            asChild
            style={{ background: "linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)" }}
          >
            <Link href="/student/careers">
              View Career Matches <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/student/assessment">
              More Assessments
              <ClipboardCheck className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </ResultsCard>
    );
  }

  const question = QUESTIONS[currentQuestion];
  const canGoNext = answers[question.id] !== undefined;

  return (
    <AssessmentContainer
      title="VARK Learning Styles Assessment"
      description="Choose the option that best describes your preference."
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
        <div className="space-y-3">
          {question.options.map((option) => (
            <OptionButton
              key={option.value}
              label={option.label}
              isSelected={answers[question.id] === option.value}
              onClick={() => handleAnswer(option.value)}
              icon={STYLE_ICONS[option.value]}
            />
          ))}
        </div>
      </div>
    </AssessmentContainer>
  );
}
