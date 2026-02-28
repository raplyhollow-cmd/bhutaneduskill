/**
 * AI STUDY PLANNER API
 *
 * POST /api/ai/study-planner - Generate personalized study schedule
 *
 * Creates weekly study plans based on subjects, available time,
 * strong/weak areas, and exam dates. Uses Gemini AI for intelligent scheduling.
 */

import { NextRequest, NextResponse } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { requireAuth } from "@/lib/auth-utils";
import { chatWithGemini } from "@/lib/ai/gemini-server";
import { STUDY_PLANNER_SYSTEM } from "@/lib/ai/prompts";
import { safeTrackAIInteraction, AI_FEATURE_IDS } from "@/lib/ai/track-interaction";
import type { ApiSuccess } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

interface StudyPlannerRequest {
  classGrade: string;
  subjects: string[];
  availableHoursPerDay: number;
  weakSubjects: string[];
  strongSubjects: string[];
  examDates?: string[];
  goals?: string;
  preferredStudyTime?: "morning" | "afternoon" | "evening" | "night";
}

interface StudySlot {
  time: string;
  subject: string;
  activity: string;
  focus?: string;
}

interface WeeklySchedule {
  monday: StudySlot[];
  tuesday: StudySlot[];
  wednesday: StudySlot[];
  thursday: StudySlot[];
  friday: StudySlot[];
  saturday: StudySlot[];
  sunday: StudySlot[];
}

interface StudyPlanResponse {
  weeklySchedule: WeeklySchedule;
  dailyRoutine: Array<{
    time: string;
    subject: string;
    focus: string;
  }>;
  studyTips: string[];
  breakSchedule: string[];
  weeklyGoals: string[];
  recommendations?: string[];
  examPreparation?: {
    examDate: string;
    subject: string;
    preparationTips: string[];
  }[];
}

// ============================================================================
// POST - Generate Study Plan
// ============================================================================

export const POST = createApiRoute<{}, StudyPlanResponse>(
  async (req, auth) => {
    const { userId, user } = auth;

    const body = await req.json() as StudyPlannerRequest;
    const {
      classGrade,
      subjects,
      availableHoursPerDay,
      weakSubjects,
      strongSubjects,
      examDates = [],
      goals = "",
      preferredStudyTime = "evening",
    } = body;

    // Validate required fields
    if (!classGrade || typeof classGrade !== "string") {
      return NextResponse.json(
        { error: "Class grade is required" },
        { status: 400 }
      );
    }

    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return NextResponse.json(
        { error: "At least one subject is required" },
        { status: 400 }
      );
    }

    if (!availableHoursPerDay || typeof availableHoursPerDay !== "number" || availableHoursPerDay < 1) {
      return NextResponse.json(
        { error: "Available hours per day must be at least 1" },
        { status: 400 }
      );
    }

    if (!weakSubjects || !Array.isArray(weakSubjects)) {
      return NextResponse.json(
        { error: "Weak subjects array is required" },
        { status: 400 }
      );
    }

    if (!strongSubjects || !Array.isArray(strongSubjects)) {
      return NextResponse.json(
        { error: "Strong subjects array is required" },
        { status: 400 }
      );
    }

    // Build the prompt for Gemini
    const prompt = buildStudyPlannerPrompt({
      classGrade,
      subjects,
      availableHoursPerDay,
      weakSubjects,
      strongSubjects,
      examDates,
      goals,
      preferredStudyTime,
      userName: "Student",
    });

    // Call Gemini AI
    const aiResponse = await chatWithGemini(prompt, STUDY_PLANNER_SYSTEM);

    // Parse the AI response into structured format
    const studyPlan = parseStudyPlanResponse(aiResponse, subjects, examDates);

    // Track AI interaction (non-blocking)
    safeTrackAIInteraction({
      userId,
      featureId: AI_FEATURE_IDS.STUDY_PLANNER,
      interactionData: {
        classGrade,
        subjectCount: subjects.length,
        availableHoursPerDay,
        weakSubjectsCount: weakSubjects.length,
        strongSubjectsCount: strongSubjects.length,
        hasExamDates: examDates.length > 0,
        preferredStudyTime,
        totalStudySlots: Object.values(studyPlan.weeklySchedule).flat().length,
      },
      metadata: {
        usedFallback: false,
        responseTimestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      data: studyPlan,
      status: 200,
      message: "Study plan generated successfully",
    } satisfies ApiSuccess<StudyPlanResponse>);
  },
  ["student", "teacher", "parent"]
);

