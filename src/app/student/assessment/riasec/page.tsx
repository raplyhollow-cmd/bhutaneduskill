"use client";

/**
 * Premium RIASEC Assessment Page
 *
 * Features:
 * - Smooth slide-in animations for questions
 * - Progress indicator with gradient styling
 * - Visual trait association labels
 * - Hover effects on options
 * - Radar chart results display
 * - Celebration animation on complete
 */

import { logger } from "@/lib/logger";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RIASEC_QUESTIONS } from "@/lib/tenant";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Wrench,
  Microscope,
  Palette,
  Heart,
  TrendingUp,
  ClipboardCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type Answers = Record<string, number>;

type AssessmentResult = {
  riasecType: string;
  scores: {
    realistic: number;
    investigative: number;
    artistic: number;
    social: number;
    enterprising: number;
    conventional: number;
  };
  dominantTraits: string[];
};

// Trait icons and descriptions for each RIASEC category
const TRAIT_INFO: Record<
  string,
  { icon: typeof Wrench; color: string; gradient: string; description: string }
> = {
  R: {
    icon: Wrench,
    color: "text-red-600",
    gradient: "linear-gradient(135deg, rgb(239 68 68) 0%, rgb(220 38 38) 100%)",
    description: "Working with tools, machines, and outdoor activities",
  },
  I: {
    icon: Microscope,
    color: "text-blue-600",
    gradient: "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)",
    description: "Science, research, and problem-solving",
  },
  A: {
    icon: Palette,
    color: "text-purple-600",
    gradient: "linear-gradient(135deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)",
    description: "Creative expression and design",
  },
  S: {
    icon: Heart,
    color: "text-green-600",
    gradient: "linear-gradient(135deg, rgb(34 197 94) 0%, rgb(22 163 74) 100%)",
    description: "Helping, teaching, and working with people",
  },
  E: {
    icon: TrendingUp,
    color: "text-orange-600",
    gradient: "linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)",
    description: "Leadership, business, and persuasion",
  },
  C: {
    icon: ClipboardCheck,
    color: "text-gray-600",
    gradient: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)",
    description: "Organization, data, and structured tasks",
  },
};

// Category display names
const CATEGORY_NAMES: Record<string, string> = {
  R: "Realistic",
  I: "Investigative",
  A: "Artistic",
  S: "Social",
  E: "Enterprising",
  C: "Conventional",
};

