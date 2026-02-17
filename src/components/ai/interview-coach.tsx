"use client";

/**
 * AI INTERVIEW COACH COMPONENT
 *
 * Client component for conducting mock interviews
 * Supports college admission, job, and scholarship interview practice
 *
 * Features:
 * - Interview type selection (college, job, scholarship)
 * - Chat-style interface
 * - Progress indicator
 * - Answer input area
 * - Feedback display after each answer
 * - Session summary at end
 * - Start new session button
 * - Mobile responsive design
 */


import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Mic,
  Send,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Lightbulb,
  GraduationCap,
  Briefcase,
  Award,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export type InterviewType = "college" | "job" | "scholarship";

export type QuestionCategory =
  | "introduction"
  | "strengths"
  | "weaknesses"
  | "motivation"
  | "goals"
  | "scenario"
  | "experience"
  | "closing";

export interface InterviewQuestion {
  question: string;
  category: QuestionCategory;
  questionNumber: number;
  tips?: string[];
}

export interface AnswerFeedback {
  whatWentWell: string[];
  howToImprove: string[];
  betterAnswer: string;
  score: number;
}

export interface InterviewSummary {
  overallPerformance: string;
  strengths: string[];
  areasToImprove: string[];
  finalTips: string[];
  recommendedPractice: string[];
}

export interface InterviewMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export interface InterviewSession {
  isComplete: boolean;
  currentQuestion?: InterviewQuestion;
  feedback?: AnswerFeedback;
  summary?: InterviewSummary;
  conversationHistory: InterviewMessage[];
  totalQuestions: number;
}

export interface InterviewCoachProps {
  className?: string;
  compact?: boolean;
}

// ============================================================================
// INTERVIEW TYPE CONFIGS
// ============================================================================

const INTERVIEW_TYPES: Record<
  InterviewType,
  { icon: typeof GraduationCap; label: string; color: string; gradient: string }
> = {
  college: {
    icon: GraduationCap,
    label: "College Admission",
    color: "text-blue-600",
    gradient: "rgb(59 130 246) -> rgb(37 99 235)",
  },
  job: {
    icon: Briefcase,
    label: "Job Interview",
    color: "text-green-600",
    gradient: "rgb(34 197 194) -> rgb(16 185 129)",
  },
  scholarship: {
    icon: Award,
    label: "Scholarship",
    color: "text-purple-600",
    gradient: "rgb(168 85 247) -> rgb(147 51 234)",
  },
};