// ============================================================================
// PROMPT BUILDER
// ============================================================================

function buildStudyPlannerPrompt(params: {
  classGrade: string;
  subjects: string[];
  availableHoursPerDay: number;
  weakSubjects: string[];
  strongSubjects: string[];
  examDates: string[];
  goals: string;
  preferredStudyTime: string;
  userName: string;
}): string {
  const {
    classGrade,
    subjects,
    availableHoursPerDay,
    weakSubjects,
    strongSubjects,
    examDates,
    goals,
    preferredStudyTime,
    userName,
  } = params;

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  let prompt = `Create a personalized weekly study plan for ${userName} in Class ${classGrade}.\n\n`;
  prompt += `**SUBJECTS:** ${subjects.join(", ")}\n`;
  prompt += `**AVAILABLE HOURS:** ${availableHoursPerDay} hours per day\n`;
  prompt += `**PREFERRED STUDY TIME:** ${preferredStudyTime}\n`;

  if (weakSubjects.length > 0) {
    prompt += `**WEAK SUBJECTS (need more focus):** ${weakSubjects.join(", ")}\n`;
  }

  if (strongSubjects.length > 0) {
    prompt += `**STRONG SUBJECTS (maintain with practice):** ${strongSubjects.join(", ")}\n`;
  }

  if (examDates.length > 0) {
    prompt += `**UPCOMING EXAMS:** ${examDates.join(", ")}\n`;
  }

  if (goals) {
    prompt += `**STUDENT GOALS:** ${goals}\n`;
  }

  prompt += `\n**SCHEDULING RULES:**\n`;
  prompt += `1. Allocate more time to weak subjects (40% of study time)\n`;
  prompt += `2. Give moderate time to strong subjects (30% of study time)\n`;
  prompt += `3. Include 10-minute breaks every hour\n`;
  prompt += `4. Sundays should be lighter - mainly revision and self-assessment\n`;
  prompt += `5. Balance subjects so no two consecutive slots are the same subject\n`;
  prompt += `6. If exams are approaching, prioritize exam subjects\n`;
  prompt += `7. Include practice/revision time for each subject\n`;

  prompt += `\n**IMPORTANT:** Respond ONLY with valid JSON in this exact format:\n\n`;
  prompt += `{\n`;
  prompt += `  "weeklySchedule": {\n`;
  prompt += `    "monday": [{"time": "4:00-5:00 PM", "subject": "Mathematics", "activity": "Practice problems", "focus": "Quadratic equations"}],\n`;
  prompt += `    "tuesday": [...],\n`;
  prompt += `    "wednesday": [...],\n`;
  prompt += `    "thursday": [...],\n`;
  prompt += `    "friday": [...],\n`;
  prompt += `    "saturday": [...],\n`;
  prompt += `    "sunday": [...]\n`;
  prompt += `  },\n`;
  prompt += `  "dailyRoutine": [\n`;
  prompt += `    {"time": "4:00-5:00 PM", "subject": "Physics", "focus": "Weak area practice"},\n`;
  prompt += `    {"time": "5:15-6:15 PM", "subject": "Mathematics", "focus": "Advanced problems"}\n`;
  prompt += `  ],\n`;
  prompt += `  "studyTips": ["Tip 1", "Tip 2", "Tip 3"],\n`;
  prompt += `  "breakSchedule": ["5 minutes every hour", "15 minutes after 2 hours"],\n`;
  prompt += `  "weeklyGoals": ["Goal 1", "Goal 2", "Goal 3"],\n`;
  prompt += `  "recommendations": ["Recommendation 1", "Recommendation 2"],\n`;
  prompt += `  "examPreparation": ${examDates.length > 0 ? '[{"examDate": "YYYY-MM-DD", "subject": "Math", "preparationTips": ["Tip 1", "Tip 2"]}]' : '[]'}\n`;
  prompt += `}\n`;

  return prompt;
}

// ============================================================================
// RESPONSE PARSER
// ============================================================================

function parseStudyPlanResponse(
  aiResponse: string,
  subjects: string[],
  examDates: string[]
): StudyPlanResponse {
  try {
    // Try to extract JSON from the response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate and sanitize the response
    return {
      weeklySchedule: sanitizeWeeklySchedule(parsed.weeklySchedule, subjects),
      dailyRoutine: parsed.dailyRoutine || [],
      studyTips: parsed.studyTips || [],
      breakSchedule: parsed.breakSchedule || [],
      weeklyGoals: parsed.weeklyGoals || [],
      recommendations: parsed.recommendations || [],
      examPreparation: parsed.examPreparation || [],
    };
  } catch (error) {
    // Return fallback if parsing fails
    return generateFallbackStudyPlan(subjects, 4, []);
  }
}