export default function AssessmentPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev">("next");

  const questions = RIASEC_QUESTIONS;
  const progress = ((Object.keys(answers).length) / questions.length) * 100;
  const question = questions[currentQuestion];
  const traitInfo = TRAIT_INFO[question.category];
  const TraitIcon = traitInfo.icon;

  // Estimate remaining time (roughly 15 seconds per remaining question)
  const remainingQuestions = questions.length - currentQuestion;
  const estimatedMinutes = Math.ceil((remainingQuestions * 15) / 60);

  const handleAnswer = async (value: number) => {
    const newAnswers = {
      ...answers,
      [questions[currentQuestion].id]: value,
    };
    setAnswers(newAnswers);

    // Auto-advance to next question after a short delay
    if (currentQuestion < questions.length - 1) {
      setDirection("next");
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
      }, 300);
    } else {
      // Calculate and save results
      await calculateAndSaveResults(newAnswers);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setDirection("prev");
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1 && answers[question.id]) {
      setDirection("next");
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const saveAssessment = async (finalAnswers: Answers, assessmentResult: AssessmentResult) => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/assessments/riasec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: finalAnswers,
          results: assessmentResult,
          scores: assessmentResult.scores,
          hollandCode: assessmentResult.hollandCode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error("Failed to save RIASEC assessment", { status: response.status, error: errorData });
        return null;
      }

      const data = await response.json();
      logger.info("RIASEC assessment saved successfully");
      return data;
    } catch (error) {
      logger.error("Failed to save assessment:", error);
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const calculateAndSaveResults = async (finalAnswers: Answers) => {
    // Calculate scores by category
    const categoryScores: Record<string, number[]> = {
      R: [],
      I: [],
      A: [],
      S: [],
      E: [],
      C: [],
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
      averages[cat] = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
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
    await saveAssessment(finalAnswers, assessmentResult);

    setResult(assessmentResult);
    setIsCompleted(true);
  };

  const restartAssessment = () => {
    setAnswers({});
    setCurrentQuestion(0);
    setIsCompleted(false);
    setResult(null);
  };

  // Results view with radar chart visualization
  if (isCompleted && result) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl mx-auto space-y-8"
      >
        {/* Celebration Header */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4">
            <Sparkles className="w-10 h-10 text-orange-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Assessment Complete!</h1>
          <p className="text-gray-600">Here's your personalized RIASEC profile</p>
        </motion.div>

        {/* RIASEC Code Result */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 overflow-hidden">
            <div
              className="p-8 text-center text-white"
              style={{ background: "linear-gradient(135deg, rgb(168 85 247) 0%, rgb(59 130 246) 100%)" }}
            >
              <CardTitle className="text-center text-xl mb-4 text-white/90">
                Your RIASEC Holland Code
              </CardTitle>
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 150, delay: 0.2 }}
                className="text-7xl font-bold mb-4 tracking-wider"
              >
                {result.riasecCode}
              </motion.div>
              <p className="text-blue-100 mb-2">
                Based on your responses, these are your dominant personality traits
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {result.riasecCode.split("").map((letter: string) => (
                  <Badge
                    key={letter}
                    className="px-4 py-2 text-sm bg-white/20 text-white border-white/30 hover:bg-white/30 transition-colors"
                  >
                    {CATEGORY_NAMES[letter]}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Score Breakdown with Visual Bars */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Your Trait Scores</CardTitle>
              <CardDescription>
                See how you score across all six personality types
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(result.scores)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([category, score], index) => {
                  const info = TRAIT_INFO[category];
                  const Icon = info.icon;
                  const isDominant = result.dominantTraits.includes(category);
                  const delay = index * 0.05;

                  return (
                    <motion.div
                      key={category}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: info.gradient }}
                          >
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <span className="font-bold text-lg">{category}</span>
                            <span className="text-gray-500 ml-2">{CATEGORY_NAMES[category]}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isDominant && (
                            <Badge className="bg-green-100 text-green-700 border-green-300">
                              Dominant
                            </Badge>
                          )}
                          <span className="text-sm font-semibold text-gray-600">
                            {String(score)}%
                          </span>
                        </div>
                      </div>
                      <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${score}%` }}
                          transition={{ duration: 1, delay: delay + 0.2, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ background: info.gradient }}
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{info.description}</p>
                    </motion.div>
                  );
                })}
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap gap-4"
        >
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
          <Button variant="outline" asChild>
            <Link href="/student/monetize">
              See Earning Opportunities
            </Link>
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  // Questions view
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header with Category Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
            style={{ background: traitInfo.gradient }}
          >
            <TraitIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Badge
                className="text-xs"
                style={{
                  background: traitInfo.gradient,
                  border: "none",
                }}
              >
                {CATEGORY_NAMES[question.category]} ({question.category})
              </Badge>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Question {currentQuestion + 1} of {questions.length}
              {estimatedMinutes > 0 && ` • ~${estimatedMinutes} min remaining`}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Your Progress</span>
            <span className="text-sm font-bold text-orange-600">{Math.round(progress)}%</span>
          </div>
          <Progress
            value={progress}
            className="h-3"
            // @ts-ignore - styling prop
            style={{
              background: "rgb(243 244 246)",
            }}
          />
        </CardContent>
      </Card>

      {/* Animated Question Card */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ x: direction === "next" ? 50 : -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction === "next" ? -50 : 50, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <Card className="border-2 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl md:text-2xl">{question.text}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {question.options.map((option, idx) => {
                  const isSelected = answers[question.id] === option.value;
                  return (
                    <motion.button
                      key={option.value}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleAnswer(option.value)}
                      className={`
                        w-full text-left p-4 rounded-xl border-2 transition-all relative overflow-hidden
                        ${isSelected ? "border-orange-500 shadow-md" : "border-gray-200 hover:border-orange-300 hover:bg-orange-50/50"}
                      `}
                      style={isSelected ? { background: "linear-gradient(135deg, rgb(255 237 213) 0%, rgb(254 215 170) 100%)" } : {}}
                    >
                      <div className="flex items-center gap-3 relative z-10">
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected ? "border-orange-500 bg-orange-500" : "border-gray-300"
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </div>
                        <span className={`font-medium ${isSelected ? "text-orange-900" : "text-gray-700"}`}>
                          {option.text}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className="min-w-[100px]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        {/* Question Indicators */}
        <div className="hidden md:flex gap-1.5">
          {questions.slice(0, 10).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestion(index)}
              className={`
                w-2.5 h-2.5 rounded-full transition-all
                ${index === currentQuestion ? "bg-orange-500 scale-125" : answers[questions[index].id] ? "bg-orange-300" : "bg-gray-200"}
                ${index !== currentQuestion ? "hover:scale-110" : ""}
              `}
            />
          ))}
          {questions.length > 10 && (
            <span className="text-xs text-gray-400 flex items-center">+{questions.length - 10}</span>
          )}
        </div>

        <Button
          onClick={handleNext}
          disabled={currentQuestion === questions.length - 1 || !answers[question.id]}
          className="min-w-[100px]"
          style={{ background: "linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)" }}
        >
          Next
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Mobile Question Indicator */}
      <div className="md:hidden flex justify-center gap-1.5">
        {questions.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentQuestion(index)}
            className={`
              w-2 h-2 rounded-full transition-all
              ${index === currentQuestion ? "bg-orange-500 scale-125" : answers[questions[index].id] ? "bg-orange-300" : "bg-gray-200"}
            `}
          />
        ))}
      </div>
    </div>
  );
}
