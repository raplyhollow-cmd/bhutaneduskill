/**
 * HOMEWORK SUBMISSION VIEWER
 * Student interface for viewing and submitting homework
 */
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  AlertCircle,
  CheckCircle,
  Save,
  Send,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { type QuestionType } from "./homework-creator";

export interface HomeworkQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  points: number;
  explanation?: string;
}

export interface HomeworkAssignment {
  id: string;
  title: string;
  description: string;
  subject: string;
  dueDate: string;
  timeLimit?: number;
  totalPoints: number;
  shuffleQuestions: boolean;
  questions: HomeworkQuestion[];
}

export interface StudentAnswer {
  questionId: string;
  answer: string | number | Array<any>;
  timeSpent?: number;
}

interface HomeworkSubmissionProps {
  homework: HomeworkAssignment;
  existingAnswers?: StudentAnswer[];
  onSubmit: (answers: StudentAnswer[], metadata: SubmissionMetadata) => void | Promise<void>;
  onSaveDraft: (answers: StudentAnswer[]) => void | Promise<void>;
  isSubmitted?: boolean;
}

export interface SubmissionMetadata {
  timeSpent: number;
  tabSwitches: number;
  copyPasteEvents: number;
}

export function HomeworkSubmission({
  homework,
  existingAnswers = [],
  onSubmit,
  onSaveDraft,
  isSubmitted = false,
}: HomeworkSubmissionProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    existingAnswers.forEach((a) => {
      initial[a.questionId] = a.answer;
    });
    return initial;
  });

  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    homework.timeLimit ? homework.timeLimit * 60 : null
  );

  const [startTime] = useState(Date.now());
  const [tabSwitches, setTabSwitches] = useState(0);
  const [copyPasteEvents, setCopyPasteEvents] = useState(0);

  // Timer
  useEffect(() => {
    if (timeRemaining === null || isSubmitted) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          handleSubmit();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, isSubmitted]);

  // Track tab switches
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches((prev) => prev + 1);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Track copy-paste
  useEffect(() => {
    const handleCopyPaste = () => setCopyPasteEvents((prev) => prev + 1);
    document.addEventListener("copy", handleCopyPaste);
    document.addEventListener("paste", handleCopyPaste);
    return () => {
      document.removeEventListener("copy", handleCopyPaste);
      document.removeEventListener("paste", handleCopyPaste);
    };
  }, []);

  const updateAnswer = (questionId: string, answer: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSaveDraft = () => {
    const answerArray = Object.entries(answers).map(([questionId, answer]) => ({
      questionId,
      answer,
    }));
    onSaveDraft(answerArray);
  };

  const handleSubmit = () => {
    const answerArray = Object.entries(answers).map(([questionId, answer]) => ({
      questionId,
      answer,
    }));

    const metadata: SubmissionMetadata = {
      timeSpent: Math.round((Date.now() - startTime) / 1000),
      tabSwitches,
      copyPasteEvents,
    };

    onSubmit(answerArray, metadata);
  };

  const answeredCount = Object.keys(answers).filter(
    (key) => answers[key] !== "" && answers[key] !== undefined
  ).length;
  const progress = (answeredCount / homework.questions.length) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const currentQuestionData = homework.questions[currentQuestion];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{homework.title}</h1>
              <p className="text-muted-foreground mt-1">{homework.description}</p>
              <div className="flex items-center gap-4 mt-4">
                <Badge variant="outline">{homework.subject}</Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  Due: {new Date(homework.dueDate).toLocaleString()}
                </div>
              </div>
            </div>

            {timeRemaining !== null && (
              <div className={`text-center ${timeRemaining < 300 ? "text-destructive" : ""}`}>
                <p className="text-sm font-medium">Time Remaining</p>
                <p className="text-2xl font-bold">{formatTime(timeRemaining)}</p>
              </div>
            )}
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Progress</span>
              <span>
                {answeredCount} / {homework.questions.length} answered
              </span>
            </div>
            <Progress value={progress} />
          </div>
        </CardContent>
      </Card>

      {isSubmitted ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Homework Submitted</h2>
            <p className="text-muted-foreground">
              Your submission has been recorded. You will be notified when it is graded.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Question Navigator */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {homework.questions.map((q, index) => {
                  const isAnswered = answers[q.id] !== "" && answers[q.id] !== undefined;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestion(index)}
                      className={`
                        w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium
                        ${currentQuestion === index ? "bg-primary text-primary-foreground" : ""}
                        ${isAnswered && currentQuestion !== index ? "bg-green-100 text-green-700" : ""}
                        ${!isAnswered && currentQuestion !== index ? "bg-muted" : ""}
                      `}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Current Question */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Question {currentQuestion + 1} of {homework.questions.length}
                </CardTitle>
                <Badge>{currentQuestionData.points} points</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-lg mb-6">{currentQuestionData.question}</p>

              <QuestionInput
                question={currentQuestionData}
                value={answers[currentQuestionData.id] || ""}
                onChange={(value) => updateAnswer(currentQuestionData.id, value)}
              />

              <div className="flex items-center justify-between mt-8 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                  disabled={currentQuestion === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>

                {currentQuestion === homework.questions.length - 1 ? (
                  <Button onClick={handleSubmit}>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Homework
                  </Button>
                ) : (
                  <Button
                    onClick={() =>
                      setCurrentQuestion(Math.min(homework.questions.length - 1, currentQuestion + 1))
                    }
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Save Draft */}
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Save className="w-4 h-4" />
                  <span>Your progress is auto-saved as you answer</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleSaveDraft}>
                  Save Draft
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Integrity Warning */}
          {(tabSwitches > 2 || copyPasteEvents > 0) && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">
                      Academic Integrity Notice
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      {tabSwitches > 0 && `${tabSwitches} tab switch(es) detected. `}
                      {copyPasteEvents > 0 &&
                        `${copyPasteEvents} copy-paste event(s) detected. `}
                      This will be recorded and may affect your score.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

interface QuestionInputProps {
  question: HomeworkQuestion;
  value: any;
  onChange: (value: any) => void;
}

function QuestionInput({ question, value, onChange }: QuestionInputProps) {
  switch (question.type) {
    case "multiple_choice":
      return (
        <div className="space-y-3">
          {question.options?.map((option, index) => (
            <label
              key={index}
              className={`
                flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors
                ${value === option ? "border-primary bg-primary/5" : "hover:bg-muted"}
              `}
            >
              <input
                type="radio"
                name={question.id}
                value={option}
                checked={value === option}
                onChange={(e) => onChange(e.target.value)}
                className="w-4 h-4"
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      );

    case "true_false":
      return (
        <div className="space-y-3">
          <label
            className={`
              flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors
              ${value === "true" ? "border-primary bg-primary/5" : "hover:bg-muted"}
            `}
          >
            <input
              type="radio"
              name={question.id}
              value="true"
              checked={value === "true"}
              onChange={(e) => onChange(e.target.value)}
              className="w-4 h-4"
            />
            <span>True</span>
          </label>
          <label
            className={`
              flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors
              ${value === "false" ? "border-primary bg-primary/5" : "hover:bg-muted"}
            `}
          >
            <input
              type="radio"
              name={question.id}
              value="false"
              checked={value === "false"}
              onChange={(e) => onChange(e.target.value)}
              className="w-4 h-4"
            />
            <span>False</span>
          </label>
        </div>
      );

    case "fill_blank":
    case "numeric":
    case "math_expression":
      return (
        <Input
          type={question.type === "numeric" ? "number" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter your answer..."
          className="max-w-md"
        />

      );

    case "short_answer":
      return (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter your answer..."
          rows={4}
          className="max-w-lg"
        />
      );

    case "essay":
      return (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write your essay here..."
          rows={12}
          className="max-w-2xl"
        />
      );

    case "match_following":
      return (
        <div className="text-sm text-muted-foreground">
          Match the following items and enter your answer as pairs (e.g., A-1, B-2).
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="A-1, B-2, C-3..."
            className="max-w-md mt-2"
          />
        </div>
      );

    default:
      return (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
        />
      );
  }
}