function sanitizeWeeklySchedule(
  schedule: unknown,
  subjects: string[]
): WeeklySchedule {
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const result: WeeklySchedule = {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  };

  for (const day of days) {
    const daySchedule = (schedule as Record<string, unknown>)[day];
    if (daySchedule && Array.isArray(daySchedule)) {
      result[day as keyof WeeklySchedule] = daySchedule.filter((slot: unknown) => {
        const s = slot as { time?: unknown; subject?: unknown };
        const subjectStr = typeof s.subject === 'string' ? s.subject : '';
        return s.time && s.subject && subjects.some(subj =>
          subjectStr.toLowerCase().includes(subj.toLowerCase())
        );
      });
    }
  }

  return result;
}

// ============================================================================
// FALLBACK STUDY PLAN GENERATOR
// ============================================================================

function generateFallbackStudyPlan(
  subjects: string[],
  availableHoursPerDay: number,
  weakSubjects: string[]
): StudyPlanResponse {
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const weeklySchedule: WeeklySchedule = {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  };

  // Start time based on available hours (default 4 PM start)
  const startHour = 16; // 4 PM
  const slotsPerDay = Math.max(2, Math.floor(availableHoursPerDay));

  // Generate schedule for each day
  days.forEach((day, dayIndex) => {
    const isSunday = day === "sunday";
    const dailySlots = isSunday ? Math.max(1, Math.floor(slotsPerDay / 2)) : slotsPerDay;

    for (let i = 0; i < dailySlots; i++) {
      // Alternate subjects with preference for weak ones
      let subject;
      if (weakSubjects.length > 0 && i % 2 === 0) {
        subject = weakSubjects[dayIndex % weakSubjects.length];
      } else {
        subject = subjects[(dayIndex + i) % subjects.length];
      }

      const startTime = new Date();
      startTime.setHours(startHour + i, i === 0 ? 0 : 15, 0);
      const endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + 1);

      const timeSlot = `${formatTime(startTime)}-${formatTime(endTime)}`;

      weeklySchedule[day as keyof WeeklySchedule].push({
        time: timeSlot,
        subject,
        activity: isSunday ? "Revision and practice" : i === 0 ? "Concept review" : "Practice problems",
        focus: weakSubjects.includes(subject) ? "Weak area practice" : "Regular study",
      });
    }
  });

  // Daily routine (first weekday as template)
  const dailyRoutine = weeklySchedule.monday.map((slot) => ({
    time: slot.time,
    subject: slot.subject,
    focus: slot.focus || "Study session",
  }));

  return {
    weeklySchedule,
    dailyRoutine,
    studyTips: [
      "Study in a quiet, well-lit place",
      "Take short breaks every hour",
      "Review what you learned before sleeping",
      "Practice problems daily for Mathematics and Sciences",
      "Read aloud for better retention in Languages",
    ],
    breakSchedule: [
      "5 minutes break after each 1-hour session",
      "15 minutes break after 2 sessions",
      "Stay hydrated during breaks",
    ],
    weeklyGoals: [
      `Complete ${subjects[0] || "Mathematics"} chapter exercises`,
      "Review all class notes",
      "Practice at least 20 problems",
      "Prepare summary notes for each subject",
    ],
    recommendations: [
      "Form a study group with classmates",
      "Ask teachers for help with difficult topics",
      "Use online resources for additional practice",
      "Get adequate sleep (7-8 hours)",
    ],
    examPreparation: [],
  };
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// ============================================================================
// GET - Check Study Planner availability
// ============================================================================

export const GET = createApiRoute(
  async () => {
    return {
      data: {
        available: true,
        feature: "AI Study Planner",
        description: "Generate personalized weekly study schedules based on your subjects and goals",
        requiresAuth: true,
        parameters: {
          classGrade: "string (e.g., '11', '12')",
          subjects: "array of strings",
          availableHoursPerDay: "number (1-8 hours)",
          weakSubjects: "array of strings",
          strongSubjects: "array of strings",
          examDates: "array of date strings (optional)",
          goals: "string (optional)",
          preferredStudyTime: "'morning' | 'afternoon' | 'evening' | 'night' (optional, default: 'evening')",
        },
      }
    };
  },
  ["student", "teacher", "parent"]
);