const QUESTION_CATEGORIES: Record<QuestionCategory, { label: string; color: string }> = {
  introduction: { label: "Introduction", color: "bg-blue-100 text-blue-700" },
  strengths: { label: "Strengths", color: "bg-green-100 text-green-700" },
  weaknesses: { label: "Weaknesses", color: "bg-red-100 text-red-700" },
  motivation: { label: "Motivation", color: "bg-purple-100 text-purple-700" },
  goals: { label: "Goals", color: "bg-orange-100 text-orange-700" },
  scenario: { label: "Scenario", color: "bg-yellow-100 text-yellow-700" },
  experience: { label: "Experience", color: "bg-cyan-100 text-cyan-700" },
  closing: { label: "Closing", color: "bg-gray-100 text-gray-700" },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function InterviewCoach({ className, compact = false }: InterviewCoachProps) {
  // State
  const [interviewType, setInterviewType] = useState<InterviewType>("college");
  const [targetInstitution, setTargetInstitution] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [position, setPosition] = useState("");
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSetup, setShowSetup] = useState(true);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.conversationHistory]);

  // Reset form when interview type changes
  const handleInterviewTypeChange = (type: InterviewType) => {
    setInterviewType(type);
    setTargetInstitution("");
    setFieldOfStudy("");
    setPosition("");
  };

  // Start new interview session
  const startInterview = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/interview-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewType,
          targetInstitution,
          fieldOfStudy: interviewType !== "job" ? fieldOfStudy : undefined,
          position: interviewType === "job" ? position : undefined,
          isStart: true,
          conversationHistory: [],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start interview session");
      }

      const result = await response.json();
      setSession(result.data);
      setShowSetup(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  // Submit answer and get feedback + next question
  const submitAnswer = async () => {
    if (!userAnswer.trim() || !session) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/interview-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewType,
          targetInstitution,
          fieldOfStudy: interviewType !== "job" ? fieldOfStudy : undefined,
          position: interviewType === "job" ? position : undefined,
          userAnswer,
          currentQuestionNumber: session.currentQuestion?.questionNumber || 1,
          conversationHistory: session.conversationHistory,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit answer");
      }

      const result = await response.json();
      setSession(result.data);
      setUserAnswer("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
      // Focus textarea for next answer
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  // Start new session
  const startNewSession = () => {
    setSession(null);
    setUserAnswer("");
    setError(null);
    setShowSetup(true);
  };

  // Get current progress
  const getProgress = () => {
    if (!session) return 0;
    const currentQ = session.currentQuestion?.questionNumber || 0;
    return (currentQ / session.totalQuestions) * 100;
  };

  // Render setup form
  if (showSetup) {
    return <SetupForm
      interviewType={interviewType}
      onInterviewTypeChange={handleInterviewTypeChange}
      targetInstitution={targetInstitution}
      onTargetInstitutionChange={setTargetInstitution}
      fieldOfStudy={fieldOfStudy}
      onFieldOfStudyChange={setFieldOfStudy}
      position={position}
      onPositionChange={setPosition}
      onStart={startInterview}
      isLoading={isLoading}
      className={className}
    />;
  }

  // Render error state
  if (error) {
    return <ErrorState error={error} onRetry={startInterview} className={className} />;
  }

  // Render interview interface
  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <SessionHeader
        interviewType={interviewType}
        targetInstitution={targetInstitution}
        position={position}
        progress={getProgress()}
        currentQuestion={session.currentQuestion}
        totalQuestions={session.totalQuestions}
        onNewSession={startNewSession}
      />

      {/* Main content */}
      {!session.isComplete ? (
        <InterviewQuestions
          session={session}
          userAnswer={userAnswer}
          onAnswerChange={setUserAnswer}
          onSubmit={submitAnswer}
          isLoading={isLoading}
          textareaRef={textareaRef}
          messagesEndRef={messagesEndRef}
        />
      ) : (
        <SessionSummary
          summary={session.summary!}
          onNewSession={startNewSession}
          conversationHistory={session.conversationHistory}
        />
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface SetupFormProps {
  interviewType: InterviewType;
  onInterviewTypeChange: (type: InterviewType) => void;
  targetInstitution: string;
  onTargetInstitutionChange: (value: string) => void;
  fieldOfStudy: string;
  onFieldOfStudyChange: (value: string) => void;
  position: string;
  onPositionChange: (value: string) => void;
  onStart: () => void;
  isLoading: boolean;
  className?: string;
}

function SetupForm({
  interviewType,
  onInterviewTypeChange,
  targetInstitution,
  onTargetInstitutionChange,
  fieldOfStudy,
  onFieldOfStudyChange,
  position,
  onPositionChange,
  onStart,
  isLoading,
  className,
}: SetupFormProps) {
  return (
    <Card className={cn("border-purple-200", className)}>
      <CardHeader
        className="text-white"
        style={{ background: "linear-gradient(to right, rgb(168 85 247), rgb(147 51 234))" }}
      >
        <CardTitle className="flex items-center gap-2 text-white">
          <Sparkles className="w-6 h-6" />
          AI Interview Coach
        </CardTitle>
        <CardDescription className="text-purple-100">
          Practice your interview skills with AI-powered feedback
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Interview Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Interview Type
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(Object.keys(INTERVIEW_TYPES) as InterviewType[]).map((type) => {
              const config = INTERVIEW_TYPES[type];
              const Icon = config.icon;
              const isSelected = interviewType === type;

              return (
                <button
                  key={type}
                  onClick={() => onInterviewTypeChange(type)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                    isSelected
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/50"
                  )}
                >
                  <Icon className={cn("w-6 h-6", isSelected ? "text-purple-600" : "text-gray-400")} />
                  <span className={cn("text-sm font-medium", isSelected ? "text-purple-700" : "text-gray-600")}>
                    {config.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Target Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {interviewType === "job" ? "Target Company" : interviewType === "scholarship" ? "Scholarship Name" : "Target College/University"}
          </label>
          <input
            type="text"
            value={targetInstitution}
            onChange={(e) => onTargetInstitutionChange(e.target.value)}
            placeholder={interviewType === "job" ? "e.g., DHI, Tashi Bank" : "e.g., CST, Sherubtse College"}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Field of Study / Position */}
        {interviewType === "job" ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Position Applied For
            </label>
            <input
              type="text"
              value={position}
              onChange={(e) => onPositionChange(e.target.value)}
              placeholder="e.g., Software Developer, Marketing Manager"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Field of Study / Program
            </label>
            <input
              type="text"
              value={fieldOfStudy}
              onChange={(e) => onFieldOfStudyChange(e.target.value)}
              placeholder="e.g., Computer Science, Business Studies"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Info cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">5 Questions</p>
              <p className="text-xs text-gray-500">Realistic interview</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Instant Feedback</p>
              <p className="text-xs text-gray-500">After each answer</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Tips Included</p>
              <p className="text-xs text-gray-500">Improve your answers</p>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <Button
          onClick={onStart}
          disabled={isLoading}
          className="w-full"
          style={{ background: "linear-gradient(135deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)" }}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Starting Session...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Start Practice Interview
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
  className?: string;
}

function ErrorState({ error, onRetry, className }: ErrorStateProps) {
  return (
    <Card className={cn("border-red-200", className)}>
      <CardContent className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="text-lg font-medium text-gray-900">Something went wrong</h3>
          <p className="text-gray-600">{error}</p>
          <Button onClick={onRetry} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface SessionHeaderProps {
  interviewType: InterviewType;
  targetInstitution: string;
  position: string;
  progress: number;
  currentQuestion?: InterviewQuestion;
  totalQuestions: number;
  onNewSession: () => void;
}

function SessionHeader({
  interviewType,
  targetInstitution,
  position,
  progress,
  currentQuestion,
  totalQuestions,
  onNewSession,
}: SessionHeaderProps) {
  const config = INTERVIEW_TYPES[interviewType];
  const Icon = config.icon;

  return (
    <Card className="border-purple-200">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Icon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {config.label} Interview
              </h3>
              <p className="text-sm text-gray-500">
                {targetInstitution && `${targetInstitution}`}
                {position && ` - ${position}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Progress */}
            {currentQuestion && (
              <div className="text-sm text-gray-600">
                Question {currentQuestion.questionNumber} of {totalQuestions}
              </div>
            )}

            {/* New session button */}
            <Button
              onClick={onNewSession}
              variant="outline"
              size="sm"
              className="shrink-0"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              New Session
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface InterviewQuestionsProps {
  session: InterviewSession;
  userAnswer: string;
  onAnswerChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

function InterviewQuestions({
  session,
  userAnswer,
  onAnswerChange,
  onSubmit,
  isLoading,
  textareaRef,
  messagesEndRef,
}: InterviewQuestionsProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (userAnswer.trim() && !isLoading) {
        onSubmit();
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Conversation History */}
      <Card className="border-purple-200">
        <CardContent className="p-4 max-h-96 overflow-y-auto space-y-4">
          {session.conversationHistory.map((message, index) => (
            <MessageBubble key={index} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </CardContent>
      </Card>

      {/* Feedback from previous answer */}
      {session.feedback && (
        <FeedbackCard feedback={session.feedback} />
      )}

      {/* Current Question */}
      {session.currentQuestion && (
        <QuestionCard question={session.currentQuestion} />
      )}

      {/* Answer Input */}
      <Card className="border-purple-200">
        <CardContent className="p-4 space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Your Answer
          </label>
          <Textarea
            ref={textareaRef}
            value={userAnswer}
            onChange={(e) => onAnswerChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer here... Be specific and use examples from your experience."
            className="min-h-32 resize-none"
            disabled={isLoading}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Press Enter to submit (Shift+Enter for new line)
            </p>
            <Button
              onClick={onSubmit}
              disabled={!userAnswer.trim() || isLoading}
              style={{ background: "linear-gradient(135deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)" }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Answer
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface MessageBubbleProps {
  message: InterviewMessage;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isAssistant = message.role === "assistant";

  return (
    <div className={cn("flex", isAssistant ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3",
          isAssistant
            ? "bg-purple-100 text-gray-800 rounded-tl-sm"
            : "bg-purple-600 text-white rounded-tr-sm"
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}

interface FeedbackCardProps {
  feedback: AnswerFeedback;
}

function FeedbackCard({ feedback }: FeedbackCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600 bg-green-100";
    if (score >= 6) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 8) return "Excellent";
    if (score >= 6) return "Good";
    return "Needs Improvement";
  };

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
            Your Feedback
          </CardTitle>
          <Badge className={getScoreColor(feedback.score)}>
            {feedback.score}/10 - {getScoreLabel(feedback.score)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* What went well */}
        <div>
          <h4 className="font-medium text-green-700 mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            What Went Well
          </h4>
          <ul className="space-y-1">
            {feedback.whatWentWell.map((point, index) => (
              <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* How to improve */}
        <div>
          <h4 className="font-medium text-orange-700 mb-2 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            How to Improve
          </h4>
          <ul className="space-y-1">
            {feedback.howToImprove.map((point, index) => (
              <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">→</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Better answer */}
        <div>
          <h4 className="font-medium text-purple-700 mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Better Answer Example
          </h4>
          <p className="text-sm text-gray-700 italic bg-white p-3 rounded-lg border border-purple-100">
            {feedback.betterAnswer}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface QuestionCardProps {
  question: InterviewQuestion;
}

function QuestionCard({ question }: QuestionCardProps) {
  const categoryInfo = QUESTION_CATEGORIES[question.category];

  return (
    <Card
      className="border-purple-300"
      style={{ background: "linear-gradient(to bottom right, rgb(250 245 255), white)" }}
    >
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-3">
          <Badge className={categoryInfo.color}>{categoryInfo.label}</Badge>
          <span className="text-sm text-gray-500">Question {question.questionNumber}</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{question.question}</h3>
        {question.tips && question.tips.length > 0 && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <Lightbulb className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-yellow-800 mb-1">Tips for answering:</p>
              <ul className="text-xs text-yellow-700 space-y-0.5">
                {question.tips.map((tip, index) => (
                  <li key={index}>• {tip}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface SessionSummaryProps {
  summary: InterviewSummary;
  onNewSession: () => void;
  conversationHistory: InterviewMessage[];
}

function SessionSummary({ summary, onNewSession, conversationHistory }: SessionSummaryProps) {
  return (
    <div className="space-y-4">
      {/* Completion Card */}
      <Card
        className="border-purple-300"
        style={{ background: "linear-gradient(to right, rgb(168 85 247), rgb(147 51 234))" }}
      >
        <CardContent className="p-6 text-center text-white">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Interview Practice Complete!</h2>
          <p className="text-purple-100">{summary.overallPerformance}</p>
        </CardContent>
      </Card>

      {/* Strengths */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-5 h-5" />
            Your Strengths
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {summary.strengths.map((strength, index) => (
              <li key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <span className="text-sm text-gray-700 pt-0.5">{strength}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Areas to Improve */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-orange-600">
            <TrendingUp className="w-5 h-5" />
            Areas to Improve
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {summary.areasToImprove.map((area, index) => (
              <li key={index} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <span className="text-sm text-gray-700 pt-0.5">{area}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Final Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-purple-600">
            <Lightbulb className="w-5 h-5" />
            Tips for Your Actual Interview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {summary.finalTips.map((tip, index) => (
              <li key={index} className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                <ChevronRight className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700 pt-0.5">{tip}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Recommended Practice */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-blue-600">
            <GraduationCap className="w-5 h-5" />
            Recommended Practice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {summary.recommendedPractice.map((practice, index) => (
              <li key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <ChevronRight className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700 pt-0.5">{practice}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* New Session Button */}
      <Button
        onClick={onNewSession}
        className="w-full"
        style={{ background: "linear-gradient(135deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)" }}
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Start New Practice Session
      </Button>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default InterviewCoach;
