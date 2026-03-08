/**
 * AI TIMETABLE OPTIMIZATION SERVICE
 *
 * Uses Google Gemini AI to optimize school timetables based on user-defined constraints.
 * This is the core intelligence engine that takes human inputs and finds optimal solutions.
 *
 * Approach: Constraint-Based + AI Optimization
 * 1. Admin sets constraints (rules, preferences, limits)
 * 2. AI analyzes current schedule and constraints
 * 3. AI suggests improvements with before/after comparison
 * 4. Admin can apply, tweak, or reject suggestions
 */

import { chatWithGemini } from "@/lib/ai/gemini-server";
import { logger } from "@/lib/logger";
import type {
  TimetableConstraints,
  TimetableEntry,
  OptimizationResult,
  Improvement,
  OptimizationMetrics,
  Conflict,
  SchoolContext,
} from "@/lib/types/timetable-constraints";

// ============================================================================
// SYSTEM PROMPTS
// ============================================================================

const TIMETABLE_OPTIMIZER_SYSTEM = `You are an expert AI Timetable Optimizer for schools. Your role is to analyze school schedules and suggest improvements based on constraints.

YOUR EXPERTISE:
- Educational psychology: When students learn best
- Teacher workload balancing: Fair distribution, preventing burnout
- Conflict resolution: Eliminating double-bookings
- Resource optimization: Efficient room and time usage

ANALYSIS PROCESS:
1. Identify all conflicts (teacher, room, class)
2. Assess workload balance across teachers
3. Evaluate subject placement (core subjects in morning)
4. Check for constraint violations
5. Generate optimal suggestions

OUTPUT FORMAT (JSON only, no markdown):
{
  "optimizedSchedule": [
    {
      "id": "existing-or-new-id",
      "classId": "...",
      "className": "Class 10A",
      "subjectId": "...",
      "subjectName": "Mathematics",
      "teacherId": "...",
      "teacherName": "Mr. Dorji",
      "roomId": "...",
      "roomName": "Room 101",
      "dayOfWeek": "mon",
      "periodNumber": 1,
      "startTime": "08:00",
      "endTime": "08:45"
    }
  ],
  "improvements": [
    {
      "type": "conflict_resolved" | "workload_balanced" | "optimal_placement" | "gap_optimized" | "room_optimized",
      "description": "Brief explanation of change",
      "before": { timetable entry before change },
      "after": { timetable entry after change },
      "impact": "high" | "medium" | "low"
    }
  ],
  "metrics": {
    "conflictsRemoved": number,
    "workloadBalanceImproved": "percentage",
    "studentPerformanceOptimized": true/false,
    "optimizationScore": 0-100,
    "totalPeriodsScheduled": number,
    "teacherUtilizationRate": percentage
  },
  "aiInsights": "2-3 sentence summary of key improvements",
  "remainingConflicts": [
    {
      "type": "teacher" | "room" | "class",
      "severity": "error" | "warning",
      "message": "description",
      "entries": [affected entries]
    }
  ],
  "canApply": true/false
}

CONSTRAINTS TO RESPECT:
- No teacher double-booked in same period
- No room double-booked in same period
- Maximum consecutive periods per teacher (from constraints)
- Core subjects (Math, English, Dzongkha) in morning slots preferred
- Break periods must be honored
- Teacher workload balanced across week`;

const SWAP_PARTNER_SYSTEM = `You are an AI assistant that finds compatible teacher swap partners.

YOUR TASK:
Given a teacher who needs to swap a specific period, find eligible colleagues who could take that period.

FACTORS TO CONSIDER:
- Subject qualification (can they teach this subject?)
- Availability in target slot (not already teaching)
- Workload fairness (don't overburden already busy teachers)
- Student relationship continuity

OUTPUT FORMAT (JSON only):
{
  "suggestedPartners": [
    {
      "teacherId": "...",
      "teacherName": "Name",
      "theirPeriod": { "day": "mon", "period": 3 },
      "compatibilityScore": 0-100,
      "swapImpact": "favorable" | "fair" | "unfavorable",
      "reason": "Why this is a good match"
    }
  ],
  "recommended": index_of_best_option
}`;

// ============================================================================
// CONTEXT BUILDER
// ============================================================================

interface OptimizationInput {
  schoolId: string;
  currentTimetable: TimetableEntry[];
  constraints: TimetableConstraints;
  scope: "all" | "specific-classes" | "specific-teachers";
  context: SchoolContext;
}

/**
 * Builds the detailed context for AI processing
 */
function buildOptimizationPrompt(input: OptimizationInput): string {
  const { currentTimetable, constraints, context } = input;

  let prompt = `# TIMETABLE OPTIMIZATION REQUEST

## SCHOOL CONTEXT
- School ID: ${input.schoolId}
- Academic Year: ${context.academicYear}
- ${context.semester ? `Semester: ${context.semester}` : ""}
- Working Days: ${context.workingDays.join(", ")}
- Bell Schedule: ${context.bellSchedule.map((p) => `${p.order}. ${p.name} (${p.startTime}-${p.endTime})`).join(", ")}

## CURRENT TIMETABLE (${currentTimetable.length} entries)
${formatTimetableForAI(currentTimetable)}

## CONSTRAINTS

### Teacher Availability (${constraints.teacherAvailability.length} teachers)
${constraints.teacherAvailability.map((t) => `
- ${t.teacherName || t.teacherId}:
  * Unavailable: ${t.unavailablePeriods.map((p) => `${p.day} P${p.period}`).join(", ") || "None"}
  * Max consecutive: ${t.maxConsecutivePeriods || 5}
  * Max daily: ${t.maxDailyPeriods || 6}
  * Max weekly: ${t.maxWeeklyPeriods || 30}
  ${t.preferredDays ? `* Prefers: ${t.preferredDays.join(", ")}` : ""}
`).join("")}

### Subject Rules (${constraints.subjectRules.length} subjects)
${constraints.subjectRules.map((s) => `
- ${s.subjectName || s.subjectId}:
  * Priority: ${s.priority || "elective"}
  * ${s.preferMorningSlots ? "* Prefer morning slots" : ""}
  * ${s.avoidLastPeriod ? "* Avoid last period" : ""}
  * ${s.requireDoublePeriod ? "* Requires double period" : ""}
`).join("")}

### Room Rules (${constraints.roomRules.length} rooms)
${constraints.roomRules.map((r) => `
- ${r.roomName || r.roomId} (${r.roomType || "classroom"}):
  * Required for: ${r.requiredForSubjects?.join(", ") || "None"}
  * ${r.minCapacity ? `* Min capacity: ${r.minCapacity}` : ""}
  * ${r.excludeSubjects ? `* Exclude: ${r.excludeSubjects.join(", ")}` : ""}
`).join("")}

### Class Rules (${constraints.classRules.length} classes)
${constraints.classRules.map((c) => `
- ${c.className || c.classId}:
  * Avoid periods: ${c.avoidPeriods.map((p) => `${p.day} P${p.period}`).join(", ") || "None"}
  * ${c.maxContinuousSameSubject ? `* Max continuous same subject: ${c.maxContinuousSameSubject}` : ""}
`).join("")}

## YOUR TASK
Optimize this timetable following all constraints. Focus on:
1. Eliminate all conflicts
2. Balance teacher workload fairly
3. Place core subjects in morning slots when possible
4. Ensure smooth transitions and breaks
5. Optimize for student learning outcomes

Return the optimized schedule in the specified JSON format.`;

  return prompt;
}

/**
 * Formats timetable data for AI consumption
 */
function formatTimetableForAI(entries: TimetableEntry[]): string {
  if (entries.length === 0) return "No current timetable entries.";

  // Group by day for better readability
  const byDay: Record<string, TimetableEntry[]> = {};
  entries.forEach((entry) => {
    if (!byDay[entry.dayOfWeek]) byDay[entry.dayOfWeek] = [];
    byDay[entry.dayOfWeek].push(entry);
  });

  let output = "";
  const days = ["mon", "tue", "wed", "thu", "fri", "sat"];

  days.forEach((day) => {
    const dayEntries = byDay[day];
    if (!dayEntries || dayEntries.length === 0) return;

    output += `\n### ${day.charAt(0).toUpperCase() + day.slice(1)}\n`;
    dayEntries
      .sort((a, b) => a.periodNumber - b.periodNumber)
      .forEach((entry) => {
        output += `  P${entry.periodNumber}: ${entry.className || entry.classId} - ${entry.subjectName || entry.subjectId} (${entry.teacherName || entry.teacherId}) @ ${entry.roomName || entry.roomId || "TBD"} (${entry.startTime}-${entry.endTime})\n`;
      });
  });

  return output;
}

function buildSwapPrompt(
  teacherId: string,
  teacherName: string,
  periodToSwap: { day: string; period: number },
  subjectId: string,
  subjectName: string,
  allTeachers: Array<{ id: string; name: string; subjects: string[] }>,
  currentTimetable: TimetableEntry[]
): string {
  // Find who's teaching what at the target time
  const teachersAtTargetTime = currentTimetable.filter(
    (e) => e.dayOfWeek === periodToSwap.day && e.periodNumber === periodToSwap.period
  );

  // Find teachers who are free at target time and qualified for subject
  const busyTeacherIds = new Set(teachersAtTargetTime.map((e) => e.teacherId));
  const qualifiedTeachers = allTeachers.filter(
    (t) => t.subjects.includes(subjectId) && !busyTeacherIds.has(t.id)
  );

  return `# TEACHER SWAP PARTNER SUGGESTION

## REQUEST
- Teacher: ${teacherName} (${teacherId})
- Subject: ${subjectName} (${subjectId})
- Period to swap: ${periodToSwap.day} Period ${periodToSwap.period}

## QUALIFIED & AVAILABLE TEACHERS
${qualifiedTeachers.map((t) => `- ${t.name} (${t.id}): Teaches ${t.subjects.join(", ")}`).join("\n") || "None found"}

## CURRENTLY BUSY AT THIS TIME
${teachersAtTargetTime.map((e) => `- ${e.teacherName}: ${e.subjectName} for ${e.className}`).join("\n")}

## YOUR TASK
Suggest compatible swap partners from the qualified teachers who could take this period.
Consider workload balance and fairness.

Return the result in the specified JSON format.`;
}

// ============================================================================
// MAIN API FUNCTIONS
// ============================================================================

/**
 * Optimizes a timetable using AI based on given constraints
 */
export async function optimizeTimetableWithAI(
  currentTimetable: TimetableEntry[],
  constraints: TimetableConstraints,
  context: SchoolContext,
  options: {
    schoolId: string;
    scope?: "all" | "specific-classes" | "specific-teachers";
  }
): Promise<OptimizationResult> {
  const startTime = Date.now();

  try {
    logger.info("Starting AI timetable optimization", {
      schoolId: options.schoolId,
      entryCount: currentTimetable.length,
      constraintCount: constraints.teacherAvailability.length + constraints.subjectRules.length,
    });

    const prompt = buildOptimizationPrompt({
      schoolId: options.schoolId,
      currentTimetable,
      constraints,
      scope: options.scope || "all",
      context,
    });

    const aiResponse = await chatWithGemini(prompt, TIMETABLE_OPTIMIZER_SYSTEM);

    // Parse JSON from AI response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI response did not contain valid JSON");
    }

    const result = JSON.parse(jsonMatch[0]) as OptimizationResult;

    // Validate and sanitize result
    if (!result.optimizedSchedule || !Array.isArray(result.optimizedSchedule)) {
      throw new Error("AI returned invalid schedule format");
    }

    // Ensure all entries have required fields
    result.optimizedSchedule = result.optimizedSchedule.map((entry, index) => ({
      id: entry.id || `generated-${index}`,
      classId: entry.classId,
      className: entry.className || "",
      subjectId: entry.subjectId,
      subjectName: entry.subjectName || "",
      teacherId: entry.teacherId,
      teacherName: entry.teacherName || "",
      roomId: entry.roomId || "",
      roomName: entry.roomName || "",
      dayOfWeek: entry.dayOfWeek,
      periodNumber: entry.periodNumber,
      startTime: entry.startTime,
      endTime: entry.endTime,
    }));

    const duration = Date.now() - startTime;
    logger.info("AI timetable optimization completed", {
      duration: `${duration}ms`,
      improvementsCount: result.improvements?.length || 0,
      optimizationScore: result.metrics?.optimizationScore || 0,
    });

    return result;
  } catch (error) {
    logger.error("AI timetable optimization failed", { error, schoolId: options.schoolId });

    // Return fallback result
    return {
      optimizedSchedule: currentTimetable,
      improvements: [],
      metrics: {
        conflictsRemoved: 0,
        workloadBalanceImproved: "0%",
        studentPerformanceOptimized: false,
        optimizationScore: 0,
        totalPeriodsScheduled: currentTimetable.length,
        teacherUtilizationRate: 0,
      },
      aiInsights: "AI optimization failed. Please try again or contact support.",
      canApply: false,
      remainingConflicts: [],
    };
  }
}

/**
 * Finds compatible swap partners for a teacher
 */
export async function findSwapPartnersWithAI(
  teacherId: string,
  teacherName: string,
  periodToSwap: { day: string; period: number },
  subjectId: string,
  subjectName: string,
  allTeachers: Array<{ id: string; name: string; subjects: string[] }>,
  currentTimetable: TimetableEntry[]
): Promise<{ suggestedPartners: Array<{ teacherId: string; teacherName: string; theirPeriod: { day: string; period: number } | null; compatibilityScore: number; swapImpact: "favorable" | "fair" | "unfavorable"; reason: string }>; recommended: number }> {
  try {
    const prompt = buildSwapPrompt(
      teacherId,
      teacherName,
      periodToSwap,
      subjectId,
      subjectName,
      allTeachers,
      currentTimetable
    );

    const aiResponse = await chatWithGemini(prompt, SWAP_PARTNER_SYSTEM);

    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI response did not contain valid JSON");
    }

    const result = JSON.parse(jsonMatch[0]);
    return result;
  } catch (error) {
    logger.error("AI swap partner search failed", { error, teacherId });
    return { suggestedPartners: [], recommended: -1 };
  }
}

/**
 * Analyzes a timetable for conflicts without making changes
 */
export function analyzeTimetableConflicts(
  entries: TimetableEntry[]
): Conflict[] {
  const conflicts: Conflict[] = [];
  const keyMap = new Map<string, TimetableEntry[]>();

  // Build lookup map
  entries.forEach((entry) => {
    const key = `${entry.dayOfWeek}-${entry.periodNumber}`;
    if (!keyMap.has(key)) keyMap.set(key, []);
    keyMap.get(key)!.push(entry);
  });

  // Check for conflicts
  keyMap.forEach((entriesAtSlot, key) => {
    if (entriesAtSlot.length <= 1) return;

    // Check teacher conflicts
    const teacherMap = new Map<string, TimetableEntry[]>();
    entriesAtSlot.forEach((entry) => {
      if (!teacherMap.has(entry.teacherId)) teacherMap.set(entry.teacherId, []);
      teacherMap.get(entry.teacherId)!.push(entry);
    });

    teacherMap.forEach((teacherEntries, teacherId) => {
      if (teacherEntries.length > 1) {
        conflicts.push({
          type: "teacher",
          severity: "error",
          message: `Teacher ${teacherEntries[0].teacherName || teacherId} is double-booked`,
          entries: teacherEntries,
        });
      }
    });

    // Check room conflicts
    const roomMap = new Map<string, TimetableEntry[]>();
    entriesAtSlot.forEach((entry) => {
      if (!entry.roomId) return;
      if (!roomMap.has(entry.roomId)) roomMap.set(entry.roomId, []);
      roomMap.get(entry.roomId)!.push(entry);
    });

    roomMap.forEach((roomEntries, roomId) => {
      if (roomEntries.length > 1) {
        conflicts.push({
          type: "room",
          severity: "error",
          message: `Room ${roomEntries[0].roomName || roomId} is double-booked`,
          entries: roomEntries,
        });
      }
    });

    // Check class conflicts
    const classMap = new Map<string, TimetableEntry[]>();
    entriesAtSlot.forEach((entry) => {
      if (!classMap.has(entry.classId)) classMap.set(entry.classId, []);
      classMap.get(entry.classId)!.push(entry);
    });

    classMap.forEach((classEntries, classId) => {
      if (classEntries.length > 1) {
        conflicts.push({
          type: "class",
          severity: "error",
          message: `Class ${classEntries[0].className || classId} is double-booked`,
          entries: classEntries,
        });
      }
    });
  });

  return conflicts;
}

/**
 * Calculates workload statistics for teachers
 */
export function calculateTeacherWorkload(
  entries: TimetableEntry[]
): Map<string, { totalPeriods: number; dailyBreakdown: Record<string, number>; consecutiveCount: number[] }> {
  const workload = new Map();

  // Group by teacher
  const byTeacher = new Map<string, TimetableEntry[]>();
  entries.forEach((entry) => {
    if (!byTeacher.has(entry.teacherId)) byTeacher.set(entry.teacherId, []);
    byTeacher.get(entry.teacherId)!.push(entry);
  });

  byTeacher.forEach((teacherEntries, teacherId) => {
    const dailyBreakdown: Record<string, number> = {};
    const days: string[] = [];

    teacherEntries.forEach((entry) => {
      if (!dailyBreakdown[entry.dayOfWeek]) dailyBreakdown[entry.dayOfWeek] = 0;
      dailyBreakdown[entry.dayOfWeek]++;
      if (!days.includes(entry.dayOfWeek)) days.push(entry.dayOfWeek);
    });

    // Calculate consecutive periods per day
    const consecutiveCounts: number[] = [];
    days.forEach((day) => {
      const dayEntries = teacherEntries
        .filter((e) => e.dayOfWeek === day)
        .sort((a, b) => a.periodNumber - b.periodNumber);

      let currentStreak = 1;
      for (let i = 1; i < dayEntries.length; i++) {
        if (dayEntries[i].periodNumber === dayEntries[i - 1].periodNumber + 1) {
          currentStreak++;
        } else {
          consecutiveCounts.push(currentStreak);
          currentStreak = 1;
        }
      }
      consecutiveCounts.push(currentStreak);
    });

    workload.set(teacherId, {
      totalPeriods: teacherEntries.length,
      dailyBreakdown,
      consecutiveCount: consecutiveCounts,
    });
  });

  return workload;
}
